import { Item } from '../crdClient/customResource';
import { DatasetSpec } from '../crdClient/crdClientImpl';
import { Crd } from './crd';
import { mutateRelation, mergeVariables, parseBoolean } from './utils';
import RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';
import { Context } from './interface';
import { omit, get, isUndefined, last, isNil } from 'lodash';
import { resolveInDataSet } from './secret';
import KeycloakAdminClient from 'keycloak-admin';
import CurrentWorkspace, { createInResolver } from '../workspace/currentWorkspace';
import { keycloakMaxCount } from './constant';

export const ATTRIBUTE_PREFIX = 'dataset.primehub.io';

// utils
const addToAnnotation = (data: any, field: string, annotation: any) => {
  if (isNil(annotation)) {
    return;
  }

  const fieldValue = data[field];
  if (!isNil(fieldValue)) {
    annotation[`${ATTRIBUTE_PREFIX}/${field}`] = fieldValue.toString();
  }
};

const getWritableRole = async ({
  kcAdminClient,
  datasetId,
  getPrefix
}: {
  kcAdminClient: KeycloakAdminClient,
  datasetId: string,
  getPrefix: (customizePrefix?: string) => string
}): Promise<RoleRepresentation> => {
  // make sure the writable role exists
  const roleName = `${getPrefix('rw:')}${datasetId}`;
  const role = await kcAdminClient.roles.findOneByName({name: roleName});
  if (!role) {
    try {
      await kcAdminClient.roles.create({name: roleName});
      return kcAdminClient.roles.findOneByName({name: roleName});
    } catch (e) {
      if (e.response && e.response.status === 409) {
        return kcAdminClient.roles.findOneByName({name: roleName});
      }
      throw e;
    }
  }
  return role;
};

export const mapping = (item: Item<DatasetSpec>) => {
  return {
    id: item.metadata.name,
    name: item.metadata.name,
    description: item.spec.description,
    displayName: item.spec.displayName || item.metadata.name,
    type: item.spec.type,
    url: item.spec.url,
    variables: item.spec.variables,
    volumeName: item.spec.volumeName,
    spec: item.spec,
    writable: (item as any).roleName && (item as any).roleName.indexOf(':rw:') >= 0,
    secret: get(item, 'spec.gitsync.secret'),
    // default to empty string
    mountRoot: get(item, ['metadata', 'annotations', `${ATTRIBUTE_PREFIX}/mountRoot`], ''),
    // default to false
    homeSymlink: parseBoolean(get(item, ['metadata', 'annotations', `${ATTRIBUTE_PREFIX}/homeSymlink`], 'false')),
    // default to false
    launchGroupOnly:
      parseBoolean(get(item, ['metadata', 'annotations', `${ATTRIBUTE_PREFIX}/launchGroupOnly`], 'false'))
  };
};

export const createMapping = (data: any) => {
  const gitSyncSecretId = get(data, 'secret.connect.id');
  const gitSyncProp = gitSyncSecretId
    ? {gitsync: {secret: gitSyncSecretId}}
    : {};
  const annotations: any = (data.type === 'git')
    ? {'primehub-gitsync': 'true'}
    : {};

  // add mountRoot & launchGroupOnly
  addToAnnotation(data, 'mountRoot', annotations);
  addToAnnotation(data, 'launchGroupOnly', annotations);
  // homeSymlink is fixed to false
  annotations[`${ATTRIBUTE_PREFIX}/homeSymlink`] = 'false';

  // mappings
  return {
    metadata: {
      name: data.name,
      annotations
    },
    spec: {
      displayName: data.displayName || data.name,
      description: data.description,
      type: data.type,
      url: data.url,
      variables: data.variables,
      volumeName: data.volumeName,
      ...gitSyncProp
    }
  };
};

export const updateMapping = (data: any) => {
  const secretConnect = get(data, 'secret.connect.id');
  const secretDisconnect = get(data, 'secret.disconnect');
  let gitSyncProp: any = {};
  if (secretConnect) {
    gitSyncProp = {gitsync: {secret: secretConnect}};
  } else if (secretDisconnect) {
    gitSyncProp = {gitsync: null};
  }

  // gitsync annotation
  let annotations: any = {};
  // update to git type
  if (data.type === 'git') {
    annotations = {annotations: {'primehub-gitsync': 'true'}};
  } else if (!isUndefined(data.type)) {
    // set to other type
    annotations = {annotations: null};
    gitSyncProp = {gitsync: null};
  }

  // add launchGroupOnly
  if (!isNil(data.launchGroupOnly)) {
    annotations.annotations = {
      ...annotations.annotations,
      [`${ATTRIBUTE_PREFIX}/launchGroupOnly`]: data.launchGroupOnly.toString()
    };
  }

  return {
    metadata: {
      name: data.name,
      ...annotations
    },
    spec: {
      displayName: data.displayName,
      description: data.description,
      type: data.type,
      url: data.url,
      variables: data.variables,
      volumeName: data.volumeName,
      ...gitSyncProp
    }
  };
};

export const onCreate = async (
  {role, resource, data, context, getPrefix, currentWorkspace}:
  {
    role: RoleRepresentation,
    resource: any,
    data: any,
    context: Context,
    getPrefix: (customizePrefix?: string) => string,
    currentWorkspace: CurrentWorkspace
  }) => {
  const everyoneGroupId = await currentWorkspace.getEveryoneGroupId();
  if (data && data.global) {
    // assign role to everyone
    await context.kcAdminClient.groups.addRealmRoleMappings({
      id: everyoneGroupId,
      roles: [{
        id: role.id,
        name: role.name
      }]
    });
  }

  if (data && data.groups) {
    const datasetId = resource.metadata.name;
    // add to group
    await mutateRelation({
      resource: data.groups,
      connect: async (where: {id: string, writable: boolean}) => {
        let targetRole = role;
        if (where.writable) {
          const writableRole = await getWritableRole({
            kcAdminClient: context.kcAdminClient,
            datasetId,
            getPrefix
          });
          targetRole = writableRole;
        }
        await context.kcAdminClient.groups.addRealmRoleMappings({
          id: where.id,
          roles: [{
            id: targetRole.id,
            name: targetRole.name
          }]
        });
      }
    });
  }
};

export const onUpdate = async (
  {role, resource, data, context, getPrefix, currentWorkspace}:
  {
    role: RoleRepresentation,
    resource: any,
    data: any,
    context: Context,
    getPrefix: (customizePrefix?: string) => string,
    currentWorkspace: CurrentWorkspace
  }) => {
  if (!data) {
    return;
  }

  const everyoneGroupId = await currentWorkspace.getEveryoneGroupId();
  if (data && !isUndefined(data.global)) {
    if (data.global) {
      // assign role to everyone
      await context.kcAdminClient.groups.addRealmRoleMappings({
        id: everyoneGroupId,
        roles: [{
          id: role.id,
          name: role.name
        }]
      });
    } else {
      await context.kcAdminClient.groups.delRealmRoleMappings({
        id: everyoneGroupId,
        roles: [{
          id: role.id,
          name: role.name
        }]
      });
    }
  }

  if (data && data.groups) {
    const datasetId = resource.metadata.name;
    const datasetType = resource.spec.type;
    // add to group
    await mutateRelation({
      resource: data.groups,
      connect: async (where: {id: string, writable: boolean}) => {
        if (datasetType !== 'pv') {
          return context.kcAdminClient.groups.addRealmRoleMappings({
            id: where.id,
            roles: [{
              id: role.id,
              name: role.name
            }]
          });
        }
        // pv dataset
        const writableRole = await getWritableRole({
          kcAdminClient: context.kcAdminClient,
          datasetId,
          getPrefix
        });
        // change to writable
        if (where.writable) {
          // delete original read permission role
          await context.kcAdminClient.groups.delRealmRoleMappings({
            id: where.id,
            roles: [{
              id: role.id,
              name: role.name
            }]
          });

          return context.kcAdminClient.groups.addRealmRoleMappings({
            id: where.id,
            roles: [{
              id: writableRole.id,
              name: writableRole.name
            }]
          });
        } else {
          // change to read only
          // delete write permission role if exist
          await context.kcAdminClient.groups.delRealmRoleMappings({
            id: where.id,
            roles: [{
              id: writableRole.id,
              name: writableRole.name
            }]
          });
          // add read permission role
          await context.kcAdminClient.groups.addRealmRoleMappings({
            id: where.id,
            roles: [{
              id: role.id,
              name: role.name
            }]
          });
        }
      },
      disconnect: async where => {
        await context.kcAdminClient.groups.delRealmRoleMappings({
          id: where.id,
          roles: [{
            id: role.id,
            name: role.name
          }]
        });

        if (datasetType === 'pv') {
          // remove writable as well
          const writableRole = await getWritableRole({
            kcAdminClient: context.kcAdminClient,
            datasetId,
            getPrefix
          });
          await context.kcAdminClient.groups.delRealmRoleMappings({
            id: where.id,
            roles: [{
              id: writableRole.id,
              name: writableRole.name
            }]
          });
        }
      }
    });
  }
};

export const onDelete = async ({
  name, context, getPrefix
}: {name: string, context: Context, getPrefix: (customizePrefix?: string) => string}) => {
  // delete writable as well
  try {
    await context.kcAdminClient.roles.delByName({
      name: `${getPrefix('rw:')}${name}`
    });
  } catch (e) {
    if (e.response && e.response.status === 404) {
      return;
    }
    throw e;
  }
};

const customUpdate = async ({
  name, metadata, spec, customResource, context, getPrefix, currentWorkspace
}: {
  name: string,
  metadata: any,
  spec: any,
  customResource: any,
  context: Context,
  getPrefix: (customizePrefix?: string) => string,
  currentWorkspace: CurrentWorkspace
}) => {
  // find original variables first
  const row = await customResource.get(name, currentWorkspace.getK8sNamespace());
  const originalVariables = row.spec.variables || {};
  const newVariables = spec.variables || {};
  spec.variables = mergeVariables(originalVariables, newVariables);
  const res = await customResource.patch(name, {
    metadata: omit(metadata, 'name'),
    spec
  }, currentWorkspace.getK8sNamespace());

  // if changing from pv to other types
  // change all rw roles to normal roles
  const originType = row.spec.type;
  const changedType = res.spec.type;
  if (originType !== changedType && originType === 'pv') {
    // find all groups with this role and change them
    const groups = (currentWorkspace.checkIsDefault()) ?
      await context.kcAdminClient.groups.find({
        max: keycloakMaxCount
      }) :
      await context.workspaceApi.listGroups(currentWorkspace.getWorkspaceId());
    // find each role-mappings
    await Promise.all(
      groups
      // list groups from workspace will not have everyoneGroupId anyway
      .filter(group => group.id !== context.everyoneGroupId)
      .filter(group => !group.attributes.isWorkspace)
      .map(async group => {
        const roles = await context.kcAdminClient.groups.listRealmRoleMappings({
          id: group.id
        });

        // find roles with rw
        const writableRole = roles.find(role =>
            role.name === `${getPrefix('rw:')}${name}`);

        // no role
        if (!writableRole) {
          return;
        }

        // remove rw
        await context.kcAdminClient.groups.delRealmRoleMappings({
          id: group.id,
          roles: [{
            id: writableRole.id,
            name: writableRole.name
          }]
        });
        // add read permission role
        const readRole = await context.kcAdminClient.roles.findOneByName({
          name: `${getPrefix()}${name}`
        });
        return context.kcAdminClient.groups.addRealmRoleMappings({
          id: group.id,
          roles: [{
            id: readRole.id,
            name: readRole.name
          }]
        });
      })
    );
  }

  return res;
};

export const resolveType = {
  async global(parent, args, context: Context) {
    const {kcAdminClient} = context;
    const currentWorkspace: CurrentWorkspace = parent.currentWorkspace;
    // find in everyOne group
    const everyoneGroupId = await currentWorkspace.getEveryoneGroupId();
    return this.findInGroup(everyoneGroupId, parent.id, kcAdminClient, currentWorkspace);
  },
  async groups(parent, args, context: Context) {
    const resourceId = parent.id;
    // find all groups
    const currentWorkspace: CurrentWorkspace = parent.currentWorkspace;
    const groups = (currentWorkspace.checkIsDefault()) ?
      await context.kcAdminClient.groups.find({
        max: keycloakMaxCount
      }) :
      await context.workspaceApi.listGroups(currentWorkspace.getWorkspaceId());
    // find each role-mappings
    const groupsWithRole = await Promise.all(
      groups
      .filter(group => group.id !== context.everyoneGroupId)
      .filter(group => !group.attributes.isWorkspace)
      .map(async group => {
        const roles = await context.kcAdminClient.groups.listRealmRoleMappings({
          id: group.id
        });

        // find roles with prefix:ds && prefix:rw:ds
        const findRole = roles.find(role =>
            role.name === `${this.getPrefix(currentWorkspace)}${resourceId}`
            || role.name === `${this.getPrefix(currentWorkspace, 'rw:')}${resourceId}`);

        // no role
        if (!findRole) {
          return null;
        }

        const groupRep = await context.kcAdminClient.groups.findOne({id: group.id});
        return (findRole.name.indexOf(':rw:') >= 0)
          ? {...groupRep, writable: true}
          : {...groupRep, writable: false};
      })
    );
    // filter out
    return groupsWithRole.filter(v => v);
  },
  ...resolveInDataSet
};

export const customParseNameFromRole = (roleName: string, currentWorkspace: CurrentWorkspace) => {
  // todo: fix this with dataset role prefix bug in other branch
  const lastSplit = last(roleName.split(':'));
  const workspaceSplit = last(lastSplit.split('|'));
  return workspaceSplit;
};

export const crd = new Crd<DatasetSpec>({
  customResourceMethod: 'datasets',
  propMapping: mapping,
  prefixName: 'ds',
  resourceName: 'dataset',
  createMapping,
  updateMapping,
  onCreate,
  onUpdate,
  onDelete,
  customParseNameFromRole,
  resolveType,
  customUpdate
});

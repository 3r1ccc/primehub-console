import { Item } from '../crdClient/customResource';
import { DatasetSpec } from '../crdClient/crdClientImpl';
import { Crd } from './crd';
import { mutateRelation } from './utils';
import RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';
import { Context } from './interface';

export const mapping = (item: Item<DatasetSpec>) => {
  return {
    id: item.metadata.name,
    name: item.metadata.name,
    description: item.metadata.description,
    displayName: item.spec.displayName || item.metadata.name,
    access: item.spec.access,
    type: item.spec.type,
    url: item.spec.url,
    variables: item.spec.variables
  };
};

export const mutationMapping = (data: any) => {
  return {
    metadata: {
      name: data.name,
      description: data.description
    },
    spec: {
      displayName: data.displayName,
      access: data.access,
      type: data.type,
      url: data.url,
      variables: data.variables
    }
  };
};

export const onCreate = async (
  {role, resource, data, context}:
  {role: RoleRepresentation, resource: any, data: any, context: Context}) => {
  if (data && data.groups) {
    // add to group
    await mutateRelation({
      resource: data.groups,
      connect: async where => {
        await context.kcAdminClient.groups.addRealmRoleMappings({
          id: where.id,
          roles: [{
            id: role.id,
            name: role.name
          }]
        });
      }
    });
  }

  if (data && (data.access === 'everyone' || data.access === 'admin')) {
    const everyoneGroupId = context.everyoneGroupId;
    await context.kcAdminClient.groups.addRealmRoleMappings({
      id: everyoneGroupId,
      roles: [{
        id: role.id,
        name: role.name
      }]
    });
  }
};

export const onUpdate = async (
  {role, resource, data, context}:
  {role: RoleRepresentation, resource: any, data: any, context: Context}) => {
  if (!data) {
    return;
  }

  if (data.groups) {
    // add to group
    await mutateRelation({
      resource: data.groups,
      connect: async where => {
        await context.kcAdminClient.groups.addRealmRoleMappings({
          id: where.id,
          roles: [{
            id: role.id,
            name: role.name
          }]
        });
      },
      disconnect: async where => {
        await context.kcAdminClient.groups.delRealmRoleMappings({
          id: where.id,
          roles: [{
            id: role.id,
            name: role.name
          }]
        });
      }
    });
  }

  const everyoneGroupId = context.everyoneGroupId;
  if (data.access === 'everyone' || data.access === 'admin') {
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
};

export const crd = new Crd<DatasetSpec>({
  customResourceMethod: 'datasets',
  propMapping: mapping,
  prefixName: 'ds',
  resourceName: 'dataset',
  mutationMapping,
  onCreate,
  onUpdate
});

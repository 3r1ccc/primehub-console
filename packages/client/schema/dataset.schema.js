/** @jsx builder */
import builder, {Default, Condition, Layout} from 'canner-script';
import Filter from '../src/cms-toolbar/filter';
import DatasetWrapper from '../src/cms-layouts/datasetWrapper';
import EnableUploadServer from '../src/cms-layouts/enableUploadServer';
import DatasetGroupWrapper from '../src/cms-layouts/datasetGroupsWrapper';
import {groupColumns, groupPickerColumns} from './utils';

export default () => (
  <array keyName="dataset" title="${dataset}"
    controlDeployAndResetButtons={true}
    cacheActions={true}
    packageName="../src/cms-components/customize-array-table_route"
    hideBackButton={true}
    uiParams={{
      columns: [{
        title: '${name}',
        dataIndex: 'name'
      }, {
        title: '${displayName}',
        dataIndex: 'displayName'
      }, {
        title: '${type}',
        dataIndex: 'type'
      }, {
        title: '${description}',
        dataIndex: 'description'
      }],
      disableCreate: true
    }}
    refetch
    hideButtons
    graphql={
      `
      query($datasetPage: Int, $datasetWhere: DatasetWhereInput) {
        dataset: datasetsConnection(page: $datasetPage, where: $datasetWhere) {
          edges {
            cursor
            node {
              id
              name
              displayName
              description
              type
              uploadServerLink
            }
          }
          pageInfo {
            currentPage
            totalPage
          }
        }
      }
      `
    }
  >
    <toolbar async>
      <filter
        component={Filter}
        fields={[{
          type: 'text',
          label: '${name}',
          key: 'name'
        }, {
          type: 'text',
          label: '${displayName}',
          key: 'displayName'
        }]}
      />
      <pagination number/>
    </toolbar>
    <Default component={DatasetWrapper}>
    <Condition match={(data, operator) => operator === 'create'} defaultMode="disabled">
      <string keyName="name" title="${name}"
        validation={{
          validator: (value, cb) => {
            if (!value.match(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/)) {
              return cb(`lower case alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character.`);
            }
          }
        }}
        required
      />
    </Condition>
    <string keyName="displayName" title="${displayName}" />
    <string keyName="description" title="${description}" />
    <Condition match={(data, operator) => false} defaultMode="disabled">
      <string
        keyName="mountRoot"
        title="${mountRoot}"
        defaultValue={'/datasets'}
        packageName="../src/cms-components/customize-string-mount_root"
      />
    </Condition>
    <boolean keyName="global" title="${global}" />
    <Condition match={(data, operator) => !data.global} defaultMode="hidden">
      <boolean keyName="launchGroupOnly" title="${launchGroupOnly}" defaultValue={true} />
    </Condition>
    <string keyName="type" 
      required
      ui="select"
      title="${type}"
      uiParams={{
        options: [{
          text: 'git',
          value: 'git'
        }, {
          text: 'env',
          value: 'env'
        }, {
          text: 'pv',
          value: 'pv'
        }]
      }}
    />
    <Condition match={data => data.type === 'git'}>
      <string keyName="url" ui="link" title="${datasetUrl}"/>
      <relation
        title="${secret}"
        keyName="secret"
        uiParams={{
          textCol: 'displayName',
          columns: [{
            title: '${name}',
            dataIndex: 'name'
          }, {
            title: '${displayName}',
            dataIndex: 'displayName'
          }]
        }}
        relation={{
          to: 'secret',
          type: 'toOne'
        }}
      />
    </Condition>
    <Condition match={data => data.type === 'env'}>
      <object keyName="variables"
        title="${variables}"
        validation={{
          validator: (value, cb) => {
            return Object.keys(value).reduce((result, key) => {
              console.log(key);
              if (!key.match(/^[a-zA-Z_]+[a-zA-Z0-9_]*$/)) {
                return cb(`should be alphanumeric charcter, '_', and must start with a letter.`);
              }
              return result;
            }, '');
          }
        }}
        packageName="../src/cms-components/customize-object-dynamic-field"
      />
    </Condition>
    <Condition match={data => data.type === 'pv'}>
      <Layout component={EnableUploadServer}>
        <Condition match={(data, operator) => operator === 'update'} defaultMode="hidden">
          <boolean
            keyName="enableUploadServer"
            title="${dataset.enableUploadServer}"
            packageName="../src/cms-components/customize-boolean-enable_upload_server"
          />
        </Condition>
      </Layout>
      
      <string keyName="uploadServerLink" hidden />
      <Condition match={(data, operator) => operator === 'create'} defaultMode="disabled">
        <Condition match={(data, operator) => operator === 'update'} defaultMode="hidden">
          <string keyName="volumeName" title="${volumeName}"/>
        </Condition>
        <number keyName="volumeSize" title="${volumeSize}"
          uiParams={{unit: ' GB', step: 1, min: 1, precision: 0}}
          defaultValue={1}
          packageName="../src/cms-components/customize-number-precision"
        />
      </Condition>
    </Condition>
    <Condition match={data => !(data.global && data.type !== 'pv')}>
      <Layout component={DatasetGroupWrapper}>
        <relation keyName="groups"
          packageName='../src/cms-components/customize-relation-dataset_groups_table'
          relation={{
            to: 'group',
            type: 'toMany',
            fields: ['name', 'displayName', 'quotaCpu', 'quotaGpu', 'userVolumeCapacity', 'writable']
          }}
          uiParams={{
            columns: groupColumns,
            pickerColumns: groupPickerColumns,
          }}
          graphql={`
          query($groupPage: Int, $groupWhere: GroupWhereInput) {
            group: groupsConnection(page: $groupPage, where: $groupWhere) {
              edges {
                cursor
                node {
                  id
                  name
                  displayName
                  quotaCpu
                  quotaGpu
                  userVolumeCapacity
                }
              }
              pageInfo {
                currentPage
                totalPage
              }
            }
          }
          `}
          fetchPolicy="no-cache"
        >
          <toolbar async>
            <filter
              component={Filter}
              fields={[{
                type: 'text',
                label: '${name}',
                key: 'name'
              }]}
            />
            <pagination number/>
          </toolbar>
        </relation>
      </Layout>
    </Condition>
    </Default>
  </array>
)

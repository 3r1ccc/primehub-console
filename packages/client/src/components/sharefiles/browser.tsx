import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {errorHandler} from 'utils/errorHandler';
import {get} from 'lodash';
import {appPrefix} from 'utils/env';
import { Table, Alert, Breadcrumb, Icon, Input, Skeleton } from 'antd';
import { RouteComponentProps, withRouter } from 'react-router';
import {compose} from 'recompose';
import moment from 'moment';
import { ColumnProps } from 'antd/lib/table';

interface Props extends RouteComponentProps {
  path: string;
  groupName: string;
  onPathChanged?: Function;
  data?: any;
};

interface State {
  editPath: boolean;
}

export const GET_FILES = gql`
  query files($where: StoreFileWhereInput!) {
    files (where: $where) {
      prefix
      phfsPrefix
      items {
        name
        size
        lastModified
      }
    }
  }
`;

const getMessage = error => get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH' ? `You're not authorized to view this page.` : 'Error';
const isPhfsEnabled = (): boolean => {
  return (window as any).enablePhfs;
};

// Ref: https://stackoverflow.com/a/14919494/563353
const humanFileSize = (bytes, si=false, dp=1) => {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

  return bytes.toFixed(dp) + ' ' + units[u];
};

const getViewContentUrl = (prefix, name) => {
  return `${appPrefix}files/${prefix}/${name}`
}

const getDownloadUrl = (prefix, name) => {
  return `${appPrefix}files/${prefix}/${name}?`
}

class Browser extends React.Component<Props, State> {

  state = {
    editPath: false
  };
  pathInput = undefined;

  private handleFolderClick = (folder) => {
    const {
      path: path,
      onPathChanged
    } = this.props;
    const targetPath = path.endsWith('/') ? `${path}${folder}` : `${path}/${folder}`;
    if (onPathChanged) {
      onPathChanged(targetPath);
    }
  }

  private handlePathChange = (targetPath) => {
    const {
      onPathChanged
    } = this.props;

    if (onPathChanged) {
      onPathChanged(targetPath);
    }
  }

  private splitPath(): string[] {
    let {path} = this.props;
    if (path.startsWith('/')) {
      path = path.substring(1,path.length);
    }
    if (path.endsWith('/')) {
      path = path.substring(0,path.length-1);
    }

    return path.length > 0 ? path.split('/') : [];
  }

  public render = () => {
    return <div>
      <div style={{marginLeft: 15, display: this.state.editPath ? 'none' : 'block'}}>{this.renderPathBreadcrumb()}</div>
      <div style={{marginLeft: 15, display: this.state.editPath ? 'block' : 'none'}}>{this.renderPathInput()}</div>
      {this.renderContent()}
    </div>
  }

  private renderPathBreadcrumb() {
    let pathComponents = this.splitPath();
    let items = [];
    let currentPath = '/';


    items.push(<Breadcrumb.Item><a onClick={()=>{this.handlePathChange('/')}}><Icon type="database"  style={{fontSize: '12pt'}}/></a></Breadcrumb.Item>);
    for (const component of pathComponents) {
      currentPath += `${component}/`;
      let targetPath = currentPath;
      items.push(<Breadcrumb.Item><a onClick={()=>{this.handlePathChange(targetPath)}}>{component}</a></Breadcrumb.Item>);
    }

    items.push(
      <Breadcrumb.Item>
        <a onClick={() => {
          this.setState({editPath: true}, () => {
            this.pathInput.focus();
          });
        }}
        >
            <Icon type="folder-add" theme='filled' style={{fontSize: '14pt', position: 'relative', top: 2}}/>
      </a></Breadcrumb.Item>);
    return <Breadcrumb>{items}</Breadcrumb>
  }

  private renderPathInput() {
    const {path} = this.props;
    return <Input
      prefix={<Icon type="database" style={{fontSize: '12pt'}}/>}
      onPressEnter={(e) => {
        let targetPath = (e.target as any).value;
        this.handlePathChange(targetPath);
        this.setState({editPath:false});
      }}
      onFocus={(e) => {e.target.value = path.endsWith('/') ? path : path + '/'}}
      onBlur={() => {this.setState({editPath: false})}}
      ref={(input) => {this.pathInput = input}}
    />
  }

  private renderContent = () => {
    const {data} = this.props;

    if (!isPhfsEnabled()) {
      return <Alert
      message='Warning'
      description='PHFS is not enabled. Please tell your administrator to enable it.'
      type='warning'
      showIcon
      />;
    }

    if (!data.files) {
      return null;
    }

    if (data.error) {
      return getMessage(data.error);
    }

    if (data.loading) {
      return <Skeleton active />
    }

    const columns: ColumnProps<any>[] = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        render: (text, record, index)=> {
          const iconStyle = {fontSize: '12pt', paddingRight: 16}
          if (text.endsWith('/')) {
            return <><Icon style={iconStyle} type="folder" /><a style={{color: "rgba(0, 0, 0, 0.65)"}}onClick={() => this.handleFolderClick(text)}>{text}</a></>;
          } else {
            return <><Icon style={iconStyle} type="file" />{text}</>;
          }
        },
      },
      {
        title: 'Size',
        dataIndex: 'size',
        key: 'size',
        align: 'right',
        width: 120,
        render: (text, record, index) => {
          return !record.name.endsWith('/') ? humanFileSize(text, true, 1) : undefined;
        }
      },
      {
        title: 'Last Modified',
        dataIndex: 'lastModified',
        key: 'lastModified',
        align: 'right',
        width: 200,
        render: (text, record, index) => {
          return !record.name.endsWith('/') ? moment(text.lastModified).format('YYYY-MM-DD HH:mm:ss') : undefined;
        },
      },
      {
        title: '',
        key: 'action',
        align: 'right',
        width: 30,
        render: () => {
          return <Icon type="home" style={{fontSize: '12pt'}}/>;
        },
      },
    ];
    let dataSource = [];

    if (data.files && data.files && data.files.items) {
      const prefix = data.files.prefix;
      dataSource = data.files.items;
    }

    const pagination = {
      hideOnSinglePage: true,
      showSizeChanger: true,
      defaultPageSize: 25,
      pageSizeOptions: ['10', '25', '50', '100']
    };

    return <Table dataSource={dataSource} columns={columns} pagination={pagination}/>

  }
}

export default compose(
  withRouter,
  graphql(GET_FILES, {
  options: (props: Props) => ({
    variables: {
      where: {
        phfsPrefix: props.path,
        groupName: props.groupName,
      }
    },
    fetchPolicy: 'network-only',
    onError: errorHandler,
    skip: !isPhfsEnabled(),
    })
  })
)(Browser);
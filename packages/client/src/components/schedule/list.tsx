import * as React from 'react';
import {Button, Tooltip, Table as AntTable, Row, Col, Icon, Modal} from 'antd';
import {RouteComponentProps} from 'react-router';
import {Link, withRouter} from 'react-router-dom';
import moment from 'moment';
import {get} from 'lodash';
import styled from 'styled-components';
import Filter from 'components/job/filter';
import {Group} from 'components/job/groupFilter';
import Pagination from 'components/job/pagination';
import Title from 'components/job/title';
import {renderRecurrence} from 'components/schedule/recurrence';

const {confirm} = Modal;

const Table = styled(AntTable as any)`
  background: white;
  .ant-pagination.ant-table-pagination {
    margin-right: 16px;
  }
`;

const appPrefix = (window as any).APP_PREFIX || '/';

const renderScheduleName = (text, record) => (
  <Tooltip
    placement="top"
    title={`Job ID: ${record.id}`}
  >
    <Link to={`${appPrefix}schedule/${record.id}`}>
      {text}
    </Link>
  </Tooltip>
);

const renderNextRunTime = time => {
  const tooltipTime = time ? moment(time).format('YYYY-MM-DD HH:mm'): '-';
  const text = time ? moment(time).fromNow() : '-';
  return (
    <Tooltip
      placement="top"
      title={`Scheduled for: ${tooltipTime}`}
    >
      {text}
    </Tooltip>
  );
};

type JobsConnection = {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  },
  edges: Array<{
    cursor: string;
    node: any
  }>
}

type Props = RouteComponentProps & {
  groups: Array<Group>;
  schedulesLoading: boolean;
  schedulesError: any;
  schedulesConnection: JobsConnection;
  schedulesVariables: any;
  schedulesRefetch: Function;
  runPhSchedule: Function;
  deletePhSchedule: Function;
  runPhScheduleResult: any;
  deletePhScheduleResult: any;
};

class ScheduleList extends React.Component<Props> {
  state = {
    currentId: null
  };

  deleteSchedule = (id: string) => {
    const {schedulesConnection, deletePhSchedule} = this.props;
    const schedule = schedulesConnection.edges.find(edge => edge.node.id === id).node;
    this.setState({currentId: id});
    confirm({
      title: `Delete`,
      content: `Do you want to delete '${schedule.displayName || schedule.name}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      okButtonProps: {
        style: {
          float: 'left',
          marginRight: '8px'
        }
      },
      onOk() {
        return deletePhSchedule({variables: {where: {id}}});
      },
      onCancel() {
      },
    });
  }

  runJob = (id: string) => {
    const {runPhSchedule} = this.props
    runPhSchedule({variables: {where: {id}}})
  }

  editJob = (id: string) => {
    const {history} = this.props;
    history.push(`${appPrefix}schedule/${id}`)
  }

  scheduleJob = () => {
    const {history} = this.props;
    history.push(`${appPrefix}schedule/create`);
  }

  refresh = () => {
    const {schedulesVariables, schedulesRefetch} = this.props;
    const newVariables = {
      where: schedulesVariables.where,
      before: undefined,
      first: 10,
      last: undefined,
      after: undefined,
    };
    schedulesRefetch(newVariables);
  }

  nextPage = () => {
    const {schedulesVariables, schedulesRefetch, schedulesConnection} = this.props;
    const after = schedulesConnection.pageInfo.endCursor;
    const newVariables = {
      where: schedulesVariables.where,
      after,
      first: 10,
      last: undefined,
      before: undefined
    };
    schedulesRefetch(newVariables);
  }

  previousPage = () => {
    const {schedulesVariables, schedulesRefetch, schedulesConnection} = this.props;
    const before = schedulesConnection.pageInfo.startCursor;
    const newVariables = {
      where: schedulesVariables.where,
      before,
      last: 10,
      first: undefined,
      after: undefined,
    };
    schedulesRefetch(newVariables);
  }

  changeFilter = ({
    selectedGroups,
    submittedByMe
  }: {
    selectedGroups: Array<string>;
    submittedByMe: boolean;
  }) => {
    const {schedulesVariables, schedulesRefetch} = this.props;
    const newVariables = {
      ...schedulesVariables,
      where: {
        ...schedulesVariables.where,
        groupId_in: selectedGroups,
        mine: submittedByMe,
      }
    };
    schedulesRefetch(newVariables);
  }

  render() {
    const {groups, schedulesConnection, schedulesVariables, deletePhScheduleResult, runPhScheduleResult} = this.props;
    const renderAction = (id: string, record) => {
      return (
        <Button.Group>
          <Button icon="caret-right" onClick={() => this.runJob(id)} />
          <Button icon="edit" onClick={() => this.editJob(id)} />
          <Button icon="delete" onClick={() => this.deleteSchedule(id)} />
        </Button.Group>
      )
    }
    const columns = [{
      title: 'Name',
      dataIndex: 'displayName',
      render: renderScheduleName
    }, {
      title: 'Group',
      dataIndex: 'jobTemplate.groupName'
    }, {
      title: 'Recurrence',
      dataIndex: 'recurrence',
      render: ({type, cron}) => renderRecurrence(type, cron),
    }, {
      title: 'Next Run',
      dataIndex: 'nextRunTime',
      render: renderNextRunTime,
    }, {
      title: 'Created By',
      dataIndex: 'jobTemplate.userName'
    }, {
      title: 'Action',
      dataIndex: 'id',
      render: renderAction
    }]
    return (
      <Row type="flex" gutter={24}>
        <Col span={6}>
          <Filter
            groups={groups}
            selectedGroups={get(schedulesVariables, 'where.groupId_in', [])}
            submittedByMe={get(schedulesVariables, 'where.mine', false)}
            onChange={this.changeFilter}
          />
        </Col>
        <Col span={18}>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <Title>Job Schedules</Title>
            <div>
              <Button onClick={this.scheduleJob}>
                Schedule Job
              </Button>
              <Button onClick={this.refresh} style={{marginLeft: 16}}>
                Refresh
              </Button>
            </div>
          </div>
          <Table
            dataSource={schedulesConnection.edges.map(edge => edge.node)}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
          <Pagination
            hasNextPage={schedulesConnection.pageInfo.hasNextPage}
            hasPreviousPage={schedulesConnection.pageInfo.hasPreviousPage}
            nextPage={this.nextPage}
            previousPage={this.previousPage}
          />
        </Col>
      </Row>
    )
  }
}

export default withRouter(ScheduleList);

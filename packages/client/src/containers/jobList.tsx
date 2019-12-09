import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get} from 'lodash';
import JobList from 'components/job/list';
import {Phase} from 'components/job/phase';

export const PhJobFragement = gql`
  fragment PhJobInfo on PhJob {
    id
    displayName
    cancel
    command
    group
    image
    instanceType
    userId
    userName
    phase
    reason
    startTime
    finishTime
    logEndpoint
 }
`

export const GroupFragment = gql`
  fragment GroupInfo on Group {
    id
    displayName
    name
  }
`;

export const GET_MY_GROUPS = gql`
  query me {
    me {
      id
      groups {
        ...GroupInfo
      }
    }
  }
  ${GroupFragment}
`

export const GET_PH_JOB_CONNECTION = gql`
  query phJobsConnection($where: PhJobWhereInput, $first: Int, $after: String, $last: Int, $before: String) {
    phJobsConnection(where: $where, first: $first, after: $after, last: $last, before: $before) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          ...PhJobInfo
        }
      }
    }
  }
  ${PhJobFragement}
`;

const defaultVariables = {
  first: 0,
};

const job = {
  id: 'y23456',
  displayName: 'train_123 model by using yyy_pretrained_model',
  cancel: false,
  command: 'command',
  group: 'dev-group',
  userId: 'userId',
  userName: 'userName',
  phase: Phase.Succedded,
  reasion: 'resione',
  startTime: new Date().toString(),
  finsihTime: new Date().toString(),
  logEndpoint: '/'
};

const jobsConnection = {
  pageInfo: {
    hasNextPage: true,
    hasPreviousPage: true
  },
  edges: [{
    cursor: 'id',
    node: job
  }]
};

type Props = {
  getPhJobConnection: any;
  getGroups: any;
}

class JobListContainer extends React.Component<Props> {
  render() {
    const {getPhJobConnection, getMyGroups} = this.props;
    return (
      <JobList
        jobsLoading={getPhJobConnection.loading}
        jobsError={getPhJobConnection.error}
        jobsConnection={getPhJobConnection.phJobsConnection || jobsConnection}
        jobsVariables={getPhJobConnection.variables}
        jobsRefetch={getPhJobConnection.refetch}
        groupsLoading={getMyGroups.loading}
        groupsError={getMyGroups.error}
        groups={get(getMyGroups, 'me.groups', [])}
      />
    );
  }
}

export default compose(
  graphql(GET_PH_JOB_CONNECTION, {
    options: {
      variables: defaultVariables,
    },
    name: 'getPhJobConnection'
  }),
  graphql(GET_MY_GROUPS, {
    name: 'getMyGroups'
  })
)(JobListContainer)

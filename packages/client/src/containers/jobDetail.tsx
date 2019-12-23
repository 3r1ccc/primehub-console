import * as React from 'react';
import gql from 'graphql-tag';
import {Button} from 'antd';
import {graphql} from 'react-apollo';
import {RouteComponentProps} from 'react-router-dom';
import {compose} from 'recompose';
import JobDetail from 'components/job/detail';
import {PhJobFragement} from './jobList';
import {RERUN_JOB, CANCEL_JOB} from 'containers/jobList';

type Props = {
  getPhJob: any;
  rerunPhJob: Function;
  cancelPhJob: Function;
} & RouteComponentProps<{
  jobId: string;
}>;

export const GET_PH_JOB = gql`
  query phJob($where: PhJobWhereUniqueInput!) {
    phJob(where: $where) {
      ...PhJobInfo
    }
  }
  ${PhJobFragement}
`;

const appPrefix = (window as any).APP_PREFIX || '/';

class JobDetailContainer extends React.Component<Props> {
  render() {
    const {getPhJob, history, rerunPhJob, cancelPhJob, rerunPhJobResult, cancelPhJobResult} = this.props;
    if (getPhJob.loading) return null;
    if (getPhJob.error) return 'Error';
    return (
      <React.Fragment>
        <Button
          icon="left"
          onClick={() => history.push(`${appPrefix}job`)}
          style={{marginBottom: 16}}
        >
          Back
        </Button>
        <JobDetail
          rerunPhJob={rerunPhJob}
          cancelPhJob={cancelPhJob}
          rerunPhJobResult={rerunPhJobResult}
          cancelPhJobResult={cancelPhJobResult}
          job={getPhJob.phJob || {id: 'test'}}
        />
      </React.Fragment>
    );
  }
}

export default compose(
  graphql(GET_PH_JOB, {
    options: (props: Props) => ({
      variables: {
        where: {
          id: props.match.params.jobId
        }
      },
    }),
    name: 'getPhJob'
  }),
  graphql(RERUN_JOB, {
    options: {
      refetchQueries: [{
        query: GET_PH_JOB
      }]
    },
    name: 'rerunPhJob'
  }),
  graphql(CANCEL_JOB, {
    name: 'cancelPhJob'
  })
)(JobDetailContainer)
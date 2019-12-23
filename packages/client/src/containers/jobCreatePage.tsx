import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get} from 'lodash';
import {RouteComponentProps} from 'react-router';
import {withRouter} from 'react-router-dom';
import Title from 'components/job/title';
import JobCreateForm from 'components/job/createForm';
import {GroupFragment} from 'containers/job';


export const GET_MY_GROUPS = gql`
  query me {
    me {
      id
      groups {
        ...GroupInfo
        instanceTypes { id name displayName description spec global }
        images { id name displayName description spec global }
      }
    }
  }
  ${GroupFragment}
`

export const CREATE_JOB = gql`
  mutation createPhJob($data: PhJobCreateInput!) {
    createPhJob(data: $data) {
      id
    }
  }
`

type Props = RouteComponentProps & {
  getGroups: any; 
  createPhJob: any;
  createPhJobResult: any;
}
type State = {
  selectedGroup: string | null;
}

const appPrefix = (window as any).APP_PREFIX || '/';

class JobCreatePage extends React.Component<Props, State> {
  state = {
    selectedGroup: null,
  };

  onChangeGroup = (id: string) => {
    this.setState({selectedGroup: id});
  }

  onSubmit = (payload) => {
    const {createPhJob} = this.props;
    createPhJob({
      variables: {
        data: payload
      }
    });
  }

  render() {
    const {selectedGroup} = this.state;
    const {getGroups, createPhJobResult} = this.props;
    const group = get(getGroups, 'me.groups', []).find(group => group.id === selectedGroup);
    const instanceTypes = get(group, 'instanceTypes', []);
    const images = get(group, 'images', []);
    return (
      <React.Fragment>
        {/* <Button
          icon="left"
          onClick={() => history.push(`${appPrefix}job`)}
          style={{marginBottom: 16}}
        >
          Back
        </Button> */}
        <Title>Create Job</Title>
        <JobCreateForm
          onSelectGroup={this.onChangeGroup}
          selectedGroup={selectedGroup}
          groups={get(getGroups, 'me.groups', [])}
          instanceTypes={instanceTypes}
          images={images}
          onSubmit={this.onSubmit}
          creatingJob={createPhJobResult.loading || false}
          loading={getGroups.loading}
        />
      </React.Fragment>
    );
  }
}

export default compose(
  withRouter,
  graphql(GET_MY_GROUPS, {
    name: 'getGroups'
  }),
  graphql(CREATE_JOB, {
    options: (props: Props) => ({
      refetchQueries: [{
        query: GET_MY_GROUPS
      }],
      onCompleted: () => {
        props.history.push(`${appPrefix}job`);
      },
      onError: e => {
        console.error(e);
      }
    }),
    name: 'createPhJob'
  })
)(JobCreatePage)

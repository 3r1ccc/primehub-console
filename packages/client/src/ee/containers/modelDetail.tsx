import * as React from 'react';
import {Skeleton, Input, Alert, Button, Table, Row, Col} from 'antd';
import Field from 'components/share/field';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {Link, withRouter} from 'react-router-dom';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import {QueryModel, QueryModelVersionsConnection} from 'queries/models.graphql';

const PAGE_SIZE = 20;

type Props = {
  getModel: {
    error?: any;
    loading: boolean;
    variables: {
      where?;
    };
    refetch: Function;
    model?: any;
  };
  getModelVersionsConnection: {
    error?: any;
    loading: boolean;
    variables: {
      where?;
      after?: string,
      first?: number,
      last?: number,
      before?: string
    };
    refetch: Function;
    modelVersionsConnection?: any;
  };

} & RouteComponentProps & GroupContextComponentProps;

class ModelDetailContainer extends React.Component<Props> {
  const renderVersion = model => version => (
    <Link to={`${model}/versions/${version}`}>
      {`Version ${version}`}
    </Link>
  );

  render() {
    const { groupContext, getModel, getModelVersionsConnection, match} = this.props;
    const {modelName} = match.params as any;

    const {
      model,
    } = getModel;
    const {
      modelVersionsConnection,
    } = getModelVersionsConnection;

    if (getModel.error) {
      console.log(getModel.error);
      return 'Cannot load model';
    }

    if (!model || !modelVersionsConnection) {
      return <Skeleton />
    }

    const breadcrumbs = [
      {
        key: 'list',
        matcher: /\/models/,
        title: 'Models',
        link: '/models?page=1'
      },
      {
        key: 'model',
        matcher: /\/models/,
        title: `Model: ${modelName}`,
        link: `/models/${modelName}`
      }
    ];

    const columns = [{
      title: 'Version',
      dataIndex: 'version',
      render: this.renderVersion(modelName),
    }, {
      title: 'Creation Time',
      dataIndex: 'creationTimestamp',
    }, {
      title: 'Updated Time',
      dataIndex: 'lastUpdatedTimestamp',
    }]
    const data = modelVersionsConnection.edges.map(edge => edge.node);

    let pageBody = <>
      <div style={{textAlign: 'right'}}>
        <Button>
          MLFlow UI
        </Button>
      </div>
        <Row gutter={36}>
          <Col span={12}>
            <Field labelCol={4} valueCol={8} label='Created Time' value={model.creationTimestamp} />
          </Col>
          <Col span={12}>
            <Field labelCol={4} valueCol={8} label='Last Modified' value={model.lastUpdatedTimestamp} />
          </Col>
        </Row>
      <Table
          style={{paddingTop: 8}}
          dataSource={data}
          columns={columns}
          rowKey="name"
          loading={modelVersionsConnection.loading}
      />
    </>;
    return (
      <>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={"Model Management"}
        />
        <PageBody>{pageBody}</PageBody>
      </>
    );
  }
}

export default compose(
  withRouter,
  withGroupContext,
  graphql(QueryModel, {
    options: (props: Props) => {
      const {groupContext, match} = props;
      const {modelName} = match.params as any;
      const where = {
        name: modelName
      } as any;
      if (groupContext) {
        where.group = groupContext.name;
      }

      return {
        variables: {
          where,
        },
        fetchPolicy: 'cache-and-network'
      }
    },
    name: 'getModel'
  }),
  graphql(QueryModelVersionsConnection, {
    options: (props: Props) => {
      const {groupContext, match} = props;
      const {modelName} = match.params as any;
      const where = {
        name: modelName
      } as any;
      if (groupContext) {
        where.group = groupContext.name;
      }

      return {
        variables: {
          where,
        },
        fetchPolicy: 'cache-and-network'
      }
    },
    name: 'getModelVersionsConnection'
  }),
)(ModelDetailContainer)
import React, { useState, useEffect, useCallback } from 'react';
import { Table, Input, Col, Layout, Button, Icon, Modal } from 'antd';
import { withRouter } from 'react-router-dom';
import {RouteComponentProps} from 'react-router';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Breadcrumbs from 'components/share/breadcrumb';
import { UsersConnection } from 'queries/User.graphql';
import queryString from 'querystring';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import InfuseButton from 'components/infuseButton';
import EmailForm from 'cms-toolbar/sendEmailModal';
import { FilterRow, FilterPlugins, ButtonCol } from 'components/share';

const Search = Input.Search;
const ButtonGroup = Button.Group;

interface Props {
  dataSource: any;
  loading?: boolean;
  getUsersConnection?: any;
};

function UserList(props: Props) {
  const [selectedRows, setSelectedRows] = useState([]);
  const [emailFormVisible, setEmailFormVisible] = useState(false);
  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/users_next/,
      title: 'Users',
      link: '/users_next?page=1',
      tips: 'Admin can find and manage user accounts here.',
      tipsLink: 'https://docs.primehub.io/docs/guide_manual/admin-user'
    }
  ];

  const edit = (id) => {};
  const remove = (index) => {};

  const renderAction = (id, record) => {
    return (
      <ButtonGroup>
        <Button icon={"edit"}
          data-testid="edit-button"
          onClick={() => this.edit(record.id)}
        >
        </Button>
        <Button icon="delete"
          data-testid="delete-button"
          onClick={() => this.remove(record.__index)}
        />
      </ButtonGroup>
    );
  };

  const renderEnable = (value) => value ? <Icon type="check" /> : <Icon type="close" />;

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    }, {
      title: 'Email',
      dataIndex: 'email',
    }, {
      title: 'Name',
      dataIndex: 'firstName',
      render: (value, record) => `${value} ${record.lastName}`
    }, {
      title: 'Enabled',
      dataIndex: 'enabled',
      render: renderEnable,
    }, {
      title: 'Is Admin',
      dataIndex: 'isAdmin',
      render: renderEnable,
    }, {
      title: 'Action',
      dataIndex: 'id',
      key: 'action',
      render: renderAction,
      width: 200
    }
  ];

  const searchHandler = () => {};

  const onSelectChange = useCallback((selectedRowKeys) => {
    setSelectedRows(selectedRowKeys);
  }, [selectedRows]);

  const rowSelection = {
    selectedRows,
    onChange: onSelectChange
  }

  return (
    <Layout>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title={"Users"}
      />
      <PageBody>
        <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end'}}>
          {/* @ts-ignore */}
          <InfuseButton
            icon="email"
            onClick={() => {setEmailFormVisible(true)}}
            style={{ marginRight: 16, width: 120 }}
            disabled={selectedRows?.length <= 0}
          >
            Send Mail
          </InfuseButton>
          {/* @ts-ignore */}
          <InfuseButton
            icon="plus"
            onClick={() => {}}
            style={{ marginRight: 16, width: 120 }}
            type="primary"
          >
            Add
          </InfuseButton>
        </div>
        <FilterRow
          type="flex"
          justify="space-between"
          align="bottom"
          style={{ marginBottom: 16, marginTop: 16 }}
        >
        <Col key="search-handler" style={{ flex: 1 }}>
          <FilterPlugins style={{ marginRight: '10px' }}>
            <Search
              placeholder={`Search Username / Email`}
              onSearch={searchHandler}
            />
          </FilterPlugins>
        </Col>
          <ButtonCol>
          </ButtonCol>
        </FilterRow>
        <Table
          rowSelection={rowSelection}
          loading={props.loading}
          dataSource={props.dataSource}
          columns={columns}
          rowKey={(record, index) => record.id}
        />
        <Modal
          closable
          footer={null}
          onCancel={() => setEmailFormVisible(false)}
          visible={emailFormVisible}
          width={600}
          title="Send Email Form"
          destroyOnClose
        >
          <EmailForm
            ids={selectedRows}
            closeModal={() => setEmailFormVisible(false)}
          />
        </Modal>
      </PageBody>
    </Layout>
  );
}

export default compose(
  withRouter,
  graphql(UsersConnection, {
    options: (props: RouteComponentProps) => {
      const params = queryString.parse(
        props.location.search.replace(/^\?/, '')
      );
      return {
        variables: {
          orderBy: JSON.parse((params.orderBy as string) || '{}'),
          page: Number(params.page || 1),
        },
        fetchPolicy: 'cache-and-network',
      };
    },
    name: 'getUsersConnection',
  }),
)((props) => {
  const { getUsersConnection} = props;
  const { users, loading } = getUsersConnection;
  const dataSource = users ? users.edges.map((edge) => edge.node) : [];
  return (
    <React.Fragment>
      <UserList
        dataSource={dataSource}
        loading={loading} />
    </React.Fragment>
  )
});


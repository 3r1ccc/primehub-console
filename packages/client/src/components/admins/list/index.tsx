import * as React from 'react';
import styled from 'styled-components';
import { filter } from 'lodash';
import {Table, Layout, Menu, Divider } from 'antd';

interface Props {
  dataSource: Array<any>;
  columns?: Array<any>;
  loading?: boolean;
}

export function List(props: Props) {
  // Extend the column config, a condition visible config.
  const columns = filter(props.columns, (obj) => obj.visible !== false)
  return (
    <React.Fragment>
      <Table
        loading={props.loading}
        dataSource={props.dataSource}
        columns={columns}
        rowKey={(record, index) => record.id}
      />
    </React.Fragment>
  );
}
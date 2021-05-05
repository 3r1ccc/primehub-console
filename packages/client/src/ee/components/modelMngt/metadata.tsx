import React from 'react';
import {Table} from 'antd';

export default function Metadata({metadata}: {metadata: Array}) {
  const columns = [{
    title: 'Name',
    dataIndex: 'key',
    width: 20,
    render: value => <div style={{wordBreak: 'break-word'}}>{value}</div>
  }, {
    title: 'Value',
    dataIndex: 'value',
    width: 80,
    render: value => <div style={{wordBreak: 'break-word'}}>{value}</div>
  }];
  return (
    <Table
      columns={columns}
      dataSource={metadata}
      scroll={{y: 120}}
      size="small"
      pagination={false}
    />
  )
}

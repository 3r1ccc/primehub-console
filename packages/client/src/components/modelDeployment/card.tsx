import React from 'react';
import {Row, Col, Card, Tooltip} from 'antd';
import {RouteComponentProps, withRouter} from 'react-router-dom';
import {DeploymentInfo, Status} from 'components/modelDeployment/common';
import moment from 'moment';
import { appPrefix } from 'utils/env';

type Props = RouteComponentProps & {
  deployment: DeploymentInfo;
  copyClipBoard: (text: string) => void;
}

function Field({
  label,
  value,
  style = {}
}: {
  label: React.ReactNode,
  value: React.ReactNode,
  style?: object
}) {
  return (
    <Row gutter={12} style={{marginBottom: 8, ...style}}>
      <Col span={8} style={{
        color: '#aaa',
      }}>
        {label}
      </Col>
      <Col span={16}>
        {value}
      </Col>
    </Row>
  )
}

function getCardColor(deployment: DeploymentInfo) {
  switch (deployment.status) {
    case Status.Deployed:
      return '#33ea33';
    case Status.Deploying:
      return 'orange'
    case Status.Failed:
      return 'red';
    case Status.Stopped:
    default:
      return '#aaa';
  }
}

class DeploymentCard extends React.Component<Props> {
  render() {
    const {deployment, copyClipBoard, history} = this.props;
    return (
      <Card
        style={{
          borderLeft: `8px solid ${getCardColor(deployment)}`
        }}
        hoverable
        onClick={() => history.push(`${appPrefix}model-deployment/${deployment.id}`)}
      >
        <h2>
          {deployment.name}
        </h2>
        <Field
          label="Group"
          value={deployment.groupName || ''}
        />
        <Field
          label="Endpoint"
          value={(
            <Tooltip title={(
              <span>
                Click to copy:
                {` `}
                <strong>{deployment.endpoint || ''}</strong>
              </span>
            )}>
              <a
                style={{
                  overflow: 'hidden',
                  textDecoration: 'underline'
                }}
                onClick={e => {
                  e.stopPropagation();
                  copyClipBoard(deployment.endpoint || '')
                }}
              >
                {deployment.endpoint || ''}
              </a>
            </Tooltip>
          )}
        />
        <Field
          label="Metadata"
          value={(
            <Tooltip
              overlayStyle={{width: '100%'}}
              title={(
                <>
                  {Object.keys(deployment.metadata || {}).map(key => (
                    <Field
                      style={{marginBottom: 0}}
                      key={key}
                      label={key}
                      value={deployment.metadata[key]}
                    />
                  ))}
                </>
              )}
            >
              <a>
                View
              </a>
            </Tooltip>
          )}
        />
        <Field
          label="Last Updated"
          value={deployment.lastUpdatedTime ? moment(deployment.lastUpdatedTime).fromNow() : '-'}
        />
      </Card>
    )
  }
}

export default withRouter(DeploymentCard)
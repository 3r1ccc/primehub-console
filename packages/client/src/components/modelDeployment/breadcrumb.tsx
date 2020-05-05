import React from 'react';
import {Breadcrumb, Icon} from 'antd';
import {withRouter, Link} from 'react-router-dom';
import {RouteComponentProps} from 'react-router';
import {appPrefix} from 'utils/env';

type Props = RouteComponentProps & {
  deploymentName?: string
};


function getBreadcrumbName(url: string, deploymentName: string) {
  switch (url) {
    case `${appPrefix}model-deployment`:
      return 'Model Deployments'
    case `${appPrefix}model-deployment/create`:
      return 'Create Model Deployment';
  }

  return `Model Deployment: ${deploymentName}`

}


class DeploymentBreadcrumb extends React.Component<Props> {

  render() {
    const { location, deploymentName } = this.props;
    const pathSnippets = location.pathname.split('/').filter(i => i && i !== appPrefix.replace(/\//g, ''));
    const extraBreadcrumbItems = pathSnippets.map((_, index) => {
      const url = `${appPrefix}${pathSnippets.slice(0, index + 1).join('/')}`;
      return (
        <Breadcrumb.Item key={url}>
          {
            pathSnippets.length === index + 1 ?
            getBreadcrumbName(url, deploymentName) :
            <Link to={url}>{getBreadcrumbName(url, deploymentName)}</Link>
          }
        </Breadcrumb.Item>
      );
    });
    const breadcrumbItems = [
      <Breadcrumb.Item key="home">
        <a href={`${appPrefix}`}>
          <Icon type="home" />
        </a>
      </Breadcrumb.Item>,
    ].concat(extraBreadcrumbItems);
    return (
      <Breadcrumb style={{marginBottom: 8}}>
        {breadcrumbItems}
      </Breadcrumb>
    );
  }
}

export default withRouter(DeploymentBreadcrumb);
import gql from 'graphql-tag';

export enum Status {
  Deploying = 'Deploying',
  Deployed = 'Deployed',
  Stopped = 'Stopped',
  Stopping = 'Stopping',
  Failed = 'Failed',
}

export interface DeploymentConnection {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  edges: Array<{
    cursor: string;
    node: DeploymentInfo;
  }>
}

export interface DeploymentInfo {
  id: string;
  status: Status
  message: string;
  name: string;
  description: string;
  metadata: object;
  groupId: string;
  groupName: string;
  creationTime: string
  lastUpdatedTime: string;
  endpoint: string;
  modelImage: string;
  pods: Array<{
    name: string;
    logEndpoint: string;
  }>,
  availableReplicas: number,
  replicas: number;
  imagePullSecret: string;
  instanceType: {
    id: string;
    name: string;
    displayName: string;
    cpuLimit: number;
    memoryLimit: number;
    gpuLimit: number;
  }
}

export const PhDeploymentFragment = gql`
fragment PhDeploymentInfo on PhDeployment {
  id
  status
  message
  name
  description
  metadata
  groupId
  groupName
  creationTime
  lastUpdatedTime
  endpoint
  modelImage
  pods {
    name
    logEndpoint
  }
  availableReplicas
  replicas
  imagePullSecret
  instanceType {
    id
    name
    displayName
    cpuLimit
    memoryLimit
    gpuLimit
  }
}
`
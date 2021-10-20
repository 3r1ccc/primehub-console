import { Middleware, ParameterizedContext } from 'koa';
import * as logger from '../logger';
import { escapePodName } from '../utils/escapism';
import { getStream as getK8SLogStream } from '../utils/k8sLog';
import CrdClientImpl, { client as kubeClient } from '../crdClient/crdClientImpl';
import Router from 'koa-router';
import { isAdmin, isGroupAdmin } from '../resolvers/utils';
import { Role } from '../resolvers/interface';
import Boom from 'boom';

export class PodLogs {

  private namespace: string;
  private appPrefix: string;
  private crdClient: CrdClientImpl;

  constructor({
    namespace,
    crdClient,
    appPrefix
  }: {
    namespace: string,
    crdClient?: CrdClientImpl,
    appPrefix?: string
  }) {
    this.namespace = namespace || 'default';
    this.crdClient = crdClient || new CrdClientImpl({ namespace });
    this.appPrefix = appPrefix || '';
  }

  public streamJupyterHubLogs = async (ctx: ParameterizedContext) => {
    const {
      follow,
      tailLines,
      container
    } = ctx.query;
    const podName = 'jupyter-' + escapePodName(ctx.username);
    const stream = getK8SLogStream(this.namespace, podName, {
      container: container || 'notebook',
      follow,
      tailLines
    });
    stream.on('error', err => {
      logger.error({
        component: logger.components.internal,
        type: 'K8S_STREAM_LOG',
        message: err.message
      });

      ctx.res.end();
    });
    ctx.body = stream;
  }

  public getImageSpecJobEndpoint = (imageId: string) => {
    return `${this.appPrefix || ''}/logs/images/${imageId}/job`;
  }

  public streamImageSpecJobLogs = async (ctx: ParameterizedContext, next: any) => {
    const { role, params, username, kcAdminClient } = ctx;
    const { imageId } = params;

    const image = await this.crdClient.images.get(imageId);
    const groupName = image.spec.groupName;
    if (role !== Role.ADMIN && role !== Role.CLIENT && await !isGroupAdmin(username, groupName, kcAdminClient)) {
      throw Boom.forbidden('request not authorized');
    }

    const {follow, tailLines} = ctx.query;
    const imageSpecJob = await this.crdClient.imageSpecJobs.get(imageId);
    const podName = imageSpecJob.status.podName;
    const stream = getK8SLogStream(this.namespace, podName, {follow, tailLines});

    stream.on('error', err => {
      logger.error({
        component: logger.components.internal,
        type: 'K8S_STREAM_LOG',
        message: err.message
      });

      ctx.res.end();
    });
    ctx.body = stream;
  }

  public getPhApplicationPodEndpoint = (podName: string) => {
    return `${this.appPrefix || ''}/logs/phapplications/${podName}`;
  }

  public streamPhApplicationPodLogs = async (ctx: ParameterizedContext) => {
    const {follow, tailLines} = ctx.query;
    const podName = ctx.params.podName;
    const stream = getK8SLogStream(this.namespace, podName, {follow, tailLines});

    stream.on('error', err => {
      logger.error({
        component: logger.components.internal,
        type: 'K8S_STREAM_LOG',
        message: err.message
      });

      ctx.res.end();
    });
    ctx.body = stream;
  }

  public mount(rootRouter: Router, authenticateMiddleware: Middleware) {
    rootRouter.get('/logs/jupyterhub', authenticateMiddleware, this.streamJupyterHubLogs);
    rootRouter.get('/logs/images/:imageId/job', authenticateMiddleware, this.streamImageSpecJobLogs);
    rootRouter.get('/logs/phapplications/:podName', authenticateMiddleware, this.streamPhApplicationPodLogs); // checkUserGroup,
  }
}

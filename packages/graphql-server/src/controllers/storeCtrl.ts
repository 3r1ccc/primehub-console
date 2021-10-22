import Koa, {Context, Middleware} from 'koa';
import Router = require('koa-router');
import {Client} from 'minio';
import mime from 'mime';

import * as logger from '../logger';
import { Stream } from 'stream';
import getStream from 'get-stream';
import { last } from 'lodash';
import Boom from 'boom';
import { isGroupBelongUser } from '../utils/groupCheck';

export const mountStoreCtrl = (router: Router,
                               appPrefix: string,
                               authenticateMiddleware: Middleware,
                               minioClient: Client,
                               storeBucket: string) => {
  const checkPermission = async (ctx, path) => {
    let fileDownloadAPIPrefix = `${appPrefix || ''}/files/`;
    if (path.startsWith(fileDownloadAPIPrefix)) {
      throw Boom.forbidden('request not authorized');
    }

    fileDownloadAPIPrefix = fileDownloadAPIPrefix + 'groups/';
    const groupName = path.split(fileDownloadAPIPrefix).pop().split('/')[0];
    if (!ctx.request.path.startsWith(fileDownloadAPIPrefix) ||
        await isGroupBelongUser(ctx, ctx.userId, groupName) === false) {
      throw Boom.forbidden('request not authorized');
    }
  };

  const downloadFile = async (ctx, path) => {
    let download = false;
    if ('download' in ctx.request.query && ctx.request.query.download === '1') {
      download = true;
    }

    let req;
    try {
      req = await minioClient.getObject(storeBucket, path);
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return ctx.status = 404;
      } else {
        logger.error({
          component: logger.components.internal,
          type: 'MINIO_GET_OBJECT_ERROR',
          code: error.code,
          message: error.message
        });
        ctx.res.end();
      }
    }

    req.on('error', err => {
      logger.error({
        component: logger.components.internal,
        type: 'MINIO_GET_OBJECT_ERROR',
        message: err.message
      });
      ctx.res.end();
    });

    ctx.body = req;

    const mimetype = mime.getType(path);
    ctx.set('Content-type', mimetype);
    if (download) {
      const filename: string = last(path.split('/'));
      ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    }
  };

  router.get('/files/(.*)', authenticateMiddleware, async ctx => {
    const objectPath = decodeURIComponent(ctx.request.path.split('/groups').pop());
    const path = `groups${objectPath}`;
    await checkPermission(ctx, path);
    await downloadFile(ctx, path);
  });

  router.get('/share/:hash', async ctx => {
    const hash = ctx.params.hash;
    let metadata;
    try {
      const stream: Stream = await minioClient.getObject(storeBucket, `share/${hash}`);
      const result = await getStream(stream);
      metadata = JSON.parse(result);
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return ctx.status = 404;
      } else {
        logger.error({
          component: logger.components.internal,
          type: 'MINIO_GET_OBJECT_ERROR',
          code: error.code,
          message: error.message
        });
        return ctx.status = 500;
      }
    }

    const { path } = metadata;
    if (!path) {
      return ctx.status = 500;
    }

    await downloadFile(ctx, path);
  });
};

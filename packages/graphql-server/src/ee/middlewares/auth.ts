import { rule, shield, and, or, not } from 'graphql-shield';
import { isAdmin, isClient, isUser, isGroupAdmin, isGroupMember } from '../../utils/roles';

export const permissions = shield({
  Query: {
    '*': isAdmin,
    'system': or(isAdmin, isClient),
    'me': or(isAdmin, isUser),
    'user': or(isAdmin, isClient),
    'group': or(isAdmin, isGroupAdmin, isClient),
    'groups': or(isAdmin, isClient),
    'datasets': or(isAdmin, isClient),
    'secret': or(isAdmin, isUser, isClient),
    'secrets': or(isAdmin, isUser, isClient),
    'image': or(isAdmin, isUser, isClient),
    'images': or(isAdmin, isUser, isClient),
    'imagesConnection': or(isAdmin, isUser, isClient),
    'groupImagesConnection': or(isAdmin, isUser, isClient),
    'phAppTemplates': or(isAdmin, isUser, isClient),
    'phApplication': or(isAdmin, isUser, isClient),
    'phApplications': or(isAdmin, isUser, isClient),
    'phApplicationsConnection': or(isAdmin, isUser, isClient),
    'instanceType': or(isAdmin, isClient),
    'phJob': or(isAdmin, isUser),
    'phJobs': or(isAdmin, isUser),
    'phJobsConnection': or(isAdmin, isUser),
    'phSchedule': or(isAdmin, isUser),
    'phSchedules': or(isAdmin, isUser),
    'phSchedulesConnection': or(isAdmin, isUser),
    'phDeployment': or(isAdmin, isUser),
    'phDeployments': or(isAdmin, isUser),
    'phDeploymentsConnection': or(isAdmin, isUser),
    'license': or(isAdmin, isUser),
    'files': or(isAdmin, isUser),
    'mlflow': or(isAdmin, isGroupMember),
    'model': or(isAdmin, isGroupMember),
    'models': or(isAdmin, isGroupMember),
    'modelVersion': or(isAdmin, isGroupMember),
    'modelVersions': or(isAdmin, isGroupMember),
    'modelVersionsConnection': or(isAdmin, isGroupMember),
  },
  Mutation: {
    '*': isAdmin,
    'updateGroup': or(isAdmin, isUser),
    'revokeApiToken': or(isAdmin, isUser),
    'createPhJob': or(isAdmin, isUser),
    'rerunPhJob': or(isAdmin, isUser),
    'cancelPhJob': or(isAdmin, isUser),
    'notifyPhJobEvent': or(isClient),
    'createPhSchedule': or(isAdmin, isUser),
    'updatePhSchedule': or(isAdmin, isUser),
    'deletePhSchedule': or(isAdmin, isUser),
    'runPhSchedule': or(isAdmin, isUser),
    'createPhDeployment': or(isAdmin, isUser),
    'updatePhDeployment': or(isAdmin, isUser),
    'deletePhDeployment': or(isAdmin, isUser),
    'stopPhDeployment': or(isAdmin, isUser),
    'deployPhDeployment': or(isAdmin, isUser),
    'createImage': or(isAdmin, isUser),
    'updateImage': or(isAdmin, isUser),
    'rebuildImage': or(isAdmin, isUser),
    'cancelImageBuild': or(isAdmin, isUser),
    'deleteImage': or(isAdmin, isUser),
    'deleteFiles': or(isAdmin, isUser),
    'createPhApplication': or(isAdmin, isUser),
    'updatePhApplication': or(isAdmin, isUser),
    'deletePhApplication': or(isAdmin, isUser),
    'startPhApplication': or(isAdmin, isUser),
    'stopPhApplication': or(isAdmin, isUser),
  },
}, {
  allowExternalErrors: true
});

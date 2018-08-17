// tslint:disable:no-console
import CrdClient, { InstanceTypeSpec, DatasetSpec, ImageSpec } from '../crdClient/crdClientImpl';
import KeycloakAdmin from 'keycloak-admin';
import Watcher from './watcher';
import { crd as instanceType} from '../resolvers/instanceType';
import { crd as dataset} from '../resolvers/dataset';
import { crd as image} from '../resolvers/image';

export default class Observer {
  private datasetWatcher: Watcher<DatasetSpec>;
  private imageWatcher: Watcher<ImageSpec>;
  private instanceTypeWatcher: Watcher<InstanceTypeSpec>;
  private credentials: any;

  constructor({
    crdClient,
    keycloakAdmin,
    everyoneGroupId,
    credentials
  }: {
    crdClient: CrdClient,
    keycloakAdmin: KeycloakAdmin,
    everyoneGroupId: string,
    credentials: any
  }) {
    this.datasetWatcher = new Watcher<DatasetSpec>({
      crd: dataset,
      resource: crdClient.datasets,
      keycloakAdmin,
      defaultCreateData: object => ({access: object.spec.access || 'everyone'}),
      everyoneGroupId,
      credentials
    });

    this.imageWatcher = new Watcher<ImageSpec>({
      crd: image,
      resource: crdClient.images,
      keycloakAdmin,
      defaultCreateData: object => ({global: true}),
      everyoneGroupId,
      credentials
    });

    this.instanceTypeWatcher = new Watcher<ImageSpec>({
      crd: instanceType,
      resource: crdClient.instanceTypes,
      keycloakAdmin,
      defaultCreateData: object => ({global: true}),
      everyoneGroupId,
      credentials
    });
  }

  public observe(options?: {rewatch?: boolean}) {
    this.datasetWatcher.watch(options);
    this.imageWatcher.watch(options);
    this.instanceTypeWatcher.watch(options);
  }

  public abort() {
    this.datasetWatcher.abort();
    this.imageWatcher.abort();
    this.instanceTypeWatcher.abort();
  }
}

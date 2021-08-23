export const datasets = [
  {
    "id": "env",
    "name": "env",
    "displayName": "env dataset",
    "description": "env",
    "type": "env",
    "pvProvisioning": "auto",
    "volumeName": "env",
    "volumeSize": null,
    "variables": {
      "FOO": "BAR",
      "foo_Bar": "foo-bar"
    },
    "nfsServer": null,
    "nfsPath": null,
    "hostPath": null,
    "url": "",
    "secret": null,
    "mountRoot": "/datasets",
    "enableUploadServer": false,
    "uploadServerLink": null,
    "global": true,
    "groups": []
  },
  {
    "id": "git",
    "name": "git",
    "displayName": "gitsync dataset",
    "description": "",
    "type": "git",
    "pvProvisioning": "auto",
    "volumeName": "git",
    "volumeSize": null,
    "variables": {},
    "nfsServer": null,
    "nfsPath": null,
    "hostPath": null,
    "url": "git@github.com:InfuseAI/primehub.git",
    "secret": null,
    "mountRoot": "/datasets",
    "enableUploadServer": false,
    "uploadServerLink": null,
    "global": true,
    "groups": []
  },
  {
    "id": "hostpath",
    "name": "hostpath",
    "displayName": "hostpath-ooxx",
    "description": "",
    "type": "hostPath",
    "pvProvisioning": "auto",
    "volumeName": "hostpath",
    "volumeSize": null,
    "variables": {},
    "nfsServer": null,
    "nfsPath": null,
    "hostPath": "/data",
    "url": "",
    "secret": null,
    "mountRoot": "/datasets",
    "enableUploadServer": false,
    "uploadServerLink": null,
    "global": false,
    "groups": []
  },
  {
    "id": "nfs",
    "name": "nfs",
    "displayName": "nfs",
    "description": "",
    "type": "nfs",
    "pvProvisioning": "auto",
    "volumeName": "nfs",
    "volumeSize": null,
    "variables": {},
    "nfsServer": "1.2.3.4",
    "nfsPath": "/data",
    "hostPath": null,
    "url": "",
    "secret": null,
    "mountRoot": "/datasets",
    "enableUploadServer": false,
    "uploadServerLink": null,
    "global": false,
    "groups": []
  },
  {
    "id": "pv-manual",
    "name": "pv-manual",
    "displayName": "pv manual",
    "description": "PV Manual Provision",
    "type": "pv",
    "pvProvisioning": "manual",
    "volumeName": "pv-manual",
    "volumeSize": -1,
    "variables": {},
    "nfsServer": null,
    "nfsPath": null,
    "hostPath": null,
    "url": "",
    "secret": null,
    "mountRoot": "/datasets",
    "enableUploadServer": false,
    "uploadServerLink": null,
    "global": false,
    "groups": []
  },
  {
    "id": "pv-auto",
    "name": "pv-auto",
    "displayName": "pv auto",
    "description": "",
    "type": "pv",
    "pvProvisioning": "auto",
    "volumeName": "test6",
    "volumeSize": 1,
    "variables": {},
    "nfsServer": null,
    "nfsPath": null,
    "hostPath": null,
    "url": "",
    "secret": null,
    "mountRoot": "/datasets",
    "enableUploadServer": true,
    "uploadServerLink": "https://demo.primehub.io/dataset/hub/pv-auto/browse",
    "global": true,
    "groups": []
  },
];

export default datasets;
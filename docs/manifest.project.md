# Project manifest

Declares the project specified configuration.

Can be multiple.

### Config structure

    type: "project" (mandatory)

    id: [ string ] (mandatory)

    title: [ string ]
    description: [ string ]

    info:
      contactEmail: [ string ]

    artifacts:
      [ id1: string ]: ArtifactConfig
      [ id2: string ]: ArtifactConfig
      ...

    integrations:
      [ id1: string ]: IntegrationConfig
      [ id2: string ]: IntegrationConfig
      ...

    storages:
      [ id1: string ]: StorageConfig
      [ id2: string ]: StorageConfig
      ...

    versionings:
      [ id1: string ]: VersioningConfig
      [ id2: string ]: VersioningConfig
      ...

    flows:
      [ id1: string ]: FlowConfig
      [ id2: string ]: FlowConfig
      ...

    targets:
      [ id1: string ]: TargetConfig
      [ id2: string ]: TargetConfig
      ...

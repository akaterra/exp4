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
      [ id1: string ]: ArtifactOptions
      [ id2: string ]: ArtifactOptions
      ...

    integrations:
      [ id1: string ]: IntegrationOptions
      [ id2: string ]: IntegrationOptions
      ...

    storages:
      [ id1: string ]: StorageOptions
      [ id2: string ]: StorageOptions
      ...

    versionings:
      [ id1: string ]: VersioningOptions
      [ id2: string ]: VersioningOptions
      ...

    flows:
      [ id1: string ]: FlowOptions
      [ id2: string ]: FlowOptions
      ...

    targets:
      [ id1: string ]: TargetConfig
      [ id2: string ]: TargetConfig
      ...

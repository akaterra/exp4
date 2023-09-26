# General manifest

Describes the general configuration used across all components.

Can be defined only once.

### Structure

    type: "general" (mandatory)

    auth:
      [ id1: string ]: AuthProviderConfig
      [ id2: string ]: AuthProviderConfig
      ...

    integrations:
      [ id1: string ]: IntegrationConfig
      [ id2: string ]: IntegrationConfig
      ...

    storages:
      [ id1: string ]: StorageConfig
      [ id2: string ]: StorageConfig
      ...


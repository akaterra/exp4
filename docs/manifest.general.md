# General manifest

Declares the general configuration used across all components.

Can be defined only once.

### Config structure

    type: "general" (mandatory)

    auth:
      [ id1: string ]: AuthProviderOptions
      [ id2: string ]: AuthProviderOptions
      ...

    integrations:
      [ id1: string ]: IntegrationOptions
      [ id2: string ]: IntegrationOptions
      ...

    storages:
      [ id1: string ]: StorageOptions
      [ id2: string ]: StorageOptions
      ...


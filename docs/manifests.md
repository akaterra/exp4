# Manifests

Manifest is a resource that describes various configuration of the components.

It can be of the following:
* [`General`](manifests.general.md) - defines the general configuration like auth strategies, global storages, etc.
* [`Project`](manifests.project.md) - defines the project specified configuration

Manifest source can be defined as:
* Directory(-es), JSON or YAML files are supported
* File path(s), JSON or YAML files are supported
* Storage URI

  Currenlty supported:
    * MongoDb - `mongodb://user:pass@host/db`
    * MySQL - `mysql://user:pass@host/db`
    * PostgreSQL - `postgres://user:pass@host/db`
    * SQLite - `sqlite://`

In form of `CLI` param
  ```
  sourceflow --manifest=[ filePath ] --manifest=[ dir ] --manifest=[ uri ]
  ```
or as `ENV` var
  ```
  MANIFEST=[ filePath ],[ dir ],[ uri ]
  ```

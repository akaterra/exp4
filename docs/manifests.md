# Manifests

Manifest declares various configuration of the components.

It can be of the following:
* [`General`](manifests.general.md) - defines the general configuration like auth strategies, global storages, etc.
* [`Project`](manifests.project.md) - defines the project specified configuration.

Manifest is loaded on start-up and resynchronizes periodically.

### Loading sources

Manifest can be be loaded from:
* Directory(-es), JSON or YAML files are supported.

  Entire directory will be scanned for files with possible manifest declaration.
* File path(s), JSON or YAML files are supported.
* Storage URI.

  Currenlty supported:
    * MongoDb - `mongodb://user:pass@host/db`
    * MySQL - `mysql://user:pass@host/db`
    * PostgreSQL - `postgres://user:pass@host/db`
    * SQLite - `file://`

In form of `CLI` param
  ```
  sourceflow --manifest=[ filePath ] --manifest=[ dir ] --manifest=[ uri ]
  ```
or as `ENV` var
  ```
  MANIFEST=[ filePath ],[ dir ],[ uri ]
  ```
By default the source is `[ CWD ]/projects]` directory.

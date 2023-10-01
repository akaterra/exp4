# Manifest

Manifest declares various configuration of the components.

It can be of the following:
* [`General`](manifest.general.md) - defines the general configuration like auth strategies, global storages, etc.
* [`Project`](manifest.project.md) - defines the project specified configuration.

Manifest is loaded on start-up and resynchronizes periodically.

### Sources

*By default source is `[ CWD ]/projects]` directory.*

Manifest can be be loaded from:
* Directory(-es), JSON and YAML files are supported.

  Entire directory will be scanned for files with appropriate manifest declaration.
* File path(s), JSON and YAML files are supported.
* Storage URI.

  Currenlty supported:
    * MongoDb `mongodb://user:pass@host/db`
    * MySQL - `mysql://user:pass@host/db`
    * PostgreSQL - `postgres://user:pass@host/db`
    * SQLite - `file://`

  By default the manifests collection (or table) is "storageManifests".
  To customize it add `#[ name ]` to the URI.

  Example for MongoDb URI which loads manifests from "manifests" collection
  ```
  mongodb://user:pass@host/db#manifests
  ```

The sources are provided in form of CLI param
  ```
  sourceflow --manifest=[ filePath ] --manifest=[ directory ] --manifest=[ URI ]
  ```
or as ENV var
  ```
  MANIFEST=[ filePath ],[ directory ],[ URI ]
  ```


# Overview

**SourceFlow** is a tool for easy controlling of versioned code sources.

Aims:
  * to provide a fully controlled flows over the code sources hosted locally or remotely
  * to aggregate various integration data

### Components, terminology and concept

The main idea is to provide control over set of the [`streams`](stream.md) like GitHub repositories.
Such sets are called [`targets`](target.md) and combined under [`project`](manifest.project.md).

* **Service** - resource which provides some functionality
  * [`Artifacts`](artifacts.md) - artifacts aggregation
  * [`Auth strategies`](auth-strategies.md) - auth ability and users management
  * [`Integrations`](integrations.md) - integration with 3rd parties (like GitHub)
  * [`Steps`](steps.md) - flow action handler
  * [`Storages`](storages.md) - internal data storage
  * [`Versionings`](versionings.md) - version and history management

* **Project** - a customized set of services aimed to provide workflows inside an some isolated environment.
  * [`Manifest`](manifests.project.md)

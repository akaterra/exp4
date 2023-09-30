# Overview

**SourceFlow** is a tool for easy controlling of versioned code sources.
It provides a fully controlled flows over the code sources hosted locally or remotely.
Gives capabilities like aggregation of various integration data and more and provides access to all this through UI and API.

### Components, terminology and concept

The main idea is to provide control over set of the [`streams`](stream.md).
The stream can be any code-source, such as a GitHub repository, a local git directory or anything else.
Such sets are called [`targets`](target.md) and represent a kind of environments that need to be observed or controlled.
Targets combined under [`project`](manifest.project.md).
Each stream can have a some set of artifacts associated with it, such as some data exctacted from GitHub action run, etc.

* **Service** - resource which provides some functionality
  * [`Artifacts`](artifacts.md) - artifacts aggregation
  * [`Auth strategies`](auth-strategies.md) - auth ability and users management
  * [`Integrations`](integrations.md) - integration with 3rd parties (like GitHub)
  * [`Steps`](steps.md) - flow action handler
  * [`Storages`](storages.md) - internal data storage
  * [`Versionings`](versionings.md) - version and history management

* **Project** - a customized set of services aimed to provide workflows inside an some isolated environment.
  * [`Manifest`](manifests.project.md)

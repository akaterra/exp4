# Overview

**Source Flow** is a tool for easy controlling of versioned code sources.
It provides a fully controlled flows over the code sources hosted locally or remotely.
Gives capabilities like aggregation of various integration data and more and provides access to all this through UI and API.

### Components and concept

The main idea is to provide control over set of the [`streams`](stream.md).
The stream can be any code-source, such as a GitHub repository, a local git directory or anything else.
Such sets are called [`targets`](target.md) and represent a kind of environments that need to be observed or controlled.
Each stream may have a some set of artifacts associated with it, such as some data exctacted from GitHub action run, etc.
Additionally it is possible to define various [`flows`](flow.md) to run some work on the targets and streams.
All these targets, streams and flow are combined under a [`project`](manifest.project.md).

##### Example:

There is a project "x" with two targets (environments) - "dev" and "stg".

"dev" target defines two streams:
  * serviceA - is an associated GitHub repo "service-a", branch `dev`
  * serviceB - is an associated GitHub repo "service-b", branch `dev`

"stg" target defines two streams:
  * serviceA - is an associated GitHub repo "service-a", branch `release-${major}-${minor}-${patch}`
  * serviceB - is an associated GitHub repo "service-b", branch `release-${major}-${minor}-${patch}`

For project defined [`versioning`](versioning) of type "semver" with initial value "0.1.0", versioning associated with the "stg" target and affects to "stg" repositories branch names.

For project has two flows "mergeLatestDevelop" and "release".

"mergeLatestDevelop" flow defined for target "stg" and consists of two steps:
  * "moveFrom" - merges "dev" branch to "stg" branch using current versioning data
  * "runTest" - runs tests

"release" flow defined for target "stg" and consists of two steps:
  * "release" - increases minor version
  * "moveFrom" - merges "dev" branch to "stg" branch using current versioning data

Scenarios:
  * on running "mergeLatestDevelop" flow:
    * "service-a" `release-0-1-0` branch merges latest state of "dev" branch
    * "service-b" `release-0-1-0` branch merges latest state of "dev" branch
    * "run test" GitHub action is triggered on both repositories
    * UI then shows "dev" repositories for branch `dev` and "stg" repositories for branch `release-0-1-0`

  * on running "release" flow:
    * versioning value is bumped to "0.2.0"
    * "service-a" `release-0-2-0` branch is created from the latest state of "dev" branch
    * "service-b" `release-0-2-0` branch is created from the latest state of "dev" branch
    * UI then shows "dev" repositories for branch `dev` and "stg" repositories for branch `release-0-2-0`

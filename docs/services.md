# Services

* **Service** is a unit which provides some functionality
  * [`Artifact`](artifact.md) - targets and streams artifacts aggregation
  * [`Auth strategy`](auth-strategy.md) - auth ability and users management
  * [`Integration`](integration.md) - integration with 3rd parties (like GitHub)
  * [`Step`](step.md) - flow action handler
  * [`Storage`](storage.md) - internal data storage
  * [`Versioning`](versioning.md) - version and history management

### Custom services

Service module is a JS script which exports `[ name ][ servicePostfix ]` symbol as a class of the service implementation.

```js
class MyStorageService {
  async manifestsLoad(source) {
    return []
  }

  // ...
}

exports.MyStorageService = MyStorageService;
```

Loading with CLI:

```
sourceflow --service-dir=[ directory ]
```

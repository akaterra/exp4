# Artifact

Artifact provides ability to aggregate various data related to the streams.

### Declaration

Artifact should be declared in a "artifacts" section of project manifest in form of dictionary where key is an artifact id and value is an artifact options.
Artifact options must include the "type" field at least to accosiate it with one of the artifact services.
"config" section includes arbitrary configuration data depending on the implementation of the artifact service.

```yaml
artifacts:
  artifact1:
    type: [ type ]
    config:
      integration: [ key ]
```

Artifacts can be combined into a pipeline using option "dependsOn".

```yaml
artifacts:
  artifact1:
    type: [ type ]
  artifact2:
    type: [ type ]
    dependsOn: "artifact1"
  artifact3:
    type: [ type ]
    dependsOn: "artifact1"
```

So on requesting the "artifact3" first of all the "artifact1" will be called.

# Deployment example: Go, Artifact Registry, and Deploys.app

Use the supplied-file pattern for new deployments: build once from the Go module
root, publish to Google Artifact Registry, then pass the immutable digest output
to dependent Deploys.app jobs. All names and configuration must come from the
target project, not the source used to demonstrate this pattern.

Canonical templates live inside the deployment skill so installing the complete
skill directory also installs its examples:

- [Dockerfile template](../../skills/deploying-go-to-nortezh/assets/deploys/Dockerfile.tmpl)
- [Staging workflow template](../../skills/deploying-go-to-nortezh/assets/deploys/workflow-staging.yaml.tmpl)
- [Docker context exclusions](../../skills/deploying-go-to-nortezh/assets/dockerignore.tmpl)
- [Required configuration, adaptations, and checks](../../skills/deploying-go-to-nortezh/references/deploys-pattern.md)

For illustration, choose `example` as the application name; it is not mandatory:

```text
<target-project>/
  go.mod
  go.sum
  .dockerignore
  cmd/example/
    main.go
    Dockerfile
  example/                         # app-owned features when needed
  pkg/                             # genuinely shared code when needed
  schema/                          # when this app uses the shared database
  .github/workflows/
    example-staging.yaml
```

Render `__APP__` as the selected app name and `__GO_VERSION__` as its compatible
Go image version. Use the Docker context at the module root, not `cmd/example`.
The templates are inert here; copying a rendered YAML into `.github/workflows`
can enable publication/deployment, so obtain authorization and configure protected
environments first. Never copy the supplied root files as publishable examples.

The workflow includes credential-free source verification, one build job, one
deployment job, and an optional second deployment of the **same digest** (off by
default). Do not add a second real target without a requirement. No production
trigger is assumed. Explicit GHCR/Nortezh requirements can use the retained
alternative templates instead.

The example contains no source project identity, runner label, registry/project/
cluster identifiers, credential values, or private endpoint. Secret **names** are
references to the target's approved secret store, not supplied key values.

Run the built-in static contract checks from the bundle root:

```text
node --test skills/deploying-go-to-nortezh/scripts/deployment-templates.test.mjs
```

These checks do not parse YAML, run actionlint, build an image, execute target
project tests, or prove a live rollout. Validate those layers separately against
the actual rendered target files and available approved tooling.

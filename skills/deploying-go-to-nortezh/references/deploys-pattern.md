# Artifact Registry and Deploys.app delivery pattern

Use this as the default for new deployment authoring in this bundle, unless the
target project or explicit request selects another platform. Keep the existing
GHCR/Nortezh assets as an alternative, not an automatic replacement for this
pattern. The skill directory name is retained for compatibility.

## Source shape and deliberate adaptations

The user supplied a root Dockerfile and staging workflow, inspected on
2026-11-13. Preserve their structure, not their project identity:

- Compile one `cmd/<app>` binary from the Go module root, Linux amd64, CGO off;
  copy only the binary and required non-secret assets into distroless `/app`.
- Place the rendered Dockerfile at `cmd/<app>/Dockerfile` and the workflow at
  `.github/workflows/<app>-staging.yaml`.
- Stage on main/manual dispatch with app, shared-code, schema, module, Docker
  context, and workflow path filters.
- Authenticate to Google Artifact Registry using a service-account secret,
  obtain an access token, log in as `oauth2accesstoken`, and use Buildx to publish.
- Export `repository@digest` from the build job. All authorized deployment jobs
  depend on that job and consume the same output without rebuilding or deploying
  a mutable tag. Keep `provenance: false` from the supplied pattern; review this
  compatibility choice against the target's supply-chain policy.
- Use `deploys-app/deploys-action` with `project`, `location`, `name`, and `image`,
  plus the target's type/port. Pass only secret references for authentication.
- Add multiple targets only when requested. The optional second job is disabled
  by default and has its own environment configuration. Parallel deployments are
  not an atomic rollout; add explicit ordering when migrations or dependencies
  require it, and inspect every target after an authorized rollout.

Do not transfer source app/project names, runner labels, registry paths, region,
cluster, deployment names, credentials, or account-specific values. The example
uses `__APP__`/`__GO_VERSION__`, environment variables, and secret references.
Select actual values from the target requirements.

The template deliberately adds a credential-free verification job, full-commit
run-specific tags, pinned action revisions, non-root runtime, path coverage,
environment-scoped credentials, and serialized per-app staging runs. It does not
install agents, provision secrets, launch a workflow, or authorize a deployment.

## Configuration before enabling a rendered workflow

Use [the Dockerfile](../assets/deploys/Dockerfile.tmpl) and
[staging workflow](../assets/deploys/workflow-staging.yaml.tmpl) with
[context exclusions](../assets/dockerignore.tmpl). Replace every template token;
derive the Go version from the target module/toolchain, not the source's version.
Adapt CGO/architecture/runtime assets when needed. Add pinned Swagger generation
to both verification and Docker build only if the target imports generated docs.

Create and protect the following GitHub environments **before** enabling runs:

| Environment | Variables | Secrets |
|---|---|---|
| `<app>-staging-build` | `REGISTRY_HOST`, `REGISTRY_PROJECT`, `REGISTRY_REPOSITORY` | `GOOGLE_CREDENTIALS` |
| `<app>-staging` | `DEPLOY_PROJECT`, `DEPLOY_LOCATION`, `DEPLOY_NAME`, `DEPLOY_PORT` | `DEPLOYS_AUTH_USER`, `DEPLOYS_AUTH_PASS` |
| `<app>-staging-secondary` (optional) | Independent values for the same `DEPLOY_*` keys | Independent values for the same `DEPLOYS_*` keys |

`REGISTRY_HOST` has shape `<region>-docker.pkg.dev`; the complete image path is
`<host>/<registry-project>/<repository>/<app>-staging`. The registry project and
Deploys project are distinct inputs. Give the Google identity only the approved
repository write/token-generation access; configure runtime image-pull access
separately. Do not paste JSON keys into a workflow, Dockerfile, or chat.

`ENABLE_SECONDARY_DEPLOYMENT` is a **repository variable**, exactly `true` to
enable the optional job. Omit/remove that job for one-target projects. Environment
names alone do not establish reviewers, trust, or correct credentials.

The example is a WebService: confirm its listening port, configured target, and
approved name before enabling it. For a Worker, change `type` and omit `port`;
do not create an HTTP service for a non-HTTP application. Keep platform runtime
env, networking, scaling, mounts, and private-image pull access configured for
the actual target. Avoid action `env`/`envGroups` inputs unless an explicit
replacement of the platform's existing sets is intended. The action may create
a missing deployment; confirm identity/creation authority first.

Use trusted Ubuntu-compatible runners with Docker, Bash, curl, jq, and Node 20
action support. Select a self-hosted label only when supplied/approved for the
target; never copy the source label. Review the target's test harness and
`TEST_DB_MODE` before using the example commands. Build/vet/test success alone
does not prove migrations, runtime assets, health, or deployment readiness.

No production workflow is inferred from the supplied staging example. Obtain
the production release/approval policy before authoring one. Explicitly requested
GHCR/Nortezh delivery continues to use the older reusable pipeline/contracts.

## Action evidence and validation boundaries

Resolved public refs and inspected action metadata on 2026-11-13:

| Action | Revision | Verified interface used here |
|---|---|---|
| `google-github-actions/auth@v2` | `c200f3691d83b41bf9bbd8638997a462592937ed` | `credentials_json`, `token_format: access_token`, `access_token` output, disabled credential-file/environment exports |
| `deploys-app/deploys-action@v1` | `16080dc6692cfe7205515a95e8921317b66f4ef9` | `action.yaml`: target/image/type/port inputs; `DEPLOYS_AUTH_USER`/`DEPLOYS_AUTH_PASS` env fallbacks; digest image examples |

Other action pins reuse the previously researched table in
[source baseline](source-baseline.md); they are not new security audits. Recheck
client/action/runtime support before adoption. Pinning an action is not proof of
safe execution, trusted runners, or a successful deployment.

Parse rendered YAML, run actionlint when available, verify triggers/needs/image
outputs/environment scope, and inspect the rendered Dockerfile and context.
Build/smoke-test with the actual target module only when its toolchain/engine is
available. Report static checks, source tests, image build, workflow execution,
registry publication, and each live target rollout separately. No image push,
secret provisioning, workflow run, or live deployment is part of template work.

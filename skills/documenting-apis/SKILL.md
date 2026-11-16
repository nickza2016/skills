---
name: documenting-apis
description: Writes and maintains OpenAPI 3.1 documentation for RPC-style Go HTTP APIs (arpc/httpmux), with purpose-focused descriptions, request examples, success and every error response example, and per-milestone release snapshots served as a static docs site (apidocs.<domain>/<milestone>). Use when documenting new or changed endpoints, preparing API docs for frontend handoff, or cutting a docs release. Does not authorize deploying the docs site.
---

# Document APIs

On first project use, follow [agent setup](../initializing-agent-teams/SKILL.md) when available. The parent asks once before configuration/model changes; delegated children do not initialize again. Missing, declined, or non-interactive setup does not block the task or force delegation.

Write OpenAPI 3.1 YAML by hand from the code. Do not use swag or other annotation generators.

## Files

One docs site per API application, in `apidocs/` (or `apidocs/<app>/` when the repository has several API apps):

```text
apidocs/
  index.html                    Swagger UI with a milestone dropdown (from assets/index.html.tmpl)
  releases.json                 dropdown entries: latest + every milestone
  openapi.yaml                  latest spec (from assets/openapi.yaml.tmpl)
  CHANGELOG.md                  per milestone: Added / Changed / Deprecated / Removed
  M01_2026_10_10/
    index.html                  same file as apidocs/index.html
    openapi.yaml                snapshot of this milestone
```

Template tokens: `__TITLE__`, `__SERVER_URL__`, `__MILESTONE__`, and `__SWAGGER_UI_VERSION__` (pin an exact `swagger-ui-dist` 5.x version, which renders OpenAPI 3.1; never `latest`).

## Workflow

1. **Collect routes.** Read `<app>/handler.go`: every `Handle("POST /<resource>.<action>", ...)`, its group (public, signed-in, verified), and the function it calls.
2. **Read each function.** Its `Params`, `Valid()` messages, `Result`/`Item` types, permission check, `var Err...` declarations, and errors from middleware. Read `<app>/rest.go` for the exact error `code` strings and envelope the encoder sends; never guess them.
3. **Write the operation** in `apidocs/openapi.yaml` following [descriptions](references/descriptions.md) and [examples](references/examples.md): summary, description, request schema + examples, `200` with success and every error example, `400` validation example.
4. **Record the milestone.** Ask the user which milestone this work belongs to (format `M<NN>_<YYYY>_<MM>_<DD>`). Add the milestone tag and `x-changes` entry per [releases](references/releases.md).
5. **Write the snapshot.** Copy `apidocs/openapi.yaml` to `apidocs/<milestone>/openapi.yaml`, copy `index.html` into that folder, update `releases.json` and `CHANGELOG.md`.
   **While the milestone is not on the base branch yet (PR not merged), rewrite that milestone's files in place** — fold later changes into the existing entries, no extra history. Only a milestone that already exists on the base branch is frozen. See [releases](references/releases.md).
6. **Check.**
   - Every route in `handler.go` has a path in `openapi.yaml`, and every path in `openapi.yaml` exists in `handler.go`.
   - Every error the function or its middleware can return has a named example.
   - Every `$ref` resolves; lint with an available OpenAPI linter (for example `npx @redocly/cli lint apidocs/openapi.yaml`) and report if none was run.
   - Open `index.html` locally and confirm the examples render before handing off.

## Boundaries

- Document what the code does today. If the code and the requested behavior differ, report it; do not document the wished-for behavior.
- Never put real tokens, passwords, customer data, or production hostnames in examples.
- Preparing `apidocs/` does not authorize publishing it; deploying the static site is a separate request.

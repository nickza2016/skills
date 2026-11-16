# API contracts and feature conventions

Apply this reference to each application that exposes an HTTP API, not to every executable in the repository.

## Routing and function shape

Register method + path with httpmux and adapt typed functions through `arpc.Manager`. Use a shape such as `func Get(ctx context.Context, p *GetParams) (*GetResult, error)`, with JSON tags and `Valid() error` on request types.

Follow [writing functions](writing-functions.md): each function's params, `Valid()`, and result types sit directly above it in the same file; no new files unless the code is reused (then `pkg/`).

Use `validator.New()`, `v.Must(condition, "message")`, and `v.Error()`. Explicit validation in a domain function can support direct invocation; arpc v2.2.0 also validates requests before invocation by default. Keep validation idempotent and free of database writes or other side effects.

Register endpoints with `mux.Handle("POST /item.get", am.Handler(item.Get))`. Use `POST /<resource>.<action>` as the RPC baseline. This is not JSON-RPC 2.0: the request body contains parameters directly, not a `jsonrpc`/`method`/`id` envelope.

Place `Mount(mux *httpmux.Mux, am *arpc.Manager)` in `<app>/handler.go`, following [HTTP entrypoint](http-app-entrypoint.md): public routes on `mux`, then one named group per access level. Determine application boundaries from requirements rather than assuming two audiences or fixed application names.

## Identity and authorization

- Read `Authorization: Bearer <access_token>` in middleware, validate the session, and install identity/token using typed context keys.
- Check permissions and resource ownership/tenant scope at the domain boundary. Successful authentication does not authorize every operation.
- Preserve the idea of an explicit authorization function, but define permissions for the new domain. Do not copy source accounts, permission catalogs, or privileged bypasses.
- Do not infer JWT from Swagger examples. The source uses opaque random session tokens with SHA-256 hashes stored in PostgreSQL; define expiry, refresh rotation, and revocation deliberately.
- Handle missing identity safely rather than copying unchecked type assertions and treating recovery as an authorization response.
- Separate audiences when required. Frontend visibility is not backend authorization.

## Response contract

Configure adapters explicitly before writing the client specification. The RPC success baseline uses HTTP 200:

```json
{"ok":true,"result":{"id":"example-id","name":"Example"}}
```

Typed application/domain/auth errors use HTTP 200:

```json
{"ok":false,"error":{"code":"UNAUTHORIZED","message":"auth: unauthorized"}}
```

Validation errors from the custom encoder use **HTTP 400**, code **`VALIDATION`**, and optional `items` when details exist:

```json
{"ok":false,"error":{"code":"VALIDATION","message":"validation error","items":["id is required"]}}
```

The inspected encoder masks unknown errors as `INTERNAL_SERVER_ERROR` with a generic message and HTTP 200. The rate limiter has its own 429 path. Do not expose raw SQL/internal diagnostics.

Do not interpret HTTP 200 alone as business success or claim every response uses 200. Normalize typed codes to stable `UPPER_SNAKE_CASE`. If the user selects conventional REST statuses, record that contract change and update tests/specifications together.

Implement `<app>/rest.go` and wire `am.WrapError`, `am.ErrorEncoder`, `am.OnOK`, and `am.OnError`. Returning an error alone does not establish the baseline envelope. Test mounted handlers, including no-result functions; do not infer `{ok:true}` versus `result:null` from documentation types alone.

## Lists, pagination, and updates

Every list uses `pkg/api.Paginate` and `pkg/rest.Sort`, following [pagination and sorting](pagination-and-sorting.md).

- Distinguish omitted, null, empty, false, and zero for updates with pointer fields.
- Use pgstmt for filters/updates and pgctx for fixed SQL only. Do not generate arbitrary column maps from client input.

## Specifications and integration handoff

Write API documentation with [documenting-apis](../../documenting-apis/SKILL.md) (hand-written OpenAPI 3.1, no swag). Document each exposed API application; a worker needs no API document.

- Document method/path, auth, permissions, envelopes, nullability, optionality, defaults, and enums. Preserve accurate `required`, descriptions, and examples when changing schemas.
- Match documented statuses to the runtime encoder: typed errors are HTTP 200 with `ok: false`, not 401.
- Follow the requested or repository-established documentation language. Source-specific Thai FE handoff rules do not make every new project's output Thai; this skill bundle itself remains English.
- For integration handoffs, include request/response JSON and key-reference tables covering nested example fields, relevant targeting/timing/error semantics, and a checklist.
- For multiple screens, include endpoint-to-screen and permission-to-action mappings, navigation, and loading/empty/error behavior as backend integration guidance, not permission to implement the frontend.

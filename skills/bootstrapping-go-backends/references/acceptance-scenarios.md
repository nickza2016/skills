# Acceptance scenarios

Use these cases to evaluate skill behavior. A plan or dry-run is behavioral review, not proof that a generated application builds or runs.

## 1. One named application

**Prompt:** Create an inventory API at the specified path/module with an items feature and PostgreSQL. No other applications are requested.

**Expect:** One root module, `cmd/inventory/main.go`, `inventory/handler.go`, `inventory/item`, required shared helpers, schema, real implementation/tests/specification. Use arpc/httpmux/parapet and database/sql/libpq/pgsql. Do not reopen framework selection or add a second API, worker, scheduler, or cloud setup.

**Reject:** A forced user/admin pair, renamed source business domains, unrelated modules/go.work, empty scaffold claims, private-source imports, or an unrequested stack switch.

## 2. Several applications with different responsibilities

**Prompt:** Create inventory and reporting HTTP applications plus a dispatch job processor and a reconciliation scheduler. Share the required catalog contracts and database operations.

**Expect:** `cmd/inventory`, `cmd/reporting`, `cmd/dispatch`, and `cmd/reconciliation` in one module. Give each its own composition root and role-appropriate dependencies. Put shared contracts/operations in `pkg/catalog` rather than cross-importing application packages. Give only the HTTP applications route tables/specifications. Select a migration owner by responsibility, not an assumed source app name.

**Reject:** A fixed four-app template with source names, forced HTTP servers in non-HTTP apps, one module per app, or shared access credentials merely because the repository is shared.

## 3. Transactional job

**Prompt:** Persist an item and enqueue a River job atomically for a processor with the requested application name.

**Expect:** One lib/pq-backed pool used by pgctx and `riverdatabasesql.New(db)` in the producer. SQL and `InsertTx` share the callback context/physical transaction. Give the selected processor proper registration, migration rollout, retry/idempotency, and shutdown behavior. Test rollback; do not claim exactly-once.

**Reject:** Enqueue after committing business state, a second transaction/pool presented as atomic, or automatic request transactions attributed to pgctx middleware.

## 4. Source unavailable / explicit override

**Prompt:** Use the skill on a machine without the reference repository and without permission to clone it.

**Expect:** Use bundled references and implement local adapters without private imports, absolute source paths, or business seeds. Disclose missing downloads/toolchain instead of inventing test success.

**Adjacent prompt:** Fix a feature in an existing Gin/GORM repository while preserving its stack.

**Expect:** Preserve that repository and authorized scope; do not restructure it using new-project defaults.

## 5. Mounted HTTP contract

**Prompt:** Test invalid parameters, unauthorized access, and empty lists through the real application router.

**Expect:** Validation 400/code VALIDATION; typed unauthorized 200/ok:false under the baseline; clients inspect envelopes. Verify no-result output and absence of raw DB diagnostics. Keep pagination fields consistent with the endpoint's selected mode.

## 6. Paginated list with sorting

**Prompt:** Add a list endpoint with search and sort.

**Expect:** `ListParams`/`ListItem`/`ListResult` above the function in the same file, `api.Paginate` + `rest.Sort`, one shared pgstmt filter for `CountTotal`, `Count`, and the item query, `p.Sort.Do(b)` plus `Limit()`/`Offset()` on the item query, `items: []` when empty. No raw SQL beyond pgctx/pgstmt.

No single-use helpers or row-conversion methods; rows are scanned straight into `ListItem`. `CountTotal` is used only after estimating the row count, and never when the filter can match more than 100,000 rows.

**Cases:** Empty, one page, several pages; `next` (and `totalCount` when used) correct; item count never exceeds `perPage`; default, valid, and invalid sort; missing `paginate` defaults to page 1/50.

## 7. Query beyond pgctx/pgstmt

**Prompt:** A feature seems to need a CTE, window function, bulk COPY, or another DB library.

**Expect:** Stop and ask the user before writing it.

## 8. Migrations and safe tests

**Prompt:** Initialize DB tests on Windows and add a fresh-project migration.

**Expect:** Start at 01.sql with a project-specific lock/ledger; use isolated UTF-8 PostgreSQL, lazy TestMain cleanup, per-test databases, and explicitly test-only external mode. Do not copy source accounts, Redis settings, production dotenv, or migration history.

**Reject:** Guessing a baseline, dropping databases the harness did not create, silently skipping unsupported names such as 100.sql, or claiming whole-upgrade rollback.

## Completion criteria for a generated project

- Verify application/import/dependency ownership, not just a proposed tree.
- Exercise actual routers and isolated databases; validate each selected pagination/sort contract.
- Run formatting/build/vet/tests and separate passed, blocked, and unrun checks.
- Check specifications, configuration placeholders, secret exclusions, and application-specific launch instructions.
- Do not commit, push, deploy, or expand product scope without authorization.

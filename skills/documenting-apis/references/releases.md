# Milestones and release snapshots

## Naming

`M<NN>_<YYYY>_<MM>_<DD>`: a two-digit sequence plus the release date, e.g. `M01_2026_10_10`, `M02_2026_11_16`. Ask the user for the milestone; do not invent the date.

## Recording changes

For every operation created, changed, or deprecated in a milestone:

- Add the milestone name to the operation's `tags`, and declare the tag once at the top level (`tags: [{ name: M02_2026_11_16, description: "Changes in M02" }]`). Frontend can filter by it.
- Add one `x-changes` entry `{ release: <milestone>, change: <short text> }`. Use `created` for new operations; otherwise describe the result ("Added optional `note`.", "`status` now includes `archived`.").
- Deprecated operations get `deprecated: true` and an `x-changes` entry saying what to use instead.
- Removed operations are deleted from `openapi.yaml` and listed under **Removed** in `CHANGELOG.md`.
`CHANGELOG.md`:

```markdown
## M02_2026_11_16
### Added
- `POST /item.archive`
### Changed
- `POST /item.create`: added optional `note`.
### Deprecated
### Removed
```

## Unmerged milestones are rewritten in place

A milestone is **frozen only after it exists on the base branch**. Check before editing:

```text
git fetch origin
git cat-file -e origin/main:apidocs/M01_2026_10_10/openapi.yaml
```

(Use the repository's real base branch and app path.)

- **Not on the base branch** (still only in this branch/PR): rewrite `apidocs/M01_2026_10_10/` and the latest `apidocs/openapi.yaml` directly, then push to the same branch.
  - An operation created in this milestone keeps exactly one entry, `{ release: M01_2026_10_10, change: created }`. Later additions in the same PR (a new response field, a new param) go straight into its schema and examples with no extra history.
  - An operation changed in this milestone keeps one `x-changes` entry for M01; rewrite its text to describe the final result.
  - An operation added and then removed within the same PR is deleted entirely; it never appears under **Removed**.
  - Rewrite the M01 section of `CHANGELOG.md` to match the final state.
- **Already on the base branch**: never edit that snapshot. Start the next milestone (ask the user for it) and record changes there.

Example: `account.create` was documented in M01 and the PR is still open. A new field is added to its result. Add the field to the M01 schema and `success` example, in both `apidocs/openapi.yaml` and `apidocs/M01_2026_10_10/openapi.yaml`. `x-changes` stays `created`.

## Static site

- `releases.json` lists `latest` first, then milestones newest first:

  ```json
  [
    { "name": "latest", "url": "/openapi.yaml" },
    { "name": "M02_2026_11_16", "url": "/M02_2026_11_16/openapi.yaml" },
    { "name": "M01_2026_10_10", "url": "/M01_2026_10_10/openapi.yaml" }
  ]
  ```

- `apidocs/index.html` and every `apidocs/<milestone>/index.html` are the same file rendered from [index.html](../assets/index.html.tmpl). It opens the milestone named in the URL path, or `latest` at `/`.
- Publish `apidocs/` as the site root, so `apidocs.<domain>/M01_2026_10_10/` opens that snapshot. Publishing is a separate, explicitly authorized step.

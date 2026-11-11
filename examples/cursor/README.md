# Cursor project agent configuration example

This is a reusable **XYZ Skills agent-team example**, not Cursor editor settings,
an MCP configuration, or an activated team. It does not change the running model.

## Example model allocation

[models.example.json](models.example.json) contains only the seven role-to-model
assignments, adapted from a supplied local Cursor manifest. These model IDs are
illustrative: they have **not** been checked against an installed Cursor version,
account, subscription, or live model catalog. Confirm exact supported IDs and
costs before using them; do not infer reasoning controls from their suffixes.

| Role | Illustrative model ID |
|---|---|
| scout | `composer-2.5-fast` |
| implementer | `grok-4.7-high-fast` |
| verifier | `claude-sonnet-5-5-high` |
| advisor | `claude-opus-5-5-medium` |
| git-publisher | `composer-2.5-fast` |
| db-reviewer | `claude-opus-5-5-medium` |
| security-reviewer | `claude-opus-5-5-medium` |

For a portable alternative, use
[the inheritance model map](../../skills/initializing-agent-teams/assets/model-overrides.example.json).
An unavailable ID needs an explicit choice of another supported ID or `inherit`;
the helper does not verify availability or silently substitute a model.

## Preview setup

Requires Node 20+ and a trusted local XYZ Skills checkout. Create/open the intended
target project first. Replace the placeholder paths below; do not run setup
against this example directory or the skills bundle itself.

PowerShell, dry-run only:

```powershell
$bundle = "<path-to-xyz-skills>"
$project = "<path-to-target-project>"
$models = Join-Path $bundle "examples/cursor/models.example.json"
$helper = Join-Path $bundle "skills/initializing-agent-teams/scripts/init-agent-team.mjs"

node $helper --project $project --harness cursor --models $models
```

Review the models and proposed changes, confirm the installed client's native
schema/model support, and obtain approval before applying:

```powershell
node $helper --project $project --harness cursor --models $models --apply --approved --capabilities-confirmed
```

These flags attest to approval and capability checks; they do not perform them.
If the target already has AGENTS.md, review the proposed append separately and
add `--append-entrypoints` only after approval. Conflicting managed definitions
are not overwritten. Do not install extensions, alter global settings, or bypass
permissions to make this example work.

## Result in the target project

```text
<target-project>/
  AGENTS.md
  .cursor/
    agents/
      xyz-scout.md
      xyz-implementer.md
      xyz-verifier.md
      xyz-advisor.md
      xyz-git-publisher.md
      xyz-db-reviewer.md
      xyz-security-reviewer.md
  .agents/
    xyz-skills/
      cursor.json
```

The native Cursor definitions are `.cursor/agents/xyz-<role>.md`. The generated
`.agents/xyz-skills/cursor.json` is the helper's **state manifest**, not a file to
import into Cursor editor settings and not the input to `--models`. Do not copy
a manifest from another project: source bindings, managed-file hashes, and
verification state belong to that setup. Let the helper generate them.

Generation does not launch agents or prove native activation. Verify instruction
loading, discovery, models, and read-only behavior in the installed Cursor client;
`nativeVerification` remains `pending` in the helper output. The coordination
policy is at most two concurrent children, depth one, and one writer per file;
these are not universal Cursor enforcement settings. Publication still requires
separate task-specific authorization.

## Privacy and portability

- This example deliberately includes no credentials, private endpoints, local
  workstation paths, managed-file hashes, or copied verification claims.
- Keep keys/tokens in the client's supported secret store, never in model maps,
  agent prompts, or example files. Inspect generated files before sharing.
- The supplied root `/cursor.json` is a local reference and is ignored by this
  repository. It is not the publishable template.
- Local-mode generated instructions/manifest reference the actual bundle path;
  they are not automatically portable or safe to publish unchanged. For pinned
  public-source setup, follow the separate
  [public GitHub source guide](../../skills/initializing-agent-teams/references/public-github-source.md).

See [native adapter boundaries](../../skills/initializing-agent-teams/references/native-adapters.md)
and [first-use setup](../../skills/initializing-agent-teams/references/first-use-and-entrypoints.md)
for client-version and preservation limits.

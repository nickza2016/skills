# XYZ Skills

Portable Agent Skills for working in the XYZ style. Keep personal defaults separate from each target project's rules and requirements.

## Skills

| Skill | Use when |
|---|---|
| [initializing-agent-teams](skills/initializing-agent-teams/SKILL.md) | Offer first-use model defaults once; generate seven on-demand backend roles and project startup entrypoints for the active harness without overwriting existing instructions or pretending native activation. |
| [designing-backend-systems](skills/designing-backend-systems/SKILL.md) | Discover detailed requirements, design simple extensible PostgreSQL-backed systems and normalized reusable data, consider Redis for justified high-RPS reads, and iterate on shareable DB diagrams with the team before implementation. |
| [bootstrapping-go-backends](skills/bootstrapping-go-backends/SKILL.md) | Create a Go backend repository that can contain multiple applications in one Go module, with shared packages, PostgreSQL, and the selected HTTP/job libraries. |
| [debugging-backend-issues](skills/debugging-backend-issues/SKILL.md) | Reproduce a bug safely, establish its cause, add missing red/green regression coverage, apply a minimal authorized fix, and rerun the original case and related tests to completion. |
| [deploying-go-to-nortezh](skills/deploying-go-to-nortezh/SKILL.md) | Prepare per-application Dockerfiles, GHCR publishing, GitHub Actions, and Nortezh staging/production deployment templates without authorizing a live deployment. |
| [reviewing-backend-prs](skills/reviewing-backend-prs/SKILL.md) | Review backend diffs pragmatically with exact task logic, safe related tests, and isolated original/alternative measurements when useful; prioritize dangerous, financial, and material-performance defects without style gatekeeping. |
| [committing-to-github](skills/committing-to-github/SKILL.md) | Deliver ready cross-task changes on one fresh branch, prefer one commit or a small same-branch split, exclude credentials, and open a PR covering all shipped work; stop/report push or PR failure without hunting keys. |

The Go baseline is **one repository, one Go module, and as many application binaries as the requirements need**. It does not prescribe application names or require a user/admin pair. An application can be an API, worker, scheduler, or another backend executable.

Browsable lists support validated sorting. Pagination is selected per workload: exact totals are optional, and large lists can use count-free next-page navigation rather than an unconditional COUNT query.

This bundle provides instructions, references, and a local agent-configuration helper, not an executable backend application generator. The consuming AI must implement and test the target application.

## For an AI asked to install this repository into a project

When the user says "install https://github.com/nickza2016/skills into this project, replace duplicate skills," **do not stop after copying skills or suggesting models**. Follow the complete [project installation and subagent setup guide](skills/initializing-agent-teams/references/installing-in-project.md): inspect the target project and installed harness, resolve and record one public source commit, install each complete skill directory using that harness's project-local discovery mechanism, and replace only same-name XYZ Skills copies when the user authorized replacement. Preserve unrelated instructions, custom agents, and local work.

Then read [initializing-agent-teams](skills/initializing-agent-teams/SKILL.md). Show one quickly confirmable set of model defaults and file changes. **After the user's confirmation**, create all seven *definitions* for the active harness in the target project, verify native discovery and model/tool behavior as far as the installed client permits, and continue the original task. Do not merely describe or promise creation. Seven definitions do not mean seven agents run on every task. A URL or copied AGENTS.md alone does not install skills or create agents; Pi also requires a compatible trusted extension. Never silently switch providers, install extensions, overwrite unrelated project rules, or commit/push/deploy without separate authorization.

## Quick project entrypoint

With an existing local checkout and Node 20+, preview project-only setup (replace both paths and the harness):

```text
node "<xyz-skills>/skills/initializing-agent-teams/scripts/init-agent-team.mjs" --project "<project>" --harness cursor
```

This is dry-run by default. After confirming the displayed plan/models and installed native capabilities, add `--apply --approved --capabilities-confirmed`. Existing instruction files require separately approved `--append-entrypoints`; no force overwrite exists. Pi additionally needs an already verified compatible extension and `--pi-extension-confirmed`.

The helper creates a small AGENTS.md entrypoint, a CLAUDE.md import for Claude, seven native role definitions, and a per-harness manifest. It does not launch agents or switch the running model. A linked checkout must remain accessible; shared/offline portability needs an agreed vendoring or checkout strategy. Native startup loading varies, and Letta automatic injection is not established by merely creating AGENTS.md. See [first-use details](skills/initializing-agent-teams/references/first-use-and-entrypoints.md).

To point project instructions to **public GitHub** instead of a workstation path, add `--github-ref "29b619c1552cc076049de86ba93fc77776cb2b32"` for the published snapshot used below. Every resource is pinned to that revision; apply also requires `--github-source-confirmed` after checking that published files exist and match the reviewed renderer/contracts. The helper does no fetching or remote execution, and a URL is not guaranteed to auto-import in every client. See [public GitHub mode](skills/initializing-agent-teams/references/public-github-source.md). New local features are unavailable through GitHub until separately published.

## Copy-ready new-project example

For a Cursor-specific role-to-model template and PowerShell setup commands, see
[examples/cursor](examples/cursor/README.md). This is a sanitized example, not
activated configuration or a verified live model catalog.

Pinned skill snapshot: **`29b619c1552cc076049de86ba93fc77776cb2b32`**, the latest published main revision verified when this example was updated. This is a real source commit, not a placeholder. The later documentation commit intentionally has a different SHA; do not make a document attempt to contain its own commit hash. Upgrade this pin deliberately when choosing a newer skill snapshot, not automatically on each chat.

1. Create/open the intended project folder, for example `D:\works\my-api`.
2. Copy [examples/new-project/AGENTS.md](examples/new-project/AGENTS.md) into that project's root. It already contains public raw-GitHub URLs with the pinned SHA; no local XYZ Skills checkout path is embedded.
3. For Claude Code, also copy [examples/new-project/CLAUDE.md](examples/new-project/CLAUDE.md) next to it. Its `@AGENTS.md` import loads the shared project instructions subject to the installed client's normal import behavior. Preserve existing instruction files; append/integrate with approval rather than overwriting them with an example.
4. Open a fresh session in that project and verify the instructions were loaded. Cursor/Codex/Pi instruction discovery has cwd/version/override limits. For Letta, explicitly ask it to read AGENTS.md until loading is confirmed; merely copying the file is not a universal auto-loader.
5. Give the AI this starting request, then confirm its actual available model/configuration defaults once:

```text
Read AGENTS.md first. Help start a Go backend using PostgreSQL.
Discover and confirm the detailed requirements before finalizing the design.
Choose application names/count from those requirements, not fixed user/admin apps.
Propose the available agent/model defaults once. After I confirm, create and
verify all seven project-local subagent definitions for this active harness;
do not stop at a plan or just write AGENTS.md.
Load only the XYZ Skills needed for each task. Do not commit, push, or deploy.
```

Direct bootstrap URL for the copy-ready example:

```text
https://raw.githubusercontent.com/nickza2016/skills/29b619c1552cc076049de86ba93fc77776cb2b32/skills/initializing-agent-teams/SKILL.md
```

An agent still needs approved web/HTTP access (or an approved same-commit cache). Copying these instruction files does not fetch/execute code, launch agents, configure models, or establish native activation by itself.

## Use with an AI

Ask a file-capable AI to read the skill and its relevant references:

```text
Read skills/bootstrapping-go-backends/SKILL.md from this xyz-skills bundle
and load the references needed for the task.

Create a backend at <target-path> with module path <module-path>.
The required applications are <application names and responsibilities>.
Use PostgreSQL where required. Do not add applications or integrations
that are not needed. Do not commit, push, or deploy.

Apply the skill's defaults unless the current task or target repository
explicitly requires something else. Report implemented files, actual
build/test results, and unverified or blocked checks.
If the skill or a required reference cannot be read, say so.
```

For an Agent Skills-compatible tool, install the **whole skill directory**, including its references, using that tool's supported mechanism. For a web chat, attach the files or use an available tool to retrieve them.

A public GitHub repository makes the source accessible; it does not make every AI load it automatically or continuously refresh it. Reload at task start and record the source revision when reproducibility matters.

## Boundaries

- Apply this Go baseline to new projects, not as permission to restructure an existing repository.
- Store authored skill documentation in English. Follow explicit task/repository requirements for the language of generated deliverables.
- Do not include source-system credentials, production configuration, business code, or SQL seeds.
- Consult the [source baseline](skills/bootstrapping-go-backends/references/source-baseline.md) for evidence, dependency versions, and deliberate adaptations.
- The original reference repository is not required to use the skill.

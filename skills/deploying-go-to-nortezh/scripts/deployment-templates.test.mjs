import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const skill = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(skill, relative), 'utf8');
const workflow = read('assets/deploys/workflow-staging.yaml.tmpl');
const dockerfile = read('assets/deploys/Dockerfile.tmpl');
const render = text => text.replaceAll('__APP__', 'example').replaceAll('__GO_VERSION__', '1.25');

// These are static contract checks, not a YAML parser, actionlint, or Docker run.
test('templates render without unresolved tokens or literal credential/path patterns', () => {
  for (const text of [render(workflow), render(dockerfile)]) {
    assert.doesNotMatch(text, /__[A-Z_]+__/);
    assert.doesNotMatch(text, /(?:[A-Za-z]:\\|-----BEGIN .*PRIVATE KEY-----|\bsk-[A-Za-z0-9]{20,})/);
  }
  assert.match(render(dockerfile), /FROM golang:1\.25 AS builder/);
  assert.match(render(dockerfile), /\.\/cmd\/example/);
  assert.match(render(workflow), /file: \.\/cmd\/example\/Dockerfile/);
});

test('build from module root, keep non-root binary-only distroless runtime', () => {
  assert.match(workflow, /context: \./);
  assert.match(workflow, /platforms: linux\/amd64/);
  assert.match(dockerfile, /ENV GOOS=linux\s+ENV GOARCH=amd64\s+ENV CGO_ENABLED=0/);
  assert.match(dockerfile, /COPY go\.mod go\.sum \.\/\s+RUN go mod download\s+COPY \. \./);
  const runtime = dockerfile.split('FROM gcr.io/distroless/')[1];
  assert.match(runtime, /^static-debian12:nonroot/);
  assert.match(runtime, /COPY --from=builder --link --chown=65532:65532 \/workspace\/\.build\/__APP__ \.\//);
  assert.match(runtime, /USER 65532:65532/);
  assert.match(runtime, /ENTRYPOINT \["\/app\/__APP__"\]/);
  assert.doesNotMatch(runtime, /^COPY \. \./m);
});

test('verification gates build and both deployments consume the same digest', () => {
  assert.match(workflow, /build-example:[\s\S]*?needs: verify/);
  assert.match(workflow, /image: \$\{\{ steps\.image\.outputs\.repository \}\}@\$\{\{ steps\.docker_build\.outputs\.digest \}\}/);
  assert.equal((workflow.match(/needs: build-example/g) ?? []).length, 2);
  assert.equal((workflow.match(/image: \$\{\{ needs\.build-example\.outputs\.image \}\}/g) ?? []).length, 2);
  assert.equal((workflow.match(/ref: \$\{\{ github\.sha \}\}/g) ?? []).length, 2);
  assert.match(workflow, /tags: .*github\.sha.*github\.run_id.*github\.run_attempt/);
  assert.match(workflow, /if: vars\.ENABLE_SECONDARY_DEPLOYMENT == 'true'/);
  const verify = workflow.split('  verify:')[1].split('  build-example:')[0];
  assert.doesNotMatch(verify, /secrets\.|environment:/);
  for (const command of ['go build ./...', 'go vet ./...', 'go test -p 4 ./...']) {
    assert.ok(verify.includes(command));
  }
});

test('staging triggers cover schema, Dockerfile, context and workflow changes', () => {
  const triggers = render(workflow).split('permissions:')[0];
  for (const filter of ['go.mod', 'go.sum', 'example/**', 'cmd/example/**', 'pkg/**', 'schema/**', '.dockerignore', '.github/workflows/example-staging.yaml']) {
    assert.ok(triggers.includes(`- ${filter}`), `Missing filter: ${filter}`);
  }
  assert.match(triggers, /workflow_dispatch:/);
  assert.match(triggers, /branches: \[main\]/);
  assert.doesNotMatch(workflow, /pull_request_target|\brelease:|:latest\b/);
  assert.match(workflow, /cancel-in-progress: false/);
});

test('credentials are references, auth creates no credential file, and actions are pinned', () => {
  const actions = [...workflow.matchAll(/uses: ([^\s]+)(?:\s|$)/g)].map(match => match[1]);
  assert.equal(actions.length, 9);
  for (const action of actions) assert.match(action, /^[\w.-]+\/[\w.-]+@[a-f0-9]{40}$/);
  assert.match(workflow, /credentials_json: \$\{\{ secrets\.GOOGLE_CREDENTIALS \}\}/);
  assert.match(workflow, /create_credentials_file: false/);
  assert.match(workflow, /export_environment_variables: false/);
  assert.match(workflow, /password: \$\{\{ steps\.auth\.outputs\.access_token \}\}/);
  for (const key of ['DEPLOYS_AUTH_USER', 'DEPLOYS_AUTH_PASS']) {
    assert.equal((workflow.match(new RegExp(`${key}: \\$\\{\\{ secrets\\.${key} \\}\\}`, 'g')) ?? []).length, 2);
  }
  assert.ok(read('assets/dockerignore.tmpl').includes('**/gha-creds-*.json'));
  assert.ok(read('assets/dockerignore.tmpl').includes('**/service-account*.json'));
});

test('new skill links resolve inside the portable skill directory', () => {
  for (const relative of ['SKILL.md', 'references/deploys-pattern.md']) {
    const absolute = path.join(skill, relative);
    for (const [, link] of fs.readFileSync(absolute, 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
      if (/^https?:/.test(link)) continue;
      assert.ok(fs.existsSync(path.resolve(path.dirname(absolute), link)), `Broken link: ${link}`);
    }
  }
});

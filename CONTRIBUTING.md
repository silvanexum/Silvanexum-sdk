# Contributing

Thanks for helping. Issues and pull requests are both welcome.

## Before you start

- **Bugs:** open an issue with the package name and version, what you ran, and
  what happened.
- **Bigger changes:** open an issue first so we can agree on the approach before
  you spend time on it.

## Setup

```bash
pnpm install
pnpm -r build
pnpm -r test
```

For a Python package, `cd packages/<name>`, install it with its test extras
(see its `pyproject.toml`), and run `pytest`.

## Generated code

These files are generated from the Silvanexum API's contracts and are
overwritten on every API change:

- `spec/openapi.json`
- `packages/sdk-ts/src/generated/`
- `packages/sdk-py/silvanexum/_generated/`

Don't edit them by hand. If a type there looks wrong, open an issue and we'll
fix it at the source. Everything else (the client classes, the MCP server, the
plugins) is hand-written and open to PRs.

## Pull requests

- Keep each PR to one change, with tests where it makes sense.
- For a change to a published npm package, add a changeset: `pnpm changeset`.
- CI must pass.

By contributing, you agree that your contributions are licensed under the
Apache-2.0 license of this repo.

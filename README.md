# Napland Music Tools

[Open Music Tools](https://music-tools.naplandgames.com)

![test](https://github.com/Naphier/music-tools/workflows/test/badge.svg)

A tool for practicing sight reading, learning songs, and training other musical skills in your browser. The successor to <https://github.com/leafo/mursic>.

See [features.md](features.md) for tool details and the [site guide](https://music-tools.naplandgames.com/about) for help getting started.

## Contributors

Contributions are welcome. Open a clean, focused pull request and include relevant tests. If CI does not run those tests, include the commands and passing results in the PR description. Update [features.md](features.md), [AGENTS.md](AGENTS.md), and any other affected documentation.

## Frontend development

The frontend is a React app that can be developed without the backend (Lua,
PostgreSQL, tup). All you need is Node:

```bash
npm ci
npm run dev
```

Then open <http://localhost:3000/>. The dev server bundles with esbuild,
watches for changes, and reloads the page automatically. MIDI input and output
work in this preview. Login, account Stats, and the account song library require
the backend.

## Remote development with GitHub Codespaces

To test a pull-request branch without installing anything locally:

1. Open the pull request on GitHub, select **Code**, then **Codespaces**, and
   create a codespace on the pull-request branch.
2. Wait for the container setup to finish. Locked dependencies are installed and the frontend preview starts
   automatically.
3. If the preview is not running, run `bash dev/start_preview.sh` in the Codespaces terminal.
4. When Codespaces forwards port 3000, select **Open in Browser**. If the
   notification is missed, open the **Ports** panel and use the globe icon next
   to **Napland Music Tools**.

The forwarded site runs in the codespace; only the browser is local. The
frontend-only limitations above still apply.

The full site build (backend + minified production assets) uses the
[tup](https://gittup.org/tup/) build system, see the Tupfiles in the repo.

### Create a Codespaces preview from the command line

With a personal GitHub CLI login that has Codespaces access:

```bash
gh auth login
gh auth refresh -h github.com -s codespace
bash dev/create_codespace.sh your-branch
```

The helper reuses a codespace for that branch or creates one using the smallest
available machine, a 30-minute idle timeout and seven-day stopped retention.
Creating or running a codespace consumes your GitHub Codespaces quota. The branch
must already be pushed. Open the printed URL, wait for setup, then use **Ports →
3000 → Open in Browser**. New forwarded ports default to private; verify
**Port Visibility → Private** when reusing a codespace. The devcontainer automatically
starts the preview when the codespace starts; `dev/out/preview.log` contains logs.
When reusing a codespace, update its checkout to the latest branch commit after
preserving any local work. If it predates this devcontainer update, rebuild its container
or run `bash dev/start_preview.sh` manually after updating the checkout.

## Full-backend production runtime

Production requires `SR_STAGE` (`dev` or `prd`), `SR_PUBLIC_URL` (an HTTPS origin
without a trailing slash), `SR_DB_HOST`, `SR_DB_NAME`, `SR_DB_USER`, and the
`SR_DB_PASSWORD` / `SR_SESSION_SECRET` secrets. Each secret may instead be read
from its corresponding `_FILE` path; do not supply both sources. Session secrets
must have at least 32 characters and differ between stages. Secret inputs are
limited to 4096 bytes; file reads are bounded and trim trailing CR/LF. Public
hostnames are validated and normalized to lowercase. Missing production
configuration fails closed. Keep these values outside the repository.

The production process runs in the foreground, uses secure host-only session
cookies, and rejects unexpected Host headers. `GET /_health/ready` checks database
connectivity and the required trainer-preferences schema; it returns 503 without
database error details when unavailable. Internal health clients must send the
configured public hostname in their Host header. Deployment scripts and server
configuration live in the private operations repository.

Run `lapis migrate` before deploying this version: the migration adds the
`users.trainer_preferences` JSONB column. Production PostgreSQL must use persistent
storage (a volume or an external database) to retain preferences and existing hit
history across container replacement. The repository's Dockerfile is for CI;
it does not define a persistent production deployment.

Run the authentication transport regressions with `npm run test_auth`. Backend CI also exercises a cookie-preserving login, logout, and account-switch sequence.

Backend CI uses the root Dockerfile as a disposable test runner with stable Lapis
and PostgreSQL. Generate assets with `npm ci && npm run build_assets`, then run
`docker build -t sightreading-test .` and `docker run --rm sightreading-test`.
Its database is local to that throwaway container; do not run `ci.sh` on a host.
The script checks an image-only marker before changing PostgreSQL configuration.
It discovers MoonScript specs once, excluding their generated Lua copies. The CI
image uses Debian PostgreSQL 15; the private runtime integration also checks the
production PostgreSQL 17 stack.

## Adding practice tools

Follow the [new-tool playbook](docs/adding-tools.md) for routes, navigation,
state persistence, audio lifecycle, accessibility, verification, and PR previews.

## Upstream

Music Tools builds on [leafo/sightreading.training](https://github.com/leafo/sightreading.training) by Leaf Corcoran. Original attribution is retained in the source.

The default branch in this fork is `main`; upstream still uses `master`. When incorporating upstream changes, fetch `upstream`, then merge `upstream/master` into a review branch based on `main` and open a pull request targeting this fork’s `main`. The branch names do not need to match.

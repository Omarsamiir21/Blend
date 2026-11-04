# Blend

Blend is an appliance for authorized guest-level machine capture and migration. This foundation build serves an operator console and reports PostgreSQL schema readiness.

## Start on this machine

Install Docker with Compose v2 and use Linux containers. From PowerShell in the repository root, initialize the local database secret once, then start Blend.

```powershell
if (-not (Test-Path .env.db-password)) {
    [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)) |
        Set-Content -NoNewline .env.db-password
}
docker compose up --build -d
Invoke-RestMethod http://127.0.0.1:8080/api/v1/system/health
```

Open [the local console](http://127.0.0.1:8080). On Linux, generate the same secret with `openssl rand -hex 32 > .env.db-password` and run `chmod 644 .env.db-password` so the unprivileged API process can read the mounted file. Keep the checkout directory private and retain the original secret with the initialized volume. Use `docker compose ps -a` and `docker compose logs api migrate db` to diagnose startup. `docker compose down` stops the stack and retains the database volume.

## GitHub release and appliance installation

Push the repository to GitHub. The verification workflow runs on pull requests, pushes to `main`, and version tags. A passing `vMAJOR.MINOR.PATCH` tag publishes its tested Linux/amd64 image to `ghcr.io/<owner>/<repo>:<tag>`. GitHub Packages access applies to the resulting image.

On the appliance host, use the matching tag's source checkout for `compose.yaml` and migrations. Create the local database secret, authenticate to GHCR if the package is private, then run the following with the approved image reference.

```bash
export BLEND_IMAGE=ghcr.io/owner/repo:v0.1.0
docker compose pull
docker compose up --no-build -d
bash scripts/smoke.sh
```

The foundation binds to loopback. The smoke script needs Bash, curl and jq.

## Layout and validation

- `cmd/blend-api` holds the Go HTTP service and probe tests.
- `web` holds the React/TypeScript console.
- `db/migrations` holds the ordered PostgreSQL migrations.
- `docs/api/openapi.yaml` describes the implemented probes.
- `docs/architecture.md` records the implementation order and decisions.
- `IMPLEMENTATION_STATUS.md` tracks evidence and the acceptance gate.

The Docker build runs `gofmt` verification, `go vet ./...`, `go test ./...` and `npm run build`. CI also starts the stack and checks its live routes and compiled console asset.

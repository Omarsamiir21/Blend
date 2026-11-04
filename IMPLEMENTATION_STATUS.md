# Implementation status

## Milestone 0 — Foundation implemented, Compose gate pending

- Go liveness and database-backed readiness probes, with a redacted failure response.
- PostgreSQL initialization migration and Compose startup dependency checks.
- React and TypeScript shell with live health reporting and explicit unavailable states for future workflows.
- OpenAPI health contract, dependency lockfiles, container build and GitHub Actions smoke test and GHCR publication workflow.

## Validation on 2026-11-04

- `gofmt -l cmd` returned no files. `go vet ./...`, `go test -v ./...`, and `go build -mod=readonly ./cmd/blend-api` passed using Go 1.26.10. The three health tests cover liveness independence, success and redacted failure.
- `npm ci --prefix web` and `npm run build --prefix web` passed. `npm audit --prefix web` reported zero vulnerabilities.
- `bash -n scripts/smoke.sh` passed. A local run of the compiled API returned 200 for liveness, 503 for an intentionally unavailable database, and 200 for the console deep link and its JavaScript asset.
- Docker is unavailable on the Windows workstation. Successful PostgreSQL startup, migration application, and image verification remain pending the first GitHub Actions run. The workspace has no Git remote or published release.

## Subsequent milestones

1. Appliance identity, RBAC, enrollment, inventory and audit.
2. Linux disk capture, interrupted upload resume and byte-identical reconstruction.
3. Proxmox deployment and observed Linux boot.
4. Logical labs and their capture/deployment workflows.
5. Windows snapshot provider and observed Windows boot.
6. Portable recovery.
7. Recovery ISO and appliance packaging.

Begin appliance identity and enrollment after the Compose acceptance gate passes.

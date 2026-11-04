# Architecture and implementation plan

Build the foundation first, then prove one Linux capture-to-boot path before broadening guest or recovery support. The separate master prompt numbers the foundation as Milestone 1. This repository follows the engineering spec's Milestone 0 numbering and its acceptance gate.

## Decisions

- Serve the built console and API from one Go service and origin. Start with liveness and database readiness. The browser shell exposes the implemented health view and describes unavailable workflows.
- PostgreSQL owns durable metadata. Ordered SQL migrations run before API startup and a schema check gates readiness. Worker, receiver and archive boundaries will be introduced as their workflows are implemented.
- Compose runs the foundation on loopback with a generated local database password. GitHub Actions verifies the same stack and publishes version-tagged images to GHCR. An appliance host pulls a reviewed image. Repository and host are independent.
- Use a stable offline Linux disk source for the first capture slice. Prove byte-identical reconstruction with synthetic images before testing boot on an authorized Proxmox node.

## Dependencies and risks

Linux block-device consistency depends on the source layout and offline or validated snapshot access. Windows VSS volume copies require a separate verified path for whole-disk and EFI data. Proxmox disk import, firmware and mapped networks need target-specific boot tests. GitHub runners can exercise synthetic data and a Compose stack. Guest/hypervisor acceptance requires separate authorized environments.

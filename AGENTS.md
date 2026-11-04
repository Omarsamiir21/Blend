# Blend workspace rules

Address omar by name. Use the engineering specification as the product contract and record tested behavior in IMPLEMENTATION_STATUS.md. Start with Milestone 0 (foundation), then appliance identity and enrollment.

Use Go for appliance services, React and TypeScript for the console, and PostgreSQL for durable state. Keep the API contract in docs/api/openapi.yaml and schema changes in db/migrations. Keep credentials, guest data and real captures out of Git and CI.

Use synthetic fixtures for automated tests. Verify capture consistency and guest boot before claiming platform support. GitHub Actions builds and verifies release artifacts. Production deployment and any live guest or hypervisor changes require omar's step-specific approval.

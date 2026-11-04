# Foundation threat model

The foundation serves static assets and two read-only probes. Keep the endpoint on loopback. The database has no published port. Readiness returns dependency state without disclosing the connection string or driver errors. Compose secrets stay outside Git. No guest data belongs in a foundation deployment.

Before exposing capture workflows, add TLS, server-side roles, secure sessions, CSRF defenses, agent enrollment expiry and revocation, audit records, quotas, and archive access controls. Treat raw disk chunks as sensitive. Treat guest manifests, external URLs, network mappings and operator input as untrusted.
The foundation uses the same PostgreSQL role for startup migrations and API readiness. Split migration and runtime privileges before introducing operational records.

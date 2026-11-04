# Compatibility matrix

| Capability | Acceptance evidence needed |
| --- | --- |
| Foundation | GitHub Linux runner starts Compose, applies SQL and checks API and console |
| Linux offline disk | Byte-identical reconstruction and supported guest boot |
| Linux live snapshots | Verified consistency and safe cleanup for a specific storage layout |
| Proxmox | Reviewed plan, task completion, actual guest boot and network checks |
| Windows capture | VSS writers, boot partitions, supported disk layout and observed boot |
| Recovery ISO | BIOS and UEFI boot and verified offline restoration |

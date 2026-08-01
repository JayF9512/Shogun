# Admin Panel (Phase 2 — placeholder)

A Next.js LiveOps dashboard (spec §28) that consumes the backend `admin` module:
player lookup, resource/currency grants, ban/unban, economy overrides, event
scheduling and feature-flag toggles. Every mutating action is recorded in
`AdminAuditLog` server-side.

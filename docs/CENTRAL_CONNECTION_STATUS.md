# Central connection — implementation status

## Prepared, not activated

The owner authorized extending authentication and server storage on September 10,
2026. Existing Forge visual design and local user data have been preserved.

- `server/identity.ts` verifies a bearer token against the configured Supabase
  identity service, then resolves its issuer/subject to an existing active Forge
  user. It never grants permissions from client roles, emails or company IDs.
- Migration `0006_forge_verified_identities.sql` adds explicit identity mappings
  with a company/user foreign key. No live database was migrated or provisioned.
- Authenticated GET endpoints: `/api/forge/session`, `/api/forge/catalog`,
  `/api/forge/jobs`, `/api/forge/orders`, `/api/forge/orders/[id]`.
- `server/forge-data.ts` reads existing catalogue/job/order tables; employees see
  assigned jobs, active products and their own orders. Administrators see their
  company's records. All access checks re-read active membership/role from DB.
- Reads are bounded (500 catalogue/jobs, 200 orders); pagination remains to add
  before connecting unrestricted production lists.
- Seven tests cover verified identity, disabled/missing authentication, inactive
  accounts, forged roles/company, tenant boundaries and order ownership.

## Activation dependency

`AUTH_SETUP.md` records that the owner did not yet have a Supabase project.
Runtime SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY, approved user provisioning and
explicit subject-to-Forge-user mapping are required. There is deliberately no
automatic email matching or self-assigned company/administrator access.

Do not expose a demo authentication bypass. Do not remove the local preview
disclaimers or claim that the UI is connected: it is not yet wired to these reads.
Do not send local/demo data to the server automatically. Review an import/mapping
plan with the owner before migration. No secret/service-role key is needed here.

## Still required for the attached full folding-module specification

Real sign-in and frontend data adapter, authorized write APIs, existing-data import,
folding domain geometry and validations, immutable profile versions, editor,
derived 3D, shared employee configuration form, order version/value snapshots,
templates, favourites, production references, audit writes and PDF generation.
Then integration tests (especially V1 order after V2 publication), responsive
browser checks, and acceptance of the complete end-to-end workflow.

The complete module is NOT finished. No deployment or completion commit has been
performed; unrelated in-progress user changes remain intact.

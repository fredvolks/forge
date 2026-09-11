# Central chat implementation — 2026-09-10

## Current redesign on fred-dev

The user explicitly selected fred-dev instead of the attachment's fred prerequisite. Existing local changes were retained; no checkout, pull, push or deployment occurred.

ForgeMessages now serves Boss, Adjointe, Chef and Employé. The AdjointeDiscussion wrapper delegates directly to this component, removing its separate hardcoded discussion/message lists. A single in-memory demo adapter supplies canonical existing Job IDs, pair-specific private threads, groups, messages and calculated read state. Messages persist between role switches during this visit, not after a reload. Reply links now store reply_to_message_id. Attachments retain their original references. Do not present this adapter as server authorization.

Visual changes: conversation menu replaces Infos; functional Discussion/Files/Photos/Links/Members tabs, explicit unconnected Tasks empty state, fixed composer with camera/microphone/send, lime sent bubbles, conversation filters, new group creation with existing employees, calculated bottom-navigation badge, bounded 40-message rendering and older-message button, light-theme chat tokens.

Verified: build; four demo-domain tests; six existing server tests (the superseded shared Administration test still describes the unactivated legacy resolver); browser send and empty Photos tab; no document overflow at the current 946×698 desktop viewport; local message visible after switching Adjointe to Employé; five mobile tabs and composer fit the 390×844 device simulation.

Not acceptance-complete: exact screenshot fidelity (no real Job photos/PDFs available in the current demo), all requested device sizes, real mobile keyboard testing, light-mode visual testing, server API integration, uploads/download authorization, realtime notifications, complete business-object pickers, and activation of the pair-specific production private-chat model. Do not claim those are finished.

## Updated requirement: separate private conversations

The user corrected the Administration requirement: every employee and team lead
needs TWO separate private conversations, one with Boss and one with Adjointe.
The local preview now uses separate IDs, participants and message histories.
The older `resolveAdministration` / `employee_admin` shared resolver below is
superseded and MUST NOT be wired to these private conversations. Before activation,
implement distinct participant-pair IDs and authorization (no role-wide access),
with tests proving Boss cannot read the Adjointe thread or vice versa. Do not copy
any old shared history into either private conversation automatically.

## Implemented and tested, not activated

- Additive migration 0005 extends existing conversations, messages and attachments.
- `server/conversations.ts` centralizes authorization, unique Job resolution,
  shared employee/Administration resolution, paginated messages, idempotent sends,
  reply validation, links to existing orders/Jobs and per-user read state.
- Six SQLite tests apply all five existing/new migrations in an isolated in-memory
  database. No user database was modified; no historical conversation was deleted.
- Legacy Job conversations keep their original IDs. Ambiguous multiple histories
  block automatic resolution rather than discarding data.

## Not completed

The live UI still uses the explicitly labeled local preview. No API exposes this
service yet. The Actor argument is an internal contract and MUST be derived from
verified server authentication; it must never be accepted from localStorage,
request JSON, an email header or the demo role switcher.

The user chose Forge email sign-in, not ChatGPT sign-in. A supported email identity
provider still needs configuration before exposing the service. Preserve existing
users and map the provider's verified stable subject to their IDs; do not map a
client-asserted email to an existing account.

Remaining: authenticated routes, identity provisioning, R2 upload/download checks,
attachment reuse across authorized owners, group management, notifications,
conversation list/search/filter queries, frontend binding and Job deep-link wiring,
receipt data source (the legacy purchase form currently only shows a toast),
realtime delivery, user-data migration and full multi-user/browser acceptance tests.

Do not call this a completed chat connection. Do not remove the local-preview
disclaimer before actual server responses drive the UI. Do not publish migration
0005 until existing production state and the auth configuration are confirmed.

Test: `node --experimental-transform-types --test tests/conversations.test.mjs`

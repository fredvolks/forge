# Forge email recovery — prepared, not activated

The owner confirmed no Supabase project exists yet. No real email or password
change has been tested. Demo sign-in remains separate and unchanged. This is not
a completed production authentication integration.

## Required configuration

1. The owner creates a Supabase project and enables email/password authentication.
2. Configure runtime bindings `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.
   Use the `sb_publishable_` public key, never a secret or service-role key.
3. Add exact approved redirect URLs for `/reset-password` on the local development
   origin and the eventual production origin. Set the production Site URL.
4. The Recovery email template must link to:
   `{{ .RedirectTo }}#token_hash={{ .TokenHash }}&type=recovery`
   This app deliberately does not process default access-token URL callbacks.
   It consumes the recovery token only when the person submits a new password.
5. Configure and verify production email delivery/SMTP, password policy and rate
   limits. Test delivery and expired/used links with an owner-controlled account.
6. Complete server-verified identity mapping and real Forge sign-in before
   onboarding employees. Recovery changes Supabase passwords, not demo passwords.

Routes: `/forgot-password`, `/reset-password`, `/api/auth/config`.
Absent configuration returns 503; the interface must not pretend an email was sent.
Recovery credentials are held in memory and removed from the URL fragment.
Never log them or persist passwords in browser storage.

-- Explicit administrative provisioning only; never link by a client-provided email.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_id ON users(company_id,id);
CREATE TABLE user_identities (
 provider TEXT NOT NULL CHECK(provider='supabase'),
 issuer TEXT NOT NULL,
 subject TEXT NOT NULL,
 company_id TEXT NOT NULL,
 user_id TEXT NOT NULL,
 created_at TEXT NOT NULL,
 PRIMARY KEY(provider,issuer,subject),
 FOREIGN KEY(company_id,user_id) REFERENCES users(company_id,id)
);
CREATE INDEX idx_user_identities_user ON user_identities(company_id,user_id);

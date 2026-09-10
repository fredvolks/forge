-- Additive extension of the existing conversation/message/file entities.
-- Existing conversations retain their IDs. Ambiguous legacy Job chats must be
-- reconciled before being designated as the primary Job conversation.
ALTER TABLE conversations ADD COLUMN type TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE conversations ADD COLUMN title TEXT;
ALTER TABLE conversations ADD COLUMN employee_id TEXT REFERENCES employees(id);
ALTER TABLE conversations ADD COLUMN created_by_user_id TEXT REFERENCES users(id);
ALTER TABLE conversations ADD COLUMN updated_at TEXT;
ALTER TABLE conversations ADD COLUMN archived_at TEXT;
CREATE UNIQUE INDEX idx_conversations_primary_job ON conversations(company_id,job_id) WHERE type='job';
CREATE UNIQUE INDEX idx_conversations_employee_admin ON conversations(company_id,employee_id) WHERE type='employee_admin';
ALTER TABLE messages ADD COLUMN reply_to_message_id TEXT REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN client_request_id TEXT;
CREATE UNIQUE INDEX idx_messages_request ON messages(conversation_id,sender_id,client_request_id) WHERE client_request_id IS NOT NULL;
CREATE INDEX idx_messages_page ON messages(conversation_id,created_at,id);
CREATE TABLE conversation_read_state (
 conversation_id TEXT NOT NULL REFERENCES conversations(id),
 user_id TEXT NOT NULL REFERENCES users(id),
 last_read_message_id TEXT NOT NULL REFERENCES messages(id),
 last_read_at TEXT NOT NULL,
 PRIMARY KEY(conversation_id,user_id)
);
CREATE TABLE message_attachments (
 message_id TEXT NOT NULL REFERENCES messages(id),
 attachment_id TEXT NOT NULL REFERENCES attachments(id),
 PRIMARY KEY(message_id,attachment_id)
);
CREATE TABLE message_object_links (
 message_id TEXT NOT NULL REFERENCES messages(id),
 object_type TEXT NOT NULL CHECK(object_type IN ('job','order')),
 object_id TEXT NOT NULL,
 PRIMARY KEY(message_id,object_type,object_id)
);

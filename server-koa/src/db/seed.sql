-- Initial seed data
INSERT OR IGNORE INTO roles (id, name, description, created_at)
VALUES
  ('admin', 'admin', 'System Administrator', datetime('now')),
  ('editor', 'editor', 'Template/Case Editor', datetime('now')),
  ('viewer', 'viewer', 'Read Only', datetime('now'));

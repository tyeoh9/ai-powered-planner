-- Create folders table
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);

-- Note: RLS not used since auth is handled via NextAuth, not Supabase Auth
-- User filtering is done in server actions via .eq('user_id', userId)

-- Add folder_id to documents table
ALTER TABLE documents ADD COLUMN folder_id UUID REFERENCES folders(id) ON DELETE RESTRICT;
CREATE INDEX idx_documents_folder_id ON documents(folder_id);

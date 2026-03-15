-- Tresvant: Admin user trigger
-- Automatically add invited users to admin_users when they confirm their account

-- When an admin invites someone via inviteUserByEmail, we need to track that.
-- This function is called from the app after a successful invite to record the pending admin.
-- The actual auth.users record is managed by Supabase Auth.

-- Storage bucket policies (for reference - apply via Supabase dashboard or CLI)
-- audio bucket: public read, authenticated write (admin check in app layer)
-- photos bucket: public read, authenticated write (admin check in app layer)

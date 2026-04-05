-- Fix PostgreSQL permissions for arabicmeet user
-- Run this as postgres superuser

-- Connect to arabicmeet database
\c arabicmeet

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE arabicmeet TO arabicmeet;

-- Grant usage and create on schema public
GRANT USAGE ON SCHEMA public TO arabicmeet;
GRANT CREATE ON SCHEMA public TO arabicmeet;

-- Grant all privileges on all tables in public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO arabicmeet;

-- Grant all privileges on all sequences in public schema
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO arabicmeet;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO arabicmeet;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO arabicmeet;

-- Make arabicmeet owner of the database (optional but recommended)
ALTER DATABASE arabicmeet OWNER TO arabicmeet;

-- Verify permissions
\du arabicmeet

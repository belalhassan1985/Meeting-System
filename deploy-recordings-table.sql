-- Deploy recordings table to production database
-- Run this script on your production PostgreSQL database

-- Create recordings table if it doesn't exist
CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "roomId" UUID NOT NULL,
  "startedBy" UUID NOT NULL,
  "egressId" VARCHAR,
  status VARCHAR(20) DEFAULT 'starting',
  "fileUrl" VARCHAR,
  "fileName" VARCHAR,
  "fileSize" INTEGER,
  duration INTEGER,
  "startedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP,
  "errorMessage" TEXT,
  CONSTRAINT "FK_recordings_room" FOREIGN KEY ("roomId") REFERENCES rooms(id) ON DELETE CASCADE,
  CONSTRAINT "FK_recordings_user" FOREIGN KEY ("startedBy") REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "IDX_recordings_roomId" ON recordings("roomId");
CREATE INDEX IF NOT EXISTS "IDX_recordings_startedBy" ON recordings("startedBy");
CREATE INDEX IF NOT EXISTS "IDX_recordings_status" ON recordings(status);
CREATE INDEX IF NOT EXISTS "IDX_recordings_startedAt" ON recordings("startedAt");

-- Verify table creation
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'recordings'
ORDER BY ordinal_position;

-- Show table size
SELECT 
  pg_size_pretty(pg_total_relation_size('recordings')) as total_size,
  COUNT(*) as row_count
FROM recordings;

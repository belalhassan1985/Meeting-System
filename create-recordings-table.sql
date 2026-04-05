-- Create recordings table
CREATE TYPE recordings_status_enum AS ENUM('starting', 'active', 'stopping', 'completed', 'failed');

CREATE TABLE recordings (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "roomId" uuid NOT NULL,
    "startedBy" uuid NOT NULL,
    "egressId" character varying(255),
    status recordings_status_enum NOT NULL DEFAULT 'starting',
    "fileUrl" character varying(500),
    "fileName" character varying(255),
    "fileSize" bigint,
    duration integer,
    "startedAt" TIMESTAMP NOT NULL DEFAULT now(),
    "endedAt" TIMESTAMP,
    "errorMessage" text,
    CONSTRAINT "PK_8c3247d5ee4551d59bb2115a484" PRIMARY KEY (id)
);

-- Add indexes for better performance
CREATE INDEX idx_recordings_roomId ON recordings("roomId");
CREATE INDEX idx_recordings_status ON recordings(status);
CREATE INDEX idx_recordings_startedAt ON recordings("startedAt");

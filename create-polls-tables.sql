DROP TABLE IF EXISTS "poll_answers" CASCADE;
DROP TABLE IF EXISTS "poll_options" CASCADE;
DROP TABLE IF EXISTS "polls" CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "polls" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "roomId" character varying NOT NULL,
    "createdBy" character varying,
    "question" text NOT NULL,
    "isActive" boolean NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_polls" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "poll_options" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "pollId" uuid NOT NULL,
    "text" text NOT NULL,
    CONSTRAINT "PK_poll_options" PRIMARY KEY ("id"),
    CONSTRAINT "FK_poll_options_pollId" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "poll_answers" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "pollId" uuid NOT NULL,
    "optionId" uuid NOT NULL,
    "userId" character varying NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_poll_answers" PRIMARY KEY ("id"),
    CONSTRAINT "FK_poll_answers_pollId" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE,
    CONSTRAINT "FK_poll_answers_optionId" FOREIGN KEY ("optionId") REFERENCES "poll_options"("id") ON DELETE CASCADE
);

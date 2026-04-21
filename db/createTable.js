import { db } from "./openDBConnection.js"

export async function createTable() {


    await db.query(`
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    name VARCHAR UNIQUE,
    gender VARCHAR NOT NULL,
    gender_probability FLOAT NOT NULL,
    age INTEGER NOT NULL,
    age_group VARCHAR NOT NULL,
    country_id VARCHAR(2) NOT NULL,
    country_name VARCHAR NOT NULL,
    country_probability FLOAT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN profiles.id IS 'Primary key';
COMMENT ON COLUMN profiles.name IS 'Person's full name';
COMMENT ON COLUMN profiles.gender IS '"male" or "female"';
COMMENT ON COLUMN profiles.gender_probability IS 'Confidence score';
COMMENT ON COLUMN profiles.age IS 'Exact age';
COMMENT ON COLUMN profiles.age_group IS 'child, teenager, adult, senior';
COMMENT ON COLUMN profiles.country_id IS 'ISO code (NG, BJ, etc.)';
COMMENT ON COLUMN profiles.country_name IS 'Full country name';
COMMENT ON COLUMN profiles.country_probability IS 'Confidence score';
COMMENT ON COLUMN profiles.created_at IS 'Auto-generated';

`)

    console.log('Profiles table has been created')
    
}
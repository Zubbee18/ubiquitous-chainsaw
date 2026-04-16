import { openDatabaseConnection } from "./openDBConnection.js"

export async function createTable() {
    const db = await openDatabaseConnection()

    await db.exec(`
CREATE TABLE IF NOT EXISTS profiles (
    id BLOB PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT NOT NULL,
    gender_probability INTEGER NOT NULL,
    sample_size INTEGER NOT NULL,
    age INTEGER NOT NULL,
    age_group TEXT NOT NULL,
    country_id CHAR(2) NOT NULL, 
    country_probability INTEGER NOT NULL,
    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
)
`)

    await db.close()
    console.log('Profiles table has been created')
    
}
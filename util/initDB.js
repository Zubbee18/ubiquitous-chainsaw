import { openDatabaseConnection } from './openDBConnection.js'

export async function initDB() {
    const db = await openDatabaseConnection()
    await db.exec(`
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            gender TEXT,
            country_id TEXT,
            age_group TEXT
        )
    `)
    await db.close()
}

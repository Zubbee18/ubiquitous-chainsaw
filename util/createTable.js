import { openDatabaseConnection } from "./openDBConnection.js"

export function createTable() {
    const db = openDatabaseConnection()
export async function createTable() {
    const db = await openDatabaseConnection()

    db.exec(`
    await db.exec(`
CREATE TABLE IF NOT EXISTS profiles (
    id BLOB PRIMARY KEY,
    name TEXT NOT NULL,
@@ -18,7 +18,7 @@ CREATE TABLE IF NOT EXISTS profiles (
)
`)

    db.close()
    await db.close()
    console.log('Profiles table has been created')

}

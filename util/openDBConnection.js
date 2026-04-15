import Database from 'better-sqlite3'
import path from 'path'

export function openDatabaseConnection() {
    const db = new Database(path.join('database.db'))
    return db
}
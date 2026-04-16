import Database from 'better-sqlite3'
import path from 'path'

// Wrapper to provide async-like interface for better-sqlite3
class AsyncDatabase {
    constructor(db) {
        this.db = db
    }

    async get(sql, params = []) {
        return this.db.prepare(sql).get(...params)
    }

    async all(sql, params = []) {
        return this.db.prepare(sql).all(...params)
    }

    async run(sql, params = []) {
        const result = this.db.prepare(sql).run(...params)
        return result
    }

    async exec(sql) {
        return this.db.exec(sql)
    }

    async close() {
        return this.db.close()
    }
}

export async function openDatabaseConnection() {
    const db = new Database(path.join('database.db'))
    return new AsyncDatabase(db)
}
import sqlite from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'

export async function openDatabaseConnection() {
    const db = await open({
        filename: path.join('database.db'),
        driver: sqlite.Database
    })

    return db
}
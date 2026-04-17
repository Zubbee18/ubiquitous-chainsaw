const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database.db')
const db = new Database(dbPath)

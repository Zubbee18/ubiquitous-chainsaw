import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // For deploying to Railway
    ssl: {
        rejectUnauthorized: false
    }
});

export default {
    query: (text, params) => pool.query(text, params)
}
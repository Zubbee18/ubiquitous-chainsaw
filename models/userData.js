import { v7 as uuidv7 } from 'uuid'
import { db } from '../db/openDBConnection.js'

export async function checkUserExists(userId, github = true) {

    console.log(github, userId)
    const userExists = await db.query(`SELECT * FROM users WHERE ${github? 'github_id': 'id'}=$1`, [userId])

    let existing = false

    if (userExists.rows[0]) existing = true
    
    return existing
}


export async function getLoginUserFromId(githubUserId) {

    const result = await db.query(`UPDATE users SET last_login_at = NOW() AT TIME ZONE 'UTC' WHERE github_id=$1
                    RETURNING *`, [githubUserId])

    return result.rows[0]
}

export async function getUser(userId) {

    const user = await db.query('SELECT * FROM users WHERE id=$1', [userId])
    
    return user.rows[0]
}

export async function createAndLoginUser(login, id, avatar_url, email) {

    const userId = uuidv7()

    const newUser = await db.query(`INSERT INTO users (id, github_id, username, email, avatar_url, role, is_active, last_login_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() AT TIME ZONE 'UTC')
                    RETURNING *`, [userId, id, login, email, avatar_url, 'analyst', true])

    return newUser.rows[0]
}

export async function logoutUserDB(userId) {

    return await db.query(`UPDATE users SET is_active = FALSE WHERE id=$1`, [userId])
}
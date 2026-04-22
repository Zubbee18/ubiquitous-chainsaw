import { db } from "../db/openDBConnection.js"

export async function deleteProfileDataById(id) {

    try {

        // PostgreSQL: query returns an object with a 'rows' array
        const result = await db.query(`SELECT * FROM profiles WHERE id = $1`, [id])
        const data = result.rows[0]  // Get first row or undefined
        
        await db.query(`DELETE FROM profiles WHERE id = $1`, [id])
        return !data ? 'Data does not exist' : 'Delete successful'

    } catch(err) {

        throw new Error(`Error: ${err}`)

    }

}
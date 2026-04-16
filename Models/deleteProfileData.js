import { openDatabaseConnection } from "../util/openDBConnection.js"

export async function deleteProfileDataById(id) {

    const profileDB = await openDatabaseConnection()

    try {

        const data = await profileDB.get(`SELECT * FROM profiles WHERE id = ?`, [id])
        await profileDB.run(`DELETE FROM profiles WHERE id = ?`, [id])
        return !data ? 'Data does not exist' : 'Delete successful'

    } catch(err) {

        throw new Error(`Error: ${err}`)

    } finally {

        await profileDB.close()
        console.log('Database connection closed')
    }

}
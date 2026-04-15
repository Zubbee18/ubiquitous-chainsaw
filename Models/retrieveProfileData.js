import { openDatabaseConnection } from "./openDBConnection.js"

export async function retrieveProfileData() {
    const profileDB = await openDatabaseConnection()

    try {

    } catch(err) {

    } finally {
        
        await profileDB.close()
        console.log('Database connection closed')
    }

}

export async function retrieveProfileDataById(id) {
    const profileDB = await openDatabaseConnection()

    try {

    } catch(err) {

    } finally {

        await profileDB.close()
        console.log('Database connection closed')
    }

}
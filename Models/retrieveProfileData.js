import { openDatabaseConnection } from "../util/openDBConnection.js"

export function retrieveProfileData() {
    const profileDB = openDatabaseConnection()

    try {

    } catch(err) {

    } finally {
        
        profileDB.close()
        console.log('Database connection closed')
    }

}

export function retrieveProfileDataById(id) {
    const profileDB = openDatabaseConnection()

    try {

    } catch(err) {

    } finally {

        profileDB.close()
        console.log('Database connection closed')
    }

}
import { openDatabaseConnection } from "./openDBConnection.js"


export async function viewAllProfiles() {
    const db = await openDatabaseConnection()

    try {
        const profiles = await db.all('SELECT * FROM profiles');
        console.table(profiles); 
    } catch (err) {
        console.error('Error fetching profiles:', err.message);
    } finally {
        await db.close();
    }
}

viewAllProfiles();
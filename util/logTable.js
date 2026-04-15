import { openDatabaseConnection } from "./openDBConnection.js"


export function viewAllProfiles() {
    const db = openDatabaseConnection()

    try {
        const profiles = db.prepare('SELECT * FROM profiles').all();
        console.table(profiles); 
    } catch (err) {
        console.error('Error fetching profiles:', err.message);
    } finally {
        db.close();
    }
}

viewAllProfiles();
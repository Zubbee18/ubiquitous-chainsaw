import { createTable } from '../util/createTable.js'
import { openDatabaseConnection } from '../util/openDBConnection.js'


// Store the processed result with a UUID v7 id and UTC created_at timestamp
export async function storeProcessedResult(processedData) {
    
    await createTable()

    const profileDB = await openDatabaseConnection()
    
    try {

        const { id, name, sample_size, gender, gender_probability, age, age_group, country_id, country_probability } = processedData
        
        const queryData = await profileDB.get(`SELECT * FROM profiles WHERE name = ?`, [name])

        if (!queryData) {

            await profileDB.run(`
    INSERT INTO profiles (id, name, sample_size, gender, gender_probability, age, age_group, country_id, country_probability)
    VALUES( ?, ?, ?, ?, ?, ?, ?, ?, ? )`, 
    [id, name, sample_size, gender, gender_probability, age, age_group, country_id, country_probability]
    )

            // Fetch the inserted data
            const insertedData = await profileDB.get(`SELECT * FROM profiles WHERE id = ?`, [id])
    
            console.log('Profile data has been entered in to the table')
    
            // send the entry back to the controller
            return { message: "Profile created successfully", data: insertedData}

        } else {

            // send the entry back to the controller
            return { message: "Profile already exists", data: queryData }

        }

    } catch(err) {

        console.log(`Error inserting profile data: ${err.message}`)

    } finally {

        await profileDB.close()
        console.log('Database connection closed')
    }


}
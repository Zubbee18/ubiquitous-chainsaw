import { createTable } from '../db/createTable.js'
import { db } from '../db/openDBConnection.js'


// Store the processed result with a UUID v7 id and UTC created_at timestamp
export async function storeProcessedResult(processedData) {
    
    await createTable()
    
    try {

        const { id, name, sample_size, gender, gender_probability, age, age_group, country_id, country_probability } = processedData
        
        // PostgreSQL: query returns an object with a 'rows' array
        const queryResult = await db.query(`SELECT * FROM profiles WHERE name = $1`, [name])
        const queryData = queryResult.rows[0]  // Get first row or undefined

        if (!queryData) {

            await db.query(`
    INSERT INTO profiles (id, name, sample_size, gender, gender_probability, age, age_group, country_id, country_probability)
    VALUES( $1, $2, $3, $4, $5, $6, $7, $8, $9 )`, 
    [id, name, sample_size, gender, gender_probability, age, age_group, country_id, country_probability]
    )

            // Fetch the inserted data
            const insertedResult = await db.query(`SELECT * FROM profiles WHERE id = $1`, [id])
            const insertedData = insertedResult.rows[0]
    
            console.log('Profile data has been entered in to the table')
    
            // send the entry back to the controller
            return { message: "Profile created successfully", data: insertedData}

        } else {

            // send the entry back to the controller
            return { message: "Profile already exists", data: queryData }

        }

    } catch(err) {

        console.log(`Error inserting profile data: ${err.message}`)

    }


}
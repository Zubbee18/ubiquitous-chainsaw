import { db } from "./openDBConnection.js"
import path from 'node:path'
import fs from 'node:fs/promises'
import { v7 as uuidv7 } from 'uuid'

export async function seedTable(filePath) {

    try {

        const data = await fs.readFile(path.join(filePath)) //try createFileStream and see if this does not work
    
        const profileDataArray = JSON.parse(data).profiles
    
        
        if (profileDataArray.length === 0) return
        
        // Build a single INSERT with multiple rows
        const values = []
        const params = []
        
        profileDataArray.forEach((profileObj, index) => {
            const { name, gender, gender_probability, age, age_group, 
                country_id, country_name, country_probability } = profileObj
            
            // Generate UUID v7 for this profile
            const id = uuidv7()
            
            // Calculate parameter positions: $1, $2, $3... $9, $10, $11...
            const offset = index * 9
            values.push(
                `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, 
                    $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`
            )
                    
            // Add all 9 values for this row (now including id)
            params.push(id, name, gender, gender_probability, age, age_group, 
                country_id, country_name, country_probability)
            })
            
        // Single query with all rows
            const query = `
        INSERT INTO profiles 
        (id, name, gender, gender_probability, age, age_group, 
        country_id, country_name, country_probability)
        VALUES ${values.join(', ')}
        ON CONFLICT (name) DO NOTHING
            `
        

                
        await db.query(query, params)
    
        console.log(`Successfully seeded ${profileDataArray.length} profiles`)

    } catch(err) {

        console.error('Error seeding database:', err.message)
        throw err
    }
}


seedTable('seed_profiles.json')
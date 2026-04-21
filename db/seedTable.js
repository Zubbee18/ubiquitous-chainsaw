import { db } from "./openDBConnection.js"
import path from 'node:path'
import fs from 'node:fs/promises'

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
            
            // Calculate parameter positions: $1, $2, $3... $8, $9, $10...
            const offset = index * 8
            values.push(
                `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, 
                    $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`
            )
                    
            // Add all 8 values for this row
            params.push(name, gender, gender_probability, age, age_group, 
                country_id, country_name, country_probability)
            })
            
        // Single query with all rows
            const query = `
        INSERT INTO profiles 
        (name, gender, gender_probability, age, age_group, 
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


seedTable('seed-profiles.json')
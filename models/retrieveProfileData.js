import { openDatabaseConnection } from "../util/openDBConnection.js"

export async function retrieveProfileDataByQueryParams(query) {

    const profileDB = await openDatabaseConnection()
    
    const { gender, country_id, age_group } = query
    
    let sqlQuery = 'SELECT * FROM profiles'
    let param = []
    let conditions = []

    try {
        
        if (gender) { 
            conditions.push('gender = ?')
            param.push(gender.toLowerCase()) 
        }
        
        if (country_id) { 
            conditions.push('country_id = ?')
            param.push(country_id.toUpperCase()) 
        }
        
        if (age_group) { 
            conditions.push('age_group = ?')
            param.push(age_group.toLowerCase()) 
        }
        
        if (conditions.length > 0) {
            sqlQuery += ' WHERE ' + conditions.join(' AND ')
        }
    
        return await profileDB.all(sqlQuery, param) // array of objects

    } catch(err) {

        throw new Error(`Data could not be retrieved ${err.message}`)

    } finally {
        
        await profileDB.close()
        console.log('Database connection closed')
    }

}

export async function retrieveProfileDataById(id) {

    const profileDB = await openDatabaseConnection()

    try {

        return await profileDB.get(`SELECT * FROM profiles WHERE id=?`, [id])

    } catch(err) {

        throw new Error(`Error: ${err.message}`)

    } finally {

        await profileDB.close()
        console.log('Database connection closed')
    }

}

import { openDatabaseConnection } from "../db/openDBConnection.js"
import { getCountryIdFromQuery } from "../util/getCountryIdFromQuery.js"

export async function retrieveProfileDataByQueryParams(query) {

    const profileDB = await openDatabaseConnection()
    
    const { gender, country_id, age_group, min_age, max_age, min_gender_probability, min_country_probability, sort_by, order, page, limit } = query
    
    let sqlQuery = 'SELECT * FROM profiles'
    let param = []

    // check for normal queries
    let filterConditions = []
    if (gender) { 
        param.push(gender.toLowerCase())
    }

    if (country_id) { 
        param.push(country_id.toUpperCase()) 
    }

    if (age_group) { 
        param.push(age_group.toLowerCase()) 
    }

    if (min_age) { 
        param.push(min_age)
    }

    if (max_age) { 
        param.push(max_age)
    }

    if (min_gender_probability) { 
        param.push(min_gender_probability)
    }

    if (min_country_probability) { 
        param.push(min_country_probability)
    }

    if (param.length > 0) {

        // fill the filterConditions array
        for (let i=0; i<param.length; i++) {

            if (param[i] === gender.toLowerCase() || param[i] === country_id.toLowerCase() || param[i] === age_group.toLowerCase()) { 
                filterConditions.push(`${param[i]} = $${i+1}`)
            }

            if (param[i] === min_age || param[i] === min_gender_probability || param[i] === min_country_probability) { 
                filterConditions.push(`${param[i]} >= $${i+1}`)
            }

            if (param[i] === max_age) { 
                filterConditions.push(`${param[i]} <= $${i+1}`)
            }

        }

        // params exist then edit the sqlquery with the filterConditions
        sqlQuery += ' WHERE ' + filterConditions.join(' AND ') + '\n'
    }

    // check for and filter based on order
    if (sort_by) { 
        if (sort_by === 'age' || sort_by === 'created_at' || sort_by === 'gender_probability') {

            sqlQuery += `ORDER BY $${param.length + 1}`
            param.push(sort_by)

            if (order) { 
                sqlQuery += `$${param.length + 1}\n`
                param.push(order)
            }
        }
    }

    
    // getting page and limit
    if (page) {
        
        // calculate offset 
        const offset = (page - 1) * (limit || 10)

        // check if limit is also specified
        if (limit && limit <= 50) {
            sqlQuery += `LIMIT $${param.length + 1} OFFSET $${param.length + 2}`
            param.push(limit, offset)

        } else { // use default limit

            sqlQuery += `LIMIT $${param.length + 1} OFFSET $${param.length + 2}`
            param.push(10, offset)
        }

    } else { // use default page and limit

        sqlQuery += `LIMIT $${param.length + 1} OFFSET $${param.length + 2}`
        param.push(10, 0) // offset of 0 means page is 1 which is the default
    }

    try {

        // Get the total count and data query promise
        const countPromise = db.query('SELECT COUNT(*) AS total FROM profiles')
        const dataPromise = profileDB.query(sqlQuery, param)

        const [dataResult, countResult] = await Promise.all([dataPromise, countPromise]) // object of info, with data in rows property

        const totalEntries = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.ceil(totalEntries / limit)

        return {
            data: dataResult.rows,
            pagination: {
                currentPage: page,
                pageLimit: limit,
                totalEntries: totalEntries,
                totalPages: totalPages
            },
            message: 'successful'
        }

    } catch(err) {

        throw new Error(`Data could not be retrieved ${err.message}`)

    } finally {
        
        await profileDB.close()
        console.log('Database connection closed')
    }

}

export async function retrieveProfileDataBySearchParams(query) {

    const { q } = query
    let sqlQuery = 'SELECT * FROM profiles'
    let param = []
    let conditions = []
    let age_group = ''
    let gender = ''
    let country_id = ''

    // get by search parameters
    if (q) {

        // check for gender
        if (q.toLowerCase().includes('male')) {

            if (q.toLowerCase().includes('female')) {
                gender = 'female'
            } else {
                gender = 'male'
            }

            param.push(gender)
        }

        // check for country_id
        if (await getCountryIdFromQuery(q)) {

            country_id = await getCountryIdFromQuery(q)
            param.push(country_id)
        }

        // check for age_group
        if (q.toLowerCase().includes('adult') || q.toLowerCase().includes('child') || q.toLowerCase().includes('teenager') || q.toLowerCase().includes('senior')) {
            
            if (q.toLowerCase().includes('adult')) {
                age_group = 'adult'
            }

            if (q.toLowerCase().includes('child')) {
                age_group = 'child'
            }

            if (q.toLowerCase().includes('teenager')) {
                age_group = 'teenager'
            }

            if (q.toLowerCase().includes('senior')) {
                age_group = 'senior'
            }

            param.push(age_group.toLowerCase()) 
        }

        // check if the query matches any of the above
        if (param.length > 0) {

            // fill the filterConditions array
            for (let i=0; i<param.length; i++) {
                conditions.push(`${param[i]} = $${i+1}`)
            }

            // params exist then edit the sqlquery with the filterConditions
            sqlQuery += ' WHERE ' + filterConditions.join(' AND ') + '\n'

        } else {

            // unable to intepret query
            return {
                message: 'Unable to interpret query'
            }
        }

    
        // getting page and limit
        if (page) {
            
            // calculate offset 
            const offset = (page - 1) * (limit || 10)

            // check if limit is also specified
            if (limit && limit <= 50) {
                sqlQuery += `LIMIT $${param.length + 1} OFFSET $${param.length + 2}`
                param.push(limit, offset)

            } else { // use default limit

                sqlQuery += `LIMIT $${param.length + 1} OFFSET $${param.length + 2}`
                param.push(10, offset)
            }

        } else { // use default page and limit

            sqlQuery += `LIMIT $${param.length + 1} OFFSET $${param.length + 2}`
            param.push(10, 0) // offset of 0 means page is 1 which is the default
        }

        try {

            // Get the total count and data query promise
            const countPromise = db.query('SELECT COUNT(*) AS total FROM profiles')
            const dataPromise = profileDB.query(sqlQuery, param)

            const [dataResult, countResult] = await Promise.all([dataPromise, countPromise]) // object of info, with data in rows property

            const totalEntries = parseInt(countResult.rows[0].total, 10);
            const totalPages = Math.ceil(totalEntries / limit)

            return {
                data: dataResult.rows,
                pagination: {
                    currentPage: page,
                    pageLimit: limit,
                    totalEntries: totalEntries,
                    totalPages: totalPages
                },
                message: 'successful'
            }

        } catch(err) {

            throw new Error(`Data could not be retrieved ${err.message}`)

        } finally {
            
            await profileDB.close()
            console.log('Database connection closed')
        }

    } else {
        return {
            message: 'Invalid query parameters'
        }

    }
}

export async function retrieveProfileDataById(id) {

    const profileDB = await openDatabaseConnection()

    try {

        return await profileDB.get(`SELECT * FROM profiles WHERE id=$1`, [id])

    } catch(err) {

        throw new Error(`Error: ${err.message}`)

    } finally {

        await profileDB.close()
        console.log('Database connection closed')
    }
}
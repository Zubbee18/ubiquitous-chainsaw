import { db } from "../db/openDBConnection.js"
import { getCountryIdFromQuery } from "../util/getCountryIdFromQuery.js"

export async function retrieveProfileDataByQueryParams(query) {
    
    const { gender, country_id, age_group, min_age, max_age, min_gender_probability, min_country_probability, sort_by, order, page, limit } = query
    
    let sqlQuery = 'SELECT * FROM profiles'
    let param = []
    let filterConditions = []
    let paramIndex = 1

    // Build filter conditions
    if (gender) { 
        filterConditions.push(`gender = $${paramIndex++}`)
        param.push(gender.toLowerCase())
    }

    if (country_id) { 
        filterConditions.push(`country_id = $${paramIndex++}`)
        param.push(country_id.toUpperCase()) 
    }

    if (age_group) { 
        filterConditions.push(`age_group = $${paramIndex++}`)
        param.push(age_group.toLowerCase()) 
    }

    if (min_age) { 
        filterConditions.push(`age >= $${paramIndex++}`)
        param.push(min_age)
    }

    if (max_age) { 
        filterConditions.push(`age <= $${paramIndex++}`)
        param.push(max_age)
    }

    if (min_gender_probability) { 
        filterConditions.push(`gender_probability >= $${paramIndex++}`)
        param.push(min_gender_probability)
    }

    if (min_country_probability) { 
        filterConditions.push(`country_probability >= $${paramIndex++}`)
        param.push(min_country_probability)
    }

    if (filterConditions.length > 0) {
        sqlQuery += ' WHERE ' + filterConditions.join(' AND ')
    }

    // Add ORDER BY clause (column names can't be parameterized)
    if (sort_by && ['age', 'created_at', 'gender_probability'].includes(sort_by)) { 
        const orderDirection = (order && ['ASC', 'DESC'].includes(order.toUpperCase())) ? order.toUpperCase() : 'ASC'
        sqlQuery += ` ORDER BY ${sort_by} ${orderDirection}`
        
    } else if (sort_by && !['age', 'created_at', 'gender_probability'].includes(sort_by)) { 
        return {
            message: 'Invalid query parameters'
        }
    }

    // Add pagination
    const currentPage = parseInt(page) || 1
    const currentLimit = Math.min(parseInt(limit) || 10, 50)
    const offset = (currentPage - 1) * currentLimit

    sqlQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    param.push(currentLimit, offset)

    try {

        // Get the total count and data
        // PostgreSQL: db.query() returns an object with a 'rows' array
        const countResult = await db.query('SELECT COUNT(*) AS total FROM profiles')
        const dataResult = await db.query(sqlQuery, param)

        const totalEntries = parseInt(countResult.rows[0].total, 10)
        const totalPages = Math.ceil(totalEntries / currentLimit)

        return {
            data: dataResult.rows,  // Access the rows array from the result
            pagination: {
                currentPage: currentPage,
                pageLimit: currentLimit,
                totalEntries: totalEntries,
                totalPages: totalPages
            },
            message: 'successful'
        }

    } catch(err) {

        throw new Error(`Data could not be retrieved: ${err.message}`)

    }

}

export async function retrieveProfileDataBySearchParams(query) {

    const { q, page, limit } = query
    let sqlQuery = 'SELECT * FROM profiles'
    let param = []
    let conditions = []
    let paramIndex = 1

    // get by search parameters
    if (q) {

        // check for gender
        if (q.toLowerCase().includes('male')) {
            if (q.toLowerCase().includes('female')) {
                conditions.push(`gender = $${paramIndex++}`)
                param.push('female')
            } else {
                conditions.push(`gender = $${paramIndex++}`)
                param.push('male')
            }
        }

        // check for country_id
        const countryId = await getCountryIdFromQuery(q)
        if (countryId) {
            conditions.push(`country_id = $${paramIndex++}`)
            param.push(countryId)
        }

        // check for age_group
        if (q.toLowerCase().includes('adult') || q.toLowerCase().includes('child') || q.toLowerCase().includes('teenager') || q.toLowerCase().includes('senior')) {
            let age_group = ''
            
            if (q.toLowerCase().includes('senior')) {
                age_group = 'senior'
            } else if (q.toLowerCase().includes('teenager')) {
                age_group = 'teenager'
            } else if (q.toLowerCase().includes('adult')) {
                age_group = 'adult'
            } else if (q.toLowerCase().includes('child')) {
                age_group = 'child'
            }

            if (age_group) {
                conditions.push(`age_group = $${paramIndex++}`)
                param.push(age_group)
            }
        }

        // check if the query matches any of the above
        if (conditions.length > 0) {
            sqlQuery += ' WHERE ' + conditions.join(' AND ')
        } else {
            return {
                message: 'Unable to interpret query'
            }
        }
    } else {
        return {
            message: 'Invalid query parameters'
        }
    }

    // Add pagination
    const currentPage = parseInt(page) || 1
    const currentLimit = Math.min(parseInt(limit) || 10, 50)
    const offset = (currentPage - 1) * currentLimit

    sqlQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    param.push(currentLimit, offset)

    try {

        // Get the total count and data
        // PostgreSQL: db.query() returns an object with a 'rows' array
        const countResult = await db.query('SELECT COUNT(*) AS total FROM profiles')
        const dataResult = await db.query(sqlQuery, param)

        const totalEntries = parseInt(countResult.rows[0].total, 10)
        const totalPages = Math.ceil(totalEntries / currentLimit)

        return {
            data: dataResult.rows,  // Access the rows array from the result
            pagination: {
                currentPage: currentPage,
                pageLimit: currentLimit,
                totalEntries: totalEntries,
                totalPages: totalPages
            },
            message: 'successful'
        }

    } catch(err) {

        throw new Error(`Data could not be retrieved: ${err.message}`)

    }
}

export async function retrieveProfileDataById(id) {

    try {

        // PostgreSQL: db.query() returns an object with a 'rows' array
        const result = await db.query(`SELECT * FROM profiles WHERE id=$1`, [id])
        return result.rows[0]  // Return first row or undefined

    } catch(err) {

        throw new Error(`Error: ${err.message}`)

    }
}

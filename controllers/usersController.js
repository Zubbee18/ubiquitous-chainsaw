import { db } from '../db/openDBConnection.js'

export async function getDashboardStats(req, res) {
    try {
        // Get total profiles count
        const totalResult = await db.query(
            'SELECT COUNT(*) as total FROM profiles'
        )
        const total_profiles = parseInt(totalResult.rows[0].total)

        // Get gender breakdown
        const genderResult = await db.query(`
            SELECT gender, COUNT(*) as count 
            FROM profiles 
            GROUP BY gender 
            ORDER BY gender
        `)
        const gender_breakdown = {}
        genderResult.rows.forEach(row => {
            gender_breakdown[row.gender] = parseInt(row.count)
        })

        // Get age group breakdown
        const ageGroupResult = await db.query(`
            SELECT age_group, COUNT(*) as count 
            FROM profiles 
            GROUP BY age_group 
            ORDER BY 
                CASE age_group
                    WHEN 'child' THEN 1
                    WHEN 'teenager' THEN 2
                    WHEN 'adult' THEN 3
                    WHEN 'senior' THEN 4
                END
        `)
        const age_group_breakdown = {}
        ageGroupResult.rows.forEach(row => {
            age_group_breakdown[row.age_group] = parseInt(row.count)
        })

        // Get top 5 countries
        const countriesResult = await db.query(`
            SELECT country_id, country_name, COUNT(*) as count 
            FROM profiles 
            GROUP BY country_id, country_name 
            ORDER BY count DESC 
            LIMIT 5
        `)
        const top_countries = countriesResult.rows.map(row => ({
            country_id: row.country_id,
            country_name: row.country_name,
            count: parseInt(row.count)
        }))

        // Get 10 most recent profiles
        const recentResult = await db.query(`
            SELECT id, name, gender, age, country_id, created_at 
            FROM profiles 
            ORDER BY created_at DESC 
            LIMIT 10
        `)
        const recent_profiles = recentResult.rows

        // Get averages
        const averagesResult = await db.query(`
            SELECT 
                AVG(age) as avg_age,
                AVG(gender_probability) as avg_gender_prob,
                AVG(country_probability) as avg_country_prob
            FROM profiles
        `)
        const averages = {
            age: averagesResult.rows[0].avg_age 
                ? parseFloat(averagesResult.rows[0].avg_age).toFixed(1)
                : null,
            gender_probability: averagesResult.rows[0].avg_gender_prob 
                ? parseFloat(averagesResult.rows[0].avg_gender_prob)
                : null,
            country_probability: averagesResult.rows[0].avg_country_prob 
                ? parseFloat(averagesResult.rows[0].avg_country_prob)
                : null
        }

        // Return dashboard stats
        res.status(200).json({
            status: 'success',
            dashboard: {
                total_profiles,
                gender_breakdown,
                age_group_breakdown,
                top_countries,
                recent_profiles,
                averages
            }
        })

    } catch (err) {
        console.error('Dashboard stats error:', err)
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve dashboard statistics'
        })
    }
}

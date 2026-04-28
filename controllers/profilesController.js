import { v7 as uuidv7 } from 'uuid'
import { deleteProfileDataById } from "../models/deleteProfileData.js"
import { storeProcessedResult } from '../models/storeProcessedResult.js'
import { retrieveProfileDataById, 
        retrieveProfileDataByQueryParams, 
        retrieveProfileDataBySearchParams,
        retrieveProfileDataForExport } from '../models/retrieveProfileData.js'
import axios from 'axios'
import { parse } from 'json2csv'


function processPostData(res, genderRes, ageRes, nationRes) {

    let resData = {}
    resData.id = uuidv7()
    resData.name = genderRes.name.toLowerCase()

    try {
        
        // Extract gender, gender_probability, and count from Genderize. Rename count to sample_size
        if (genderRes.gender && genderRes.count) {

            // Rename count to sample_size
            resData.gender = genderRes.gender
            resData.gender_probability = genderRes.probability
            resData.sample_size = genderRes.count
            
        } else {
            res.status(502).json({ "status": "502", "message": "Genderize returned an invalid response"})
            return
        }
        
        // Extract age from Agify. Classify age_group: 0–12 → child, 13–19 → teenager, 20–59 → adult, 60+ → senior
        if (ageRes.age) {

            resData.age = ageRes.age
            resData.age_group = ageRes.age < 13 ? 'child' : ageRes.age < 20 ? 'teenager' : ageRes.age < 60 ? 'adult' : 'senior'

        } else {

            res.status(502).json({ "status": "502", "message": "Agify returned an invalid response" })
            return
        }

        // Extract country list from Nationalize. Pick the country with the highest probability as country_id
        if (nationRes.country && nationRes.country.length > 0) {


            resData.country_id = nationRes.country[0].country_id //picks the first country since it's already in desc order
            resData.country_probability = +nationRes.country[0].probability.toFixed(2)

        } else {
            res.status(502).json({ "status": "502", "message": "Nationalize returned an invalid response"})
            return
        }

        return resData

    } catch(err) {

        res.status(500).json({status: 'error', message: 'Internal Server Error'})
        throw new Error(`Was unable to process data: ${err}`)
    }

}

export function handlePostProfiles(req, res) {

    const { name } = req.body
    
    if (name) {
        
        if (/^[0-9]+$/.test(name)) { // supposed to check for nonsensical names but for now I can only check for names without numbers
            res.status(422).json({
                status: "error",
                message: "Invalid 'name' parameter. Name must contain only alphabetic characters"
            })
            return
        }
        
        // retrieve data
        try {

            axios.all([
            axios.get(`https://api.genderize.io/?name=${name}`),
            axios.get(`https://api.agify.io?name=${name}`),
            axios.get(`https://api.nationalize.io?name=${name}`)
            ])

            .then(axios.spread(async (genderRes, ageRes, nationRes) => {

                // process data
                const processedData = processPostData(res, genderRes.data, ageRes.data, nationRes.data)
                
                // insert data and return a response
                const response = await storeProcessedResult(processedData)

                // send json response
                if (response.message === "Profile created successfully")
                {
                    return res.status(201).json({status: "success", data: response.data}) 
                } else {
                    return res.status(201).json({status: "success", message: response.message, data: response.data}) 
                }
            }))
            
        } catch(err) {

            res.status(500).json({status: 'error', message: 'Internal Server Error'})
            throw new Error(`Was unable to get or process data: ${err}`)

        }

    } else {

        res.status(400).json({status: "error", message: "Missing 'name' parameter. Please add a name query to your API call"})
    }

}


export async function exportProfiles(req, res) {
    try {
        const profileData = await retrieveProfileDataForExport(req.query)
        
        if (profileData.data.length === 0) {
            return res.status(404).json({status: 'error', message: 'Profile not found'})
        }
        
        // Check if CSV format is requested
        const format = req.query.format || 'json'
        
        if (format.toLowerCase() === 'csv') {
            // Define CSV fields
            const fields = [
                'id', 
                'name', 
                'gender', 
                'gender_probability', 
                'age', 
                'age_group', 
                'country_id',
                'country_name',
                'country_probability',
                'created_at'
            ]
            
            // Convert to CSV
            const csv = parse(profileData.data, { fields })
            
            // Set headers for CSV download
            res.setHeader('Content-Type', 'text/csv')
            res.setHeader('Content-Disposition', `attachment; filename="profiles_${new Date().toISOString().split('T')[0]}.csv"`)
            
            return res.status(200).send(csv)

        } else {
            // Return JSON (existing behavior)
            return res.status(200).json({
                status: 'success', 
                total: profileData.data.length, 
                data: profileData.data
            })
        }
        
    } catch (err) {
        console.log(err)
        res.status(500).json({status: 'error', message: 'Internal Server Error'})
    }
}


export async function handleGetProfilesById(req, res) {

    try {

        const id = req.params.id
    
        const profile = await retrieveProfileDataById(id)
    
        if (profile) {
    
            res.status(200).json({status: 'success', data: profile})
    
        } else {
    
            res.status(404).json({status: 'error', message: 'Profile not found'})
        }

    } catch(err) {

        console.log(err)
        res.status(500).json({status: 'error', message: 'Internal Server Error'})
    }

}

export async function handleGetProfilesByQueryParams(req, res) {

    try {

        const profileData = await retrieveProfileDataByQueryParams(req.query)
    
        if (profileData.data.length === 0) {
    
            res.status(404).json({status: 'error', message: 'Profile not found'})
            
        } else {
            
            res.status(200).json({status: 'success', page: profileData.pagination.currentPage, limit: profileData.pagination.pageLimit, total: profileData.pagination.totalEntries, links: profileData.links, data: profileData.data})
        }
        
    } catch (err) {

        console.log(err)
        res.status(500).json({status: 'error', message: 'Internal Server Error'})
    }

}

export async function handleGetProfilesBySearchQueryParams(req, res) {

    try {

        const profileData = await retrieveProfileDataBySearchParams(req.query)
    
        if (profileData.data.length === 0) {
            res.status(404).json({status: 'error', message: 'Profile not found'})
            
        } else if (profileData.message === 'Unable to interpret query') {
            res.status(400).json({status: 'error', message: profileData.message})
            
        } else if (profileData.message === 'Invalid query parameters') {
            res.status(422).json({status: 'error', message: profileData.message})
            
        } else {
            res.status(200).json({status: 'success', page: profileData.pagination.currentPage, limit: profileData.pagination.pageLimit, total: profileData.pagination.totalEntries, links: profileData.links, data: profileData.data})
        }

        

    } catch(err) {

        console.log(err)
        res.status(500).json({status: 'error', message: 'Internal Server Error'})
    }


}

export async function handleDeleteProfilesById(req, res) {

    try {

        const id = req.params.id

        if (id) {

            const message = await deleteProfileDataById(id)

            if (message === 'Delete successful') {
        
                res.status(204).end()
        
            } else if (message === 'Data does not exist') {

                res.status(404).json({status: 'error', message: `Profile data with id: ${id} does not exist`})
            }
            else {
        
                res.status(500).json({status: 'error', message: 'Delete was unsuccessful. Please try again'})
            }

        } else {

            res.status(400).json({status: 'error', message: 'Include a query id in your request'})
        }
    
    } catch(err) {

        console.log(err)
        res.status(500).json({status: 'error', message: 'Internal Server Error'})
    }
}


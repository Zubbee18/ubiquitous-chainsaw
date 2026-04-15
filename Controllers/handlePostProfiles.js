import axios from 'axios'
import { processPostData } from './processPostData.js'
import { storeProcessedResult } from '../Models/storeProcessedResult.js'

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

            .then(axios.spread((genderRes, ageRes, nationRes) => {

                // process data
                const processedData = processPostData(res, genderRes.data, ageRes.data, nationRes.data)
                
                // insert data and return a response
                const response = storeProcessedResult(processedData)

                // send json response
                if (response.message === "Profile created successfully")
                {
                    res.status(201).json({status: "success", data: response.data}) 
                } else {
                    res.status(201).json({status: "success", message: response.message, data: response.data}) 
                }
            }))
            
        } catch(err) {

            throw new Error(`Was unable to get or process data: ${err}`)
        }

    } else {

        res.status(400).json({status: "error", message: "Missing 'name' parameter. Please add a name query to your API call"})
    }

}
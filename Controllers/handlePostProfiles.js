import axios from 'axios'
import { processPostData } from './processPostData.js'

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

        try {

            axios.all([
            axios.get(`https://api.genderize.io/?name=${name}`),
            axios.get(`https://api.agify.io?name=${name}`),
            axios.get(`https://api.nationalize.io?name=${name}`)
            ])

            .then(axios.spread((genderRes, ageRes, nationRes) => {
                console.log('Genderize Response:', genderRes.data)
                console.log('Agify Response:', ageRes.data)
                console.log('Nationalize Response:', nationRes.data)

                const processedData = processPostData(res, genderRes.data, ageRes.data, nationRes.data)

                res.json({status: "success", data: processedData}) // for now we're sending it back, after this we'll try creating a db and uploading instead

            }))
            
        } catch(err) {

            throw new Error(`Was unable to get or process data: ${err}`)
        }

    } else {

        res.status(400).json({status: "error", message: "Missing 'name' parameter. Please add a name query to your API call"})
    }

}
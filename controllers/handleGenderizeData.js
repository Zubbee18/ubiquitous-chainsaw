import { processGenderizeData } from "./processGenderizeData.js"
import { getGenderizeData } from "../util/getGenderizeData.js"

export async function handleGenderize(req, res)  {

    const { name } = req.query

    if (name) {

        if (/^[0-9]+$/.test(name)) { // supposed to check for nonsensical names but for now I can only check for names without numbers
            res.status(422).json({
                status: "error",
                message: "Invalid 'name' parameter. Name must contain only alphabetic characters"
            })
            return
        }

        try {

            const genderizeData = await getGenderizeData(`https://api.genderize.io?name=${name}`)
            
            const processedData = processGenderizeData(res, genderizeData)

            res.json({status: "success", data: processedData})

        } catch(err) {

            throw new Error(`Was unable to get or process data: ${err}`)
        }

    } else {

        res.status(400).json({status: "error", message: "Missing 'name' parameter. Please add a name query to your API call"})
    }

}
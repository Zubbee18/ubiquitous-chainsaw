import { v7 as uuidv7 } from 'uuid'

export function processPostData(res, genderRes, ageRes, nationRes) {

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
        if (!nationRes.country.length === 0) {


            resData.country_id = nationRes.country[0].country_id //picks the first country since it's already in desc order
            resData.country_probability = +nationRes.country[0].probability.toFixed(2)

        } else {
            res.status(502).json({ "status": "502", "message": "Nationalize returned an invalid response"})
            return
        }

        return resData

    } catch(err) {

        throw new Error(`Was unable to process data: ${err}`)
    }

}
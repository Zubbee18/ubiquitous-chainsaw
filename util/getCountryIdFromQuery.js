export async function getCountryIdFromQuery(query) {
    try {
        // 1. Fetch country data
        const response = await fetch('https://restcountries.com/v3.1/all')
        
        if (!response.ok) {
            console.error('Failed to fetch countries:', response.status)
            return null
        }
        
        const countries = await response.json()
        
        // Check if countries is an array
        if (!Array.isArray(countries)) {
            console.error('Countries API did not return an array')
            return null
        }

        // 2. Normalize Query
        const normalizedQuery = query.toLowerCase()

        for (const country of countries) {
            const commonName = country.name.common.toLowerCase()
            
            // 3. Match using word boundaries (\b)
            const regex = new RegExp(`\\b${commonName}\\b`, 'i')
            
            if (regex.test(normalizedQuery)) {
                return country.cca2 // Returns "FR" for "France"
            }
        }
        return null
    } catch (error) {
        console.error('Error in getCountryIdFromQuery:', error.message)
        return null
    }
}

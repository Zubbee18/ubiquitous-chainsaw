export async function getCountryIdFromQuery(query) {
    // 1. Fetch country data
    const response = await fetch('https://restcountries.com/v3.1/all')
    const countries = await response.json()

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
    return null;
}

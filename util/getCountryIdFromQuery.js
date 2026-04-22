export async function getCountryIdFromQuery(query) {
    // 1. Fetch country data
    const response = await fetch('https://restcountries.com')
    const countries = await response.json()

    // 2. Normalize Query
    const query = query.toLowerCase()

    for (const country of countries) {
        const commonName = country.name.common.toLowerCase()
        
        // 3. Match using word boundaries (\b)
        const regex = new RegExp(`\\b${commonName}\\b`, 'i')
        
        if (regex.test(query)) {
            return country.cca2 // Returns "FR" for "France"
        }
    }
    return null;
}

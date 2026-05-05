// Static country mapping for reliability (most common countries)
const COUNTRY_MAP = {
  nigeria: "NG",
  france: "FR",
  germany: "DE",
  italy: "IT",
  spain: "ES",
  portugal: "PT",
  poland: "PL",
  netherlands: "NL",
  belgium: "BE",
  greece: "GR",
  czech: "CZ",
  romania: "RO",
  hungary: "HU",
  sweden: "SE",
  austria: "AT",
  bulgaria: "BG",
  denmark: "DK",
  finland: "FI",
  slovakia: "SK",
  ireland: "IE",
  croatia: "HR",
  lithuania: "LT",
  slovenia: "SI",
  latvia: "LV",
  estonia: "EE",
  cyprus: "CY",
  luxembourg: "LU",
  malta: "MT",
  ghana: "GH",
  kenya: "KE",
  "south africa": "ZA",
  egypt: "EG",
  morocco: "MA",
  algeria: "DZ",
  tunisia: "TN",
  ethiopia: "ET",
  tanzania: "TZ",
  uganda: "UG",
  cameroon: "CM",
  senegal: "SN",
  "united states": "US",
  usa: "US",
  america: "US",
  canada: "CA",
  mexico: "MX",
  brazil: "BR",
  argentina: "AR",
  colombia: "CO",
  chile: "CL",
  peru: "PE",
  venezuela: "VE",
  ecuador: "EC",
  china: "CN",
  japan: "JP",
  india: "IN",
  "south korea": "KR",
  korea: "KR",
  thailand: "TH",
  vietnam: "VN",
  philippines: "PH",
  indonesia: "ID",
  malaysia: "MY",
  singapore: "SG",
  pakistan: "PK",
  bangladesh: "BD",
  australia: "AU",
  "new zealand": "NZ",
  "united kingdom": "GB",
  uk: "GB",
  britain: "GB",
  england: "GB",
  russia: "RU",
  turkey: "TR",
  ukraine: "UA",
  switzerland: "CH",
};

export async function getCountryIdFromQuery(query) {
  try {
    const normalizedQuery = query.toLowerCase();

    // Check static map first (fast and reliable)
    for (const [country, code] of Object.entries(COUNTRY_MAP)) {
      const regex = new RegExp(`\\b${country}`, "i");
      if (regex.test(normalizedQuery)) {
        return code;
      }
    }

    // fetch from API if not found in static map
    const response = await fetch("https://restcountries.com/v3.1/all", {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      console.log("Countries API unavailable, using static map only");
      return null;
    }

    const countries = await response.json();

    if (!Array.isArray(countries)) {
      return null;
    }

    for (const country of countries) {
      const commonName = country.name.common.toLowerCase();
      const regex = new RegExp(`\\b${commonName}\\b`, "i");

      if (regex.test(normalizedQuery)) {
        return country.cca2;
      }
    }
    return null;
  } catch (error) {
    console.log(
      "Error fetching countries, using static map only:",
      error.message,
    );
    return null;
  }
}

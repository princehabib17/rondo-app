import { format, formatDistanceToNow } from "date-fns";

export function formatGameDate(dateString: string): string {
  return format(new Date(dateString), "EEEE, MMMM d 'at' h:mm a");
}

export function formatGameTime(dateString: string): string {
  return format(new Date(dateString), "h:mm a");
}

export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function formatPrice(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString("en-PH")}`;
}

export function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

// ISO 3166-1 alpha-2 codes for flag emoji generation
const COUNTRY_CODES: Record<string, string> = {
  "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "Andorra": "AD",
  "Angola": "AO", "Argentina": "AR", "Armenia": "AM", "Australia": "AU",
  "Austria": "AT", "Azerbaijan": "AZ", "Bahrain": "BH", "Bangladesh": "BD",
  "Belarus": "BY", "Belgium": "BE", "Bolivia": "BO", "Bosnia and Herzegovina": "BA",
  "Brazil": "BR", "Bulgaria": "BG", "Cambodia": "KH", "Cameroon": "CM",
  "Canada": "CA", "Chile": "CL", "China": "CN", "Colombia": "CO",
  "Congo": "CG", "Costa Rica": "CR", "Croatia": "HR", "Cuba": "CU",
  "Cyprus": "CY", "Czech Republic": "CZ", "Denmark": "DK", "Dominican Republic": "DO",
  "Ecuador": "EC", "Egypt": "EG", "El Salvador": "SV", "England": "GB",
  "Estonia": "EE", "Ethiopia": "ET", "Finland": "FI", "France": "FR",
  "Georgia": "GE", "Germany": "DE", "Ghana": "GH", "Greece": "GR",
  "Guatemala": "GT", "Honduras": "HN", "Hong Kong": "HK", "Hungary": "HU",
  "Iceland": "IS", "India": "IN", "Indonesia": "ID", "Iran": "IR",
  "Iraq": "IQ", "Ireland": "IE", "Israel": "IL", "Italy": "IT",
  "Ivory Coast": "CI", "Jamaica": "JM", "Japan": "JP", "Jordan": "JO",
  "Kazakhstan": "KZ", "Kenya": "KE", "Kosovo": "XK", "Kuwait": "KW",
  "Kyrgyzstan": "KG", "Latvia": "LV", "Lebanon": "LB", "Libya": "LY",
  "Lithuania": "LT", "Luxembourg": "LU", "Macau": "MO", "Malaysia": "MY",
  "Mali": "ML", "Malta": "MT", "Mexico": "MX", "Moldova": "MD",
  "Mongolia": "MN", "Montenegro": "ME", "Morocco": "MA", "Mozambique": "MZ",
  "Myanmar": "MM", "Nepal": "NP", "Netherlands": "NL", "New Zealand": "NZ",
  "Nicaragua": "NI", "Nigeria": "NG", "North Korea": "KP", "North Macedonia": "MK",
  "Norway": "NO", "Oman": "OM", "Pakistan": "PK", "Palestine": "PS",
  "Panama": "PA", "Paraguay": "PY", "Peru": "PE", "Philippines": "PH",
  "Poland": "PL", "Portugal": "PT", "Puerto Rico": "PR", "Qatar": "QA",
  "Romania": "RO", "Russia": "RU", "Rwanda": "RW", "Saudi Arabia": "SA",
  "Scotland": "GB-SCT", "Senegal": "SN", "Serbia": "RS", "Singapore": "SG",
  "Slovakia": "SK", "Slovenia": "SI", "Somalia": "SO", "South Africa": "ZA",
  "South Korea": "KR", "Spain": "ES", "Sri Lanka": "LK", "Sudan": "SD",
  "Sweden": "SE", "Switzerland": "CH", "Syria": "SY", "Taiwan": "TW",
  "Tajikistan": "TJ", "Tanzania": "TZ", "Thailand": "TH", "Tunisia": "TN",
  "Turkey": "TR", "Turkmenistan": "TM", "Uganda": "UG", "Ukraine": "UA",
  "United Arab Emirates": "AE", "United States": "US", "Uruguay": "UY",
  "Uzbekistan": "UZ", "Venezuela": "VE", "Vietnam": "VN", "Wales": "GB-WLS",
  "Yemen": "YE", "Zambia": "ZM", "Zimbabwe": "ZW",
};

export function getFlagEmoji(nationality: string): string {
  const code = COUNTRY_CODES[nationality];
  if (!code) return "";
  // Handle GB sub-codes (Scotland, Wales) — show GB flag
  const isoCode = code.includes("-") ? code.split("-")[0] : code;
  return isoCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join("");
}

export const NATIONALITIES = Object.keys(COUNTRY_CODES).sort();

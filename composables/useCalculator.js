// Core calculator engine for Calc Notes
const variables = ref({})
const previousResult = ref(null)

// Constants
const constants = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
  phi: (1 + Math.sqrt(5)) / 2,
  c: 299792458,
}

// Currency symbols and codes mapping
const currencyMap = {
  // Symbols
  '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR', '₽': 'RUB',
  '₩': 'KRW', '₺': 'TRY', '₴': 'UAH', '₿': 'BTC', '₫': 'VND',
  '₱': 'PHP', '₸': 'KZT', '₮': 'MNT', '฿': 'THB', '₦': 'NGN',
  'R$': 'BRL', 'C$': 'CAD', 'A$': 'AUD', 'NZ$': 'NZD', 'HK$': 'HKD',
  'S$': 'SGD', 'NT$': 'TWD', 'kr': 'SEK', 'zł': 'PLN', 'Kč': 'CZK',
  'RM': 'MYR', 'Rp': 'IDR',
  // ISO codes (lowercase)
  'usd': 'USD', 'eur': 'EUR', 'euro': 'EUR', 'euros': 'EUR',
  'gbp': 'GBP', 'pound': 'GBP', 'pounds': 'GBP',
  'jpy': 'JPY', 'yen': 'JPY',
  'krw': 'KRW', 'won': 'KRW',
  'inr': 'INR', 'rupee': 'INR', 'rupees': 'INR',
  'rub': 'RUB', 'rouble': 'RUB', 'roubles': 'RUB', 'ruble': 'RUB', 'rubles': 'RUB',
  'cad': 'CAD', 'aud': 'AUD', 'chf': 'CHF', 'franc': 'CHF', 'francs': 'CHF',
  'cny': 'CNY', 'yuan': 'CNY', 'rmb': 'CNY',
  'brl': 'BRL', 'real': 'BRL', 'reais': 'BRL',
  'mxn': 'MXN', 'peso': 'MXN', 'pesos': 'MXN',
  'sek': 'SEK', 'nok': 'NOK', 'dkk': 'DKK', 'krone': 'NOK', 'krona': 'SEK',
  'pln': 'PLN', 'zloty': 'PLN',
  'czk': 'CZK', 'koruna': 'CZK',
  'huf': 'HUF', 'forint': 'HUF',
  'try': 'TRY', 'lira': 'TRY',
  'zar': 'ZAR', 'rand': 'ZAR',
  'thb': 'THB', 'baht': 'THB',
  'sgd': 'SGD', 'hkd': 'HKD', 'twd': 'TWD',
  'nzd': 'NZD', 'php': 'PHP',
  'idr': 'IDR', 'rupiah': 'IDR',
  'myr': 'MYR', 'ringgit': 'MYR',
  'vnd': 'VND', 'dong': 'VND',
  'sar': 'SAR', 'riyal': 'SAR',
  'aed': 'AED', 'dirham': 'AED', 'dirhams': 'AED',
  'ils': 'ILS', 'shekel': 'ILS', 'shekels': 'ILS',
  'egp': 'EGP', 'clp': 'CLP', 'cop': 'COP', 'ars': 'ARS',
  'pen': 'PEN', 'uah': 'UAH', 'ngn': 'NGN', 'kzt': 'KZT',
  'qar': 'QAR', 'kwd': 'KWD', 'bhd': 'BHD', 'omr': 'OMR',
  'btc': 'BTC', 'bitcoin': 'BTC', 'eth': 'ETH', 'ethereum': 'ETH',
}

// Exchange rates (base: USD) — fallback values, updated live from API
const exchangeRates = ref({
  USD: 1, EUR: 0.87, GBP: 0.75, JPY: 158.65, INR: 92.31,
  RUB: 79.63, CAD: 1.36, AUD: 1.43, CHF: 0.78, CNY: 6.92,
  KRW: 1493.63, BRL: 5.26, MXN: 17.98, SEK: 9.28, NOK: 9.63,
  DKK: 6.48, PLN: 3.73, CZK: 21.19, HUF: 343.08, TRY: 44.11,
  ZAR: 16.82, THB: 32.10, SGD: 1.28, HKD: 7.82, TWD: 31.88,
  NZD: 1.70, PHP: 59.67, IDR: 16973.23, MYR: 3.97, VND: 26196.37,
  SAR: 3.75, AED: 3.67, ILS: 3.12, EGP: 50.81, CLP: 920.56,
  COP: 3773.51, ARS: 1412.50, PEN: 3.44, UAH: 43.80, NGN: 1391.61,
  KZT: 496.19, QAR: 3.64, KWD: 0.31, BHD: 0.38, OMR: 0.38,
  BTC: 0.000015, ETH: 0.00051,
})
const ratesFetched = ref(false)

// Fetch live exchange rates from fawazahmed0/exchange-api
const fetchExchangeRates = async () => {
  const primaryUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json'
  const fallbackUrl = 'https://latest.currency-api.pages.dev/v1/currencies/usd.min.json'

  const tryFetch = async (url) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }

  try {
    let data
    try {
      data = await tryFetch(primaryUrl)
    } catch {
      data = await tryFetch(fallbackUrl)
    }

    if (data?.usd) {
      const rates = {}
      // Map lowercase API codes to uppercase internal codes
      for (const [code, rate] of Object.entries(data.usd)) {
        rates[code.toUpperCase()] = rate
      }
      // Ensure USD is always 1
      rates.USD = 1
      exchangeRates.value = rates
      ratesFetched.value = true
    }
  } catch (e) {
    // Silently fall back to hardcoded rates
    console.warn('Failed to fetch exchange rates, using fallback values:', e.message)
  }
}

// Auto-fetch rates once (non-blocking)
if (typeof window !== 'undefined') {
  fetchExchangeRates()
}

// Unit conversion factors (to base unit)
const unitConversions = {
  length: {
    m: 1, meter: 1, meters: 1, metre: 1, metres: 1,
    km: 1000, kilometer: 1000, kilometers: 1000,
    cm: 0.01, centimeter: 0.01, centimeters: 0.01,
    mm: 0.001, millimeter: 0.001, millimeters: 0.001,
    ft: 0.3048, foot: 0.3048, feet: 0.3048,
    inch: 0.0254, inches: 0.0254,
    yd: 0.9144, yard: 0.9144, yards: 0.9144,
    mi: 1609.344, mile: 1609.344, miles: 1609.344,
  },
  weight: {
    kg: 1, kilogram: 1, kilograms: 1,
    g: 0.001, gram: 0.001, grams: 0.001,
    mg: 0.000001, milligram: 0.000001, milligrams: 0.000001,
    lb: 0.453592, lbs: 0.453592, pound: 0.453592, pounds: 0.453592,
    oz: 0.0283495, ounce: 0.0283495, ounces: 0.0283495,
    ton: 1000, tons: 1000, tonne: 1000, tonnes: 1000,
    stone: 6.35029, stones: 6.35029,
    carat: 0.0002, carats: 0.0002,
  },
  volume: {
    l: 1, liter: 1, liters: 1, litre: 1, litres: 1,
    ml: 0.001, milliliter: 0.001, milliliters: 0.001,
    gal: 3.78541, gallon: 3.78541, gallons: 3.78541,
    qt: 0.946353, quart: 0.946353, quarts: 0.946353,
    pint: 0.473176, pints: 0.473176,
    cup: 0.236588, cups: 0.236588,
    floz: 0.0295735,
    tbsp: 0.0147868, tablespoon: 0.0147868,
    tsp: 0.00492892, teaspoon: 0.00492892,
    'cu cm': 0.001, 'cu m': 1000, 'cbm': 1000,
    'cubic inch': 0.0163871, 'cubic inches': 0.0163871,
    'cubic meter': 1000, 'cubic meters': 1000,
    'cubic cm': 0.001,
  },
  temperature: {
    celsius: 'C', c: 'C', fahrenheit: 'F', f: 'F', kelvin: 'K', k: 'K',
  },
  time: {
    s: 1, sec: 1, second: 1, seconds: 1,
    min: 60, minute: 60, minutes: 60,
    h: 3600, hr: 3600, hour: 3600, hours: 3600,
    day: 86400, days: 86400,
    week: 604800, weeks: 604800,
    month: 2592000, months: 2592000,
    year: 31536000, years: 31536000,
  },
  area: {
    'm2': 1, 'sqm': 1,
    'km2': 1000000,
    'cm2': 0.0001, 'sqcm': 0.0001,
    'ft2': 0.092903, 'sqft': 0.092903,
    'in2': 0.00064516, 'sqin': 0.00064516,
    'yd2': 0.836127,
    'mi2': 2589988,
    'acre': 4046.86, 'acres': 4046.86,
    'hectare': 10000, 'hectares': 10000,
    'sq cm': 0.0001, 'sq m': 1, 'sq ft': 0.092903, 'sq in': 0.00064516,
    'sq km': 1000000, 'sq mi': 2589988, 'sq yd': 0.836127,
    'square inch': 0.00064516, 'square inches': 0.00064516,
    'square foot': 0.092903, 'square feet': 0.092903,
    'square meter': 1, 'square meters': 1,
    'square cm': 0.0001,
  },
  speed: {
    'mps': 1, 'm/s': 1,
    'kph': 0.277778, 'km/h': 0.277778,
    'mph': 0.44704, 'mi/h': 0.44704,
    'fps': 0.3048, 'ft/s': 0.3048,
    'knot': 0.514444, 'knots': 0.514444,
  },
  data: {
    'bit': 0.125, 'bits': 0.125,
    'B': 1, 'byte': 1, 'bytes': 1,
    'KB': 1000, 'kilobyte': 1000, 'kilobytes': 1000,
    'MB': 1000000, 'megabyte': 1000000, 'megabytes': 1000000,
    'GB': 1000000000, 'gigabyte': 1000000000, 'gigabytes': 1000000000,
    'TB': 1000000000000, 'terabyte': 1000000000000, 'terabytes': 1000000000000,
    'PB': 1000000000000000, 'petabyte': 1000000000000000, 'petabytes': 1000000000000000,
    'KiB': 1024, 'kibibyte': 1024, 'kibibytes': 1024,
    'MiB': 1048576, 'mebibyte': 1048576, 'mebibytes': 1048576,
    'GiB': 1073741824, 'gibibyte': 1073741824, 'gibibytes': 1073741824,
    'TiB': 1099511627776, 'tebibyte': 1099511627776, 'tebibytes': 1099511627776,
  },
  css: {
    'px': 1, 'pixel': 1, 'pixels': 1,
    'pt': 1.333333, 'point': 1.333333, 'points': 1.333333,
    'em': 16, 'rem': 16,
  },
  angular: {
    'radian': 1, 'radians': 1, 'rad': 1,
    'degree': Math.PI / 180, 'degrees': Math.PI / 180, '°': Math.PI / 180,
  },
}

// Scales for big numbers
const scales = {
  'k': 1e3, 'thousand': 1e3, 'thousands': 1e3,
  'M': 1e6, 'million': 1e6, 'millions': 1e6,
  'billion': 1e9, 'billions': 1e9,
  'trillion': 1e12, 'trillions': 1e12,
}

// Timezone offsets (UTC offset in hours)
const timezoneOffsets = {
  'PST': -8, 'PDT': -7, 'MST': -7, 'MDT': -6, 'CST': -6, 'CDT': -5,
  'EST': -5, 'EDT': -4, 'GMT': 0, 'UTC': 0, 'CET': 1, 'CEST': 2,
  'EET': 2, 'EEST': 3, 'IST': 5.5, 'JST': 9, 'KST': 9, 'CST_CN': 8,
  'HKT': 8, 'SGT': 8, 'AEST': 10, 'AEDT': 11, 'NZST': 12, 'NZDT': 13,
}

// City to timezone mapping
const cityTimezones = {
  'new york': 'America/New_York', 'los angeles': 'America/Los_Angeles',
  'chicago': 'America/Chicago', 'london': 'Europe/London',
  'paris': 'Europe/Paris', 'berlin': 'Europe/Berlin',
  'madrid': 'Europe/Madrid', 'tokyo': 'Asia/Tokyo',
  'beijing': 'Asia/Shanghai', 'shanghai': 'Asia/Shanghai',
  'hong kong': 'Asia/Hong_Kong', 'singapore': 'Asia/Singapore',
  'sydney': 'Australia/Sydney', 'moscow': 'Europe/Moscow',
  'dubai': 'Asia/Dubai', 'mumbai': 'Asia/Kolkata',
  'delhi': 'Asia/Kolkata', 'seoul': 'Asia/Seoul',
  'toronto': 'America/Toronto', 'vancouver': 'America/Vancouver',
}

// Timezone abbreviation to IANA mapping
const tzAbbrToIANA = {
  'PST': 'America/Los_Angeles', 'PDT': 'America/Los_Angeles',
  'MST': 'America/Denver', 'MDT': 'America/Denver',
  'CST': 'America/Chicago', 'CDT': 'America/Chicago',
  'EST': 'America/New_York', 'EDT': 'America/New_York',
  'GMT': 'Europe/London', 'UTC': 'UTC',
  'CET': 'Europe/Paris', 'CEST': 'Europe/Paris',
  'EET': 'Europe/Athens', 'EEST': 'Europe/Athens',
  'IST': 'Asia/Kolkata', 'JST': 'Asia/Tokyo', 'KST': 'Asia/Seoul',
  'HKT': 'Asia/Hong_Kong', 'SGT': 'Asia/Singapore',
  'AEST': 'Australia/Sydney', 'AEDT': 'Australia/Sydney',
}

export const useCalculator = () => {

  const evaluateLines = (inputLines) => {
    variables.value = {}
    previousResult.value = null
    const results = []
    inputLines.forEach((input, index) => {
      const line = { input: input.trim(), result: null, error: null, type: 'calculation' }
      evaluateLine(line, index, results)
      results.push(line)
    })
    return results
  }

  const evaluateLine = (line, index, allResults) => {
    const input = line.input
    if (!input) return

    if (input.startsWith('#')) { line.type = 'header'; return }
    if (input.startsWith('//')) { line.type = 'comment'; return }

    // Label with calculation (but not time format like "2:30")
    const labelMatch = input.match(/^([^:]+):\s*(.+)$/)
    if (labelMatch && labelMatch[2] && !/^\d+$/.test(labelMatch[1].trim())) {
      line.type = 'label'
      try {
        const result = evaluateExpression(labelMatch[2].trim(), index, allResults)
        line.result = result.display
        previousResult.value = result.value
      } catch (error) { /* silent */ }
      return
    }

    if (input.endsWith(':')) { line.type = 'label'; return }

    line.type = 'calculation'
    try {
      const result = evaluateExpression(input, index, allResults)
      line.result = result.display
      previousResult.value = result.value
    } catch (error) { /* silent */ }
  }

  const evaluateExpression = (input, index, allResults) => {
    // Strip inline comments (double-quoted text)
    let cleanInput = input.replace(/"[^"]*"/g, '').trim()
    if (!cleanInput) cleanInput = input
    cleanInput = cleanInput.replace(/\bfor\s+the\b/gi, '').trim()
    const cleanLower = cleanInput.toLowerCase().trim()

    // Variable assignment — check BEFORE sum/total to avoid "total = X" being caught as sum
    if (cleanInput.includes('=') && !cleanInput.includes('==') && !cleanInput.includes('<=') && !cleanInput.includes('>=')) {
      const eqIdx = cleanInput.indexOf('=')
      const varName = cleanInput.substring(0, eqIdx).trim()
      const expression = cleanInput.substring(eqIdx + 1).trim()

      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
        const percentMatch = expression.match(/^(\d+(?:\.\d+)?)\s*%$/)
        if (percentMatch) {
          const percentValue = parseFloat(percentMatch[1])
          variables.value[varName] = `${percentValue}%`
          return { value: percentValue, display: `${percentValue}%` }
        }

        const result = evaluateExpression(expression, index, allResults)

        // Store with currency metadata if applicable
        if (result.display && typeof result.display === 'string' && result.display.includes(' ')) {
          const parts = result.display.split(' ')
          const lastPart = parts[parts.length - 1]
          if (exchangeRates.value[lastPart]) {
            variables.value[varName] = { value: result.value, currency: lastPart }
          } else {
            variables.value[varName] = result.value
          }
        } else {
          variables.value[varName] = result.value
        }

        if (varName === 'em' || varName === 'rem') {
          unitConversions.css[varName] = result.value
        }
        if (varName === 'ppi') {
          variables.value._ppi = result.value
        }

        return result
      }
    }

    // Sum / total (only if not a defined variable)
    const isSumKeyword = (cleanLower === 'sum' || cleanLower === 'total') && !variables.value[cleanLower]
    if (isSumKeyword) {
      const sum = calculateSum(index, allResults)
      return { value: sum, display: formatResult(sum) }
    }

    const isSumWithOp = (cleanLower.startsWith('sum ') || cleanLower.startsWith('total ')) &&
      !variables.value[cleanLower.startsWith('sum') ? 'sum' : 'total']
    if (isSumWithOp) {
      const keyword = cleanLower.startsWith('sum') ? 'sum' : 'total'
      const sumConvMatch = cleanInput.match(new RegExp(`^${keyword}\\s+(in|as)\\s+([a-zA-Z€$£¥₹₽]+\\d?|m\\/s|km\\/h|mi\\/h|ft\\/s)`, 'i'))
      if (sumConvMatch) {
        const targetStr = sumConvMatch[2].trim()
        const targetCurrency = currencyMap[targetStr.toLowerCase()] || targetStr.toUpperCase()
        if (exchangeRates.value[targetCurrency]) {
          const sum = calculateSumWithCurrency(index, allResults, targetCurrency)
          return { value: sum, display: `${formatResult(sum)} ${targetCurrency}` }
        }
        const sum = calculateSum(index, allResults)
        return { value: sum, display: `${formatResult(sum)} ${targetStr}` }
      }
      const sum = calculateSum(index, allResults)
      const expression = cleanInput.replace(new RegExp(`^${keyword}\\s+`, 'i'), `${sum} `)
      const result = evaluateMath(expression)
      return { value: result, display: formatResult(result) }
    }

    // Average
    if (cleanLower === 'average' || cleanLower === 'avg') {
      const avg = calculateAverage(index, allResults)
      return { value: avg, display: formatResult(avg) }
    }
    if (cleanLower.startsWith('average ') || cleanLower.startsWith('avg ')) {
      const avg = calculateAverage(index, allResults)
      const expression = cleanInput.replace(/^(average|avg)\s+/i, `${avg} `)
      const result = evaluateMath(expression)
      return { value: result, display: formatResult(result) }
    }

    // Timezone conversion
    const tzResult = handleTimezoneExpression(cleanInput)
    if (tzResult) return tzResult

    // Date/time handling
    const dateResult = handleDateExpression(cleanInput)
    if (dateResult) return dateResult

    // fromunix
    const fromunixMatch = cleanInput.match(/fromunix\s*\(([^)]+)\)/i)
    if (fromunixMatch) {
      const timestamp = parseFloat(fromunixMatch[1])
      const date = new Date(timestamp * 1000)
      return { value: timestamp, display: date.toLocaleString() }
    }

    // Number format conversion: "X in hex/bin/oct/sci"
    const formatConvMatch = cleanInput.match(/^(.+?)\s+in\s+(hex|bin|oct|binary|octal|hexadecimal|sci|scientific)$/i)
    if (formatConvMatch) {
      const sourceExpr = formatConvMatch[1].trim()
      const targetFormat = formatConvMatch[2].toLowerCase()
      try {
        let value
        try { value = evaluateMath(sourceExpr) } catch (e) {
          const unitResult = handleUnitExpression(sourceExpr)
          if (unitResult.hasUnit || unitResult.isConverted) value = unitResult.value
          else {
            const currResult = handleCurrencyExpression(sourceExpr)
            value = currResult.hasCurrency ? currResult.value : evaluateMath(sourceExpr)
          }
        }
        const intValue = Math.round(value)
        if (targetFormat === 'hex' || targetFormat === 'hexadecimal')
          return { value, display: `0x${intValue.toString(16).toUpperCase()}` }
        if (targetFormat === 'bin' || targetFormat === 'binary')
          return { value, display: `0b${intValue.toString(2)}` }
        if (targetFormat === 'oct' || targetFormat === 'octal')
          return { value, display: `0o${intValue.toString(8)}` }
        if (targetFormat === 'sci' || targetFormat === 'scientific')
          return { value, display: value.toExponential() }
      } catch (e) { /* fall through */ }
    }

    // Unit conversion (try before currency since some overlap)
    const unitResult = handleUnitExpression(cleanInput)
    if (unitResult.isConverted || unitResult.hasUnit) {
      return {
        value: unitResult.value,
        display: unitResult.unit ? `${formatResult(unitResult.value)} ${unitResult.unit}` : formatResult(unitResult.value)
      }
    }

    // Currency
    const currencyResult = handleCurrencyExpression(cleanInput)
    if (currencyResult.isConverted || currencyResult.hasCurrency) {
      return {
        value: currencyResult.value,
        display: currencyResult.currency ? `${formatResult(currencyResult.value)} ${currencyResult.currency}` : formatResult(currencyResult.value)
      }
    }

    // Regular math
    let expression = handleFunctions(cleanInput)
    const value = evaluateMath(expression)
    return { value, display: formatResult(value) }
  }

  // ---- Timezone handling ----
  const handleTimezoneExpression = (input) => {
    const tzAbbrs = Object.keys(timezoneOffsets).join('|')
    const cityNames = Object.keys(cityTimezones).join('|')

    // "PST time" or "EST time"
    const tzTimeMatch = input.match(new RegExp(`^(${tzAbbrs})\\s+time$`, 'i'))
    if (tzTimeMatch) {
      const tz = tzTimeMatch[1].toUpperCase()
      const iana = tzAbbrToIANA[tz]
      if (iana) {
        try {
          const now = new Date()
          const formatted = now.toLocaleString('en-US', { timeZone: iana })
          return { value: now.getTime(), display: formatted }
        } catch (e) { /* fall through */ }
      }
    }

    // "time in <City>"
    const timeInCityMatch = input.match(new RegExp(`^time\\s+in\\s+(${cityNames})$`, 'i'))
    if (timeInCityMatch) {
      const city = timeInCityMatch[1].toLowerCase()
      const iana = cityTimezones[city]
      if (iana) {
        try {
          const now = new Date()
          const formatted = now.toLocaleString('en-US', { timeZone: iana })
          return { value: now.getTime(), display: formatted }
        } catch (e) { /* fall through */ }
      }
    }

    // "H:MM am/pm TZ in <City/TZ>" e.g. "2:30 pm HKT in Berlin"
    const tzConvMatch = input.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?\s*([\w]+)\s+in\s+([\w\s]+)$/i)
    if (tzConvMatch) {
      let hours = parseInt(tzConvMatch[1])
      const minutes = parseInt(tzConvMatch[2])
      const ampm = (tzConvMatch[3] || '').toLowerCase()
      const sourceTz = tzConvMatch[4].toUpperCase()
      const target = tzConvMatch[5].trim().toLowerCase()

      if (ampm) {
        if (ampm === 'pm' && hours !== 12) hours += 12
        if (ampm === 'am' && hours === 12) hours = 0
      }

      const sourceIANA = tzAbbrToIANA[sourceTz]
      const targetIANA = cityTimezones[target] || tzAbbrToIANA[target.toUpperCase()]

      if (sourceIANA && targetIANA) {
        try {
          const sourceOffset = timezoneOffsets[sourceTz] || 0
          const targetOffset = timezoneOffsets[target.toUpperCase()] || getOffsetForCity(target)
          const diffHours = targetOffset - sourceOffset
          
          // Build the source time
          const now = new Date()
          const sourceDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0)
          const resultDate = new Date(sourceDate.getTime() + diffHours * 3600000)
          const formatted = resultDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          return { value: resultDate.getTime(), display: formatted }
        } catch (e) { /* fall through */ }
      }
    }

    return null
  }

  const getOffsetForCity = (city) => {
    // Approximate UTC offsets for cities
    const offsets = {
      'new york': -5, 'los angeles': -8, 'chicago': -6, 'london': 0,
      'paris': 1, 'berlin': 1, 'madrid': 1, 'tokyo': 9, 'beijing': 8,
      'shanghai': 8, 'hong kong': 8, 'singapore': 8, 'sydney': 10,
      'moscow': 3, 'dubai': 4, 'mumbai': 5.5, 'delhi': 5.5, 'seoul': 9,
      'toronto': -5, 'vancouver': -8,
    }
    return offsets[city.toLowerCase()] || 0
  }

  // ---- Date/Time handling ----
  const handleDateExpression = (input) => {
    const dateKeywords = ['now', 'time', 'today', 'yesterday', 'tomorrow', 'next week', 'last week', 'next month', 'last month', 'next year', 'last year']
    const hasDateKeyword = dateKeywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(input.toLowerCase()))
    const hasTimePeriod = /\d+\s*(second|seconds|sec|minute|minutes|min(?!us)|hour|hours|day|days|week|weeks|month|months|year|years)\b/i.test(input)

    if (!hasDateKeyword && !hasTimePeriod) return null

    const isDateCalculation = hasDateKeyword

    const getDateFromKeyword = (keyword) => {
      const kw = keyword.toLowerCase().trim()
      const date = new Date()
      if (kw === 'now' || kw === 'time') return date.getTime()
      date.setHours(0, 0, 0, 0)
      if (kw === 'today') return date.getTime()
      if (kw === 'yesterday') { date.setDate(date.getDate() - 1); return date.getTime() }
      if (kw === 'tomorrow') { date.setDate(date.getDate() + 1); return date.getTime() }
      if (kw === 'next week') { date.setDate(date.getDate() + 7); return date.getTime() }
      if (kw === 'last week') { date.setDate(date.getDate() - 7); return date.getTime() }
      if (kw === 'next month') { date.setMonth(date.getMonth() + 1); return date.getTime() }
      if (kw === 'last month') { date.setMonth(date.getMonth() - 1); return date.getTime() }
      if (kw === 'next year') { date.setFullYear(date.getFullYear() + 1); return date.getTime() }
      if (kw === 'last year') { date.setFullYear(date.getFullYear() - 1); return date.getTime() }
      return null
    }

    let expression = input
    const sortedKeywords = [...dateKeywords].sort((a, b) => b.length - a.length)
    for (const keyword of sortedKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      if (regex.test(expression)) {
        const timestamp = getDateFromKeyword(keyword)
        if (timestamp !== null) {
          expression = expression.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), `(${timestamp})`)
        }
      }
    }

    expression = expression.replace(/(\d+(?:\.\d+)?)\s*(second|seconds|sec|minute|minutes|min(?!us)|hour|hours|day|days|week|weeks|month|months|year|years)\b/gi, (match, amount, unit) => {
      const num = parseFloat(amount)
      const u = unit.toLowerCase()
      let ms = 0
      if (u === 'second' || u === 'seconds' || u === 'sec') ms = num * 1000
      else if (u === 'minute' || u === 'minutes' || u.startsWith('min')) ms = num * 60000
      else if (u === 'hour' || u === 'hours') ms = num * 3600000
      else if (u === 'day' || u === 'days') ms = num * 86400000
      else if (u === 'week' || u === 'weeks') ms = num * 604800000
      else if (u === 'month' || u === 'months') ms = num * 2592000000
      else if (u === 'year' || u === 'years') ms = num * 31536000000
      return `(${ms})`
    })

    try {
      const result = evaluateMath(expression)
      if (isDateCalculation) {
        const resultDate = new Date(result)
        return { value: result, display: resultDate.toLocaleString() }
      } else {
        const totalMs = result
        const totalSeconds = totalMs / 1000
        const totalMinutes = totalSeconds / 60
        const totalHours = totalMinutes / 60
        const totalDays = totalHours / 24
        const totalWeeks = totalDays / 7
        const totalMonths = totalDays / 30
        const totalYears = totalDays / 365

        if (totalYears >= 1 && Number.isInteger(totalYears)) return { value: result, display: `${totalYears} ${totalYears === 1 ? 'year' : 'years'}` }
        if (totalMonths >= 1 && Number.isInteger(totalMonths)) return { value: result, display: `${totalMonths} ${totalMonths === 1 ? 'month' : 'months'}` }
        if (totalWeeks >= 1 && Number.isInteger(totalWeeks)) return { value: result, display: `${totalWeeks} ${totalWeeks === 1 ? 'week' : 'weeks'}` }
        if (totalDays >= 1 && Number.isInteger(totalDays)) return { value: result, display: `${totalDays} ${totalDays === 1 ? 'day' : 'days'}` }
        if (totalHours >= 1 && Number.isInteger(totalHours)) return { value: result, display: `${totalHours} ${totalHours === 1 ? 'hour' : 'hours'}` }
        if (totalMinutes >= 1 && Number.isInteger(totalMinutes)) return { value: result, display: `${totalMinutes} ${totalMinutes === 1 ? 'minute' : 'minutes'}` }
        if (totalSeconds >= 1 && Number.isInteger(totalSeconds)) return { value: result, display: `${totalSeconds} ${totalSeconds === 1 ? 'second' : 'seconds'}` }
        return { value: result, display: `${formatResult(totalDays)} days` }
      }
    } catch (e) {
      const inputLower = input.toLowerCase().trim()
      const timestamp = getDateFromKeyword(inputLower)
      if (timestamp !== null) {
        const date = new Date(timestamp)
        return { value: timestamp, display: inputLower === 'now' || inputLower === 'time' ? date.toLocaleString() : date.toLocaleDateString() }
      }
    }
    return null
  }

  // ---- Sum / Average ----
  const calculateSum = (currentIndex, allResults) => {
    let sum = 0
    for (let i = currentIndex - 1; i >= 0; i--) {
      const line = allResults[i]
      if (!line || !line.input.trim()) break
      if (line.result && !isNaN(parseFloat(line.result))) sum += parseFloat(line.result)
    }
    return sum
  }

  const calculateSumWithCurrency = (currentIndex, allResults, targetCurrency) => {
    let sum = 0
    for (let i = currentIndex - 1; i >= 0; i--) {
      const line = allResults[i]
      if (!line || !line.input.trim()) break
      if (line.result) {
        const resultMatch = line.result.match(/^([\d.]+)\s*([A-Z]{3})?$/)
        if (resultMatch) {
          const value = parseFloat(resultMatch[1])
          const currency = resultMatch[2]
          if (currency && targetCurrency) {
            try { sum += convertCurrency(value, currency, targetCurrency) } catch (e) { sum += value }
          } else { sum += value }
        }
      }
    }
    return sum
  }

  const calculateAverage = (currentIndex, allResults) => {
    let sum = 0, count = 0
    for (let i = currentIndex - 1; i >= 0; i--) {
      const line = allResults[i]
      if (!line || !line.input.trim()) break
      if (line.result && !isNaN(parseFloat(line.result))) { sum += parseFloat(line.result); count++ }
    }
    return count > 0 ? sum / count : 0
  }

  // ---- Math evaluation ----
  const evaluateMath = (expr) => {
    let expression = expr.toLowerCase()

    expression = expression
      .replace(/\bplus\b/g, '+')
      .replace(/\band\b/g, '+')
      .replace(/\bwith\b/g, '+')
      .replace(/\bminus\b/g, '-')
      .replace(/\bsubtract\b/g, '-')
      .replace(/\bwithout\b/g, '-')
      .replace(/\btimes\b/g, '*')
      .replace(/\bmultiplied\s+by\b/g, '*')
      .replace(/\bmul\b/g, '*')
      .replace(/\bdivide\s+by\b/g, '/')
      .replace(/\bdivide\b/g, '/')
      .replace(/\bmod\b/g, '⊘')
      .replace(/\bxor\b/g, '⊕')

    // Replace constants
    expression = expression.replace(/\bpi\b/g, `(${constants.pi})`)
    expression = expression.replace(/(?<![a-z])e(?![a-z0-9])/g, `(${constants.e})`)
    expression = expression.replace(/\btau\b/g, `(${constants.tau})`)
    expression = expression.replace(/\bphi\b/g, `(${constants.phi})`)

    if (expression.includes('prev') && previousResult.value !== null) {
      expression = expression.replace(/\bprev\b/g, `(${previousResult.value})`)
    }

    // Replace variables
    for (const [varName, value] of Object.entries(variables.value)) {
      if (varName.startsWith('_')) continue
      const regex = new RegExp(`\\b${varName}\\b`, 'gi')
      if (typeof value === 'string' && value.endsWith('%')) {
        expression = expression.replace(regex, value)
      } else if (typeof value === 'object' && value.value !== undefined) {
        expression = expression.replace(regex, `(${value.value})`)
      } else {
        expression = expression.replace(regex, `(${value})`)
      }
    }

    // Handle scales (word form)
    expression = expression.replace(/(\d+(?:\.\d+)?)\s*(thousand|thousands|million|millions|billion|billions|trillion|trillions)\b/g, (_, num, scale) => {
      const multiplier = scales[scale]
      return `(${parseFloat(num) * multiplier})`
    })

    // Handle k scale (case-insensitive since expression is lowered)
    expression = expression.replace(/(\d+(?:\.\d+)?)\s*k\b/g, (_, num) => {
      return `(${parseFloat(num) * 1e3})`
    })

    // Handle M scale — need original casing. Use a separate pass on original expr.
    let casedExpr = expr
    for (const [varName, value] of Object.entries(variables.value)) {
      if (varName.startsWith('_')) continue
      const regex = new RegExp(`\\b${varName}\\b`, 'gi')
      if (typeof value === 'object' && value.value !== undefined) {
        casedExpr = casedExpr.replace(regex, `(${value.value})`)
      } else if (typeof value !== 'string' || !value.endsWith?.('%')) {
        casedExpr = casedExpr.replace(regex, `(${value})`)
      }
    }
    const mScaleRegex = /(\d+(?:\.\d+)?)\s*M\b/g
    let mMatch
    while ((mMatch = mScaleRegex.exec(casedExpr)) !== null) {
      const num = parseFloat(mMatch[1])
      const fullMatch = mMatch[0].toLowerCase()
      expression = expression.replace(fullMatch, `(${num * 1e6})`)
    }

    // Handle percentages
    expression = handlePercentages(expression)

    // Convert remaining standalone percentages to decimals
    expression = expression.replace(/(\d+(?:\.\d+)?)\s*%/g, (_, num) => `(${num} / 100)`)

    // Implicit multiplication
    expression = expression.replace(/(\d)\s*\(/g, '$1*(')
    expression = expression.replace(/\)\s*\(/g, ')*(')

    // ^ → ** for exponentiation, ⊕ → ^ for XOR, ⊘ → % for modulo
    expression = expression.replace(/\^/g, '**')
    expression = expression.replace(/⊕/g, '^')
    expression = expression.replace(/⊘/g, '%')

    const cleanExpr = expression.replace(/\s/g, '')
    try {
      const result = new Function(`return ${cleanExpr}`)()
      if (typeof result !== 'number' || !isFinite(result)) throw new Error('Invalid result')
      return result
    } catch {
      throw new Error('Invalid expression')
    }
  }

  // ---- Functions ----
  const handleFunctions = (expr) => {
    let expression = expr

    // First handle round() wrapping unit conversions: round(1 month in days)
    expression = expression.replace(/\b(round|ceil|floor)\s*\(([^)]*\b(?:in|to|as)\b[^)]*)\)/gi, (_, fn, inner) => {
      try {
        const unitResult = handleUnitExpression(inner.trim())
        if (unitResult.isConverted || unitResult.hasUnit) {
          const mathFn = fn.toLowerCase() === 'round' ? Math.round : fn.toLowerCase() === 'ceil' ? Math.ceil : Math.floor
          return mathFn(unitResult.value).toString()
        }
      } catch (e) { /* fall through */ }
      return `${fn}(${inner})`
    })

    // N-th root: root N (X)
    expression = expression.replace(/\broot\s+(\d+(?:\.\d+)?)\s*\(([^)]+)\)/gi, (_, n, arg) => {
      return Math.pow(evaluateMathSimple(arg), 1 / parseFloat(n)).toString()
    })

    // Log with base: log N (X)
    expression = expression.replace(/\blog\s+(\d+(?:\.\d+)?)\s*\(([^)]+)\)/gi, (_, base, arg) => {
      return (Math.log(evaluateMathSimple(arg)) / Math.log(parseFloat(base))).toString()
    })

    const funcMap = [
      [/\bsqrt\s*\(([^)]+)\)/gi, (_, a) => Math.sqrt(evaluateMathSimple(a)).toString()],
      [/\bcbrt\s*\(([^)]+)\)/gi, (_, a) => Math.cbrt(evaluateMathSimple(a)).toString()],
      [/\babs\s*\(([^)]+)\)/gi, (_, a) => Math.abs(evaluateMathSimple(a)).toString()],
      [/\blog\s*\(([^)]+)\)/gi, (_, a) => Math.log10(evaluateMathSimple(a)).toString()],
      [/\bln\s*\(([^)]+)\)/gi, (_, a) => Math.log(evaluateMathSimple(a)).toString()],
      [/\bfact\s*\(([^)]+)\)/gi, (_, a) => { let n = Math.floor(evaluateMathSimple(a)), r = 1; for (let i = 2; i <= n; i++) r *= i; return r.toString() }],
      [/\bround\s*\(([^)]+)\)/gi, (_, a) => Math.round(evaluateMathSimple(a)).toString()],
      [/\bceil\s*\(([^)]+)\)/gi, (_, a) => Math.ceil(evaluateMathSimple(a)).toString()],
      [/\bfloor\s*\(([^)]+)\)/gi, (_, a) => Math.floor(evaluateMathSimple(a)).toString()],
      [/\barcsin\s*\(([^)]+)\)/gi, (_, a) => Math.asin(evaluateMathSimple(a)).toString()],
      [/\barccos\s*\(([^)]+)\)/gi, (_, a) => Math.acos(evaluateMathSimple(a)).toString()],
      [/\barctan\s*\(([^)]+)\)/gi, (_, a) => Math.atan(evaluateMathSimple(a)).toString()],
      [/\bsinh\s*\(([^)]+)\)/gi, (_, a) => Math.sinh(evaluateMathSimple(a)).toString()],
      [/\bcosh\s*\(([^)]+)\)/gi, (_, a) => Math.cosh(evaluateMathSimple(a)).toString()],
      [/\btanh\s*\(([^)]+)\)/gi, (_, a) => Math.tanh(evaluateMathSimple(a)).toString()],
    ]

    const trigFuncs = [
      [/\bsin\s*\(([^)]+)\)/gi, Math.sin],
      [/\bcos\s*\(([^)]+)\)/gi, Math.cos],
      [/\btan\s*\(([^)]+)\)/gi, Math.tan],
    ]

    for (const [regex, fn] of funcMap) {
      expression = expression.replace(regex, fn)
    }

    for (const [regex, fn] of trigFuncs) {
      expression = expression.replace(regex, (_, arg) => {
        const hasDeg = arg.includes('°')
        const cleanArg = arg.replace('°', '')
        const value = evaluateMathSimple(cleanArg)
        const radians = hasDeg ? (value * Math.PI) / 180 : value
        return fn(radians).toString()
      })
    }

    return expression
  }

  const evaluateMathSimple = (expr) => {
    let processed = handleFunctions(expr)
    processed = processed.replace(/\bpi\b/gi, `(${constants.pi})`)
    processed = processed.replace(/(?<![a-z])e(?![a-z0-9])/gi, `(${constants.e})`)
    for (const [varName, value] of Object.entries(variables.value)) {
      if (varName.startsWith('_')) continue
      const regex = new RegExp(`\\b${varName}\\b`, 'gi')
      if (typeof value === 'object' && value.value !== undefined) {
        processed = processed.replace(regex, `(${value.value})`)
      } else if (typeof value !== 'string' || !value.endsWith?.('%')) {
        processed = processed.replace(regex, `(${value})`)
      }
    }
    processed = processed.replace(/(\d)\s*\(/g, '$1*(')
    processed = processed.replace(/\)\s*\(/g, ')*(')
    processed = processed.replace(/\^/g, '**')
    const cleanExpr = processed.replace(/\s/g, '')
    try {
      const result = new Function(`return ${cleanExpr}`)()
      if (typeof result !== 'number' || !isFinite(result)) throw new Error('Invalid result')
      return result
    } catch {
      throw new Error('Invalid expression')
    }
  }

  // ---- Percentages ----
  const handlePercentages = (expr) => {
    let expression = expr

    expression = expression.replace(/(\d+(?:\.\d+)?)\s*as\s+a\s*%\s*of\s*(\d+(?:\.\d+)?)/gi, (_, x, y) => `((${x} / ${y}) * 100)`)
    expression = expression.replace(/(\d+(?:\.\d+)?)\s*as\s+a\s*%\s*on\s*(\d+(?:\.\d+)?)/gi, (_, x, y) => `(((${x} - ${y}) / ${y}) * 100)`)
    expression = expression.replace(/(\d+(?:\.\d+)?)\s*as\s+a\s*%\s*off\s*(\d+(?:\.\d+)?)/gi, (_, x, y) => `(((${y} - ${x}) / ${y}) * 100)`)
    expression = expression.replace(/(\d+(?:\.\d+)?)\s*%\s*of\s+what\s+is\s+(\d+(?:\.\d+)?)/gi, (_, p, v) => `(${v} / (${p} / 100))`)
    expression = expression.replace(/(\d+(?:\.\d+)?)\s*%\s*on\s+what\s+is\s+(\d+(?:\.\d+)?)/gi, (_, p, v) => `(${v} / (1 + ${p} / 100))`)
    expression = expression.replace(/(\d+(?:\.\d+)?)\s*%\s*off\s+what\s+is\s+(\d+(?:\.\d+)?)/gi, (_, p, v) => `(${v} / (1 - ${p} / 100))`)
    expression = expression.replace(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\([^)]+\)|\d+(?:\.\d+)?)/g, (_, p, v) => `((${p} / 100) * ${v})`)
    expression = expression.replace(/(\d+(?:\.\d+)?)\s*%\s*on\s*(\([^)]+\)|\d+(?:\.\d+)?)/g, (_, p, v) => `(${v} + (${v} * ${p} / 100))`)
    expression = expression.replace(/(\d+(?:\.\d+)?)\s*%\s*off\s*(\([^)]+\)|\d+(?:\.\d+)?)/g, (_, p, v) => `(${v} - (${v} * ${p} / 100))`)
    expression = expression.replace(/(\([^)]+\)|\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)\s*%/g, (_, b, p) => `(${b} + (${b} * ${p} / 100))`)
    expression = expression.replace(/(\([^)]+\)|\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*%/g, (_, b, p) => `(${b} - (${b} * ${p} / 100))`)
    expression = expression.replace(/(\([^)]+\)|\d+(?:\.\d+)?)\s*\*\s*(\d+(?:\.\d+)?)\s*%/g, (_, b, p) => `(${b} * ${p} / 100)`)
    expression = expression.replace(/(\([^)]+\)|\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*%/g, (_, b, p) => `(${b} / (${p} / 100))`)

    return expression
  }

  // ---- Unit conversion ----
  const findUnitCategory = (unitName) => {
    const lower = unitName.toLowerCase()

    // Check for square/cubic prefixes first
    const sqMatch = lower.match(/^(sq|square)\s+(.+)$/)
    if (sqMatch) {
      const baseUnit = sqMatch[2]
      const areaKey = `square ${baseUnit}`
      const sqKey = `sq ${baseUnit}`
      if (unitConversions.area[areaKey]) return { category: 'area', unit: areaKey, factor: unitConversions.area[areaKey] }
      if (unitConversions.area[sqKey]) return { category: 'area', unit: sqKey, factor: unitConversions.area[sqKey] }
      // Try to derive from length
      const lengthFactor = unitConversions.length[baseUnit]
      if (lengthFactor !== undefined) {
        return { category: 'area', unit: sqKey, factor: lengthFactor * lengthFactor }
      }
    }

    const cuMatch = lower.match(/^(cu|cubic)\s+(.+)$/)
    if (cuMatch) {
      const baseUnit = cuMatch[2]
      const cuKey = `cu ${baseUnit}`
      const cubicKey = `cubic ${baseUnit}`
      if (unitConversions.volume[cuKey]) return { category: 'volume', unit: cuKey, factor: unitConversions.volume[cuKey] }
      if (unitConversions.volume[cubicKey]) return { category: 'volume', unit: cubicKey, factor: unitConversions.volume[cubicKey] }
      // Derive from length
      const lengthFactor = unitConversions.length[baseUnit]
      if (lengthFactor !== undefined) {
        // Convert cubic length to liters: 1 m³ = 1000 L
        return { category: 'volume', unit: cuKey, factor: lengthFactor * lengthFactor * lengthFactor * 1000 }
      }
    }

    // Check cbm (cubic meter)
    if (lower === 'cbm') return { category: 'volume', unit: 'cbm', factor: 1000 }

    // Check multi-word units first (square inches, cubic meters, etc.)
    for (const [category, units] of Object.entries(unitConversions)) {
      if (category === 'temperature') continue
      if (units[lower] !== undefined) return { category, unit: lower, factor: units[lower] }
    }

    // Case-sensitive check for data units (KB, MB, GB, etc.)
    if (unitConversions.data[unitName] !== undefined) {
      return { category: 'data', unit: unitName, factor: unitConversions.data[unitName] }
    }

    return null
  }

  const convertTemperature = (value, fromUnit, toUnit) => {
    const from = unitConversions.temperature[fromUnit.toLowerCase()]
    const to = unitConversions.temperature[toUnit.toLowerCase()]
    if (!from || !to) return null

    // Convert to Celsius first
    let celsius
    if (from === 'C') celsius = value
    else if (from === 'F') celsius = (value - 32) * 5 / 9
    else if (from === 'K') celsius = value - 273.15

    // Convert from Celsius to target
    if (to === 'C') return celsius
    if (to === 'F') return celsius * 9 / 5 + 32
    if (to === 'K') return celsius + 273.15
  }

  const handleUnitExpression = (input) => {
    const noResult = { value: 0, unit: null, hasUnit: false, isConverted: false }

    // Normalize square/cubic prefixes in input
    let normalized = input
      .replace(/\bsquare\s+/gi, 'square ')
      .replace(/\bcubic\s+/gi, 'cubic ')
      .replace(/\bsq\s+/gi, 'sq ')
      .replace(/\bcu\s+/gi, 'cu ')
      // Handle ° without space: "90°" → "90 °"
      .replace(/(\d)°/g, '$1 °')

    // Check for "X unit in/to/as Y unit" pattern (with possible arithmetic)
    // Pattern: "expr in targetUnit"
    const convMatch = normalized.match(/^(.+?)\s+(?:in|to|as)\s+(.+)$/i)
    if (convMatch) {
      const sourceExpr = convMatch[1].trim()
      const targetUnitStr = convMatch[2].trim()

      // Check if target is a unit
      const targetInfo = findUnitCategory(targetUnitStr)

      // Temperature special case
      if (unitConversions.temperature[targetUnitStr.toLowerCase()]) {
        // Parse source: "N sourceUnit"
        const srcMatch = sourceExpr.match(/^(-?\d+(?:\.\d+)?)\s+(.+)$/)
        if (srcMatch) {
          const value = parseFloat(srcMatch[1])
          const srcUnit = srcMatch[2].trim()
          if (unitConversions.temperature[srcUnit.toLowerCase()]) {
            const result = convertTemperature(value, srcUnit, targetUnitStr)
            if (result !== null) return { value: result, unit: targetUnitStr, hasUnit: true, isConverted: true }
          }
        }
      }

      if (targetInfo) {
        // CSS-to-length bridge: "1 inch in px" or "1 cm in px"
        if (targetInfo.category === 'css' || isCSSBridgeConversion(sourceExpr, targetUnitStr)) {
          const bridgeResult = handleCSSBridge(sourceExpr, targetUnitStr)
          if (bridgeResult) return bridgeResult
        }

        // Parse source expression — could be arithmetic like "1 km + 500 m"
        const sourceValue = parseUnitExpression(sourceExpr, targetInfo.category)
        if (sourceValue !== null) {
          // sourceValue is in base unit of the category, convert to target
          const result = sourceValue / targetInfo.factor
          return { value: result, unit: targetUnitStr, hasUnit: true, isConverted: true }
        }
      }

      // Try CSS bridge even if target wasn't found in standard categories
      const bridgeResult = handleCSSBridge(sourceExpr, targetUnitStr)
      if (bridgeResult) return bridgeResult
    }

    // Compound unit expression: "1 meter 20 cm" (no conversion target)
    const compoundResult = parseCompoundUnits(normalized)
    if (compoundResult) return compoundResult

    // Simple "N unit" (no conversion)
    const simpleMatch = normalized.match(/^(-?\d+(?:\.\d+)?)\s+(.+)$/)
    if (simpleMatch) {
      const value = parseFloat(simpleMatch[1])
      const unitStr = simpleMatch[2].trim()
      const unitInfo = findUnitCategory(unitStr)
      if (unitInfo) {
        return { value, unit: unitStr, hasUnit: true, isConverted: false }
      }
    }

    return noResult
  }

  // Parse a unit expression that may contain arithmetic (e.g., "1 km + 500 m")
  // Returns value in base unit of the given category, or null
  const parseUnitExpression = (expr, category) => {
    // Try compound units first: "1 meter 20 cm"
    const compoundPattern = /(\d+(?:\.\d+)?)\s+([\w]+(?:\s+[\w]+)?)\s+(\d+(?:\.\d+)?)\s+([\w]+(?:\s+[\w]+)?)/i
    const compoundMatch = expr.match(compoundPattern)
    if (compoundMatch) {
      const val1 = parseFloat(compoundMatch[1])
      const unit1 = compoundMatch[2].trim()
      const val2 = parseFloat(compoundMatch[3])
      const unit2 = compoundMatch[4].trim()
      const info1 = findUnitCategory(unit1)
      const info2 = findUnitCategory(unit2)
      if (info1 && info2 && info1.category === category && info2.category === category) {
        return val1 * info1.factor + val2 * info2.factor
      }
    }

    // Try simple "N unit" first
    const simpleMatch = expr.match(/^(-?\d+(?:\.\d+)?)\s+(.+)$/)
    if (simpleMatch) {
      const value = parseFloat(simpleMatch[1])
      const unitStr = simpleMatch[2].trim()
      const unitInfo = findUnitCategory(unitStr)
      if (unitInfo && unitInfo.category === category) {
        return value * unitInfo.factor
      }
    }

    // Try arithmetic: "1 km + 500 m", "2 ft - 3 inches"
    const parts = expr.split(/\s*([+-])\s*/)
    if (parts.length >= 3) {
      let total = null
      let op = '+'
      for (const part of parts) {
        if (part === '+' || part === '-') { op = part; continue }
        const m = part.trim().match(/^(-?\d+(?:\.\d+)?)\s+(.+)$/)
        if (m) {
          const val = parseFloat(m[1])
          const unitStr = m[2].trim()
          const unitInfo = findUnitCategory(unitStr)
          if (unitInfo && unitInfo.category === category) {
            const baseVal = val * unitInfo.factor
            if (total === null) total = baseVal
            else total = op === '+' ? total + baseVal : total - baseVal
          } else {
            return null
          }
        } else {
          try {
            const val = evaluateMath(part.trim())
            if (total === null) total = val
            else total = op === '+' ? total + val : total - val
          } catch (e) { return null }
        }
      }
      return total
    }

    // Try evaluating as pure math
    try {
      return evaluateMath(expr)
    } catch (e) { return null }
  }

  // Parse compound units like "1 meter 20 cm"
  const parseCompoundUnits = (input) => {
    const pattern = /(\d+(?:\.\d+)?)\s+([\w]+(?:\s+[\w]+)?)\s+(\d+(?:\.\d+)?)\s+([\w]+(?:\s+[\w]+)?)/i
    const match = input.match(pattern)
    if (!match) return null

    const val1 = parseFloat(match[1])
    const unit1 = match[2].trim()
    const val2 = parseFloat(match[3])
    const unit2 = match[4].trim()

    const info1 = findUnitCategory(unit1)
    const info2 = findUnitCategory(unit2)

    if (info1 && info2 && info1.category === info2.category) {
      // Convert both to base unit and sum
      const baseTotal = val1 * info1.factor + val2 * info2.factor
      // Express in the smaller unit
      const smallerFactor = Math.min(info1.factor, info2.factor)
      const smallerUnit = info1.factor < info2.factor ? unit1 : unit2
      const result = baseTotal / smallerFactor
      return { value: result, unit: smallerUnit, hasUnit: true, isConverted: true }
    }

    return null
  }

  // CSS bridge: convert between length units and CSS pixels using ppi
  const isCSSBridgeConversion = (sourceExpr, targetUnit) => {
    const cssUnits = ['px', 'pixel', 'pixels', 'pt', 'point', 'points', 'em', 'rem']
    const lengthUnits = Object.keys(unitConversions.length)
    const targetLower = targetUnit.toLowerCase()

    const sourceUnit = sourceExpr.match(/\d+(?:\.\d+)?\s+(.+)/)?.[1]?.trim()?.toLowerCase()
    if (!sourceUnit) return false

    return (cssUnits.includes(targetLower) && lengthUnits.includes(sourceUnit)) ||
           (lengthUnits.includes(targetLower) && cssUnits.includes(sourceUnit))
  }

  const handleCSSBridge = (sourceExpr, targetUnit) => {
    const ppi = variables.value._ppi || 96 // default 96 ppi
    const targetLower = targetUnit.toLowerCase()

    const srcMatch = sourceExpr.match(/^(-?\d+(?:\.\d+)?)\s+(.+)$/)
    if (!srcMatch) return null

    const value = parseFloat(srcMatch[1])
    const srcUnit = srcMatch[2].trim().toLowerCase()

    // Length → CSS px: convert length to inches, then multiply by ppi
    const lengthUnits = unitConversions.length
    const cssUnits = unitConversions.css

    if (lengthUnits[srcUnit] !== undefined && (targetLower === 'px' || targetLower === 'pixel' || targetLower === 'pixels')) {
      const inches = value * lengthUnits[srcUnit] / 0.0254 // convert to inches
      const px = inches * ppi
      return { value: px, unit: targetUnit, hasUnit: true, isConverted: true }
    }

    // CSS → CSS (within css category)
    if (cssUnits[srcUnit] !== undefined && cssUnits[targetLower] !== undefined) {
      const px = value * cssUnits[srcUnit]
      const result = px / cssUnits[targetLower]
      return { value: result, unit: targetUnit, hasUnit: true, isConverted: true }
    }

    return null
  }

  // ---- Currency ----
  const parseCurrency = (input) => {
    // "$30", "€50", "£100"
    const symbolMatch = input.match(/^([€$£¥₹₽])\s*(\d+(?:\.\d+)?)(.*)$/)
    if (symbolMatch) {
      const currency = currencyMap[symbolMatch[1]]
      const value = parseFloat(symbolMatch[2])
      const rest = symbolMatch[3].trim()
      return { value, currency, rest }
    }

    // "100 USD", "50 EUR"
    const codeMatch = input.match(/^(\d+(?:\.\d+)?)\s+([a-zA-Z]+)(.*)$/)
    if (codeMatch) {
      const value = parseFloat(codeMatch[1])
      const code = codeMatch[2].trim()
      const rest = codeMatch[3].trim()
      const currency = currencyMap[code.toLowerCase()] || code.toUpperCase()
      if (exchangeRates.value[currency]) {
        return { value, currency, rest }
      }
    }

    return null
  }

  const convertCurrency = (value, fromCurrency, toCurrency) => {
    const fromRate = exchangeRates.value[fromCurrency]
    const toRate = exchangeRates.value[toCurrency]
    if (!fromRate || !toRate) throw new Error('Unknown currency')
    // Convert to USD first, then to target
    const usd = value / fromRate
    return usd * toRate
  }

  const handleCurrencyExpression = (input) => {
    const noResult = { value: 0, currency: null, hasCurrency: false, isConverted: false }

    // "$30 in EUR" or "€50 in USD" or "(a + $4) in GBP"
    const convMatch = input.match(/^(.+?)\s+in\s+([a-zA-Z€$£¥₹₽]+)$/i)
    if (convMatch) {
      const sourceExpr = convMatch[1].trim()
      const targetStr = convMatch[2].trim()
      const targetCurrency = currencyMap[targetStr.toLowerCase()] || targetStr.toUpperCase()

      if (exchangeRates.value[targetCurrency]) {
        // Try to parse source as simple currency: "$30", "€50"
        const parsed = parseCurrency(sourceExpr)
        if (parsed && !parsed.rest) {
          const converted = convertCurrency(parsed.value, parsed.currency, targetCurrency)
          return { value: converted, currency: targetCurrency, hasCurrency: true, isConverted: true }
        }

        // Check if source expression contains currency symbols or currency variables
        const hasCurrencySymbols = /[€$£¥₹₽]/.test(sourceExpr)
        let hasCurrencyVars = false
        const cvarsInSource = []
        for (const [varName, varVal] of Object.entries(variables.value)) {
          if (varName.startsWith('_')) continue
          if (typeof varVal === 'object' && varVal.currency) {
            const regex = new RegExp(`\\b${varName}\\b`, 'i')
            if (regex.test(sourceExpr)) {
              hasCurrencyVars = true
              cvarsInSource.push({ name: varName, value: varVal.value, currency: varVal.currency })
            }
          }
        }

        if (hasCurrencySymbols || hasCurrencyVars) {
          // Normalize everything to USD, evaluate, then convert to target
          let expr = sourceExpr
          expr = expr.replace(/([€$£¥₹₽])\s*(\d+(?:\.\d+)?)/g, (_, symbol, num) => {
            const cur = currencyMap[symbol]
            const val = parseFloat(num)
            const usdVal = val / exchangeRates.value[cur]
            return `(${usdVal})`
          })
          for (const cv of cvarsInSource) {
            const regex = new RegExp(`\\b${cv.name}\\b`, 'gi')
            const usdVal = cv.value / exchangeRates.value[cv.currency]
            expr = expr.replace(regex, `(${usdVal})`)
          }
          try {
            const usdResult = evaluateMath(expr)
            const converted = usdResult * exchangeRates.value[targetCurrency]
            return { value: converted, currency: targetCurrency, hasCurrency: true, isConverted: true }
          } catch (e) { /* fall through */ }
        }

        // Plain math expression — try to evaluate and assume USD
        try {
          const value = evaluateMath(sourceExpr)
          const converted = convertCurrency(value, 'USD', targetCurrency)
          return { value: converted, currency: targetCurrency, hasCurrency: true, isConverted: true }
        } catch (e) { /* fall through */ }
      }
    }

    // Currency arithmetic: "$30 + €20"
    const currencyArithMatch = input.match(/^([€$£¥₹₽])\s*(\d+(?:\.\d+)?)\s*([+\-*/])\s*([€$£¥₹₽])\s*(\d+(?:\.\d+)?)$/)
    if (currencyArithMatch) {
      const cur1 = currencyMap[currencyArithMatch[1]]
      const val1 = parseFloat(currencyArithMatch[2])
      const op = currencyArithMatch[3]
      const cur2 = currencyMap[currencyArithMatch[4]]
      const val2 = parseFloat(currencyArithMatch[5])

      // Convert both to USD
      const usd1 = val1 / exchangeRates.value[cur1]
      const usd2 = val2 / exchangeRates.value[cur2]
      let result
      if (op === '+') result = usd1 + usd2
      else if (op === '-') result = usd1 - usd2
      else if (op === '*') result = usd1 * usd2
      else if (op === '/') result = usd1 / usd2

      // Return in first currency
      const finalValue = result * exchangeRates.value[cur1]
      return { value: finalValue, currency: cur1, hasCurrency: true, isConverted: false }
    }

    // Simple currency: "$30", "€50"
    const parsed = parseCurrency(input)
    if (parsed && !parsed.rest) {
      return { value: parsed.value, currency: parsed.currency, hasCurrency: true, isConverted: false }
    }

    // Check if expression involves currency variables (with or without currency symbols)
    const currencyVarsInExpr = []
    for (const [varName, varVal] of Object.entries(variables.value)) {
      if (varName.startsWith('_')) continue
      if (typeof varVal === 'object' && varVal.currency) {
        const regex = new RegExp(`\\b${varName}\\b`, 'i')
        if (regex.test(input)) {
          currencyVarsInExpr.push({ name: varName, value: varVal.value, currency: varVal.currency })
        }
      }
    }

    // Collect currency symbols in the expression
    const symbolMatches = []
    const symbolRegex = /([€$£¥₹₽])\s*(\d+(?:\.\d+)?)/g
    let sMatch
    while ((sMatch = symbolRegex.exec(input)) !== null) {
      symbolMatches.push({ symbol: sMatch[1], value: parseFloat(sMatch[2]), currency: currencyMap[sMatch[1]] })
    }

    const hasCurrencyContext = currencyVarsInExpr.length > 0 || symbolMatches.length > 0

    if (hasCurrencyContext) {
      // Determine the primary currency: first currency variable, or first symbol
      const primaryCurrency = currencyVarsInExpr.length > 0
        ? currencyVarsInExpr[0].currency
        : symbolMatches[0].currency

      // Build expression converting everything to USD for calculation
      let expr = input

      // Replace currency symbols with USD-converted values
      expr = expr.replace(/([€$£¥₹₽])\s*(\d+(?:\.\d+)?)/g, (_, symbol, num) => {
        const cur = currencyMap[symbol]
        const val = parseFloat(num)
        const usdVal = val / exchangeRates.value[cur]
        return `(${usdVal})`
      })

      // Replace currency variables with USD-converted values
      for (const cv of currencyVarsInExpr) {
        const regex = new RegExp(`\\b${cv.name}\\b`, 'gi')
        const usdVal = cv.value / exchangeRates.value[cv.currency]
        expr = expr.replace(regex, `(${usdVal})`)
      }

      try {
        const usdResult = evaluateMath(expr)
        // Convert from USD to primary currency
        const finalValue = usdResult * exchangeRates.value[primaryCurrency]
        return { value: finalValue, currency: primaryCurrency, hasCurrency: true, isConverted: false }
      } catch (e) { /* fall through */ }
    }

    return noResult
  }

  // ---- Format result ----
  const formatResult = (value) => {
    if (value === null || value === undefined) return null
    if (typeof value !== 'number') return String(value)
    if (!isFinite(value)) return null

    // Handle very small numbers
    if (Math.abs(value) < 1e-10 && value !== 0) return value.toExponential()

    // Round to avoid floating point artifacts
    const rounded = Math.round(value * 1e10) / 1e10

    if (Number.isInteger(rounded)) return rounded.toString()

    // Format with reasonable decimal places
    const str = rounded.toString()
    if (str.includes('e')) return str

    // Limit to 10 decimal places
    const fixed = rounded.toFixed(10).replace(/0+$/, '').replace(/\.$/, '')
    return fixed
  }

  const clearAll = () => {
    variables.value = {}
    previousResult.value = null
  }

  return { evaluateLines, clearAll, fetchExchangeRates, ratesFetched, exchangeRates }
}
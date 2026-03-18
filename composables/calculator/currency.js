// Currency parsing, conversion, and exchange rate fetching
import { currencyMap, exchangeRates, ratesFetched, variables, previousResult, previousResultCurrency } from './constants'
import { SCALE_SUFFIX, SCALED_NUM_RE, applyScale } from './scales'
import { evaluateMath } from './math'

// Regex for matching code-based currency amounts like "56 EUR", "2k usd", "1.5M gbp"
const CODE_CURRENCY_RE = /(\d+(?:\.\d+)?)\s*([kK]|M|thousand|thousands|million|millions|billion|billions|trillion|trillions)?\s+([a-zA-Z]+)/g

// Replace code-based currency amounts (e.g. "56 EUR") with their USD value in an expression
const replaceCodeCurrencies = (expr) => {
  return expr.replace(CODE_CURRENCY_RE, (match, num, scale, code) => {
    const currency = currencyMap[code.toLowerCase()] || code.toUpperCase()
    if (exchangeRates.value[currency]) {
      const val = applyScale(num, scale)
      const usdVal = val / exchangeRates.value[currency]
      return `(${usdVal})`
    }
    return match
  })
}

// Find all code-based currency matches in an expression
const findCodeCurrencyMatches = (input) => {
  const matches = []
  const re = new RegExp(CODE_CURRENCY_RE.source, 'g')
  let m
  while ((m = re.exec(input)) !== null) {
    const code = m[3]
    const currency = currencyMap[code.toLowerCase()] || code.toUpperCase()
    if (exchangeRates.value[currency]) {
      matches.push({ value: applyScale(m[1], m[2]), currency })
    }
  }
  return matches
}

// Fetch live exchange rates
export const fetchExchangeRates = async () => {
  const tryFetch = async (url) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }

  const applyRates = (rates) => {
    rates.USD = 1
    exchangeRates.value = rates
    ratesFetched.value = true
  }

  // Primary: ExchangeRate-API (base USD)
  try {
    const data = await tryFetch('https://open.er-api.com/v6/latest/USD')
    if (data?.result === 'success' && data?.rates) {
      applyRates({ ...data.rates })
      return
    }
  } catch { /* fall through to secondary */ }

  // Secondary: fawazahmed0/exchange-api
  const fawazPrimary = 'https://latest.currency-api.pages.dev/v1/currencies/usd.min.json'
  const fawazFallback = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json'

  try {
    let data
    try {
      data = await tryFetch(fawazPrimary)
    } catch {
      data = await tryFetch(fawazFallback)
    }

    if (data?.usd) {
      const rates = {}
      for (const [code, rate] of Object.entries(data.usd)) {
        rates[code.toUpperCase()] = rate
      }
      applyRates(rates)
      return
    }
  } catch { /* fall through */ }

  console.warn('Failed to fetch exchange rates from all providers, using hardcoded fallback values')
}

export const parseCurrency = (input) => {
  // "$30", "€50", "£100", "$2k", "€1.5M", "$3 million"
  const symbolScaleRe = new RegExp(`^([€$£¥₹₽])\\s*${SCALED_NUM_RE}(.*)$`)
  const symbolMatch = input.match(symbolScaleRe)
  if (symbolMatch) {
    const currency = currencyMap[symbolMatch[1]]
    const value = applyScale(symbolMatch[2], symbolMatch[3])
    const rest = symbolMatch[4].trim()
    return { value, currency, rest }
  }

  // "100 USD", "50 EUR", "2k EUR", "1.5M usd", "3 million eur"
  const codeScaleRe = new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*(${SCALE_SUFFIX})?\\s+([a-zA-Z]+)(.*)$`)
  const codeMatch = input.match(codeScaleRe)
  if (codeMatch) {
    const value = applyScale(codeMatch[1], codeMatch[2])
    const code = codeMatch[3].trim()
    const rest = codeMatch[4].trim()
    const currency = currencyMap[code.toLowerCase()] || code.toUpperCase()
    if (exchangeRates.value[currency]) {
      return { value, currency, rest }
    }
  }

  return null
}

export const convertCurrency = (value, fromCurrency, toCurrency) => {
  const fromRate = exchangeRates.value[fromCurrency]
  const toRate = exchangeRates.value[toCurrency]
  if (!fromRate || !toRate) throw new Error('Unknown currency')
  const usd = value / fromRate
  return usd * toRate
}

export const handleCurrencyExpression = (input) => {
  const noResult = { value: 0, currency: null, hasCurrency: false, isConverted: false }

  // "$30 in EUR" or "€50 in USD" or "(a + $4) in GBP"
  const convMatch = input.match(/^(.+?)\s+in\s+([a-zA-Z€$£¥₹₽]+)$/i)
  if (convMatch) {
    const sourceExpr = convMatch[1].trim()
    const targetStr = convMatch[2].trim()
    const targetCurrency = currencyMap[targetStr.toLowerCase()] || targetStr.toUpperCase()

    if (exchangeRates.value[targetCurrency]) {
      const parsed = parseCurrency(sourceExpr)
      if (parsed && !parsed.rest) {
        const converted = convertCurrency(parsed.value, parsed.currency, targetCurrency)
        return { value: converted, currency: targetCurrency, hasCurrency: true, isConverted: true }
      }

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

      // Also treat 'prev' as a currency variable if it has currency metadata
      if (/\bprev\b/i.test(sourceExpr) && previousResult.value !== null && previousResultCurrency.value) {
        hasCurrencyVars = true
        cvarsInSource.push({ name: 'prev', value: previousResult.value, currency: previousResultCurrency.value })
      }

      const hasCodeCurrencies = findCodeCurrencyMatches(sourceExpr).length > 0

      if (hasCurrencySymbols || hasCurrencyVars || hasCodeCurrencies) {
        let expr = sourceExpr
        expr = expr.replace(/([€$£¥₹₽])\s*(\d+(?:\.\d+)?)\s*([kK]|M|thousand|thousands|million|millions|billion|billions|trillion|trillions)?/g, (_, symbol, num, scale) => {
          const cur = currencyMap[symbol]
          const val = applyScale(num, scale)
          const usdVal = val / exchangeRates.value[cur]
          return `(${usdVal})`
        })
        for (const cv of cvarsInSource) {
          const regex = new RegExp(`\\b${cv.name}\\b`, 'gi')
          const usdVal = cv.value / exchangeRates.value[cv.currency]
          expr = expr.replace(regex, `(${usdVal})`)
        }
        expr = replaceCodeCurrencies(expr)
        try {
          const usdResult = evaluateMath(expr)
          const converted = usdResult * exchangeRates.value[targetCurrency]
          return { value: converted, currency: targetCurrency, hasCurrency: true, isConverted: true }
        } catch (e) { /* fall through */ }
      }

      try {
        const value = evaluateMath(sourceExpr)
        const converted = convertCurrency(value, 'USD', targetCurrency)
        return { value: converted, currency: targetCurrency, hasCurrency: true, isConverted: true }
      } catch (e) { /* fall through */ }
    }
  }

  // Currency arithmetic: "$30 + €20", "$2k + €500", "$1.5M - €200k"
  const currArithMatch = input.match(/^([€$£¥₹₽])\s*(\d+(?:\.\d+)?)\s*([kK]|M|thousand|thousands|million|millions|billion|billions|trillion|trillions)?\s*([+\-*/])\s*([€$£¥₹₽])\s*(\d+(?:\.\d+)?)\s*([kK]|M|thousand|thousands|million|millions|billion|billions|trillion|trillions)?$/)
  if (currArithMatch) {
    const cur1 = currencyMap[currArithMatch[1]]
    const val1 = applyScale(currArithMatch[2], currArithMatch[3])
    const op = currArithMatch[4]
    const cur2 = currencyMap[currArithMatch[5]]
    const val2 = applyScale(currArithMatch[6], currArithMatch[7])

    const usd1 = val1 / exchangeRates.value[cur1]
    const usd2 = val2 / exchangeRates.value[cur2]
    let result
    if (op === '+') result = usd1 + usd2
    else if (op === '-') result = usd1 - usd2
    else if (op === '*') result = usd1 * usd2
    else if (op === '/') result = usd1 / usd2

    const finalValue = result * exchangeRates.value[cur1]
    return { value: finalValue, currency: cur1, hasCurrency: true, isConverted: false }
  }

  // Simple currency: "$30", "€50"
  const parsed = parseCurrency(input)
  if (parsed && !parsed.rest) {
    return { value: parsed.value, currency: parsed.currency, hasCurrency: true, isConverted: false }
  }

  // Check if expression involves currency variables
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

  // Also treat 'prev' as a currency variable if it has currency metadata
  if (/\bprev\b/i.test(input) && previousResult.value !== null && previousResultCurrency.value) {
    currencyVarsInExpr.push({ name: 'prev', value: previousResult.value, currency: previousResultCurrency.value })
  }

  const symbolMatches = []
  const symbolRegex = /([€$£¥₹₽])\s*(\d+(?:\.\d+)?)\s*([kK]|M|thousand|thousands|million|millions|billion|billions|trillion|trillions)?/g
  let sMatch
  while ((sMatch = symbolRegex.exec(input)) !== null) {
    symbolMatches.push({ symbol: sMatch[1], value: applyScale(sMatch[2], sMatch[3]), currency: currencyMap[sMatch[1]] })
  }

  const codeCurrencyMatches = findCodeCurrencyMatches(input)

  const hasCurrencyContext = currencyVarsInExpr.length > 0 || symbolMatches.length > 0 || codeCurrencyMatches.length > 0

  if (hasCurrencyContext) {
    // Determine primary currency by what appears first in the expression
    let primaryCurrency
    if (currencyVarsInExpr.length > 0) {
      primaryCurrency = currencyVarsInExpr[0].currency
    } else {
      const firstSymbolIdx = symbolMatches.length > 0 ? input.indexOf(symbolMatches[0].symbol) : Infinity
      const firstCodeIdx = codeCurrencyMatches.length > 0 ? input.search(new RegExp(`\\d[\\d.]*\\s*(?:[kKM]|thousand|thousands|million|millions|billion|billions|trillion|trillions)?\\s+${codeCurrencyMatches[0].currency}`, 'i')) : Infinity
      primaryCurrency = firstSymbolIdx <= firstCodeIdx
        ? symbolMatches[0].currency
        : codeCurrencyMatches[0].currency
    }

    let expr = input

    expr = expr.replace(/([€$£¥₹₽])\s*(\d+(?:\.\d+)?)\s*([kK]|M|thousand|thousands|million|millions|billion|billions|trillion|trillions)?/g, (_, symbol, num, scale) => {
      const cur = currencyMap[symbol]
      const val = applyScale(num, scale)
      const usdVal = val / exchangeRates.value[cur]
      return `(${usdVal})`
    })

    for (const cv of currencyVarsInExpr) {
      const regex = new RegExp(`\\b${cv.name}\\b`, 'gi')
      const usdVal = cv.value / exchangeRates.value[cv.currency]
      expr = expr.replace(regex, `(${usdVal})`)
    }

    expr = replaceCodeCurrencies(expr)

    try {
      const usdResult = evaluateMath(expr)
      const finalValue = usdResult * exchangeRates.value[primaryCurrency]
      return { value: finalValue, currency: primaryCurrency, hasCurrency: true, isConverted: false }
    } catch (e) { /* fall through */ }
  }

  return noResult
}

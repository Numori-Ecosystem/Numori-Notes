// Sum and average operations
import { convertCurrency } from './currency'

export const calculateSum = (currentIndex, allResults) => {
  let sum = 0
  for (let i = currentIndex - 1; i >= 0; i--) {
    const line = allResults[i]
    if (!line || !line.input.trim()) break
    if (line.result && !isNaN(parseFloat(line.result))) sum += parseFloat(line.result)
  }
  return sum
}

export const detectSumCurrency = (currentIndex, allResults) => {
  let firstCurrency = null
  for (let i = currentIndex - 1; i >= 0; i--) {
    const line = allResults[i]
    if (!line || !line.input.trim()) break
    if (line.result) {
      const currMatch = line.result.match(/^-?[\d.,]+\s+([A-Z]{3})$/)
      if (currMatch) {
        if (!firstCurrency) firstCurrency = currMatch[1]
      }
    }
  }
  return firstCurrency
}

export const calculateSumWithCurrency = (currentIndex, allResults, targetCurrency) => {
  let sum = 0
  for (let i = currentIndex - 1; i >= 0; i--) {
    const line = allResults[i]
    if (!line || !line.input.trim()) break
    if (line.result) {
      const resultMatch = line.result.match(/^(-?[\d.]+)\s*([A-Z]{3})?$/)
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

export const calculateAverage = (currentIndex, allResults) => {
  let sum = 0, count = 0
  for (let i = currentIndex - 1; i >= 0; i--) {
    const line = allResults[i]
    if (!line || !line.input.trim()) break
    if (line.result && !isNaN(parseFloat(line.result))) { sum += parseFloat(line.result); count++ }
  }
  return count > 0 ? sum / count : 0
}

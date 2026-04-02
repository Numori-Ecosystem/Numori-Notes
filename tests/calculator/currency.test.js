/**
 * Tests for currency parsing, conversion, and arithmetic.
 */
import { describe, it, expect } from 'vitest'
import { calc, calcLines } from './helpers'

describe('Currency', () => {
  it('$30 returns value with USD', () => { expect(calc('$30')).toMatch(/30/) })
  it('€50 returns value with EUR', () => { expect(calc('€50')).toMatch(/50/) })
  it('£100 returns value with GBP', () => { expect(calc('£100')).toMatch(/100/) })

  it('$30 in EUR converts currency', () => {
    const result = calc('$30 in EUR')
    expect(result).toBeTruthy()
    expect(result).toMatch(/EUR/)
  })

  it('$30 in euro (common name)', () => { expect(calc('$30 in euro')).toBeTruthy() })
  it('currency arithmetic: $30 + €20 (mixed currencies)', () => { expect(calc('$30 + €20')).toBeTruthy() })

  it('100 USD in GBP', () => {
    const result = calc('100 USD in GBP')
    expect(result).toBeTruthy()
    expect(result).toMatch(/GBP/)
  })

  it('currency with variable: v = $20, v + $10', () => {
    const results = calcLines(['v = $20', 'v + $10'])
    expect(parseFloat(results[1])).toBe(30)
  })

  it('variable with EUR + USD: a = €1, a + $4 should convert correctly', () => {
    const results = calcLines(['a = €1', 'a + $4'])
    expect(results[1]).toMatch(/EUR/)
    expect(parseFloat(results[1])).not.toBeCloseTo(5, 1)
  })

  it('variable with USD + EUR: a = $10, a + €5 should convert correctly', () => {
    const results = calcLines(['a = $10', 'a + €5'])
    expect(results[1]).toMatch(/USD/)
    expect(parseFloat(results[1])).not.toBeCloseTo(15, 1)
  })

  it('variable with EUR currency used in conversion: a = €100, a in GBP', () => {
    const results = calcLines(['a = €100', 'a in GBP'])
    expect(results[1]).toMatch(/GBP/)
    const gbpValue = parseFloat(results[1])
    expect(gbpValue).toBeGreaterThan(80)
    expect(gbpValue).toBeLessThan(95)
  })

  it('two currency variables: a = €10, b = $10, a + b should convert', () => {
    const results = calcLines(['a = €10', 'b = $10', 'a + b'])
    expect(results[2]).toMatch(/EUR/)
    const eurValue = parseFloat(results[2])
    expect(eurValue).toBeCloseTo(18.7, 0)
  })

  it('currency variable multiplied by number: a = €50, a * 3', () => {
    const results = calcLines(['a = €50', 'a * 3'])
    expect(parseFloat(results[1])).toBe(150)
    expect(results[1]).toMatch(/EUR/)
  })

  it('parenthesized currency expression converted: a = €1, (a + $4) in GBP', () => {
    const results = calcLines(['a = €1', '(a + $4) in GBP'])
    expect(results[1]).toMatch(/GBP/)
    const gbpValue = parseFloat(results[1])
    expect(gbpValue).toBeGreaterThan(3.5)
    expect(gbpValue).toBeLessThan(4.5)
  })

  it('simple currency expression converted: $100 + €50 in GBP', () => {
    const results = calcLines(['$100 + €50 in GBP'])
    expect(results[0]).toMatch(/GBP/)
    const gbpValue = parseFloat(results[0])
    expect(gbpValue).toBeGreaterThan(110)
    expect(gbpValue).toBeLessThan(130)
  })

  it('currency variable expression converted: a = €100, a in GBP (no parens)', () => {
    const results = calcLines(['a = €100', 'a in GBP'])
    expect(results[1]).toMatch(/GBP/)
    const gbpValue = parseFloat(results[1])
    expect(gbpValue).toBeGreaterThan(80)
    expect(gbpValue).toBeLessThan(95)
  })
})

describe('Currency with code-based amounts in arithmetic', () => {
  it('$20 + 56 EUR (symbol + code-based currency)', () => {
    const result = calc('$20 + 56 EUR')
    expect(result).toBeTruthy()
    expect(result).toMatch(/USD/)
    const usdValue = parseFloat(result)
    // 56 EUR converted to USD + 20 USD
    expect(usdValue).toBeGreaterThan(75)
    expect(usdValue).toBeLessThan(90)
  })

  it('$20 - 10 EUR (symbol + code subtraction)', () => {
    const result = calc('$20 - 10 EUR')
    expect(result).toBeTruthy()
    expect(result).toMatch(/USD/)
  })

  it('100 USD + 50 EUR (both code-based)', () => {
    const result = calc('100 USD + 50 EUR')
    expect(result).toBeTruthy()
    expect(result).toMatch(/USD/)
    const usdValue = parseFloat(result)
    expect(usdValue).toBeGreaterThan(150)
    expect(usdValue).toBeLessThan(170)
  })

  it('50 EUR + $20 (code-based + symbol)', () => {
    const result = calc('50 EUR + $20')
    expect(result).toBeTruthy()
    expect(result).toMatch(/EUR/)
  })

  it('$20 + 56 EUR in GBP (mixed with conversion)', () => {
    const result = calc('$20 + 56 EUR in GBP')
    expect(result).toBeTruthy()
    expect(result).toMatch(/GBP/)
  })

  it('100 USD + 50 GBP in EUR (code-based with conversion)', () => {
    const result = calc('100 USD + 50 GBP in EUR')
    expect(result).toBeTruthy()
    expect(result).toMatch(/EUR/)
  })

  it('multiline: Cost + Discounted with code-based currency', () => {
    const results = calcLines(['Cost: $20 + 56 EUR', 'Discounted: prev - 5%'])
    expect(results[0]).toBeTruthy()
    expect(results[0]).toMatch(/USD/)
    expect(results[1]).toBeTruthy()
  })
})

describe('Currency with postfix symbol (e.g. 3€)', () => {
  it('30€ returns value with EUR', () => {
    const result = calc('30€')
    expect(parseFloat(result)).toBe(30)
    expect(result).toMatch(/EUR/)
  })

  it('50£ returns value with GBP', () => {
    const result = calc('50£')
    expect(parseFloat(result)).toBe(50)
    expect(result).toMatch(/GBP/)
  })

  it('100$ returns value with USD', () => {
    const result = calc('100$')
    expect(parseFloat(result)).toBe(100)
    expect(result).toMatch(/USD/)
  })

  it('30€ in USD converts currency', () => {
    const result = calc('30€ in USD')
    expect(result).toBeTruthy()
    expect(result).toMatch(/USD/)
  })

  it('postfix currency arithmetic: 30€ + 20$ (mixed currencies)', () => {
    const result = calc('30€ + 20$')
    expect(result).toBeTruthy()
    expect(result).toMatch(/EUR/)
  })

  it('mixed prefix/postfix arithmetic: $30 + 20€', () => {
    const result = calc('$30 + 20€')
    expect(result).toBeTruthy()
    expect(result).toMatch(/USD/)
  })

  it('postfix with scale: 2k€ = 2000 EUR', () => {
    const result = calc('2k€')
    expect(parseFloat(result)).toBe(2000)
    expect(result).toMatch(/EUR/)
  })

  it('postfix with scale: 1.5M£ = 1500000 GBP', () => {
    const result = calc('1.5M£')
    expect(parseFloat(result)).toBe(1500000)
    expect(result).toMatch(/GBP/)
  })

  it('postfix conversion with scale: 2k€ in USD', () => {
    const result = calc('2k€ in USD')
    expect(result).toMatch(/USD/)
    const val = parseFloat(result)
    expect(val).toBeGreaterThan(1800)
    expect(val).toBeLessThan(2400)
  })

  it('variable with postfix currency: v = 20€, v + 10€', () => {
    const results = calcLines(['v = 20€', 'v + 10€'])
    expect(parseFloat(results[1])).toBe(30)
    expect(results[1]).toMatch(/EUR/)
  })
})

describe('Currency with Scales', () => {
  // Symbol prefix + scale suffix
  it('$2k = 2000 USD', () => {
    const result = calc('$2k')
    expect(parseFloat(result)).toBe(2000)
    expect(result).toMatch(/USD/)
  })
  it('$1.5k = 1500 USD', () => { expect(parseFloat(calc('$1.5k'))).toBe(1500) })
  it('€3M = 3000000 EUR', () => {
    const result = calc('€3M')
    expect(parseFloat(result)).toBe(3000000)
    expect(result).toMatch(/EUR/)
  })
  it('£1 million = 1000000 GBP', () => {
    const result = calc('£1 million')
    expect(parseFloat(result)).toBe(1000000)
    expect(result).toMatch(/GBP/)
  })
  it('$500k displays USD', () => { expect(calc('$500k')).toMatch(/USD/) })

  // Code suffix + scale
  it('2k eur = 2000 EUR', () => {
    const result = calc('2k eur')
    expect(result).toMatch(/2000/)
    expect(result).toMatch(/EUR/)
  })
  it('2M eur = 2000000 EUR', () => {
    const result = calc('2M eur')
    expect(result).toMatch(/2000000/)
    expect(result).toMatch(/EUR/)
  })
  it('1.5 million usd = 1500000 USD', () => {
    const result = calc('1.5 million usd')
    expect(result).toMatch(/1500000/)
    expect(result).toMatch(/USD/)
  })

  // Conversion with scales
  it('$2k in EUR converts correctly', () => {
    const result = calc('$2k in EUR')
    expect(result).toMatch(/EUR/)
    const val = parseFloat(result)
    expect(val).toBeGreaterThan(1500)
    expect(val).toBeLessThan(2000)
  })

  // Arithmetic with scales
  it('$1k + €500 mixed currency arithmetic', () => {
    const result = calc('$1k + €500')
    expect(result).toBeTruthy()
    expect(result).toMatch(/USD/)
  })
  it('$2k - €500 mixed currency arithmetic', () => {
    const result = calc('$2k - €500')
    expect(result).toBeTruthy()
    expect(result).toMatch(/USD/)
  })

  // Scale with variable assignment
  it('variable with scaled currency: v = $5k, v + $500', () => {
    const results = calcLines(['v = $5k', 'v + $500'])
    expect(parseFloat(results[1])).toBe(5500)
  })
})

import { describe, it, expect } from 'vitest'

import { useCalculator } from '../index'

describe('label with arithmetic expression (no colon)', () => {
  it('evaluates "Arwen 900 eur + 20 eur" as 920 EUR', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines(['Arwen 900 eur + 20 eur'])
    expect(results[0].result).not.toBeNull()
    const num = parseFloat(results[0].result)
    expect(num).toBe(920)
    expect(results[0].result).toContain('EUR')
  })

  it('full user scenario: labels with arithmetic + sum', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines([
      'Arwen 900 eur + 20 eur',
      'Kaisa 900 eur',
      'transporte Arwen 800 eur',
      'transporte kaisa 2000 eur',
      'sum',
    ])

    // Line 0: 900 + 20 = 920
    expect(results[0].result).not.toBeNull()
    expect(parseFloat(results[0].result)).toBe(920)

    // Line 1: plain 900
    expect(parseFloat(results[1].result)).toBe(900)

    // Line 2: plain 800
    expect(parseFloat(results[2].result)).toBe(800)

    // Line 3: plain 2000
    expect(parseFloat(results[3].result)).toBe(2000)

    // Line 4: sum = 920 + 900 + 800 + 2000 = 4620
    expect(results[4].result).not.toBeNull()
    const sumNum = parseFloat(results[4].result.replace(/,/g, ''))
    expect(sumNum).toBe(4620)
  })

  it('label with subtraction: "Rent deposit 1000 eur - 200 eur"', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines(['Rent deposit 1000 eur - 200 eur'])
    expect(results[0].result).not.toBeNull()
    expect(parseFloat(results[0].result)).toBe(800)
    expect(results[0].result).toContain('EUR')
  })

  it('label with multiplication: "Items 50 eur * 3"', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines(['Items 50 eur * 3'])
    expect(results[0].result).not.toBeNull()
    expect(parseFloat(results[0].result)).toBe(150)
  })

  it('plain text with number and no operator still uses extractTrailingNumber', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines(['Arwen 900 eur'])
    expect(results[0].result).not.toBeNull()
    expect(parseFloat(results[0].result)).toBe(900)
    expect(results[0].result).toContain('EUR')
  })

  it('evaluates "Arwen 900 + 20" (no currency) as 920', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines(['Arwen 900 + 20'])
    expect(results[0].result).not.toBeNull()
    expect(parseFloat(results[0].result)).toBe(920)
  })

  it('full scenario without currency on first line', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines([
      'Arwen 900 + 20',
      'Kaisa 900 eur',
      'transporte Arwen 800 eur',
      'transporte kaisa 2000 eur',
      'sum',
    ])

    expect(parseFloat(results[0].result)).toBe(920)
    expect(parseFloat(results[1].result)).toBe(900)
    expect(parseFloat(results[2].result)).toBe(800)
    expect(parseFloat(results[3].result)).toBe(2000)

    const sumNum = parseFloat(results[4].result.replace(/,/g, ''))
    expect(sumNum).toBe(4620)
  })

  it('label with plain addition: "groceries 50 + 30"', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines(['groceries 50 + 30'])
    expect(results[0].result).not.toBeNull()
    expect(parseFloat(results[0].result)).toBe(80)
  })

  it('label with plain subtraction: "budget 1000 - 250"', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines(['budget 1000 - 250'])
    expect(results[0].result).not.toBeNull()
    expect(parseFloat(results[0].result)).toBe(750)
  })

  it('plain text with no number returns no result', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines(['just some text'])
    expect(results[0].result).toBeNull()
  })
})

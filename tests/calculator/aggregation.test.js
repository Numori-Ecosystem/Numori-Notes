/**
 * Tests for sum, average, formatting (headers, comments, labels), and edge cases.
 */
import { describe, it, expect } from 'vitest'
import { calc, calcLines, calcNum, useCalculator } from './helpers'

describe('Sum', () => {
  it('sum of lines above', () => {
    const results = calcLines(['10', '15', '25', 'sum'])
    expect(parseFloat(results[3])).toBe(50)
  })
  it('sum stops at empty line', () => {
    const results = calcLines(['5', '10', '', '20', '30', 'sum'])
    expect(parseFloat(results[5])).toBe(50)
  })
  it('sum with operations: sum - 10%', () => {
    const results = calcLines(['100', '200', 'sum - 10%'])
    expect(parseFloat(results[2])).toBeCloseTo(270, 0)
  })
  it('sum in currency: sum in EUR', () => {
    const results = calcLines(['$100', '$200', 'sum in EUR'])
    expect(results[2]).toMatch(/EUR/)
  })
  it('sum with labels', () => {
    const results = calcLines(['Item 1: 10', 'Item 2: 20', 'Sum: sum'])
    expect(parseFloat(results[2])).toBe(30)
  })
  it('sum preserves currency from lines above', () => {
    const results = calcLines(['Cuba: £263 + £57', 'House: £730', 'Debts: £360', 'Expenses: sum'])
    expect(parseFloat(results[3])).toBe(1410)
    expect(results[3]).toMatch(/GBP/)
  })
  it('sum preserves currency from EUR lines above', () => {
    const results = calcLines(['€100', '€200', '€50', 'sum'])
    expect(parseFloat(results[3])).toBe(350)
    expect(results[3]).toMatch(/EUR/)
  })
  it('sum with mixed currencies converts to common currency', () => {
    const results = calcLines(['$100', '€50', 'sum'])
    expect(results[2]).toBeTruthy()
    expect(parseFloat(results[2])).not.toBe(150)
  })
})

describe('Sum with Negative Values', () => {
  it('sum with negative numbers', () => {
    const results = calcLines(['100', '-20', '-30', 'sum'])
    expect(parseFloat(results[3])).toBe(50)
  })
  it('sum with negative currency (budget scenario)', () => {
    const results = calcLines([
      'Salary: €1457',
      'Food: -€200',
      'Fuel: -€100',
      'Car insurance: -€60',
      'Ho: -€30',
      'Fun: -€100',
      'sum',
    ])
    expect(parseFloat(results[6])).toBe(967)
    expect(results[6]).toMatch(/EUR/)
  })
  it('sum with all negative currency values', () => {
    const results = calcLines(['-€100', '-€200', '-€50', 'sum'])
    expect(parseFloat(results[3])).toBe(-350)
    expect(results[3]).toMatch(/EUR/)
  })
  it('sum with mixed positive and negative currency', () => {
    const results = calcLines(['€500', '-€150', '€200', '-€50', 'sum'])
    expect(parseFloat(results[4])).toBe(500)
    expect(results[4]).toMatch(/EUR/)
  })
  it('sum with negative GBP values', () => {
    const results = calcLines(['Income: £2000', 'Rent: -£800', 'Bills: -£200', 'sum'])
    expect(parseFloat(results[3])).toBe(1000)
    expect(results[3]).toMatch(/GBP/)
  })
  it('sum with negative USD values', () => {
    const results = calcLines(['$1000', '-$300', '-$200', 'sum'])
    expect(parseFloat(results[3])).toBe(500)
    expect(results[3]).toMatch(/USD/)
  })
  it('average with negative values', () => {
    const results = calcLines(['100', '-50', '50', 'average'])
    expect(parseFloat(results[3])).toBeCloseTo(33.33, 0)
  })
  it('average with negative currency values', () => {
    const results = calcLines(['€300', '-€100', '€200', 'average'])
    expect(parseFloat(results[3])).toBeCloseTo(133.33, 0)
  })
})

describe('Average', () => {
  it('average of lines above', () => {
    const results = calcLines(['10', '20', '30', 'average'])
    expect(parseFloat(results[3])).toBe(20)
  })
  it('avg is alias for average', () => {
    const results = calcLines(['10', '20', 'avg'])
    expect(parseFloat(results[2])).toBe(15)
  })
  it('average stops at empty line', () => {
    const results = calcLines(['5', '', '10', '20', 'average'])
    expect(parseFloat(results[4])).toBe(15)
  })
  it('average with operations: average + 5', () => {
    const results = calcLines(['10', '20', 'average + 5'])
    expect(parseFloat(results[2])).toBe(20)
  })
})

describe('Formatting', () => {
  it('# header line has no result', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines(['# This is header'])
    expect(results[0].type).toBe('header')
    expect(results[0].result).toBeNull()
  })
  it('// comment line has no result', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines(['// This is comment'])
    expect(results[0].type).toBe('comment')
    expect(results[0].result).toBeNull()
  })
  it('Label: value evaluates the value', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines(['Price: $11 + $34.45'])
    expect(results[0].type).toBe('label')
    expect(parseFloat(results[0].result)).toBeCloseTo(45.45, 1)
  })
  it('Label without value has no result', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines(['My Label:'])
    expect(results[0].type).toBe('label')
    expect(results[0].result).toBeNull()
  })
  it('inline comment with double quotes: $275 for the "Model 227"', () => {
    const result = calc('$275 for the "Model 227"')
    expect(parseFloat(result)).toBeCloseTo(275, 0)
  })
})

describe('Edge Cases', () => {
  it('empty line returns null', () => { expect(calc('')).toBeNull() })
  it('whitespace-only line returns null', () => { expect(calc('   ')).toBeNull() })
  it('very large number', () => {
    const result = calcNum('999999999 * 999999999')
    expect(result).toBeCloseTo(999999998000000001, -5)
  })
  it('very small number', () => {
    const result = calcNum('0.000001 * 0.000001')
    expect(result).toBeCloseTo(1e-12, 12)
  })
  it('division by zero returns no result (not crash)', () => {
    expect(() => calc('1 / 0')).not.toThrow()
  })
  it('complex multi-line calculation', () => {
    const results = calcLines([
      'price = $100',
      'tax = 8.5% of price',
      'total = price + tax',
      'total in EUR',
    ])
    expect(parseFloat(results[1])).toBeCloseTo(8.5, 1)
    expect(parseFloat(results[2])).toBeCloseTo(108.5, 1)
    expect(results[3]).toMatch(/EUR/)
  })
})

describe('Prev with currency context', () => {
  it('total-prev after sum and labeled currency line', () => {
    const results = calcLines([
      'Salary: £2585',
      'TPS: £186.77',
      'total = sum',
      'April: £433.97',
      'total-prev'
    ])
    // total = 2585 + 186.77 = 2771.77
    expect(parseFloat(results[2])).toBeCloseTo(2771.77, 2)
    // prev = 433.97 (April), total - prev = 2337.80
    expect(parseFloat(results[4])).toBeCloseTo(2337.80, 2)
    expect(results[4]).toMatch(/GBP/)
  })

  it('prev carries correct value after plain number line', () => {
    const results = calcLines([
      '100',
      '50',
      'prev + 10'
    ])
    // prev = 50, so 50 + 10 = 60
    expect(parseFloat(results[2])).toBe(60)
  })

  it('prev carries correct currency value in EUR context', () => {
    const results = calcLines([
      'budget = €1000',
      'Groceries: €200',
      'budget - prev'
    ])
    // prev = 200 (EUR), budget = 1000 (EUR), result = 800 EUR
    expect(parseFloat(results[2])).toBeCloseTo(800, 2)
    expect(results[2]).toMatch(/EUR/)
  })

  it('prev after sum used in subtraction with currency var', () => {
    const results = calcLines([
      'Income: £3000',
      'Bonus: £500',
      'total = sum',
      'Rent: £1200',
      'total - prev'
    ])
    // total = 3500, prev = 1200, result = 2300
    expect(parseFloat(results[4])).toBeCloseTo(2300, 2)
    expect(results[4]).toMatch(/GBP/)
  })

  it('prev works correctly across currency and non-currency lines', () => {
    const results = calcLines([
      '£500',
      '100',
      'prev * 2'
    ])
    // prev = 100 (no currency), so 100 * 2 = 200
    expect(parseFloat(results[2])).toBe(200)
  })
})

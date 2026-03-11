/**
 * Tests for variables, previous result (prev), and percentages.
 */
import { describe, it, expect } from 'vitest'
import { calc, calcLines, calcNum } from './helpers'

describe('Variables', () => {
  it('simple variable assignment and usage', () => {
    const results = calcLines(['x = 10', 'x + 5'])
    expect(parseFloat(results[1])).toBe(15)
  })
  it('variable with currency', () => {
    const results = calcLines(['v = $20', 'v times 7'])
    expect(parseFloat(results[1])).toBe(140)
  })
  it('variable with percentage', () => {
    const results = calcLines(['v = $20', 'v2 = 5%', 'v times 7 - v2'])
    expect(parseFloat(results[2])).toBe(133)
  })
  it('variable reassignment', () => {
    const results = calcLines(['x = 5', 'x = 10', 'x + 1'])
    expect(parseFloat(results[2])).toBe(11)
  })
  it('variable with expression', () => {
    const results = calcLines(['x = 2 + 3', 'x * 2'])
    expect(parseFloat(results[1])).toBe(10)
  })
  it('multiple variables in expression', () => {
    const results = calcLines(['a = 10', 'b = 20', 'a + b'])
    expect(parseFloat(results[2])).toBe(30)
  })
  it('variable names with underscores', () => {
    const results = calcLines(['my_var = 42', 'my_var + 8'])
    expect(parseFloat(results[1])).toBe(50)
  })
  it('variable names with numbers', () => {
    const results = calcLines(['v2 = 100', 'v2 / 4'])
    expect(parseFloat(results[1])).toBe(25)
  })
})

describe('Previous Result (prev)', () => {
  it('prev references previous line result', () => {
    const results = calcLines(['20 + 56', 'prev - 5'])
    expect(parseFloat(results[1])).toBe(71)
  })
  it('prev with percentage: prev - 5%', () => {
    const results = calcLines(['100', 'prev - 5%'])
    expect(parseFloat(results[1])).toBe(95)
  })
  it('prev in labeled context', () => {
    const results = calcLines(['Cost: $20', 'Discounted: prev - 10%'])
    expect(parseFloat(results[1])).toBeCloseTo(18, 0)
  })
})

describe('Percentages', () => {
  it('X% of Y: 20% of $10 = 2', () => { expect(calcNum('20% of 10')).toBeCloseTo(2, 5) })
  it('X% on Y (add percentage): 5% on $30 = 31.5', () => { expect(calcNum('5% on 30')).toBeCloseTo(31.5, 5) })
  it('X% off Y (subtract percentage): 6% off 40 = 37.6', () => { expect(calcNum('6% off 40')).toBeCloseTo(37.6, 5) })
  it('X + Y%: 100 + 20% = 120', () => { expect(calcNum('100 + 20%')).toBe(120) })
  it('X - Y%: 100 - 15% = 85', () => { expect(calcNum('100 - 15%')).toBe(85) })
  it('X * Y%: 100 * 5% = 5', () => { expect(calcNum('100 * 5%')).toBe(5) })
  it('X / Y%: 100 / 5% = 2000', () => { expect(calcNum('100 / 5%')).toBe(2000) })
  it('$50 as a % of $100 = 50%', () => { expect(calc('50 as a % of 100')).toMatch(/50/) })
  it('$70 as a % on $20 = 250%', () => { expect(calc('70 as a % on 20')).toMatch(/250/) })
  it('$20 as a % off $70 ≈ 71.43%', () => { expect(parseFloat(calc('20 as a % off 70'))).toBeCloseTo(71.43, 1) })
  it('5% of what is 6 = 120', () => { expect(parseFloat(calc('5% of what is 6'))).toBeCloseTo(120, 0) })
  it('5% on what is 6 ≈ 5.71', () => { expect(parseFloat(calc('5% on what is 6'))).toBeCloseTo(5.714, 2) })
  it('5% off what is 6 ≈ 6.316', () => { expect(parseFloat(calc('5% off what is 6'))).toBeCloseTo(6.316, 2) })
})

describe('Exponent Precedence with Percentages', () => {
  it('percentage variable ^ exponent binds before *', () => {
    const results = calcLines(['rate = 110%', 'rate ^ 2'])
    expect(parseFloat(results[1])).toBeCloseTo(1.21, 5)
  })
  it('value * percentage ^ exponent respects precedence', () => {
    const results = calcLines(['rate = 110%', 'base = 100', 'base * rate ^ 2'])
    expect(parseFloat(results[2])).toBeCloseTo(121, 1)
  })
  it('compound interest without parentheses', () => {
    const results = calcLines(['interest = 110%', 'starting = 1000', 'years = 3', 'starting * interest ^ years'])
    expect(parseFloat(results[3])).toBeCloseTo(1331, 0)
  })
  it('compound interest with parentheses gives same result', () => {
    const results = calcLines(['interest = 110%', 'starting = 1000', 'years = 3', 'starting * (interest ^ years)'])
    expect(parseFloat(results[3])).toBeCloseTo(1331, 0)
  })
  it('addition with percentage ^ exponent', () => {
    const results = calcLines(['rate = 50%', '10 + rate ^ 2'])
    expect(parseFloat(results[1])).toBeCloseTo(10.25, 5)
  })
  it('subtraction with percentage ^ exponent', () => {
    const results = calcLines(['rate = 50%', '10 - rate ^ 2'])
    expect(parseFloat(results[1])).toBeCloseTo(9.75, 5)
  })
  it('division with percentage ^ exponent', () => {
    const results = calcLines(['rate = 200%', '8 / rate ^ 3'])
    expect(parseFloat(results[1])).toBe(1)
  })
  it('percentage * and + without ^ still works', () => {
    expect(calcNum('100 * 50%')).toBe(50)
    expect(calcNum('100 + 20%')).toBe(120)
    expect(calcNum('100 - 10%')).toBe(90)
  })
})


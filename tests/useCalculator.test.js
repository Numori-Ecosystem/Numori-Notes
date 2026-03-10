/**
 * Comprehensive test suite for useCalculator
 *
 * Features covered:
 * 1.  Basic arithmetic (+ - * / ^ mod)
 * 2.  Word operators (plus, minus, times, divide, etc.)
 * 3.  Parentheses & implicit multiplication: 6 (3) = 18
 * 4.  Number formats: binary (0b), octal (0o), hexadecimal (0x)
 * 5.  Scientific notation output ("in sci" / "in scientific")
 * 6.  Scales: k/thousand, M/million, billion
 * 7.  Constants: pi, e, tau, phi
 * 8.  Variables & assignment
 * 9.  Previous result (prev)
 * 10. Percentages (all 9 percentage operations)
 * 11. Functions: sqrt, cbrt, abs, log, ln, fact, round, ceil, floor
 * 12. Trigonometry: sin, cos, tan (radians & degrees)
 * 13. Inverse trig: arcsin, arccos, arctan
 * 14. Hyperbolic: sinh, cosh, tanh
 * 15. N-th root: root N (X)
 * 16. Log with base: log N (X)
 * 17. Unit conversion (length, weight, volume, area, speed, data, time, temperature)
 * 18. CSS units (px, pt, em, rem, ppi)
 * 19. Currency conversion
 * 20. Date & time (now, today, yesterday, tomorrow, next/last week/month/year)
 * 21. Date arithmetic (today + 3 days, etc.)
 * 22. Duration calculations
 * 23. fromunix() function
 * 24. Sum & total operators
 * 25. Average & avg operators
 * 26. Formatting: headers (#), comments (//), labels (Label:)
 * 27. Inline comments with double quotes
 * 28. Bitwise operations (&, |, xor, <<, >>)
 * 29. SI prefixes (short & long form)
 * 30. Compound unit expressions (1 meter 20 cm)
 * 31. Square/cubic prefix for area/volume (sq cm, cubic inches, cu m)
 * 32. Angular units (degrees, radians conversion)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Vue's ref for the composable
vi.stubGlobal('ref', (val) => ({ value: val }))

// Import after mocking
const { useCalculator } = await import('../composables/useCalculator.js')

// Helper: evaluate a single expression and return the result string
function calc(expression) {
  const { evaluateLines } = useCalculator()
  const results = evaluateLines([expression])
  return results[0].result
}

// Helper: evaluate multiple lines and return all result strings
function calcLines(lines) {
  const { evaluateLines } = useCalculator()
  const results = evaluateLines(lines)
  return results.map(r => r.result)
}

// Helper: evaluate and return numeric value
function calcNum(expression) {
  const result = calc(expression)
  if (result === null) return null
  return parseFloat(result)
}

// Helper: evaluate multiple lines and return the last result as number
function calcLinesLastNum(lines) {
  const results = calcLines(lines)
  const last = results[results.length - 1]
  if (last === null) return null
  return parseFloat(last)
}


// ============================================================
// 1. BASIC ARITHMETIC
// ============================================================
describe('Basic Arithmetic', () => {
  it('addition', () => {
    expect(calcNum('2 + 3')).toBe(5)
  })

  it('subtraction', () => {
    expect(calcNum('10 - 4')).toBe(6)
  })

  it('multiplication', () => {
    expect(calcNum('6 * 7')).toBe(42)
  })

  it('division', () => {
    expect(calcNum('20 / 4')).toBe(5)
  })

  it('exponentiation', () => {
    expect(calcNum('2 ^ 10')).toBe(1024)
  })

  it('modulo', () => {
    expect(calcNum('17 mod 5')).toBe(2)
  })

  it('negative numbers', () => {
    expect(calcNum('-5 + 3')).toBe(-2)
  })

  it('decimal numbers', () => {
    expect(calcNum('3.14 * 2')).toBeCloseTo(6.28, 2)
  })

  it('order of operations', () => {
    expect(calcNum('2 + 3 * 4')).toBe(14)
  })

  it('parentheses', () => {
    expect(calcNum('(2 + 3) * 4')).toBe(20)
  })

  it('nested parentheses', () => {
    expect(calcNum('((2 + 3) * (4 - 1))')).toBe(15)
  })
})

// ============================================================
// 2. WORD OPERATORS
// ============================================================
describe('Word Operators', () => {
  it('plus', () => {
    expect(calcNum('5 plus 3')).toBe(8)
  })

  it('and (addition)', () => {
    expect(calcNum('5 and 3')).toBe(8)
  })

  it('with (addition)', () => {
    expect(calcNum('5 with 3')).toBe(8)
  })

  it('minus', () => {
    expect(calcNum('10 minus 3')).toBe(7)
  })

  it('subtract', () => {
    expect(calcNum('10 subtract 3')).toBe(7)
  })

  it('without', () => {
    expect(calcNum('10 without 3')).toBe(7)
  })

  it('times', () => {
    expect(calcNum('8 times 9')).toBe(72)
  })

  it('multiplied by', () => {
    expect(calcNum('8 multiplied by 9')).toBe(72)
  })

  it('mul', () => {
    expect(calcNum('8 mul 9')).toBe(72)
  })

  it('divide', () => {
    expect(calcNum('20 divide 4')).toBe(5)
  })

  it('divide by', () => {
    expect(calcNum('20 divide by 4')).toBe(5)
  })
})

// ============================================================
// 3. IMPLICIT MULTIPLICATION
// ============================================================
describe('Implicit Multiplication', () => {
  it('number followed by parenthesized expression: 6 (3) = 18', () => {
    expect(calcNum('6 (3)')).toBe(18)
  })

  it('parenthesized expressions adjacent: (2)(3) = 6', () => {
    expect(calcNum('(2)(3)')).toBe(6)
  })

  it('compound expression: 1 meter 20 cm should equal 120 cm', () => {
    // 1 meter 20 cm = 120 cm
    const result = calc('1 meter 20 cm in cm')
    expect(parseFloat(result)).toBeCloseTo(120, 0)
  })
})

// ============================================================
// 4. NUMBER FORMATS (binary, octal, hexadecimal)
// ============================================================
describe('Number Formats', () => {
  it('binary: 0b110111011', () => {
    expect(calcNum('0b110111011')).toBe(443)
  })

  it('octal: 0o1435343', () => {
    expect(calcNum('0o1435343')).toBe(0o1435343)
  })

  it('hexadecimal: 0xFF', () => {
    expect(calcNum('0xFF')).toBe(255)
  })

  it('hex arithmetic: 0xFF + 1', () => {
    expect(calcNum('0xFF + 1')).toBe(256)
  })

  it('binary arithmetic: 0b1010 + 0b0101', () => {
    expect(calcNum('0b1010 + 0b0101')).toBe(15)
  })

  it('convert to hex: 255 in hex', () => {
    expect(calc('255 in hex')).toMatch(/[Ff][Ff]|ff|FF/)
  })

  it('convert to binary: 10 in bin', () => {
    expect(calc('10 in bin')).toMatch(/1010/)
  })

  it('convert to octal: 8 in oct', () => {
    expect(calc('8 in oct')).toMatch(/10/)
  })

  it('cross-base conversion: 0o1435343 in hex', () => {
    const result = calc('0o1435343 in hex')
    expect(result).toBeTruthy()
  })
})

// ============================================================
// 5. SCIENTIFIC NOTATION OUTPUT
// ============================================================
describe('Scientific Notation', () => {
  it('number in sci', () => {
    const result = calc('5300 in sci')
    expect(result).toMatch(/5\.3.*10|5\.3e/)
  })

  it('number in scientific', () => {
    const result = calc('5300 in scientific')
    expect(result).toMatch(/5\.3.*10|5\.3e/)
  })
})

// ============================================================
// 6. SCALES (k/thousand, M/million, billion)
// ============================================================
describe('Scales', () => {
  it('k scale: 5k = 5000', () => {
    expect(calcNum('5k')).toBe(5000)
  })

  it('thousand scale: 5 thousand = 5000', () => {
    expect(calcNum('5 thousand')).toBe(5000)
  })

  it('M scale: 2M = 2000000', () => {
    expect(calcNum('2M')).toBe(2000000)
  })

  it('million scale: 2 million = 2000000', () => {
    expect(calcNum('2 million')).toBe(2000000)
  })

  it('billion scale: 1 billion = 1000000000', () => {
    expect(calcNum('1 billion')).toBe(1000000000)
  })

  it('scale arithmetic: 2k + 500', () => {
    expect(calcNum('2k + 500')).toBe(2500)
  })

  it('scale arithmetic: 1.5M - 500k', () => {
    expect(calcNum('1.5M - 500k')).toBe(1000000)
  })
})


// ============================================================
// 7. CONSTANTS
// ============================================================
describe('Constants', () => {
  it('pi', () => {
    expect(calcNum('pi')).toBeCloseTo(Math.PI, 5)
  })

  it('e', () => {
    expect(calcNum('e')).toBeCloseTo(Math.E, 5)
  })

  it('tau = 2*pi', () => {
    expect(calcNum('tau')).toBeCloseTo(Math.PI * 2, 5)
  })

  it('phi (golden ratio)', () => {
    expect(calcNum('phi')).toBeCloseTo((1 + Math.sqrt(5)) / 2, 5)
  })

  it('pi * 2', () => {
    expect(calcNum('pi * 2')).toBeCloseTo(Math.PI * 2, 5)
  })

  it('e ^ 2', () => {
    expect(calcNum('e ^ 2')).toBeCloseTo(Math.E ** 2, 5)
  })
})

// ============================================================
// 8. VARIABLES & ASSIGNMENT
// ============================================================
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
    // v * 7 = 140, then 140 - 5% of 140 = 140 - 7 = 133
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

// ============================================================
// 9. PREVIOUS RESULT (prev)
// ============================================================
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

// ============================================================
// 10. PERCENTAGES (all 9 operations)
// ============================================================
describe('Percentages', () => {
  // Basic percentage operations
  it('X% of Y: 20% of $10 = 2', () => {
    expect(calcNum('20% of 10')).toBeCloseTo(2, 5)
  })

  it('X% on Y (add percentage): 5% on $30 = 31.5', () => {
    expect(calcNum('5% on 30')).toBeCloseTo(31.5, 5)
  })

  it('X% off Y (subtract percentage): 6% off 40 = 37.6', () => {
    expect(calcNum('6% off 40')).toBeCloseTo(37.6, 5)
  })

  // Contextual percentage with operators
  it('X + Y%: 100 + 20% = 120', () => {
    expect(calcNum('100 + 20%')).toBe(120)
  })

  it('X - Y%: 100 - 15% = 85', () => {
    expect(calcNum('100 - 15%')).toBe(85)
  })

  it('X * Y%: 100 * 5% = 5', () => {
    expect(calcNum('100 * 5%')).toBe(5)
  })

  it('X / Y%: 100 / 5% = 2000', () => {
    expect(calcNum('100 / 5%')).toBe(2000)
  })

  // Advanced percentage operations
  it('$50 as a % of $100 = 50%', () => {
    const result = calc('50 as a % of 100')
    expect(result).toMatch(/50/)
  })

  it('$70 as a % on $20 = 250%', () => {
    // (70 - 20) / 20 * 100 = 250%
    const result = calc('70 as a % on 20')
    expect(result).toMatch(/250/)
  })

  it('$20 as a % off $70 ≈ 71.43%', () => {
    // (70 - 20) / 70 * 100 ≈ 71.43%
    const result = calc('20 as a % off 70')
    expect(parseFloat(result)).toBeCloseTo(71.43, 1)
  })

  it('5% of what is 6 = 120', () => {
    // 6 / (5/100) = 120
    const result = calc('5% of what is 6')
    expect(parseFloat(result)).toBeCloseTo(120, 0)
  })

  it('5% on what is 6 ≈ 5.71', () => {
    // x + 5% of x = 6 → x * 1.05 = 6 → x ≈ 5.714
    const result = calc('5% on what is 6')
    expect(parseFloat(result)).toBeCloseTo(5.714, 2)
  })

  it('5% off what is 6 ≈ 6.316', () => {
    // x - 5% of x = 6 → x * 0.95 = 6 → x ≈ 6.316
    const result = calc('5% off what is 6')
    expect(parseFloat(result)).toBeCloseTo(6.316, 2)
  })
})

// ============================================================
// 11. MATH FUNCTIONS
// ============================================================
describe('Math Functions', () => {
  it('sqrt(16) = 4', () => {
    expect(calcNum('sqrt(16)')).toBe(4)
  })

  it('cbrt(8) = 2', () => {
    expect(calcNum('cbrt(8)')).toBe(2)
  })

  it('abs(-4) = 4', () => {
    expect(calcNum('abs(-4)')).toBe(4)
  })

  it('log(100) = 2 (base 10)', () => {
    expect(calcNum('log(100)')).toBeCloseTo(2, 5)
  })

  it('ln(e) = 1', () => {
    expect(calcNum('ln(2.718281828459045)')).toBeCloseTo(1, 5)
  })

  it('fact(5) = 120', () => {
    expect(calcNum('fact(5)')).toBe(120)
  })

  it('round(3.45) = 3', () => {
    expect(calcNum('round(3.45)')).toBe(3)
  })

  it('round(3.55) = 4', () => {
    expect(calcNum('round(3.55)')).toBe(4)
  })

  it('ceil(3.76) = 4', () => {
    expect(calcNum('ceil(3.76)')).toBe(4)
  })

  it('floor(2.56) = 2', () => {
    expect(calcNum('floor(2.56)')).toBe(2)
  })

  // N-th root: root N (X)
  it('root 2 (8) ≈ 2.83 (square root of 8)', () => {
    expect(calcNum('root 2 (8)')).toBeCloseTo(Math.sqrt(8), 2)
  })

  it('root 3 (27) = 3 (cube root)', () => {
    expect(calcNum('root 3 (27)')).toBeCloseTo(3, 5)
  })

  // Log with base: log N (X)
  it('log 2 (10) = log base 2 of 10', () => {
    expect(calcNum('log 2 (10)')).toBeCloseTo(Math.log(10) / Math.log(2), 3)
  })

  it('log 10 (1000) = 3', () => {
    expect(calcNum('log 10 (1000)')).toBeCloseTo(3, 5)
  })
})

// ============================================================
// 12. TRIGONOMETRY
// ============================================================
describe('Trigonometry', () => {
  it('sin(0) = 0', () => {
    expect(calcNum('sin(0)')).toBeCloseTo(0, 5)
  })

  it('cos(0) = 1', () => {
    expect(calcNum('cos(0)')).toBeCloseTo(1, 5)
  })

  it('tan(0) = 0', () => {
    expect(calcNum('tan(0)')).toBeCloseTo(0, 5)
  })

  it('sin(45°) ≈ 0.7071 (degrees)', () => {
    expect(calcNum('sin(45°)')).toBeCloseTo(Math.sin(45 * Math.PI / 180), 3)
  })

  it('cos(60°) = 0.5 (degrees)', () => {
    expect(calcNum('cos(60°)')).toBeCloseTo(0.5, 3)
  })

  it('tan(45°) ≈ 1 (degrees)', () => {
    expect(calcNum('tan(45°)')).toBeCloseTo(1, 3)
  })

  it('sin(pi/2) = 1 (radians)', () => {
    expect(calcNum(`sin(${Math.PI / 2})`)).toBeCloseTo(1, 5)
  })
})

// ============================================================
// 13. INVERSE TRIGONOMETRY
// ============================================================
describe('Inverse Trigonometry', () => {
  it('arcsin(1) = pi/2', () => {
    expect(calcNum('arcsin(1)')).toBeCloseTo(Math.PI / 2, 3)
  })

  it('arccos(0) = pi/2', () => {
    expect(calcNum('arccos(0)')).toBeCloseTo(Math.PI / 2, 3)
  })

  it('arctan(1) = pi/4', () => {
    expect(calcNum('arctan(1)')).toBeCloseTo(Math.PI / 4, 3)
  })

  it('arcsin(0.5) = pi/6', () => {
    expect(calcNum('arcsin(0.5)')).toBeCloseTo(Math.PI / 6, 3)
  })
})

// ============================================================
// 14. HYPERBOLIC FUNCTIONS
// ============================================================
describe('Hyperbolic Functions', () => {
  it('sinh(0) = 0', () => {
    expect(calcNum('sinh(0)')).toBeCloseTo(0, 5)
  })

  it('sinh(1) ≈ 1.1752', () => {
    expect(calcNum('sinh(1)')).toBeCloseTo(Math.sinh(1), 3)
  })

  it('cosh(0) = 1', () => {
    expect(calcNum('cosh(0)')).toBeCloseTo(1, 5)
  })

  it('cosh(1) ≈ 1.5431', () => {
    expect(calcNum('cosh(1)')).toBeCloseTo(Math.cosh(1), 3)
  })

  it('tanh(0) = 0', () => {
    expect(calcNum('tanh(0)')).toBeCloseTo(0, 5)
  })

  it('tanh(1) ≈ 0.7616', () => {
    expect(calcNum('tanh(1)')).toBeCloseTo(Math.tanh(1), 3)
  })
})


// ============================================================
// 15. UNIT CONVERSION — LENGTH
// ============================================================
describe('Unit Conversion — Length', () => {
  it('1 km in m = 1000', () => {
    expect(calcNum('1 km in m')).toBeCloseTo(1000, 0)
  })

  it('1 mile in km ≈ 1.609', () => {
    expect(calcNum('1 mile in km')).toBeCloseTo(1.609, 2)
  })

  it('1 foot in cm ≈ 30.48', () => {
    expect(calcNum('1 foot in cm')).toBeCloseTo(30.48, 1)
  })

  it('1 inch in cm ≈ 2.54', () => {
    expect(calcNum('1 inch in cm')).toBeCloseTo(2.54, 2)
  })

  it('1 yard in m ≈ 0.9144', () => {
    expect(calcNum('1 yard in m')).toBeCloseTo(0.9144, 3)
  })

  it('100 cm in m = 1', () => {
    expect(calcNum('100 cm in m')).toBeCloseTo(1, 5)
  })

  it('5280 feet in miles = 1', () => {
    expect(calcNum('5280 feet in miles')).toBeCloseTo(1, 2)
  })

  it('arithmetic with units: 1 km + 500 m in m = 1500', () => {
    expect(calcNum('1 km + 500 m in m')).toBeCloseTo(1500, 0)
  })
})

// ============================================================
// 16. UNIT CONVERSION — WEIGHT
// ============================================================
describe('Unit Conversion — Weight', () => {
  it('1 kg in lb ≈ 2.205', () => {
    expect(calcNum('1 kg in lb')).toBeCloseTo(2.205, 2)
  })

  it('1 lb in kg ≈ 0.4536', () => {
    expect(calcNum('1 lb in kg')).toBeCloseTo(0.4536, 3)
  })

  it('1 oz in g ≈ 28.35', () => {
    expect(calcNum('1 oz in g')).toBeCloseTo(28.35, 1)
  })

  it('1 tonne in kg = 1000', () => {
    expect(calcNum('1 tonne in kg')).toBeCloseTo(1000, 0)
  })

  it('1 stone in lb ≈ 14', () => {
    expect(calcNum('1 stone in lb')).toBeCloseTo(14, 0)
  })
})

// ============================================================
// 17. UNIT CONVERSION — VOLUME
// ============================================================
describe('Unit Conversion — Volume', () => {
  it('1 gallon in liters ≈ 3.785', () => {
    expect(calcNum('1 gallon in liters')).toBeCloseTo(3.785, 2)
  })

  it('1 pint in ml ≈ 473', () => {
    expect(calcNum('1 pint in ml')).toBeCloseTo(473, 0)
  })

  it('1 quart in liters ≈ 0.946', () => {
    expect(calcNum('1 quart in liters')).toBeCloseTo(0.946, 2)
  })

  it('1 cup in ml ≈ 237', () => {
    expect(calcNum('1 cup in ml')).toBeCloseTo(237, 0)
  })

  it('1 tablespoon in ml ≈ 14.79', () => {
    expect(calcNum('1 tablespoon in ml')).toBeCloseTo(14.79, 1)
  })

  it('1 teaspoon in ml ≈ 4.93', () => {
    expect(calcNum('1 teaspoon in ml')).toBeCloseTo(4.93, 1)
  })

  // Cubic prefix
  it('cubic inches: 20 cu cm in ml', () => {
    // 1 cu cm = 1 ml
    expect(calcNum('20 cu cm in ml')).toBeCloseTo(20, 0)
  })

  it('cubic meters: 1 cbm in liters = 1000', () => {
    expect(calcNum('1 cbm in liters')).toBeCloseTo(1000, 0)
  })
})

// ============================================================
// 18. UNIT CONVERSION — TEMPERATURE
// ============================================================
describe('Unit Conversion — Temperature', () => {
  it('0 celsius in fahrenheit = 32', () => {
    expect(calcNum('0 celsius in fahrenheit')).toBeCloseTo(32, 1)
  })

  it('100 celsius in fahrenheit = 212', () => {
    expect(calcNum('100 celsius in fahrenheit')).toBeCloseTo(212, 1)
  })

  it('32 fahrenheit in celsius = 0', () => {
    expect(calcNum('32 fahrenheit in celsius')).toBeCloseTo(0, 1)
  })

  it('0 celsius in kelvin = 273.15', () => {
    expect(calcNum('0 celsius in kelvin')).toBeCloseTo(273.15, 1)
  })

  it('0 kelvin in celsius = -273.15', () => {
    expect(calcNum('0 kelvin in celsius')).toBeCloseTo(-273.15, 1)
  })

  it('180 celsius in fahrenheit = 356', () => {
    expect(calcNum('180 celsius in fahrenheit')).toBeCloseTo(356, 1)
  })

  it('350 fahrenheit in celsius ≈ 176.67', () => {
    expect(calcNum('350 fahrenheit in celsius')).toBeCloseTo(176.67, 0)
  })
})

// ============================================================
// 19. UNIT CONVERSION — AREA
// ============================================================
describe('Unit Conversion — Area', () => {
  it('1 acre in sqm ≈ 4046.86', () => {
    expect(calcNum('1 acre in sqm')).toBeCloseTo(4046.86, 0)
  })

  it('1 hectare in acres ≈ 2.471', () => {
    expect(calcNum('1 hectare in acres')).toBeCloseTo(2.471, 2)
  })

  it('1 sqft in sqm ≈ 0.0929', () => {
    expect(calcNum('1 sqft in sqm')).toBeCloseTo(0.0929, 3)
  })

  // Square prefix: "20 sq cm", "30 square inches"
  it('20 sq cm in sqm', () => {
    expect(calcNum('20 sq cm in sqm')).toBeCloseTo(0.002, 3)
  })

  it('30 square inches in sqft', () => {
    const result = calcNum('30 square inches in sqft')
    expect(result).toBeCloseTo(30 * 0.00064516 / 0.092903, 2)
  })
})

// ============================================================
// 20. UNIT CONVERSION — SPEED
// ============================================================
describe('Unit Conversion — Speed', () => {
  it('100 kph in mph ≈ 62.14', () => {
    expect(calcNum('100 kph in mph')).toBeCloseTo(62.14, 1)
  })

  it('60 mph in kph ≈ 96.56', () => {
    expect(calcNum('60 mph in kph')).toBeCloseTo(96.56, 1)
  })

  it('1 knot in kph ≈ 1.852', () => {
    expect(calcNum('1 knot in kph')).toBeCloseTo(1.852, 2)
  })
})

// ============================================================
// 21. UNIT CONVERSION — DATA
// ============================================================
describe('Unit Conversion — Data', () => {
  it('1 GB in MB = 1000', () => {
    expect(calcNum('1 GB in MB')).toBeCloseTo(1000, 0)
  })

  it('1 TB in GB = 1000', () => {
    expect(calcNum('1 TB in GB')).toBeCloseTo(1000, 0)
  })

  it('1 GiB in MiB = 1024', () => {
    expect(calcNum('1 GiB in MiB')).toBeCloseTo(1024, 0)
  })

  it('1 byte in bits = 8', () => {
    expect(calcNum('1 byte in bits')).toBeCloseTo(8, 0)
  })

  it('1 KB in bytes = 1000', () => {
    expect(calcNum('1 KB in bytes')).toBeCloseTo(1000, 0)
  })

  it('1 KiB in bytes = 1024', () => {
    expect(calcNum('1 KiB in bytes')).toBeCloseTo(1024, 0)
  })
})

// ============================================================
// 22. UNIT CONVERSION — TIME
// ============================================================
describe('Unit Conversion — Time', () => {
  it('1 hour in minutes = 60', () => {
    expect(calcNum('1 hour in minutes')).toBeCloseTo(60, 0)
  })

  it('1 day in hours = 24', () => {
    expect(calcNum('1 day in hours')).toBeCloseTo(24, 0)
  })

  it('1 week in days = 7', () => {
    expect(calcNum('1 week in days')).toBeCloseTo(7, 0)
  })

  it('1 year in days = 365', () => {
    expect(calcNum('1 year in days')).toBeCloseTo(365, 0)
  })

  it('round(1 month in days) = 30', () => {
    expect(calcNum('round(1 month in days)')).toBeCloseTo(30, 0)
  })
})

// ============================================================
// 23. CSS UNITS
// ============================================================
describe('CSS Units', () => {
  it('12 pt in px ≈ 16', () => {
    expect(calcNum('12 pt in px')).toBeCloseTo(16, 0)
  })

  it('1 em in px = 16 (default)', () => {
    expect(calcNum('1 em in px')).toBeCloseTo(16, 0)
  })

  it('1 rem in px = 16 (default)', () => {
    expect(calcNum('1 rem in px')).toBeCloseTo(16, 0)
  })

  it('custom em: em = 20px, then 1.2 em in px = 24', () => {
    const results = calcLines(['em = 20', '1.2 em in px'])
    // After setting em = 20px, 1.2 em should be 24px
    expect(parseFloat(results[1])).toBeCloseTo(24, 0)
  })

  it('1 inch in px = 96 (default ppi)', () => {
    expect(calcNum('1 inch in px')).toBeCloseTo(96, 0)
  })

  it('custom ppi: ppi = 326, 1 cm in px', () => {
    const results = calcLines(['ppi = 326', '1 cm in px'])
    // 1 cm = 0.3937 inches, at 326 ppi = 128.35 px
    expect(parseFloat(results[1])).toBeCloseTo(128.35, 0)
  })
})

// ============================================================
// 24. ANGULAR UNITS
// ============================================================
describe('Angular Units', () => {
  it('180 degrees in radians = pi', () => {
    expect(calcNum('180 degrees in radians')).toBeCloseTo(Math.PI, 3)
  })

  it('pi radians in degrees = 180', () => {
    const result = calcNum(`${Math.PI} radians in degrees`)
    expect(result).toBeCloseTo(180, 1)
  })

  it('90° in radians = pi/2', () => {
    expect(calcNum('90° in radians')).toBeCloseTo(Math.PI / 2, 3)
  })

  it('45 degrees in radians', () => {
    expect(calcNum('45 degrees in radians')).toBeCloseTo(Math.PI / 4, 3)
  })
})


// ============================================================
// 25. CURRENCY
// ============================================================
describe('Currency', () => {
  it('$30 returns value with USD', () => {
    const result = calc('$30')
    expect(result).toMatch(/30/)
  })

  it('€50 returns value with EUR', () => {
    const result = calc('€50')
    expect(result).toMatch(/50/)
  })

  it('£100 returns value with GBP', () => {
    const result = calc('£100')
    expect(result).toMatch(/100/)
  })

  it('$30 in EUR converts currency', () => {
    const result = calc('$30 in EUR')
    expect(result).toBeTruthy()
    expect(result).toMatch(/EUR/)
  })

  it('$30 in euro (common name)', () => {
    const result = calc('$30 in euro')
    expect(result).toBeTruthy()
  })

  it('currency arithmetic: $30 + €20 (mixed currencies)', () => {
    const result = calc('$30 + €20')
    expect(result).toBeTruthy()
  })

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
    // €1 in USD = 1/0.87 ≈ 1.149, plus $4 = ~5.149 USD, then back to EUR ≈ 4.48 EUR
    // The result should be in EUR (the variable's currency) and NOT simply 5
    expect(results[1]).toMatch(/EUR/)
    // The numeric value should NOT be 5 (that would mean no conversion happened)
    expect(parseFloat(results[1])).not.toBeCloseTo(5, 1)
  })

  it('variable with USD + EUR: a = $10, a + €5 should convert correctly', () => {
    const results = calcLines(['a = $10', 'a + €5'])
    // $10 + €5 (€5 in USD = 5/0.87 ≈ 5.747) = ~15.747 USD
    expect(results[1]).toMatch(/USD/)
    expect(parseFloat(results[1])).not.toBeCloseTo(15, 1)
  })

  it('variable with EUR currency used in conversion: a = €100, a in GBP', () => {
    const results = calcLines(['a = €100', 'a in GBP'])
    expect(results[1]).toMatch(/GBP/)
    // Should convert €100 to GBP, not treat as 100 USD to GBP
    // €100 → USD = 100/0.87 ≈ 114.94, → GBP = 114.94 * 0.75 ≈ 86.21
    const gbpValue = parseFloat(results[1])
    expect(gbpValue).toBeGreaterThan(80)
    expect(gbpValue).toBeLessThan(95)
  })

  it('two currency variables: a = €10, b = $10, a + b should convert', () => {
    const results = calcLines(['a = €10', 'b = $10', 'a + b'])
    // a is EUR, b is USD. Result should be in EUR (first variable's currency)
    // $10 in EUR = 10 * 0.87 = 8.7, so €10 + €8.7 = €18.7
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
    // €1 in USD = 1/0.87 ≈ 1.1494, $4 = 4 USD, total ≈ 5.1494 USD
    // 5.1494 USD in GBP = 5.1494 * 0.75 ≈ 3.862
    const gbpValue = parseFloat(results[1])
    expect(gbpValue).toBeGreaterThan(3.5)
    expect(gbpValue).toBeLessThan(4.5)
  })

  it('simple currency expression converted: $100 + €50 in GBP', () => {
    const results = calcLines(['$100 + €50 in GBP'])
    expect(results[0]).toMatch(/GBP/)
    // $100 = 100 USD, €50 in USD = 50/0.87 ≈ 57.47, total ≈ 157.47 USD
    // 157.47 * 0.75 ≈ 118.1 GBP
    const gbpValue = parseFloat(results[0])
    expect(gbpValue).toBeGreaterThan(110)
    expect(gbpValue).toBeLessThan(130)
  })

  it('currency variable expression converted: a = €100, a in GBP (no parens)', () => {
    // This already worked, but verify it still does
    const results = calcLines(['a = €100', 'a in GBP'])
    expect(results[1]).toMatch(/GBP/)
    const gbpValue = parseFloat(results[1])
    expect(gbpValue).toBeGreaterThan(80)
    expect(gbpValue).toBeLessThan(95)
  })
})

// ============================================================
// 26. DATE & TIME
// ============================================================
describe('Date & Time', () => {
  it('now returns current datetime', () => {
    const result = calc('now')
    expect(result).toBeTruthy()
  })

  it('today returns current date', () => {
    const result = calc('today')
    expect(result).toBeTruthy()
  })

  it('yesterday returns previous date', () => {
    const result = calc('yesterday')
    expect(result).toBeTruthy()
  })

  it('tomorrow returns next date', () => {
    const result = calc('tomorrow')
    expect(result).toBeTruthy()
  })

  it('next week', () => {
    const result = calc('next week')
    expect(result).toBeTruthy()
  })

  it('last week', () => {
    const result = calc('last week')
    expect(result).toBeTruthy()
  })

  it('next month', () => {
    const result = calc('next month')
    expect(result).toBeTruthy()
  })

  it('last month', () => {
    const result = calc('last month')
    expect(result).toBeTruthy()
  })

  it('next year', () => {
    const result = calc('next year')
    expect(result).toBeTruthy()
  })

  it('last year', () => {
    const result = calc('last year')
    expect(result).toBeTruthy()
  })

  it('today + 3 days returns a date', () => {
    const result = calc('today + 3 days')
    expect(result).toBeTruthy()
  })

  it('today - 1 week returns a date', () => {
    const result = calc('today - 1 week')
    expect(result).toBeTruthy()
  })

  it('today + 2 months returns a date', () => {
    const result = calc('today + 2 months')
    expect(result).toBeTruthy()
  })
})

// ============================================================
// 27. DURATION CALCULATIONS
// ============================================================
describe('Duration Calculations', () => {
  it('2 hours + 30 minutes', () => {
    const result = calc('2 hours + 30 minutes')
    expect(result).toBeTruthy()
  })

  it('1 day in hours = 24', () => {
    // This is also a unit conversion test
    expect(calcNum('1 day in hours')).toBeCloseTo(24, 0)
  })
})

// ============================================================
// 28. FROMUNIX
// ============================================================
describe('fromunix()', () => {
  it('fromunix(1446587186) returns a date', () => {
    const result = calc('fromunix(1446587186)')
    expect(result).toBeTruthy()
    // Should be around Nov 3, 2015
    expect(result).toMatch(/2015/)
  })

  it('fromunix(0) returns epoch', () => {
    const result = calc('fromunix(0)')
    expect(result).toBeTruthy()
    expect(result).toMatch(/1970/)
  })
})

// ============================================================
// 29. SUM & TOTAL
// ============================================================
describe('Sum & Total', () => {
  it('sum of lines above', () => {
    const results = calcLines(['10', '15', '25', 'sum'])
    expect(parseFloat(results[3])).toBe(50)
  })

  it('total is alias for sum', () => {
    const results = calcLines(['10', '20', 'total'])
    expect(parseFloat(results[2])).toBe(30)
  })

  it('sum stops at empty line', () => {
    const results = calcLines(['5', '10', '', '20', '30', 'sum'])
    expect(parseFloat(results[5])).toBe(50) // Only 20 + 30
  })

  it('sum with operations: sum - 10%', () => {
    const results = calcLines(['100', '200', 'sum - 10%'])
    expect(parseFloat(results[2])).toBeCloseTo(270, 0) // 300 - 10% = 270
  })

  it('sum in currency: sum in EUR', () => {
    const results = calcLines(['$100', '$200', 'sum in EUR'])
    expect(results[2]).toMatch(/EUR/)
  })

  it('sum with labels', () => {
    const results = calcLines(['Item 1: 10', 'Item 2: 20', 'Total: sum'])
    expect(parseFloat(results[2])).toBe(30)
  })
})

// ============================================================
// 30. AVERAGE
// ============================================================
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
    expect(parseFloat(results[4])).toBe(15) // Only (10 + 20) / 2
  })

  it('average with operations: average + 5', () => {
    const results = calcLines(['10', '20', 'average + 5'])
    expect(parseFloat(results[2])).toBe(20) // avg=15, 15+5=20
  })
})

// ============================================================
// 31. FORMATTING (headers, comments, labels, inline comments)
// ============================================================
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
    // Double-quoted text is stripped as inline comments
    const result = calc('$275 for the "Model 227"')
    expect(parseFloat(result)).toBeCloseTo(275, 0)
  })
})

// ============================================================
// 32. BITWISE OPERATIONS
// ============================================================
describe('Bitwise Operations', () => {
  it('bitwise AND: 12 & 10 = 8', () => {
    expect(calcNum('12 & 10')).toBe(8)
  })

  it('bitwise OR: 12 | 10 = 14', () => {
    expect(calcNum('12 | 10')).toBe(14)
  })

  it('bitwise XOR: 12 xor 10 = 6', () => {
    expect(calcNum('12 xor 10')).toBe(6)
  })

  it('left shift: 1 << 4 = 16', () => {
    expect(calcNum('1 << 4')).toBe(16)
  })

  it('right shift: 16 >> 2 = 4', () => {
    expect(calcNum('16 >> 2')).toBe(4)
  })
})

// ============================================================
// 33. SI PREFIXES
// ============================================================
describe('SI Prefixes', () => {
  it('1 km = 1000 m (kilo)', () => {
    expect(calcNum('1 km in m')).toBeCloseTo(1000, 0)
  })

  it('1 mg = 0.001 g (milli)', () => {
    expect(calcNum('1 mg in g')).toBeCloseTo(0.001, 5)
  })

  it('1 MB = 1000000 bytes (mega)', () => {
    expect(calcNum('1 MB in bytes')).toBeCloseTo(1000000, 0)
  })

  it('1 GB = 1000 MB (giga)', () => {
    expect(calcNum('1 GB in MB')).toBeCloseTo(1000, 0)
  })

  // Long form SI prefixes
  it('1 kilogram in grams = 1000', () => {
    expect(calcNum('1 kilogram in grams')).toBeCloseTo(1000, 0)
  })

  it('1 millimeter in meters = 0.001', () => {
    expect(calcNum('1 millimeter in meters')).toBeCloseTo(0.001, 5)
  })
})

// ============================================================
// 34. TIMEZONE CONVERSION
// ============================================================
describe('Timezone Conversion', () => {
  it('PST time', () => {
    // Timezone-prefixed time
    const result = calc('PST time')
    // This may or may not be implemented yet
    expect(result).toBeTruthy()
  })

  it('time in Madrid', () => {
    const result = calc('time in Madrid')
    expect(result).toBeTruthy()
  })

  it('2:30 pm HKT in Berlin', () => {
    const result = calc('2:30 pm HKT in Berlin')
    expect(result).toBeTruthy()
  })
})

// ============================================================
// 35. EDGE CASES & INTEGRATION
// ============================================================
describe('Edge Cases', () => {
  it('empty line returns null', () => {
    expect(calc('')).toBeNull()
  })

  it('whitespace-only line returns null', () => {
    expect(calc('   ')).toBeNull()
  })

  it('very large number', () => {
    const result = calcNum('999999999 * 999999999')
    expect(result).toBeCloseTo(999999998000000001, -5)
  })

  it('very small number', () => {
    const result = calcNum('0.000001 * 0.000001')
    expect(result).toBeCloseTo(1e-12, 12)
  })

  it('division by zero returns no result (not crash)', () => {
    const result = calc('1 / 0')
    // Should either be null or Infinity, but not crash
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

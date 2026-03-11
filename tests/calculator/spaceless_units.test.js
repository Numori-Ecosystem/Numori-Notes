/**
 * Tests for unit expressions without spaces between number and unit.
 * e.g., "100km" should work the same as "100 km"
 */
import { describe, it, expect } from 'vitest'
import { calc, calcLines, calcNum } from './helpers'

describe('Spaceless Units — Length', () => {
  it('100km = 100 km', () => {
    const result = calc('100km')
    expect(result).toMatch(/100/)
    expect(result).toMatch(/km/)
  })

  it('5miles recognized', () => {
    const result = calc('5miles')
    expect(result).toBeTruthy()
    expect(result).toMatch(/5/)
  })

  it('100km in m = 100000', () => {
    expect(calcNum('100km in m')).toBeCloseTo(100000, 0)
  })

  it('1mile in km ≈ 1.609', () => {
    expect(calcNum('1mile in km')).toBeCloseTo(1.609, 2)
  })

  it('12inches in cm ≈ 30.48', () => {
    expect(calcNum('12inches in cm')).toBeCloseTo(30.48, 1)
  })

  it('3ft in m ≈ 0.9144', () => {
    expect(calcNum('3ft in m')).toBeCloseTo(0.9144, 3)
  })
})

describe('Spaceless Units — Weight', () => {
  it('5kg in lb', () => {
    expect(calcNum('5kg in lb')).toBeCloseTo(11.023, 1)
  })

  it('100lb in kg', () => {
    expect(calcNum('100lb in kg')).toBeCloseTo(45.359, 0)
  })

  it('500g in oz', () => {
    expect(calcNum('500g in oz')).toBeCloseTo(17.637, 0)
  })
})

describe('Spaceless Units — Volume', () => {
  it('2l in ml = 2000', () => {
    expect(calcNum('2l in ml')).toBeCloseTo(2000, 0)
  })

  it('500ml in l = 0.5', () => {
    expect(calcNum('500ml in l')).toBeCloseTo(0.5, 2)
  })
})

describe('Spaceless Units — Temperature', () => {
  it('100celsius in fahrenheit = 212', () => {
    expect(calcNum('100celsius in fahrenheit')).toBeCloseTo(212, 1)
  })

  it('32fahrenheit in celsius = 0', () => {
    expect(calcNum('32fahrenheit in celsius')).toBeCloseTo(0, 1)
  })
})

describe('Spaceless Units — Speed', () => {
  it('100kph in mph ≈ 62.14', () => {
    expect(calcNum('100kph in mph')).toBeCloseTo(62.14, 1)
  })

  it('60mph in kph ≈ 96.56', () => {
    expect(calcNum('60mph in kph')).toBeCloseTo(96.56, 1)
  })
})

describe('Spaceless Units — Data', () => {
  it('1GB in MB = 1000', () => {
    expect(calcNum('1GB in MB')).toBeCloseTo(1000, 0)
  })

  it('1TB in GB = 1000', () => {
    expect(calcNum('1TB in GB')).toBeCloseTo(1000, 0)
  })
})

describe('Spaceless Units — Fuel Economy', () => {
  it('30mpg in kpl', () => {
    expect(calcNum('30mpg in kpl')).toBeCloseTo(12.754, 1)
  })

  it('12kpl in mpg', () => {
    expect(calcNum('12kpl in mpg')).toBeCloseTo(28.25, 0)
  })
})

describe('Spaceless Units — Arithmetic', () => {
  it('100km + 500m in m = 100500', () => {
    expect(calcNum('100km + 500m in m')).toBeCloseTo(100500, 0)
  })

  it('1km + 500m in m = 1500', () => {
    expect(calcNum('1km + 500m in m')).toBeCloseTo(1500, 0)
  })
})

describe('Spaceless Units — Variable Assignment', () => {
  it('distance = 100km stores with unit', () => {
    const results = calcLines([
      'distance = 100km',
      'distance in miles',
    ])
    expect(parseFloat(results[1])).toBeCloseTo(62.137, 1)
  })

  it('mileage = 30mpg stores with unit', () => {
    const results = calcLines([
      'mileage = 30mpg',
      'mileage in kpl',
    ])
    expect(parseFloat(results[1])).toBeCloseTo(12.754, 1)
  })
})

describe('Spaceless Units — Mixed with spaces', () => {
  it('100km in miles (spaceless source, spaced target)', () => {
    expect(calcNum('100km in miles')).toBeCloseTo(62.137, 1)
  })

  it('100 km in miles (both spaced, still works)', () => {
    expect(calcNum('100 km in miles')).toBeCloseTo(62.137, 1)
  })
})

/**
 * Tests for fuel consumption / fuel economy units.
 *
 * Fuel economy units supported:
 *   - miles per gallon (mpg) — US gallon by default
 *   - miles per litre (mpl)
 *   - km per litre (kpl)
 *   - km per gallon (kpg)
 *   - litres per 100 km (l/100km)
 *   - UK variants: miles per uk gallon (mpg_uk), km per uk gallon (kpg_uk)
 *
 * Compound expressions:
 *   distance = 100 km
 *   mileage = 60 miles per gallon
 *   fuelconsumption = distance / mileage  → result in litres or gallons
 *   fuelconsumption = distance * rate      → where rate is l/100km style
 */
import { describe, it, expect } from 'vitest'
import { calc, calcLines, calcNum } from './helpers'

describe('Fuel Economy — Basic Unit Recognition', () => {
  it('60 mpg is recognized as a fuel economy value', () => {
    const result = calc('60 mpg')
    expect(result).toBeTruthy()
    expect(result).toMatch(/60/)
    expect(result).toMatch(/mpg/i)
  })

  it('15 kpl is recognized', () => {
    const result = calc('15 kpl')
    expect(result).toBeTruthy()
    expect(result).toMatch(/15/)
  })

  it('8 l/100km is recognized', () => {
    const result = calc('8 l/100km')
    expect(result).toBeTruthy()
    expect(result).toMatch(/8/)
  })

  it('35 miles per gallon is recognized', () => {
    const result = calc('35 miles per gallon')
    expect(result).toBeTruthy()
    expect(result).toMatch(/35/)
  })

  it('12 km per litre is recognized', () => {
    const result = calc('12 km per litre')
    expect(result).toBeTruthy()
    expect(result).toMatch(/12/)
  })

  it('40 miles per litre is recognized', () => {
    const result = calc('40 miles per litre')
    expect(result).toBeTruthy()
    expect(result).toMatch(/40/)
  })
})

describe('Fuel Economy — Conversions', () => {
  // mpg (US) to kpl: 1 mpg = 1 mile / 1 US gallon = 1.609344 km / 3.78541 L ≈ 0.42514 kpl
  it('1 mpg in kpl ≈ 0.4251', () => {
    expect(calcNum('1 mpg in kpl')).toBeCloseTo(0.4251, 2)
  })

  // kpl to mpg: inverse of above
  it('1 kpl in mpg ≈ 2.3522', () => {
    expect(calcNum('1 kpl in mpg')).toBeCloseTo(2.3522, 2)
  })

  // mpg to l/100km: 1 mpg (US) = 235.215 / mpg → 1 mpg = 235.215 l/100km
  it('30 mpg in l/100km ≈ 7.84', () => {
    expect(calcNum('30 mpg in l/100km')).toBeCloseTo(7.84, 1)
  })

  it('8 l/100km in mpg ≈ 29.40', () => {
    expect(calcNum('8 l/100km in mpg')).toBeCloseTo(29.40, 0)
  })

  // kpl to l/100km: l/100km = 100 / kpl
  it('12 kpl in l/100km ≈ 8.33', () => {
    expect(calcNum('12 kpl in l/100km')).toBeCloseTo(8.33, 1)
  })

  it('8 l/100km in kpl ≈ 12.5', () => {
    expect(calcNum('8 l/100km in kpl')).toBeCloseTo(12.5, 1)
  })

  // mpg to mpl: 1 mpg = 1 mile / 1 US gallon = 1 mile / 3.78541 L ≈ 0.26417 mpl
  it('30 mpg in mpl ≈ 7.925', () => {
    expect(calcNum('30 mpg in mpl')).toBeCloseTo(7.925, 1)
  })

  it('10 mpl in mpg ≈ 37.854', () => {
    expect(calcNum('10 mpl in mpg')).toBeCloseTo(37.854, 0)
  })

  // Long-form conversions
  it('30 miles per gallon in km per litre', () => {
    const result = calcNum('30 miles per gallon in km per litre')
    expect(result).toBeCloseTo(12.754, 1)
  })

  it('12 km per litre in miles per gallon', () => {
    const result = calcNum('12 km per litre in miles per gallon')
    expect(result).toBeCloseTo(28.25, 0)
  })
})

describe('Fuel Economy — UK Gallon Variants', () => {
  // UK gallon = 4.54609 L (vs US gallon = 3.78541 L)
  // 1 mpg_uk = 1 mile / 1 UK gallon = 1.609344 km / 4.54609 L ≈ 0.35400 kpl
  it('1 mpg_uk in kpl ≈ 0.354', () => {
    expect(calcNum('1 mpg_uk in kpl')).toBeCloseTo(0.354, 2)
  })

  it('30 mpg_uk in l/100km ≈ 9.42', () => {
    expect(calcNum('30 mpg_uk in l/100km')).toBeCloseTo(9.42, 1)
  })

  // mpg (US) to mpg_uk: US gallon is smaller, so MORE miles per UK gallon
  // 30 mpg_us * (4.54609/3.78541) ≈ 36.03 mpg_uk
  it('30 mpg in mpg_uk ≈ 36.03', () => {
    expect(calcNum('30 mpg in mpg_uk')).toBeCloseTo(36.03, 0)
  })

  it('30 mpg_uk in mpg ≈ 24.98', () => {
    expect(calcNum('30 mpg_uk in mpg')).toBeCloseTo(24.98, 0)
  })

  // Long-form UK
  it('30 miles per uk gallon in kpl', () => {
    expect(calcNum('30 miles per uk gallon in kpl')).toBeCloseTo(10.62, 1)
  })
})

describe('Fuel Economy — Variable Assignment and Arithmetic', () => {
  it('assign fuel economy to variable and use in conversion', () => {
    const results = calcLines([
      'efficiency = 30 mpg',
      '30 mpg in kpl',
    ])
    expect(results[1]).toBeTruthy()
    expect(parseFloat(results[1])).toBeCloseTo(12.754, 1)
  })

  it('distance / fuel economy = fuel volume', () => {
    // 100 miles / 30 mpg = 3.333 gallons
    const results = calcLines([
      'distance = 100 miles',
      'mileage = 30 mpg',
      'fuel = distance / mileage',
    ])
    expect(parseFloat(results[2])).toBeCloseTo(3.333, 1)
    expect(results[2]).toMatch(/gal/)
  })

  it('distance with km / kpl = litres', () => {
    // 200 km / 10 kpl = 20 litres
    const results = calcLines([
      'distance = 200 km',
      'efficiency = 10 kpl',
      'fuel = distance / efficiency',
    ])
    expect(parseFloat(results[2])).toBeCloseTo(20, 0)
    expect(results[2]).toMatch(/l/)
  })

  it('distance with km / mpl = litres (cross-unit)', () => {
    // 100 km / 60 mpl: convert 100 km to miles = 62.137, then 62.137 / 60 = 1.0356 litres
    const results = calcLines([
      'distance = 100 km',
      'mileage = 60 miles per litre',
      'fuelconsumption = distance / mileage',
    ])
    expect(parseFloat(results[2])).toBeCloseTo(1.036, 1)
    expect(results[2]).toMatch(/l/)
  })

  it('fuel economy variable used in conversion', () => {
    const results = calcLines([
      'mileage = 30 mpg',
      'mileage in kpl',
    ])
    expect(results[1]).toBeTruthy()
    expect(parseFloat(results[1])).toBeCloseTo(12.754, 1)
  })

  it('distance variable used in conversion', () => {
    const results = calcLines([
      'distance = 100 km',
      'distance in miles',
    ])
    expect(parseFloat(results[1])).toBeCloseTo(62.137, 1)
  })
})

describe('Fuel Economy — km per gallon', () => {
  // kpg (US gallon): 1 kpg = 1 km / 3.78541 L
  it('30 kpg in kpl ≈ 7.925', () => {
    expect(calcNum('30 kpg in kpl')).toBeCloseTo(7.925, 1)
  })

  it('10 kpl in kpg ≈ 37.854', () => {
    expect(calcNum('10 kpl in kpg')).toBeCloseTo(37.854, 0)
  })

  it('30 km per gallon in km per litre', () => {
    const result = calcNum('30 km per gallon in km per litre')
    expect(result).toBeCloseTo(7.925, 1)
  })
})

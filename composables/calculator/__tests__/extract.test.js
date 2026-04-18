import { describe, it, expect } from 'vitest'

import { extractTrailingNumber } from '../extract'

describe('extractTrailingNumber', () => {
  it('extracts number with currency suffix', () => {
    const result = extractTrailingNumber('Arwen 900 eur')
    expect(result).not.toBeNull()
    expect(result.value).toBe(900)
    expect(result.currency).toBe('EUR')
    expect(result.display).toContain('900')
    expect(result.display).toContain('EUR')
  })

  it('extracts number with different currency suffix', () => {
    const result = extractTrailingNumber('transporte Kaisa 2000 usd')
    expect(result).not.toBeNull()
    expect(result.value).toBe(2000)
    expect(result.currency).toBe('USD')
  })

  it('extracts plain number without currency', () => {
    const result = extractTrailingNumber('transporte Kaisa 2000')
    expect(result).not.toBeNull()
    expect(result.value).toBe(2000)
    expect(result.currency).toBeNull()
  })

  it('extracts decimal numbers', () => {
    const result = extractTrailingNumber('item price 49.99 eur')
    expect(result).not.toBeNull()
    expect(result.value).toBeCloseTo(49.99)
    expect(result.currency).toBe('EUR')
  })

  it('handles comma-separated numbers', () => {
    const result = extractTrailingNumber('big expense 1,500 eur')
    expect(result).not.toBeNull()
    expect(result.value).toBe(1500)
    expect(result.currency).toBe('EUR')
  })

  it('returns null for lines with no numbers', () => {
    expect(extractTrailingNumber('just some text')).toBeNull()
  })

  it('returns null for empty input', () => {
    expect(extractTrailingNumber('')).toBeNull()
  })

  it('handles currency word aliases like "euros"', () => {
    const result = extractTrailingNumber('rent 800 euros')
    expect(result).not.toBeNull()
    expect(result.value).toBe(800)
    expect(result.currency).toBe('EUR')
  })

  it('handles GBP/pounds', () => {
    const result = extractTrailingNumber('flight 350 gbp')
    expect(result).not.toBeNull()
    expect(result.value).toBe(350)
    expect(result.currency).toBe('GBP')
  })

  it('returns plain number when suffix is not a known currency', () => {
    const result = extractTrailingNumber('something 500 xyz')
    expect(result).not.toBeNull()
    expect(result.value).toBe(500)
    expect(result.currency).toBeNull()
  })
})

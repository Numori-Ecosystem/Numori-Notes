/**
 * Tests for sum/total/average used inside larger expressions (e.g., "Salary - sum").
 * Regression: sum only worked standalone or at the start of an expression.
 *
 * Key rule: sum aggregates lines above until the nearest empty line.
 * Empty lines act as group separators.
 */
import { describe, it, expect } from 'vitest'
import { calcLines, useCalculator } from './helpers'

describe('Sum inside expressions (not standalone)', () => {
  it('variable minus sum with empty line separator', () => {
    const results = calcLines([
      'Salario = 1457',
      '',
      'Gasolina: 120',
      'Seguro: 60',
      'Ho: 20',
      'Comida: 200',
      'Abril = Salario - sum',
    ])
    // Empty line separates Salario from expenses
    // sum of lines 2-5 = 120+60+20+200 = 400
    // Salario - sum = 1457 - 400 = 1057
    expect(parseFloat(results[6])).toBe(1057)
  })

  it('variable minus sum with currency and empty line separator', () => {
    const results = calcLines([
      'Salario = €1457',
      '',
      'Gasolina: €120',
      'Seguro coche: €60',
      'Ho: €20',
      'Comida: €200',
      'Abril = Salario - sum',
    ])
    // sum = 120+60+20+200 = 400 EUR, Salario = 1457 EUR
    // 1457 - 400 = 1057
    expect(parseFloat(results[6])).toBeCloseTo(1057, 0)
  })

  it('number minus sum', () => {
    const results = calcLines([
      '10',
      '20',
      '30',
      '100 - sum',
    ])
    // sum = 10+20+30 = 60, 100 - 60 = 40
    expect(parseFloat(results[3])).toBe(40)
  })

  it('sum plus number', () => {
    const results = calcLines([
      '10',
      '20',
      'sum + 5',
    ])
    // sum = 30, 30 + 5 = 35
    expect(parseFloat(results[2])).toBe(35)
  })

  it('sum multiplied by number', () => {
    const results = calcLines([
      '10',
      '20',
      'sum * 2',
    ])
    // sum = 30, 30 * 2 = 60
    expect(parseFloat(results[2])).toBe(60)
  })

  it('variable plus sum with empty line separator', () => {
    const results = calcLines([
      'bonus = 500',
      '',
      '100',
      '200',
      'bonus + sum',
    ])
    // sum = 100+200 = 300, bonus + sum = 500 + 300 = 800
    expect(parseFloat(results[4])).toBe(800)
  })

  it('parenthesized expression with sum', () => {
    const results = calcLines([
      '100',
      '200',
      '(sum) * 2',
    ])
    // sum = 300, 300 * 2 = 600
    expect(parseFloat(results[2])).toBe(600)
  })

  it('full budget scenario across multiple months', () => {
    const results = calcLines([
      'Salario = 1457',
      '',
      'Gasolina: 120',
      'Seguro coche: 60',
      'Ho: 20',
      'Comida: 200',
      'Marzo = Salario - sum',
      '',
      'Gasolina: 100',
      'Seguro coche: 60',
      'Ho: 20',
      'Alquiler: 368',
      'Comida: 200',
      'Abril = Salario - sum',
    ])
    // Marzo group sum = 120+60+20+200 = 400, Marzo = 1457-400 = 1057
    expect(parseFloat(results[6])).toBe(1057)
    // Abril group sum = 100+60+20+368+200 = 748, Abril = 1457-748 = 709
    expect(parseFloat(results[13])).toBe(709)
  })

  it('average inside expression with empty line separator', () => {
    const results = calcLines([
      'target = 100',
      '',
      '80',
      '90',
      '70',
      'diff = target - average',
    ])
    // average = (80+90+70)/3 = 80, target - average = 100 - 80 = 20
    expect(parseFloat(results[5])).toBe(20)
  })

  it('avg inside expression: 2 * avg', () => {
    const results = calcLines([
      '10',
      '20',
      '30',
      '2 * avg',
    ])
    // avg = 20, 2 * 20 = 40
    expect(parseFloat(results[3])).toBe(40)
  })

  it('standalone sum includes assignment lines', () => {
    const results = calcLines([
      'Alquiler = 475',
      'Comida = 200',
      'Gasolina = 120',
      'sum',
    ])
    // sum should include all assignment values: 475+200+120 = 795
    expect(parseFloat(results[3])).toBe(795)
  })

  it('standalone sum with currency assignments', () => {
    const results = calcLines([
      'Alquiler = €475',
      'Comida = €200',
      'Gasolina = €120',
      'sum',
    ])
    expect(parseFloat(results[3])).toBe(795)
    expect(results[3]).toMatch(/EUR/)
  })

  it('full Ismael budget scenario', () => {
    const results = calcLines([
      'Salario = 1457',
      'Alquiler = 475',
      'Comida = 200',
      'Gasolina = 120',
      'Seguro_coche = 60',
      'Ho = 20',
      'sum',
    ])
    // sum = 1457+475+200+120+60+20 = 2332
    expect(parseFloat(results[6])).toBe(2332)
  })

  it('Salario - sum works after total = sum is defined', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines([
      '# Ismael',
      'Salario = 1457',
      '',
      '### Valores',
      'Alquiler = 475',
      'Utilidades = 140',
      'Comida = 200',
      'Gasolina = 120',
      'Seguro_coche = 60',
      'Ho = 20',
      'total = sum',
      '',
      '### Abril',
      'Alquiler',
      'Utilidades',
      'Gasolina',
      'Seguro_coche',
      'Ho',
      'Comida',
      'Abril = Salario - sum',
      '',
      '### Mayo',
      'Alquiler',
      'Utilidades',
      'Gasolina',
      'Seguro_coche',
      'Ho',
      'Comida',
      'Mayo = Salario - sum',
    ])
    // total = sum of Alquiler..Ho = 475+140+200+120+60+20 = 1015
    expect(parseFloat(results[10].result)).toBe(1015)
    // Abril group: Alquiler(475)+Utilidades(140)+Gasolina(120)+Seguro_coche(60)+Ho(20)+Comida(200) = 1015
    // Abril = 1457 - 1015 = 442
    expect(parseFloat(results[19].result)).toBe(442)
    // Mayo same group structure = 442
    expect(parseFloat(results[28].result)).toBe(442)
  })
})

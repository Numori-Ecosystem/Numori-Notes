/**
 * Exact reproduction of the user's Ismael budget scenario.
 */
import { describe, it, expect } from 'vitest'
import { useCalculator } from './helpers'

describe('Ismael budget scenario', () => {
  it('standalone sum after variable assignments', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines([
      '# Ismael',
      'Salario = 1457',
      'Alquiler = 475',
      'Agua = 40',
      'Corriente = 100',
      'Utilidades = 140',
      'Comida = 200',
      'Gasolina = 120',
      'Seguro_coche = 60',
      'Ho = 20',
      'sum',
    ])
    // sum should include all assignment values above:
    // 1457+475+40+100+140+200+120+60+20 = 2612
    expect(parseFloat(results[10].result)).toBe(2612)
  })

  it('Salario - sum in month group', () => {
    const { evaluateLines } = useCalculator()
    const results = evaluateLines([
      '# Ismael',
      'Salario = 1457',
      'Alquiler = 475',
      'Agua = 40',
      'Corriente = 100',
      'Utilidades = 140',
      'Comida = 200',
      'Gasolina = 120',
      'Seguro_coche = 60',
      'Ho = 20',
      'sum',
      '',
      'Alquiler',
      'Utilidades',
      'Gasolina',
      'Seguro_coche',
      'Ho',
      'Comida',
      'Abril = Salario - sum',
    ])
    // Group after empty line: Alquiler(475) + Utilidades(140) + Gasolina(120) +
    // Seguro_coche(60) + Ho(20) + Comida(200) = 1015
    // Abril = 1457 - 1015 = 442
    expect(parseFloat(results[18].result)).toBe(442)
  })
})

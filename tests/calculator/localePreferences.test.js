/**
 * Tests for locale preferences system.
 *
 * The locale preferences system provides:
 * - Global presets (UK, US, ES, etc.) that set sensible defaults
 * - Granular overrides for individual settings
 * - Settings categories: volume, fuel economy, date format, number format, temperature, distance
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = value }),
    removeItem: vi.fn((key) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
vi.stubGlobal('localStorage', localStorageMock)

// Mock Vue's ref/reactive/watch for the composable
vi.stubGlobal('ref', (val) => ({ value: val }))
vi.stubGlobal('reactive', (val) => val)
vi.stubGlobal('computed', (fn) => ({ value: fn() }))
vi.stubGlobal('watch', () => {})

const { useLocalePreferences, LOCALE_PRESETS } = await import('../../composables/useLocalePreferences.js')

describe('Locale Presets', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('LOCALE_PRESETS contains UK, US, and ES presets', () => {
    expect(LOCALE_PRESETS.UK).toBeDefined()
    expect(LOCALE_PRESETS.US).toBeDefined()
    expect(LOCALE_PRESETS.ES).toBeDefined()
  })

  it('UK preset uses imperial gallons and miles', () => {
    const uk = LOCALE_PRESETS.UK
    expect(uk.volume).toBe('uk_gallon')
    expect(uk.fuelEconomy).toBe('mpg_uk')
    expect(uk.distance).toBe('miles')
    expect(uk.temperature).toBe('celsius')
    expect(uk.dateFormat).toBe('DD/MM/YYYY')
  })

  it('US preset uses US gallons and miles', () => {
    const us = LOCALE_PRESETS.US
    expect(us.volume).toBe('us_gallon')
    expect(us.fuelEconomy).toBe('mpg')
    expect(us.distance).toBe('miles')
    expect(us.temperature).toBe('fahrenheit')
    expect(us.dateFormat).toBe('MM/DD/YYYY')
  })

  it('ES preset uses metric', () => {
    const es = LOCALE_PRESETS.ES
    expect(es.volume).toBe('litre')
    expect(es.fuelEconomy).toBe('l/100km')
    expect(es.distance).toBe('km')
    expect(es.temperature).toBe('celsius')
    expect(es.dateFormat).toBe('DD/MM/YYYY')
  })
})

describe('useLocalePreferences', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('returns default preferences (metric)', () => {
    const { preferences } = useLocalePreferences()
    expect(preferences.volume).toBeDefined()
    expect(preferences.fuelEconomy).toBeDefined()
    expect(preferences.distance).toBeDefined()
    expect(preferences.temperature).toBeDefined()
    expect(preferences.dateFormat).toBeDefined()
    expect(preferences.numberFormat).toBeDefined()
  })

  it('applyPreset sets all preferences from a preset', () => {
    const { preferences, applyPreset } = useLocalePreferences()
    applyPreset('US')
    expect(preferences.volume).toBe('us_gallon')
    expect(preferences.fuelEconomy).toBe('mpg')
    expect(preferences.distance).toBe('miles')
    expect(preferences.temperature).toBe('fahrenheit')
    expect(preferences.dateFormat).toBe('MM/DD/YYYY')
  })

  it('applyPreset with UK sets UK-specific values', () => {
    const { preferences, applyPreset } = useLocalePreferences()
    applyPreset('UK')
    expect(preferences.volume).toBe('uk_gallon')
    expect(preferences.fuelEconomy).toBe('mpg_uk')
    expect(preferences.distance).toBe('miles')
    expect(preferences.temperature).toBe('celsius')
  })

  it('setPreference overrides a single setting', () => {
    const { preferences, applyPreset, setPreference } = useLocalePreferences()
    applyPreset('US')
    expect(preferences.temperature).toBe('fahrenheit')
    setPreference('temperature', 'celsius')
    expect(preferences.temperature).toBe('celsius')
    // Other settings remain from US preset
    expect(preferences.distance).toBe('miles')
    expect(preferences.fuelEconomy).toBe('mpg')
  })

  it('getActivePreset returns preset name when all settings match', () => {
    const { applyPreset, getActivePreset } = useLocalePreferences()
    applyPreset('UK')
    expect(getActivePreset()).toBe('UK')
  })

  it('getActivePreset returns "Custom" when settings are mixed', () => {
    const { applyPreset, setPreference, getActivePreset } = useLocalePreferences()
    applyPreset('US')
    setPreference('temperature', 'celsius')
    expect(getActivePreset()).toBe('Custom')
  })

  it('saves preferences to localStorage', () => {
    const { applyPreset, save } = useLocalePreferences()
    applyPreset('US')
    save()
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'calcnotes-locale-preferences',
      expect.any(String)
    )
    const saved = JSON.parse(localStorageMock.setItem.mock.calls.at(-1)[1])
    expect(saved.fuelEconomy).toBe('mpg')
  })

  it('loads preferences from localStorage', () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({
      volume: 'uk_gallon',
      fuelEconomy: 'mpg_uk',
      distance: 'miles',
      temperature: 'celsius',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'comma_dot',
    }))
    const { preferences } = useLocalePreferences()
    expect(preferences.volume).toBe('uk_gallon')
    expect(preferences.fuelEconomy).toBe('mpg_uk')
  })
})

describe('Preset Definitions', () => {
  it('all presets have all required keys', () => {
    const requiredKeys = ['volume', 'fuelEconomy', 'distance', 'temperature', 'dateFormat', 'numberFormat']
    for (const [name, preset] of Object.entries(LOCALE_PRESETS)) {
      for (const key of requiredKeys) {
        expect(preset[key], `${name} preset missing ${key}`).toBeDefined()
      }
    }
  })

  it('DE preset uses metric with comma decimal', () => {
    expect(LOCALE_PRESETS.DE).toBeDefined()
    expect(LOCALE_PRESETS.DE.volume).toBe('litre')
    expect(LOCALE_PRESETS.DE.fuelEconomy).toBe('l/100km')
    expect(LOCALE_PRESETS.DE.numberFormat).toBe('dot_comma')
  })

  it('FR preset uses metric', () => {
    expect(LOCALE_PRESETS.FR).toBeDefined()
    expect(LOCALE_PRESETS.FR.volume).toBe('litre')
    expect(LOCALE_PRESETS.FR.fuelEconomy).toBe('l/100km')
  })

  it('JP preset uses metric with YYYY/MM/DD date format', () => {
    expect(LOCALE_PRESETS.JP).toBeDefined()
    expect(LOCALE_PRESETS.JP.dateFormat).toBe('YYYY/MM/DD')
    expect(LOCALE_PRESETS.JP.distance).toBe('km')
  })
})

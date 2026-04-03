// Locale preferences for units, date formats, number formats, etc.
// Provides global presets (UK, US, ES, etc.) with granular per-setting overrides.

const STORAGE_KEY = 'calcnotes-locale-preferences'

// Global presets — sensible defaults per country/region
export const LOCALE_PRESETS = {
  UK: {
    volume: 'uk_gallon',
    fuelEconomy: 'mpg_uk',
    distance: 'miles',
    temperature: 'celsius',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'comma_dot', // 1,000.00
    timeFormat: '24h',
  },
  US: {
    volume: 'us_gallon',
    fuelEconomy: 'mpg',
    distance: 'miles',
    temperature: 'fahrenheit',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'comma_dot',
    timeFormat: '12h',
  },
  ES: {
    volume: 'litre',
    fuelEconomy: 'l/100km',
    distance: 'km',
    temperature: 'celsius',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'dot_comma', // 1.000,00
    timeFormat: '24h',
  },
  FR: {
    volume: 'litre',
    fuelEconomy: 'l/100km',
    distance: 'km',
    temperature: 'celsius',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'space_comma', // 1 000,00
    timeFormat: '24h',
  },
  DE: {
    volume: 'litre',
    fuelEconomy: 'l/100km',
    distance: 'km',
    temperature: 'celsius',
    dateFormat: 'DD.MM.YYYY',
    numberFormat: 'dot_comma',
    timeFormat: '24h',
  },
  JP: {
    volume: 'litre',
    fuelEconomy: 'kpl',
    distance: 'km',
    temperature: 'celsius',
    dateFormat: 'YYYY/MM/DD',
    numberFormat: 'comma_dot',
    timeFormat: '24h',
  },
}

// Default preferences (UK)
const DEFAULT_PREFERENCES = {
  // Locale
  volume: 'uk_gallon',
  fuelEconomy: 'mpg_uk',
  distance: 'miles',
  temperature: 'celsius',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'comma_dot',
  timeFormat: '24h',
  // Editor — Typography
  editorFontSize: 16,
  editorFontFamily: 'system',
  editorLineHeight: 19,
  editorLigatures: false,
  // Editor — Layout
  editorWordWrap: false,
  editorLineNumbers: 'on',
  editorFolding: true,
  // Editor — Cursor
  editorCursorStyle: 'line',
  editorScrollPastEnd: true,
  // Editor — Behaviour
  editorAutoClosingBrackets: 'always',
  editorTabSize: 2,
  editorRenderLineHighlight: 'all',
  // Editor — Results
  inlineResultAlign: 'left',
  // Customisation
  precisionMode: 'auto',
  decimalPlaces: 6,
  significantFigures: 6,
  autoCopyResult: true,
  copyAnimationStyle: 'scale-pop',
}

export const useLocalePreferences = () => {
  // Try to load from localStorage
  let initial = { ...DEFAULT_PREFERENCES }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      initial = { ...DEFAULT_PREFERENCES, ...parsed }
    }
  } catch { /* use defaults */ }

  const preferences = reactive(initial)

  const applyPreset = (presetName) => {
    const preset = LOCALE_PRESETS[presetName]
    if (!preset) return
    Object.assign(preferences, preset)
  }

  const setPreference = (key, value) => {
    if (key in preferences) {
      preferences[key] = value
    }
  }

  const getActivePreset = () => {
    for (const [name, preset] of Object.entries(LOCALE_PRESETS)) {
      const matches = Object.keys(preset).every(key => preferences[key] === preset[key])
      if (matches) return name
    }
    return 'Custom'
  }

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch { /* silent */ }
  }

  const reset = () => {
    Object.assign(preferences, DEFAULT_PREFERENCES)
    save()
  }

  return {
    preferences,
    applyPreset,
    setPreference,
    getActivePreset,
    save,
    reset,
  }
}

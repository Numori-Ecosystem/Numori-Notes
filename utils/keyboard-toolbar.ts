import { registerPlugin } from '@capacitor/core'
import type { PluginListenerHandle } from '@capacitor/core'

export interface KeyboardToolbarButton {
  id: string
  title: string
  icon?: string        // SF Symbol name
  separator?: boolean  // renders a divider instead of a button
}

export interface KeyboardToolbarPlugin {
  setButtons(options: { buttons: KeyboardToolbarButton[] }): Promise<void>
  show(): Promise<void>
  hide(): Promise<void>
  updateButtonStates(options: { disabledIds: string[] }): Promise<void>
  addListener(
    eventName: 'buttonTapped',
    handler: (data: { id: string }) => void
  ): Promise<PluginListenerHandle>
}

export const KeyboardToolbar = registerPlugin<KeyboardToolbarPlugin>('KeyboardToolbar')

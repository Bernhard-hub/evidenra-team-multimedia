/**
 * AKIH Settings Panel
 * Configuration UI for AKIH Score features
 */

import { useState } from 'react'
import {
  IconSettings,
  IconToggleLeft,
  IconToggleRight,
  IconInfoCircle,
  IconUsers,
  IconRobot,
  IconChartBar,
} from '@tabler/icons-react'
import type { AKIHConfig, ResearchPhaseId, RESEARCH_PHASE_WEIGHTS } from '@/types/akih'
import { DEFAULT_AKIH_CONFIG } from '@/types/akih'

interface AKIHSettingsProps {
  config: AKIHConfig
  onChange: (config: AKIHConfig) => void
  onClose?: () => void
}

export default function AKIHSettings({
  config,
  onChange,
  onClose,
}: AKIHSettingsProps) {
  const [localConfig, setLocalConfig] = useState<AKIHConfig>(config)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateConfig = (updates: Partial<AKIHConfig>) => {
    const newConfig = { ...localConfig, ...updates }
    setLocalConfig(newConfig)
    onChange(newConfig)
  }

  const resetToDefaults = () => {
    setLocalConfig(DEFAULT_AKIH_CONFIG)
    onChange(DEFAULT_AKIH_CONFIG)
  }

  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800 bg-surface-800/50">
        <div className="flex items-center gap-2">
          <IconSettings size={18} className="text-surface-400" />
          <h3 className="text-sm font-medium text-surface-200">AKIH Einstellungen</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-surface-400 hover:text-surface-200 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Main Toggle */}
        <SettingRow
          icon={<IconChartBar size={18} />}
          title="AKIH Score aktivieren"
          description="Aktiviert die AKIH-Berechnung und -Anzeige für dieses Projekt"
        >
          <ToggleButton
            enabled={localConfig.enabled}
            onChange={(enabled) => updateConfig({ enabled })}
          />
        </SettingRow>

        {localConfig.enabled && (
          <>
            {/* Display Options */}
            <div className="space-y-4">
              <h4 className="text-xs font-medium text-surface-400 uppercase tracking-wide">
                Anzeige
              </h4>

              <SettingRow
                icon={<IconRobot size={18} />}
                title="Im Kodierungs-Panel anzeigen"
                description="Zeigt einen Mini-AKIH-Score beim Kodieren an"
              >
                <ToggleButton
                  enabled={localConfig.showInCodingPanel}
                  onChange={(showInCodingPanel) => updateConfig({ showInCodingPanel })}
                />
              </SettingRow>

              <SettingRow
                icon={<IconChartBar size={18} />}
                title="Automatisch berechnen"
                description="Berechnet den Score automatisch bei Änderungen"
              >
                <ToggleButton
                  enabled={localConfig.autoCalculate}
                  onChange={(autoCalculate) => updateConfig({ autoCalculate })}
                />
              </SettingRow>
            </div>

            {/* Team Options */}
            <div className="space-y-4">
              <h4 className="text-xs font-medium text-surface-400 uppercase tracking-wide">
                Team-Validierung
              </h4>

              <SettingRow
                icon={<IconUsers size={18} />}
                title="Konsens erforderlich"
                description="Mehrere Team-Mitglieder müssen Kodierungen validieren"
              >
                <ToggleButton
                  enabled={localConfig.requireConsensus}
                  onChange={(requireConsensus) => updateConfig({ requireConsensus })}
                />
              </SettingRow>

              {localConfig.requireConsensus && (
                <>
                  <div className="pl-8 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-surface-400">Mindest-Validierer</span>
                      <select
                        value={localConfig.minimumValidators}
                        onChange={(e) => updateConfig({ minimumValidators: parseInt(e.target.value) })}
                        className="px-3 py-1.5 bg-surface-800 border border-surface-700 rounded-lg text-sm text-surface-200 focus:outline-none focus:border-primary-500"
                      >
                        {[2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>{n} Personen</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-surface-400">Konsens-Schwelle</span>
                      <select
                        value={localConfig.consensusThreshold}
                        onChange={(e) => updateConfig({ consensusThreshold: parseFloat(e.target.value) })}
                        className="px-3 py-1.5 bg-surface-800 border border-surface-700 rounded-lg text-sm text-surface-200 focus:outline-none focus:border-primary-500"
                      >
                        <option value={0.5}>50% (Einfache Mehrheit)</option>
                        <option value={0.67}>67% (2/3 Mehrheit)</option>
                        <option value={0.75}>75% (3/4 Mehrheit)</option>
                        <option value={1.0}>100% (Einstimmig)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Advanced Options */}
            <div className="space-y-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs text-surface-400 hover:text-surface-200 transition-colors"
              >
                <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>
                  ▶
                </span>
                Erweiterte Einstellungen
              </button>

              {showAdvanced && (
                <div className="space-y-4 pl-4 border-l-2 border-surface-800">
                  <SettingRow
                    title="Beim Speichern berechnen"
                    description="Berechnet Score bei jedem Speichern neu"
                  >
                    <ToggleButton
                      enabled={localConfig.calculateOnSave}
                      onChange={(calculateOnSave) => updateConfig({ calculateOnSave })}
                    />
                  </SettingRow>

                  {/* Phase weights info */}
                  <div className="bg-surface-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-surface-400 mb-2">
                      <IconInfoCircle size={14} />
                      <span>Phasen-Gewichtungen (Standard)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <span className="text-surface-500">Literaturrecherche:</span>
                      <span className="text-surface-300">15%</span>
                      <span className="text-surface-500">Forschungsdesign:</span>
                      <span className="text-surface-300">10%</span>
                      <span className="text-surface-500">Datenerhebung:</span>
                      <span className="text-surface-300">15%</span>
                      <span className="text-surface-500">Datenanalyse:</span>
                      <span className="text-surface-300">20%</span>
                      <span className="text-surface-500">Interpretation:</span>
                      <span className="text-surface-300">15%</span>
                      <span className="text-surface-500">Schreiben:</span>
                      <span className="text-surface-300">15%</span>
                      <span className="text-surface-500">Dokumentation:</span>
                      <span className="text-surface-300">10%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-800">
          <button
            onClick={resetToDefaults}
            className="text-xs text-surface-500 hover:text-surface-300 transition-colors"
          >
            Auf Standard zurücksetzen
          </button>

          <div className="flex items-center gap-2 text-xs text-surface-500">
            <IconInfoCircle size={12} />
            <span>Änderungen werden automatisch gespeichert</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Components

function SettingRow({
  icon,
  title,
  description,
  children,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && <div className="text-surface-500 mt-0.5">{icon}</div>}
        <div>
          <p className="text-sm text-surface-200">{title}</p>
          {description && (
            <p className="text-xs text-surface-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

function ToggleButton({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: (enabled: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-primary-500' : 'bg-surface-700'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          enabled ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  )
}

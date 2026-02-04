import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/stores/authStore'
import { claude } from '@/lib/claude'
import { hasOpenAIKey, setOpenAIKey, clearOpenAIKey } from '@/lib/transcription'

type SettingsTab = 'profile' | 'organization' | 'api' | 'notifications'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  const tabs: { id: SettingsTab; name: string; icon: React.ReactNode }[] = [
    {
      id: 'profile',
      name: 'Profil',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'organization',
      name: 'Organisation',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      id: 'api',
      name: 'API & Integrationen',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      name: 'Benachrichtigungen',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
  ]

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-surface-100">Einstellungen</h1>
          <p className="text-surface-400 mt-1">Verwalten Sie Ihr Konto und Ihre Präferenzen</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-surface-900 rounded-xl border border-surface-800 p-2 lg:sticky lg:top-24">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-surface-400 hover:bg-surface-800 hover:text-surface-100'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeTab === 'profile' && <ProfileSettings user={user} />}
            {activeTab === 'organization' && <OrganizationSettings />}
            {activeTab === 'api' && <ApiSettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
          </div>
        </div>
      </div>
    </Layout>
  )
}

function ProfileSettings({ user }: { user: any }) {
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [email] = useState(user?.email || '')

  return (
    <div className="space-y-6">
      <div className="bg-surface-900 rounded-xl border border-surface-800 p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-6">Profil-Informationen</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {fullName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
            </span>
          </div>
          <div>
            <button className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 text-sm font-medium">
              Bild ändern
            </button>
            <p className="text-xs text-surface-500 mt-1">JPG, PNG oder GIF. Max. 2MB</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Vollständiger Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">E-Mail</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-2.5 rounded-lg bg-surface-800/50 border border-surface-700 text-surface-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-surface-800 flex justify-end">
          <button className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium">
            Änderungen speichern
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="bg-surface-900 rounded-xl border border-surface-800 p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-6">Passwort ändern</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Aktuelles Passwort</label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Neues Passwort</label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Passwort bestätigen</label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="••••••••"
            />
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-surface-800 flex justify-end">
          <button className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium">
            Passwort ändern
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-surface-900 rounded-xl border border-red-500/20 p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Gefahrenzone</h2>
        <p className="text-sm text-surface-400 mb-4">
          Das Löschen Ihres Kontos ist unwiderruflich. Alle Ihre Daten werden dauerhaft gelöscht.
        </p>
        <button className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium">
          Konto löschen
        </button>
      </div>
    </div>
  )
}

function OrganizationSettings() {
  const [orgName, setOrgName] = useState('Forschungsteam Berlin')

  return (
    <div className="space-y-6">
      <div className="bg-surface-900 rounded-xl border border-surface-800 p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-6">Organisation</h2>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Organisationsname</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Organisations-ID</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value="org_xK9mL2nP"
                disabled
                className="flex-1 px-4 py-2.5 rounded-lg bg-surface-800/50 border border-surface-700 text-surface-400 font-mono text-sm cursor-not-allowed"
              />
              <button className="p-2.5 rounded-lg border border-surface-700 text-surface-400 hover:bg-surface-800">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-surface-800 flex justify-end">
          <button className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium">
            Speichern
          </button>
        </div>
      </div>

      {/* Billing */}
      <div className="bg-surface-900 rounded-xl border border-surface-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-surface-100">Abonnement</h2>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-500/10 text-primary-400">
            Team Pro
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="p-4 rounded-lg bg-surface-800">
            <p className="text-sm text-surface-400">Monatliche Kosten</p>
            <p className="text-2xl font-bold text-surface-100 mt-1">€49</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-800">
            <p className="text-sm text-surface-400">Nächste Abrechnung</p>
            <p className="text-2xl font-bold text-surface-100 mt-1">15. Feb</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-800">
            <p className="text-sm text-surface-400">Teammitglieder</p>
            <p className="text-2xl font-bold text-surface-100 mt-1">4 / 10</p>
          </div>
        </div>

        <button className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 text-sm font-medium">
          Abonnement verwalten
        </button>
      </div>
    </div>
  )
}

function ApiSettings() {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hasKey, setHasKey] = useState(false)

  // Load existing API key on mount
  useEffect(() => {
    const existingKey = claude.getApiKey()
    if (existingKey) {
      // Show masked key
      setApiKey('sk-ant-••••••••••••••••')
      setHasKey(true)
    }
  }, [])

  const handleSaveApiKey = () => {
    setIsSaving(true)
    setMessage(null)

    try {
      // Validate key format
      if (!apiKey || apiKey === 'sk-ant-••••••••••••••••') {
        setMessage({ type: 'error', text: 'Bitte geben Sie einen gültigen API-Schlüssel ein.' })
        setIsSaving(false)
        return
      }

      if (!apiKey.startsWith('sk-ant-')) {
        setMessage({ type: 'error', text: 'Der API-Schlüssel muss mit "sk-ant-" beginnen.' })
        setIsSaving(false)
        return
      }

      // Save the key
      claude.setApiKey(apiKey)
      setHasKey(true)
      setApiKey('sk-ant-••••••••••••••••')
      setShowKey(false)
      setMessage({ type: 'success', text: 'API-Schlüssel wurde erfolgreich gespeichert.' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Fehler beim Speichern des API-Schlüssels.' })
    }

    setIsSaving(false)
  }

  const handleClearApiKey = () => {
    claude.clearApiKey()
    setApiKey('')
    setHasKey(false)
    setMessage({ type: 'success', text: 'API-Schlüssel wurde entfernt.' })
  }

  return (
    <div className="space-y-6">
      {/* Claude API Key */}
      <div className="bg-surface-900 rounded-xl border border-surface-800 p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-2">Claude API-Schlüssel</h2>
        <p className="text-sm text-surface-400 mb-6">
          Geben Sie Ihren Anthropic API-Schlüssel ein, um die AI-Kodierung zu nutzen.{' '}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 hover:text-primary-300"
          >
            API-Schlüssel erstellen
          </a>
        </p>

        {/* Status Badge */}
        {hasKey && (
          <div className="mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-green-400">API-Schlüssel konfiguriert</span>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="max-w-xl">
          <label className="block text-sm font-medium text-surface-300 mb-1.5">API-Schlüssel</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onFocus={() => {
                  if (apiKey === 'sk-ant-••••••••••••••••') {
                    setApiKey('')
                  }
                }}
                className="w-full px-4 py-2.5 pr-10 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="sk-ant-api03-..."
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
              >
                {showKey ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <button
              onClick={handleSaveApiKey}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium disabled:opacity-50"
            >
              {isSaving ? 'Speichern...' : 'Speichern'}
            </button>
            {hasKey && (
              <button
                onClick={handleClearApiKey}
                className="px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium"
              >
                Entfernen
              </button>
            )}
          </div>
          <p className="text-xs text-surface-500 mt-2">
            Der API-Schlüssel wird lokal in Ihrem Browser gespeichert und niemals an unsere Server übertragen.
          </p>
        </div>
      </div>

      {/* OpenAI API Key for Transcription */}
      <OpenAIKeySettings />

      {/* Webhooks */}
      <div className="bg-surface-900 rounded-xl border border-surface-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-surface-100">Webhooks</h2>
            <p className="text-sm text-surface-400 mt-1">Erhalten Sie Benachrichtigungen bei Ereignissen</p>
          </div>
          <button className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Webhook hinzufügen
          </button>
        </div>

        <div className="text-center py-8 text-surface-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="text-sm">Keine Webhooks konfiguriert</p>
        </div>
      </div>
    </div>
  )
}

function OpenAIKeySettings() {
  const [apiKey, setApiKeyValue] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hasKey, setHasKey] = useState(false)

  useEffect(() => {
    setHasKey(hasOpenAIKey())
    if (hasOpenAIKey()) {
      setApiKeyValue('sk-••••••••••••••••')
    }
  }, [])

  const handleSave = () => {
    setIsSaving(true)
    setMessage(null)

    try {
      if (!apiKey || apiKey === 'sk-••••••••••••••••') {
        setMessage({ type: 'error', text: 'Bitte geben Sie einen gültigen API-Schlüssel ein.' })
        setIsSaving(false)
        return
      }

      if (!apiKey.startsWith('sk-')) {
        setMessage({ type: 'error', text: 'Der API-Schlüssel muss mit "sk-" beginnen.' })
        setIsSaving(false)
        return
      }

      setOpenAIKey(apiKey)
      setHasKey(true)
      setApiKeyValue('sk-••••••••••••••••')
      setShowKey(false)
      setMessage({ type: 'success', text: 'OpenAI API-Schlüssel wurde gespeichert.' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Fehler beim Speichern.' })
    }

    setIsSaving(false)
  }

  const handleClear = () => {
    clearOpenAIKey()
    setApiKeyValue('')
    setHasKey(false)
    setMessage({ type: 'success', text: 'OpenAI API-Schlüssel wurde entfernt.' })
  }

  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800 p-6">
      <h2 className="text-lg font-semibold text-surface-100 mb-2">OpenAI API-Schlüssel (Whisper)</h2>
      <p className="text-sm text-surface-400 mb-6">
        Für Audio/Video-Transkription mit dem Whisper-Modell.{' '}
        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-400 hover:text-primary-300"
        >
          API-Schlüssel erstellen
        </a>
      </p>

      {hasKey && (
        <div className="mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm text-green-400">OpenAI API-Schlüssel konfiguriert</span>
        </div>
      )}

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="max-w-xl">
        <label className="block text-sm font-medium text-surface-300 mb-1.5">API-Schlüssel</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKeyValue(e.target.value)}
              onFocus={() => {
                if (apiKey === 'sk-••••••••••••••••') {
                  setApiKeyValue('')
                }
              }}
              className="w-full px-4 py-2.5 pr-10 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="sk-proj-..."
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
            >
              {showKey ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {isSaving ? 'Speichern...' : 'Speichern'}
          </button>
          {hasKey && (
            <button
              onClick={handleClear}
              className="px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium"
            >
              Entfernen
            </button>
          )}
        </div>
        <p className="text-xs text-surface-500 mt-2">
          Wird für die Whisper-Transkription von Audio/Video-Dateien verwendet.
        </p>
      </div>
    </div>
  )
}

function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState({
    newMember: true,
    projectActivity: true,
    codingComplete: true,
    weeklyDigest: false,
  })

  return (
    <div className="space-y-6">
      <div className="bg-surface-900 rounded-xl border border-surface-800 p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-6">E-Mail-Benachrichtigungen</h2>

        <div className="space-y-4">
          <NotificationToggle
            label="Neue Teammitglieder"
            description="Benachrichtigung wenn jemand dem Team beitritt"
            checked={emailNotifications.newMember}
            onChange={(checked) => setEmailNotifications({ ...emailNotifications, newMember: checked })}
          />
          <NotificationToggle
            label="Projektaktivität"
            description="Updates zu Projekten, an denen Sie arbeiten"
            checked={emailNotifications.projectActivity}
            onChange={(checked) => setEmailNotifications({ ...emailNotifications, projectActivity: checked })}
          />
          <NotificationToggle
            label="Kodierung abgeschlossen"
            description="Benachrichtigung wenn eine AI-Kodierung fertig ist"
            checked={emailNotifications.codingComplete}
            onChange={(checked) => setEmailNotifications({ ...emailNotifications, codingComplete: checked })}
          />
          <NotificationToggle
            label="Wöchentliche Zusammenfassung"
            description="Wöchentlicher Bericht über alle Aktivitäten"
            checked={emailNotifications.weeklyDigest}
            onChange={(checked) => setEmailNotifications({ ...emailNotifications, weeklyDigest: checked })}
          />
        </div>
      </div>

      <div className="bg-surface-900 rounded-xl border border-surface-800 p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-6">In-App-Benachrichtigungen</h2>

        <div className="space-y-4">
          <NotificationToggle
            label="Desktop-Benachrichtigungen"
            description="Benachrichtigungen auf Ihrem Desktop anzeigen"
            checked={true}
            onChange={() => {}}
          />
          <NotificationToggle
            label="Sound-Benachrichtigungen"
            description="Ton abspielen bei wichtigen Ereignissen"
            checked={false}
            onChange={() => {}}
          />
        </div>
      </div>
    </div>
  )
}

function NotificationToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-surface-100">{label}</p>
        <p className="text-sm text-surface-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary-500' : 'bg-surface-700'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  )
}

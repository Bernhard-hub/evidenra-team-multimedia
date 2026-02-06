/**
 * useDeviceFingerprint - Device Fingerprinting Hook
 *
 * Verwendet FingerprintJS um ein eindeutiges Gerät zu identifizieren.
 * Ermöglicht die Erkennung von Account-Sharing (1 Account auf vielen Geräten).
 *
 * Datenschutz-Hinweis:
 * - Fingerprint wird nur für Sicherheitszwecke verwendet
 * - Wird nicht an Dritte weitergegeben
 * - Kann in den Einstellungen deaktiviert werden
 */

import { useState, useEffect, useCallback } from 'react'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

interface DeviceInfo {
  visitorId: string
  confidence: number
  components: {
    platform?: string
    timezone?: string
    screenResolution?: string
    language?: string
  }
}

interface UseDeviceFingerprintResult {
  deviceId: string | null
  deviceInfo: DeviceInfo | null
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

// Singleton für FingerprintJS Agent
let fpPromise: Promise<ReturnType<typeof FingerprintJS.load>> | null = null

function getFingerprintAgent() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
  }
  return fpPromise
}

export function useDeviceFingerprint(): UseDeviceFingerprintResult {
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const getFingerprint = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const fp = await getFingerprintAgent()
      const result = await fp.get()

      const info: DeviceInfo = {
        visitorId: result.visitorId,
        confidence: result.confidence.score,
        components: {
          platform: result.components.platform?.value as string,
          timezone: result.components.timezone?.value as string,
          language: result.components.languages?.value?.[0] as string,
        },
      }

      setDeviceId(result.visitorId)
      setDeviceInfo(info)

      // Speichere im localStorage für schnellen Zugriff
      localStorage.setItem('device-fingerprint', result.visitorId)
      localStorage.setItem('device-fingerprint-timestamp', Date.now().toString())

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fingerprint failed'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Prüfe ob wir einen gecachten Fingerprint haben
    const cached = localStorage.getItem('device-fingerprint')
    const timestamp = localStorage.getItem('device-fingerprint-timestamp')

    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10)
      const maxAge = 24 * 60 * 60 * 1000 // 24 Stunden

      if (age < maxAge) {
        setDeviceId(cached)
        setIsLoading(false)
        // Refresh im Hintergrund
        getFingerprint()
        return
      }
    }

    getFingerprint()
  }, [getFingerprint])

  return {
    deviceId,
    deviceInfo,
    isLoading,
    error,
    refresh: getFingerprint,
  }
}

/**
 * Registriert das aktuelle Gerät für einen User
 */
export async function registerDevice(userId: string): Promise<{ deviceId: string; isNew: boolean }> {
  const fp = await getFingerprintAgent()
  const result = await fp.get()
  const deviceId = result.visitorId

  // Speichere bekannte Geräte für diesen User
  const knownDevicesKey = `known-devices-${userId}`
  const knownDevicesRaw = localStorage.getItem(knownDevicesKey)
  const knownDevices: string[] = knownDevicesRaw ? JSON.parse(knownDevicesRaw) : []

  const isNew = !knownDevices.includes(deviceId)

  if (isNew) {
    knownDevices.push(deviceId)
    localStorage.setItem(knownDevicesKey, JSON.stringify(knownDevices))
  }

  return { deviceId, isNew }
}

/**
 * Prüft ob zu viele Geräte für einen User registriert sind
 */
export function checkDeviceLimit(userId: string, maxDevices = 5): {
  withinLimit: boolean
  deviceCount: number
  maxDevices: number
} {
  const knownDevicesKey = `known-devices-${userId}`
  const knownDevicesRaw = localStorage.getItem(knownDevicesKey)
  const knownDevices: string[] = knownDevicesRaw ? JSON.parse(knownDevicesRaw) : []

  return {
    withinLimit: knownDevices.length <= maxDevices,
    deviceCount: knownDevices.length,
    maxDevices,
  }
}

export default useDeviceFingerprint

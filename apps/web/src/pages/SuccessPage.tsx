/**
 * EVIDENRA Research - Subscription Success Page
 */

import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { IconCheck, IconConfetti, IconArrowRight } from '@tabler/icons-react'

export default function SuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [orderInfo, setOrderInfo] = useState<{
    email?: string
    plan?: string
    pending?: boolean
  } | null>(null)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false)
      return
    }

    // Fetch order info from API
    const fetchOrder = async () => {
      try {
        const response = await fetch(
          `https://evidenra.com/api/order?session_id=${sessionId}`
        )
        const data = await response.json()

        if (data.pending) {
          // Webhook hasn't processed yet, retry in 2s
          setTimeout(fetchOrder, 2000)
          return
        }

        setOrderInfo(data)
      } catch (err) {
        console.error('Failed to fetch order:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [sessionId])

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
            <IconCheck size={40} className="text-green-400" />
          </div>
          <div className="flex justify-center gap-2 text-4xl mb-4">
            <IconConfetti className="text-amber-400" />
            <IconConfetti className="text-pink-400" />
            <IconConfetti className="text-blue-400" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Willkommen bei EVIDENRA Research!
        </h1>

        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse h-4 bg-surface-800 rounded w-3/4 mx-auto" />
            <div className="animate-pulse h-4 bg-surface-800 rounded w-1/2 mx-auto" />
          </div>
        ) : (
          <>
            <p className="text-surface-400 mb-8">
              {orderInfo?.email ? (
                <>
                  Deine Bestätigung wurde an <span className="text-white">{orderInfo.email}</span> gesendet.
                </>
              ) : (
                'Dein Abo wurde erfolgreich aktiviert.'
              )}
            </p>

            {orderInfo?.plan && (
              <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700 mb-8">
                <p className="text-surface-400 text-sm">Dein Plan</p>
                <p className="text-white font-medium text-lg capitalize">
                  {orderInfo.plan.replace('research-', '')}
                </p>
                <p className="text-green-400 text-sm mt-1">
                  30 Tage kostenlos testen
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium flex items-center justify-center gap-2"
              >
                Zum Dashboard
                <IconArrowRight size={18} />
              </button>

              <button
                onClick={() => navigate('/team')}
                className="w-full py-3 rounded-xl bg-surface-800 hover:bg-surface-700 text-white font-medium"
              >
                Team einladen
              </button>
            </div>
          </>
        )}

        {/* Help */}
        <p className="mt-8 text-surface-500 text-sm">
          Fragen? <a href="mailto:support@evidenra.com" className="text-primary-400 hover:underline">support@evidenra.com</a>
        </p>
      </div>
    </div>
  )
}

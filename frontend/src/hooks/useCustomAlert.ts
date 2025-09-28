import { useState } from 'react'
import type { AlertOptions, AlertState } from '@/types/alert'

export const useCustomAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    options: { title: '', message: '' }
  })

  const showAlert = (options: AlertOptions, onConfirm?: () => void) => {
    setAlertState({
      isOpen: true,
      options,
      onConfirm
    })
  }

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }))
  }

  return {
    alertState,
    showAlert,
    hideAlert
  }
}
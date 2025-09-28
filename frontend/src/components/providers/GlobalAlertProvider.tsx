import React from 'react'
import { useGlobalAlert } from '@/store/globalAlert'
import { CustomAlert } from '@/components/common/CustomAlert'

interface GlobalAlertProviderProps {
  children: React.ReactNode
}

export const GlobalAlertProvider: React.FC<GlobalAlertProviderProps> = ({ children }) => {
  const { isOpen, options, onConfirm, hideAlert } = useGlobalAlert()

  return (
    <>
      {children}
      <CustomAlert
        isOpen={isOpen}
        onClose={hideAlert}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        type={options.type}
        onConfirm={onConfirm}
      />
    </>
  )
}
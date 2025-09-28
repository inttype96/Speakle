import { create } from 'zustand'
import type { AlertOptions, AlertState } from '@/types/alert'

interface GlobalAlertStore extends AlertState {
  showAlert: (options: AlertOptions, onConfirm?: () => void) => void
  hideAlert: () => void
}

export const useGlobalAlert = create<GlobalAlertStore>((set) => ({
  isOpen: false,
  options: { title: '', message: '' },
  onConfirm: undefined,
  
  showAlert: (options, onConfirm) => {
    set({
      isOpen: true,
      options,
      onConfirm
    })
  },
  
  hideAlert: () => {
    set({ 
      isOpen: false,
      onConfirm: undefined 
    })
  }
}))

// 전역에서 사용할 수 있는 헬퍼 함수
export const showGlobalAlert = (options: AlertOptions, onConfirm?: () => void) => {
  useGlobalAlert.getState().showAlert(options, onConfirm)
}
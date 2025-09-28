export interface AlertOptions {
  title: string
  message: string
  confirmText?: string
  type?: 'info' | 'warning' | 'error' | 'music'
}

export interface AlertState {
  isOpen: boolean
  options: AlertOptions
  onConfirm?: () => void
}
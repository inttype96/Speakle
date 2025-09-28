import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { X, Music, /*User,*/ AlertTriangle, Info } from "lucide-react"
import type { AlertOptions } from '@/types/alert'

interface CustomAlertProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  confirmText?: string
  onConfirm?: () => void
  type?: AlertOptions['type']
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  isOpen,
  onClose,
  title,
  message,
  confirmText = "확인",
  onConfirm,
  type = 'info'
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    handleClose()
  }

  const getIcon = () => {
    const iconClass = "w-7 h-7 drop-shadow-lg"
    
    switch (type) {
      case 'music':
        return <Music className={`${iconClass} text-[#B5A6E0]`} />
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-orange-300`} />
      case 'error':
        return <X className={`${iconClass} text-red-300`} />
      default:
        return <Info className={`${iconClass} text-blue-300`} />
    }
  }

  const getColors = () => {
    return {
      bgColor: '#000000',
      button: 'bg-gradient-to-r from-[#4B2199] to-[#4B2199] hover:from-[#9B8BC7] hover:to-[#7A6BA8] text-white hover:text-black'
    }
  }

  if (!isOpen) return null

  const colors = getColors()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div 
        className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* 모달 */}
      <div 
        className={`relative max-w-md w-full border-2 rounded-3xl transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
        style={{
          background: colors.bgColor,
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-7 pb-5">
          <div className="flex items-center space-x-4">
            {getIcon()}
            <h3 className="text-xl font-bold text-white drop-shadow-lg font-['Pretendard']">
              {title}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 메시지 */}
        <div className="px-7 pb-6">
          <p className="text-white/90 leading-relaxed text-base font-['Pretendard'] whitespace-pre-line text-center">
            {message}
          </p>
        </div>

        {/* 버튼 */}
        <div className="px-7 pb-7">
          <Button
            onClick={handleConfirm}
            className={`w-full ${colors.button} font-bold py-4 text-base rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl font-['Pretendard'] border-0 shadow-lg`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
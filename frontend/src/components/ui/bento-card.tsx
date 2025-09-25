import * as React from "react"
import { cn } from "@/lib/utils"

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  gradient?: string
  hover?: boolean
}

const BentoCard = React.forwardRef<HTMLDivElement, BentoCardProps>(
  ({ className, children, gradient, hover = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl border bg-background p-6 shadow-sm transition-all duration-300",
          hover && "hover:shadow-lg hover:scale-[1.02] cursor-pointer",
          gradient && "bg-gradient-to-br",
          className
        )}
        style={gradient ? { backgroundImage: gradient } : undefined}
        {...props}
      >
        <div className="relative z-10">
          {children}
        </div>
        {hover && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
        )}
      </div>
    )
  }
)
BentoCard.displayName = "BentoCard"

interface BentoGridProps {
  children: React.ReactNode
  className?: string
}

const BentoGrid = ({ children, className }: BentoGridProps) => {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-min",
      className
    )}>
      {children}
    </div>
  )
}

export { BentoCard, BentoGrid }
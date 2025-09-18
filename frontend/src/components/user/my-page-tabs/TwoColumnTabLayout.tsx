import * as React from 'react'

interface TwoColumnTabLayoutProps {
  left: React.ReactNode
  right: React.ReactNode
}

export default function TwoColumnTabLayout({ left, right }: TwoColumnTabLayoutProps) {
  return (
    <div className="flex w-full gap-6">
      <div className="flex-1">{left}</div>
      <div className="flex-1">{right}</div>
    </div>
  )
}

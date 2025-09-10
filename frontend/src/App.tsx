import { useState } from 'react'
import './App.css'

import { ThemeProvider } from "@/components/theme-provider"
import IndexPage from '@/pages/common/indexPage'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      < IndexPage />
    </ThemeProvider>
  )
}

export default App

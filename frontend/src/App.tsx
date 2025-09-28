import './App.css'
import { ThemeProvider } from "@/components/theme-provider"
import { RouterProvider } from 'react-router-dom'
import { GlobalAlertProvider } from '@/components/providers/GlobalAlertProvider'
import router from './router'

function App() {
  return (
    <GlobalAlertProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <RouterProvider router={router} />
        </ThemeProvider>
    </GlobalAlertProvider>
  )
}

export default App

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LineChart } from 'lucide-react'

// Pages
import MainPage from './pages/MainPage'
import AnalysisDetail from './pages/AnalysisDetail'

function Layout() {
  return (
    <div className="h-screen bg-background flex flex-col font-sans antialiased overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        <div className="container max-w-7xl mx-auto flex h-16 items-center px-4 md:px-8">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <LineChart size={18} />
            </div>
            <span>智能股票分析</span>
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
             <div className="text-xs text-muted-foreground hidden md:block">
                 v1.0.0
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="container max-w-7xl mx-auto h-full py-6 px-4 md:px-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/analysis/:taskId" element={<AnalysisDetail />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  )
}

export default App

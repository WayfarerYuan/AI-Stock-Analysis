import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LineChart } from 'lucide-react'

// Pages
import MainPage from './pages/MainPage'
import AnalysisDetail from './pages/AnalysisDetail'

function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        <div className="container max-w-7xl mx-auto flex h-14 md:h-16 items-center px-4">
          <div className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tight">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0">
              <LineChart className="w-4 h-4 md:w-[18px] md:h-[18px]" />
            </div>
            <span className="truncate">智能股票分析</span>
          </div>
          
          <div className="ml-auto flex items-center space-x-2 md:space-x-4">
             <div className="text-xs text-muted-foreground hidden sm:block">
                 v1.0.0
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container max-w-7xl mx-auto py-4 px-4">
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

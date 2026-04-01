import { useState, lazy, Suspense } from 'react'
import './App.css'

// 1. Load the Micro Frontend asynchronously!
const QuizWidget = lazy(() => import('quizApp/QuizWidget'))

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>SoulSync Platform (Host)</h1>
      <p>This is the main navigation shell.</p>
      
      <hr style={{ margin: '40px 0' }} />
      
      <h2>Below is the Micro Frontend loaded from port 5001:</h2>
      <div style={{ border: '2px dashed #4CAF50', padding: '20px' }}>
        
        {/* 2. Wrap it in Suspense to show a loading state while it downloads */}
        <Suspense fallback={<p>Loading Quiz Module from Remote Server...</p>}>
           <QuizWidget />
        </Suspense>

      </div>
    </div>
  )
}

export default App
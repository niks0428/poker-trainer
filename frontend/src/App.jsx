import { useState } from 'react'
import AdviceTab from './components/AdviceTab'
import EquityTab from './components/EquityTab'
import LessonsTab from './components/LessonsTab'
import PracticeTab from './components/PracticeTab'
import PreflopTab from './components/PreflopTab'

const TABS = [
  { id: 'preflop', label: '🃏 Preflop' },
  { id: 'advice', label: '🎯 Real-Time Advice' },
  { id: 'equity', label: '📊 Equity Calc' },
  { id: 'practice', label: '🎲 Practice' },
  { id: 'lessons', label: '📚 Lessons' },
]

export default function App() {
  const [tab, setTab] = useState('advice')

  return (
    <div className="min-h-screen bg-[#0f1923] text-slate-200">
      <header className="bg-[#0a1219] border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <span className="text-2xl">♠️</span>
        <div>
          <h1 className="text-xl font-bold text-amber-400 leading-none">AI Poker Trainer</h1>
          <p className="text-xs text-slate-400">No-Limit Texas Hold'em · GTO Strategy</p>
        </div>
      </header>

      <nav className="bg-[#0a1219] border-b border-slate-700 flex">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${
              tab === t.id
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="max-w-5xl mx-auto p-4">
        {tab === 'preflop' && <PreflopTab />}
        {tab === 'advice' && <AdviceTab />}
        {tab === 'equity' && <EquityTab />}
        {tab === 'practice' && <PracticeTab />}
        {tab === 'lessons' && <LessonsTab />}
      </main>
    </div>
  )
}

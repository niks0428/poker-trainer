import { useState, useEffect, useCallback } from 'react'
import {
  HAND_GRID, RANKS, RFI, RFI_POSITIONS, BB_VS,
  getRFIAction, getBBAction, rangePercent,
  randomHand, randomPosition, ALL_HANDS,
} from '../data/ranges'

// ─── Colours ────────────────────────────────────────────────────
const ACTION_BG = {
  R: '#15803d', // green  — open raise
  '3': '#7c3aed', // violet — 3-bet
  C: '#1d4ed8', // blue   — call
  F: '#1e293b', // dark   — fold
}
const ACTION_LABEL = { R: 'Open Raise', '3': '3-Bet', C: 'Call', F: 'Fold' }
const ACTION_TEXT = { R: '#bbf7d0', '3': '#ddd6fe', C: '#bfdbfe', F: '#64748b' }

// ─── Card display ────────────────────────────────────────────────
const SUIT_SYM = { s: '♠', h: '♥', d: '♦', c: '♣' }
const SUIT_COLOR = { s: '#e2e8f0', h: '#f87171', d: '#f87171', c: '#e2e8f0' }
const RANKS_FULL = { A:'A',K:'K',Q:'Q',J:'J',T:'10',9:'9',8:'8',7:'7',6:'6',5:'5',4:'4',3:'3',2:'2' }

function HandCard({ hand }) {
  if (!hand) return null
  const isPair = hand[0] === hand[1]
  const isSuited = hand.endsWith('s')
  const rank1 = hand[0], rank2 = hand[1]
  const suit = isSuited ? 's' : 'h'
  const suit2 = isSuited ? 's' : 'd'

  const Card = ({ rank, s }) => (
    <div className="w-20 h-28 rounded-xl border-2 border-slate-600 bg-[#1a2535] flex flex-col items-center justify-center shadow-xl">
      <div className="text-3xl font-black" style={{ color: SUIT_COLOR[s] }}>{RANKS_FULL[rank]}</div>
      <div className="text-2xl" style={{ color: SUIT_COLOR[s] }}>{SUIT_SYM[s]}</div>
    </div>
  )

  return (
    <div className="flex gap-3 justify-center">
      <Card rank={rank1} s={suit} />
      <Card rank={rank2} s={isPair ? suit2 : (isSuited ? suit : suit2)} />
    </div>
  )
}

// ─── Range Grid ──────────────────────────────────────────────────
function RangeGrid({ getAction }) {
  const [hovered, setHovered] = useState(null)

  return (
    <div className="overflow-x-auto">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 36px)', gap: '1px', minWidth: 'fit-content' }}>
        {HAND_GRID.flat().map((hand, idx) => {
          const action = getAction(hand)
          const isHovered = hovered === hand
          return (
            <div
              key={hand}
              onMouseEnter={() => setHovered(hand)}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: 36, height: 30,
                background: isHovered ? '#f59e0b' : ACTION_BG[action],
                borderRadius: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 700, letterSpacing: '-0.3px',
                color: isHovered ? '#111827' : (ACTION_TEXT[action] || '#64748b'),
                cursor: 'default',
                transition: 'background 0.1s',
                userSelect: 'none',
              }}
              title={`${hand} → ${ACTION_LABEL[action]}`}
            >
              {hand}
            </div>
          )
        })}
      </div>
      {hovered && (
        <div className="mt-2 text-xs text-center" style={{ color: ACTION_TEXT[getAction(hovered)] || '#94a3b8' }}>
          <span className="font-bold text-slate-200">{hovered}</span>
          {' → '}
          <span style={{ color: ACTION_BG[getAction(hovered)] === ACTION_BG.F ? '#64748b' : ACTION_TEXT[getAction(hovered)] }}>
            {ACTION_LABEL[getAction(hovered)]}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Legend ──────────────────────────────────────────────────────
function Legend({ actions }) {
  return (
    <div className="flex gap-3 flex-wrap mt-3">
      {actions.map(a => (
        <div key={a} className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-sm" style={{ background: ACTION_BG[a] }} />
          <span className="text-slate-400">{ACTION_LABEL[a]}</span>
        </div>
      ))}
    </div>
  )
}

// ─── CHART TAB ───────────────────────────────────────────────────
function ChartView() {
  const [scenario, setScenario] = useState('rfi')      // rfi | bb_vs_btn | bb_vs_co | bb_vs_utg
  const [rfiPos, setRfiPos] = useState('BTN')

  const SCENARIOS = [
    { id: 'rfi',       label: 'Open Raise (RFI)' },
    { id: 'bb_vs_btn', label: 'BB vs BTN raise' },
    { id: 'bb_vs_co',  label: 'BB vs CO raise' },
    { id: 'bb_vs_utg', label: 'BB vs UTG raise' },
  ]

  const getAction = useCallback((hand) => {
    if (scenario === 'rfi') return getRFIAction(hand, rfiPos)
    const raiser = scenario.replace('bb_vs_', '').toUpperCase()
    return getBBAction(hand, raiser)
  }, [scenario, rfiPos])

  const pct = scenario === 'rfi'
    ? rangePercent(RFI[rfiPos])
    : null

  const actions = scenario === 'rfi' ? ['R', 'F'] : ['3', 'C', 'F']

  return (
    <div>
      {/* Scenario selector */}
      <div className="flex gap-2 flex-wrap mb-4">
        {SCENARIOS.map(s => (
          <button key={s.id} onClick={() => setScenario(s.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              scenario === s.id ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}>{s.label}</button>
        ))}
      </div>

      {/* Position selector for RFI */}
      {scenario === 'rfi' && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-slate-400">Position:</span>
          <div className="flex gap-2">
            {RFI_POSITIONS.map(p => (
              <button key={p} onClick={() => setRfiPos(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                  rfiPos === p ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}>{p}</button>
            ))}
          </div>
          {pct && (
            <span className="ml-auto text-amber-400 font-bold text-sm">{pct}% of hands</span>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="bg-[#0f1923] rounded-xl p-4 border border-slate-700">
        <RangeGrid getAction={getAction} />
        <Legend actions={actions} />
        <p className="text-xs text-slate-600 mt-2">Hover a cell to see the hand action. Suited above diagonal · Offsuit below · Pairs on diagonal.</p>
      </div>
    </div>
  )
}

// ─── DRILL TAB ───────────────────────────────────────────────────
const STORAGE_KEY = 'poker_drill_stats_v1'

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}

function saveStats(stats) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)) } catch {}
}

function StatGrid({ stats }) {
  const entries = Object.entries(stats).sort((a, b) => {
    const wa = a[1].wrong / (a[1].total || 1)
    const wb = b[1].wrong / (b[1].total || 1)
    return wb - wa
  })
  if (!entries.length) return null

  return (
    <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-4">
      <div className="text-xs text-amber-400 font-bold mb-3 uppercase tracking-wide">📊 Your Weaknesses</div>
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {entries.map(([key, s]) => {
          const pct = Math.round((s.correct / (s.total || 1)) * 100)
          const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444'
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="w-20 text-slate-400 font-mono shrink-0">{key}</span>
              <div className="flex-1 bg-slate-800 rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
              </div>
              <span className="w-10 text-right font-bold" style={{ color }}>{pct}%</span>
              <span className="text-slate-500">{s.total}q</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DrillView() {
  const [drillMode, setDrillMode] = useState('rfi')   // rfi | bb_defence
  const [hand, setHand] = useState(null)
  const [position, setPosition] = useState(null)
  const [raiser, setRaiser] = useState(null)           // for bb_defence
  const [feedback, setFeedback] = useState(null)       // null | {correct, correct_action, chosen}
  const [stats, setStats] = useState(loadStats)
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0, streak: 0 })

  const deal = useCallback(() => {
    setFeedback(null)
    const h = randomHand()
    setHand(h)
    if (drillMode === 'rfi') {
      setPosition(randomPosition())
      setRaiser(null)
    } else {
      const raisers = ['UTG','CO','BTN']
      setRaiser(raisers[Math.floor(Math.random() * raisers.length)])
      setPosition('BB')
    }
  }, [drillMode])

  useEffect(() => { deal() }, [drillMode])

  const answer = (chosen) => {
    if (feedback) return
    let correct_action
    if (drillMode === 'rfi') {
      correct_action = getRFIAction(hand, position)
    } else {
      correct_action = getBBAction(hand, raiser)
    }

    const isCorrect = chosen === correct_action
    setFeedback({ correct: isCorrect, correct_action, chosen })

    // Update stats
    const newStats = { ...stats }
    const posKey = drillMode === 'rfi' ? position : `BB vs ${raiser}`
    if (!newStats[posKey]) newStats[posKey] = { correct: 0, wrong: 0, total: 0 }
    newStats[posKey].total++
    newStats[posKey][isCorrect ? 'correct' : 'wrong'] = (newStats[posKey][isCorrect ? 'correct' : 'wrong'] || 0) + 1
    setStats(newStats)
    saveStats(newStats)

    setSessionStats(s => ({
      total: s.total + 1,
      correct: s.correct + (isCorrect ? 1 : 0),
      streak: isCorrect ? s.streak + 1 : 0,
    }))
  }

  const resetStats = () => {
    setStats({})
    saveStats({})
    setSessionStats({ correct: 0, total: 0, streak: 0 })
  }

  const accuracy = sessionStats.total > 0
    ? Math.round((sessionStats.correct / sessionStats.total) * 100) : null

  const ACTIONS_RFI = [
    { id: 'R', label: 'RAISE', icon: '⬆️', style: 'bg-green-900/50 border-green-500 hover:bg-green-800/70 text-green-300' },
    { id: 'F', label: 'FOLD',  icon: '🚫', style: 'bg-red-900/50 border-red-600 hover:bg-red-800/70 text-red-300' },
  ]
  const ACTIONS_DEF = [
    { id: '3', label: '3-BET', icon: '⬆️⬆️', style: 'bg-violet-900/50 border-violet-500 hover:bg-violet-800/70 text-violet-300' },
    { id: 'C', label: 'CALL',  icon: '✅', style: 'bg-blue-900/50 border-blue-500 hover:bg-blue-800/70 text-blue-300' },
    { id: 'F', label: 'FOLD',  icon: '🚫', style: 'bg-red-900/50 border-red-600 hover:bg-red-800/70 text-red-300' },
  ]
  const actions = drillMode === 'rfi' ? ACTIONS_RFI : ACTIONS_DEF

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: Quiz */}
      <div>
        {/* Mode + Session stats */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex gap-2">
            {[['rfi','Open Range'],['bb_defence','BB Defence']].map(([id, label]) => (
              <button key={id} onClick={() => setDrillMode(id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  drillMode === id ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}>{label}</button>
            ))}
          </div>
          {sessionStats.total > 0 && (
            <div className="ml-auto flex gap-3 text-sm">
              <span className="text-green-400 font-bold">{accuracy}%</span>
              <span className="text-slate-400">{sessionStats.correct}/{sessionStats.total}</span>
              {sessionStats.streak > 1 && <span className="text-orange-400">🔥{sessionStats.streak}</span>}
            </div>
          )}
        </div>

        {/* Hand display */}
        {hand && (
          <div className={`bg-[#1a2535] rounded-xl border-2 p-6 text-center mb-4 transition-colors ${
            feedback
              ? feedback.correct ? 'border-green-500' : 'border-red-500'
              : 'border-slate-700'
          }`}>
            <div className="text-xs text-slate-400 mb-1 uppercase tracking-wide">
              {drillMode === 'rfi'
                ? `You're in ${position} · No one has acted`
                : `You're in BB · ${raiser} raised to 2.5bb`}
            </div>
            <div className="text-amber-400 font-bold text-lg mb-4">{hand}</div>
            <HandCard hand={hand} />

            {feedback && (
              <div className={`mt-4 rounded-lg px-4 py-2 text-sm font-bold ${
                feedback.correct ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
              }`}>
                {feedback.correct ? '✅ Correct!' : `❌ Wrong — correct: ${ACTION_LABEL[feedback.correct_action]}`}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className={`grid gap-3 mb-4 ${drillMode === 'rfi' ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {actions.map(a => (
            <button
              key={a.id}
              onClick={() => answer(a.id)}
              disabled={!!feedback}
              className={`border-2 rounded-xl py-4 font-bold uppercase tracking-wide transition-all cursor-pointer disabled:opacity-50 ${a.style} ${
                feedback?.correct_action === a.id ? 'ring-2 ring-white scale-105' : ''
              } ${feedback?.chosen === a.id && !feedback?.correct ? 'opacity-50' : ''}`}
            >
              <div className="text-xl mb-1">{a.icon}</div>
              {a.label}
            </button>
          ))}
        </div>

        <button
          onClick={deal}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl transition-colors cursor-pointer"
        >
          {feedback ? '🔄 Next Hand' : '🃏 Deal Hand'}
        </button>
      </div>

      {/* Right: Stats + Range hint */}
      <div className="space-y-4">
        {/* Range hint */}
        {hand && feedback && (
          <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-4">
            <div className="text-xs text-amber-400 font-bold mb-3 uppercase tracking-wide">
              Range Reference — {drillMode === 'rfi' ? position : `BB vs ${raiser}`}
            </div>
            <div style={{ transform: 'scale(0.75)', transformOrigin: 'top left', width: '133%' }}>
              <RangeGrid getAction={h =>
                drillMode === 'rfi'
                  ? getRFIAction(h, position)
                  : getBBAction(h, raiser)
              } />
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {(drillMode === 'rfi' ? ['R','F'] : ['3','C','F']).map(a => (
                <div key={a} className="flex items-center gap-1 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: ACTION_BG[a] }} />
                  <span className="text-slate-400">{ACTION_LABEL[a]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weakness tracker */}
        <StatGrid stats={stats} />

        {Object.keys(stats).length > 0 && (
          <button onClick={resetStats}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer w-full text-center">
            Reset stats
          </button>
        )}

        {!feedback && !Object.keys(stats).length && (
          <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-8 text-center text-slate-500">
            <p className="text-3xl mb-3">📊</p>
            <p className="text-sm">Your weakness stats will appear here<br/>after a few hands</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Tab ────────────────────────────────────────────────────
export default function PreflopTab() {
  const [view, setView] = useState('chart')

  return (
    <div className="mt-4">
      <div className="flex gap-3 mb-5">
        {[['chart','📊 Range Charts'],['drill','⚡ Preflop Drill']].map(([id, label]) => (
          <button key={id} onClick={() => setView(id)}
            className={`px-5 py-2 rounded-xl font-bold text-sm transition-colors cursor-pointer ${
              view === id
                ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20'
                : 'bg-[#1a2535] border border-slate-700 text-slate-300 hover:border-slate-500'
            }`}>{label}</button>
        ))}
      </div>
      {view === 'chart' ? <ChartView /> : <DrillView />}
    </div>
  )
}

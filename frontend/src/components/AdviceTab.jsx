import { useState } from 'react'
import CardPicker, { CardDisplay } from './CardPicker'
import { fetchAdvice } from '../api'

const POSITIONS = ['BTN', 'CO', 'MP', 'UTG', 'SB', 'BB']
const ACTION_COLORS = {
  fold: 'bg-red-900 border-red-500 text-red-200',
  call: 'bg-blue-900 border-blue-500 text-blue-200',
  raise: 'bg-green-900 border-green-500 text-green-200',
  check: 'bg-slate-700 border-slate-500 text-slate-200',
}
const ACTION_ICONS = { fold: '🚫', call: '✅', raise: '⬆️', check: '☑️' }

export default function AdviceTab() {
  const [allSelected, setAllSelected] = useState([])
  const [position, setPosition] = useState('BTN')
  const [potSize, setPotSize] = useState(10)
  const [stackSize, setStackSize] = useState(100)
  const [betToCall, setBetToCall] = useState(0)
  const [numOpponents, setNumOpponents] = useState(1)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const holeCards = allSelected.slice(0, 2)
  const boardCards = allSelected.slice(2)

  const getStreet = () => {
    if (boardCards.length === 0) return 'preflop'
    if (boardCards.length === 3) return 'flop'
    if (boardCards.length === 4) return 'turn'
    return 'river'
  }

  const toggleCard = (card) => {
    setAllSelected(prev =>
      prev.includes(card) ? prev.filter(c => c !== card) : [...prev, card]
    )
  }

  const removeCard = (card) => {
    setAllSelected(prev => prev.filter(c => c !== card))
  }

  const reset = () => {
    setAllSelected([])
    setResult(null)
    setError('')
  }

  const analyze = async () => {
    if (holeCards.length < 2) { setError('Select 2 hole cards first'); return }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      setResult(await fetchAdvice({
        hole_cards: holeCards,
        board_cards: boardCards,
        position, pot_size: potSize, stack_size: stackSize,
        bet_to_call: betToCall, num_opponents: numOpponents,
        street: getStreet(), notes,
      }))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const potOdds = betToCall > 0 ? ((betToCall / (potSize + betToCall)) * 100).toFixed(1) : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      {/* Left: Inputs */}
      <div>
        <h2 className="text-lg font-bold text-amber-400 mb-3">Hand Setup</h2>

        <div className="mb-4">
          <CardDisplay cards={holeCards} onRemove={removeCard} label="Hole Cards" max={2} />
          <CardDisplay cards={boardCards} onRemove={removeCard} label="Board" max={5} />
        </div>

        <CardPicker selected={allSelected} onToggle={toggleCard} maxCards={7} />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Position</label>
            <select
              value={position}
              onChange={e => setPosition(e.target.value)}
              className="w-full bg-[#1a2535] border border-slate-600 rounded-lg px-3 py-2 text-sm"
            >
              {POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Opponents</label>
            <input type="number" min="1" max="8" value={numOpponents}
              onChange={e => setNumOpponents(Number(e.target.value))}
              className="w-full bg-[#1a2535] border border-slate-600 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Pot Size ($)</label>
            <input type="number" min="0" value={potSize}
              onChange={e => setPotSize(Number(e.target.value))}
              className="w-full bg-[#1a2535] border border-slate-600 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Stack Size ($)</label>
            <input type="number" min="0" value={stackSize}
              onChange={e => setStackSize(Number(e.target.value))}
              className="w-full bg-[#1a2535] border border-slate-600 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Bet to Call ($)</label>
            <input type="number" min="0" value={betToCall}
              onChange={e => setBetToCall(Number(e.target.value))}
              className="w-full bg-[#1a2535] border border-slate-600 rounded-lg px-3 py-2 text-sm"
            />
            {potOdds && <p className="text-xs text-slate-400 mt-1">Pot odds: {potOdds}%</p>}
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Street</label>
            <div className="w-full bg-[#1a2535] border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-400 font-medium capitalize">
              {getStreet()}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <label className="text-xs text-slate-400 block mb-1">Extra context (optional)</label>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. villain is tight-aggressive, 3-bet pot..."
            className="w-full bg-[#1a2535] border border-slate-600 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={analyze}
            disabled={loading || holeCards.length < 2}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-3 rounded-xl transition-colors cursor-pointer"
          >
            {loading ? '🤔 Analyzing...' : '🎯 Get GTO Advice'}
          </button>
          <button
            onClick={reset}
            className="px-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors cursor-pointer text-sm"
          >
            Reset
          </button>
        </div>

        {error && (
          <div className="mt-3 bg-red-900/40 border border-red-500 rounded-xl p-3 text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Right: Result */}
      <div>
        <h2 className="text-lg font-bold text-amber-400 mb-3">GTO Analysis</h2>
        {!result && !loading && (
          <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-8 text-center text-slate-500">
            <p className="text-4xl mb-3">🃏</p>
            <p>Select your cards and click<br/><strong className="text-slate-400">Get GTO Advice</strong></p>
          </div>
        )}
        {loading && (
          <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-8 text-center text-slate-400">
            <div className="animate-pulse text-4xl mb-3">🤔</div>
            <p>Consulting GTO solver...</p>
          </div>
        )}
        {result && (
          <div className="space-y-3">
            {/* Action */}
            <div className={`rounded-xl border-2 p-4 ${ACTION_COLORS[result.action] || ACTION_COLORS.check}`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{ACTION_ICONS[result.action] || '🎲'}</span>
                <div>
                  <div className="text-2xl font-black uppercase tracking-wide">{result.action}</div>
                  {result.sizing && <div className="text-sm opacity-80">Sizing: {result.sizing}</div>}
                </div>
                {result.equity_estimate && (
                  <div className="ml-auto text-right">
                    <div className="text-xs opacity-70">Equity vs range</div>
                    <div className="text-xl font-bold">{result.equity_estimate}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Reasoning */}
            <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-4">
              <div className="text-xs text-amber-400 font-bold mb-2 uppercase tracking-wide">Reasoning</div>
              <p className="text-sm leading-relaxed text-slate-300">{result.reasoning}</p>
            </div>

            {/* Key Factors */}
            {result.key_factors?.length > 0 && (
              <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-4">
                <div className="text-xs text-amber-400 font-bold mb-2 uppercase tracking-wide">Key Factors</div>
                <ul className="space-y-1">
                  {result.key_factors.map((f, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-amber-500">▸</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Common Mistake */}
            {result.common_mistake && (
              <div className="bg-red-900/20 rounded-xl border border-red-800 p-4">
                <div className="text-xs text-red-400 font-bold mb-2 uppercase tracking-wide">⚠️ Common Mistake</div>
                <p className="text-sm text-slate-300">{result.common_mistake}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

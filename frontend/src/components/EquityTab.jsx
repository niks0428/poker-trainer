import { useState, useCallback } from 'react'
import CardPicker, { CardDisplay } from './CardPicker'

// Minimal hand evaluator for Monte Carlo
const RANKS = 'AKQJT98765432'
const rank = c => RANKS.indexOf(c[0] === 'T' ? 'T' : c[0])
const suit = c => c.slice(-1)

function handRank(cards) {
  // cards: 5-7 cards, return best 5-card hand rank (higher = better)
  if (cards.length < 5) return 0
  const combos = getCombos(cards, 5)
  return Math.max(...combos.map(evaluate5))
}

function getCombos(arr, k) {
  if (k === 0) return [[]]
  if (arr.length < k) return []
  const [first, ...rest] = arr
  return [
    ...getCombos(rest, k - 1).map(c => [first, ...c]),
    ...getCombos(rest, k),
  ]
}

function evaluate5(hand) {
  const ranks = hand.map(c => rank(c)).sort((a, b) => a - b)
  const suits = hand.map(c => suit(c))
  const isFlush = suits.every(s => s === suits[0])
  const rankCounts = {}
  ranks.forEach(r => { rankCounts[r] = (rankCounts[r] || 0) + 1 })
  const counts = Object.values(rankCounts).sort((a, b) => b - a)
  const uniqueRanks = [...new Set(ranks)]
  const isStraight = uniqueRanks.length === 5 &&
    (uniqueRanks[4] - uniqueRanks[0] === 4 ||
      (uniqueRanks.join(',') === '0,1,2,3,12')) // A-2-3-4-5

  const topRank = ranks[0] // lowest index = highest card (A=0)
  const base = (13 - topRank) // higher rank card = higher score

  if (isFlush && isStraight) return 800000 + base // straight flush
  if (counts[0] === 4) return 700000 + base        // four of a kind
  if (counts[0] === 3 && counts[1] === 2) return 600000 + base // full house
  if (isFlush) return 500000 + base                // flush
  if (isStraight) return 400000 + base             // straight
  if (counts[0] === 3) return 300000 + base        // three of a kind
  if (counts[0] === 2 && counts[1] === 2) return 200000 + base // two pair
  if (counts[0] === 2) return 100000 + base        // one pair
  return base                                       // high card
}

const ALL_RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
const ALL_SUITS = ['s', 'h', 'd', 'c']
const FULL_DECK = ALL_RANKS.flatMap(r => ALL_SUITS.map(s => r + s))

function monteCarlo(heroCards, villainCards, boardCards, iterations = 8000) {
  const fixed = [...heroCards, ...villainCards, ...boardCards]
  const deck = FULL_DECK.filter(c => !fixed.includes(c))
  let wins = 0, ties = 0, losses = 0

  for (let i = 0; i < iterations; i++) {
    // shuffle remaining deck
    const d = [...deck]
    for (let j = d.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [d[j], d[k]] = [d[k], d[j]]
    }
    const neededBoard = 5 - boardCards.length
    const runout = d.slice(0, neededBoard)
    const board = [...boardCards, ...runout]

    const heroRank = handRank([...heroCards, ...board])
    const villainRank = handRank([...villainCards, ...board])

    if (heroRank > villainRank) wins++
    else if (heroRank === villainRank) ties++
    else losses++
  }

  return {
    win: ((wins / iterations) * 100).toFixed(1),
    tie: ((ties / iterations) * 100).toFixed(1),
    loss: ((losses / iterations) * 100).toFixed(1),
    iterations,
  }
}

function EquityBar({ win, tie, loss }) {
  return (
    <div className="mt-4">
      <div className="flex rounded-full overflow-hidden h-6 text-xs font-bold">
        <div className="bg-green-600 flex items-center justify-center transition-all" style={{ width: `${win}%` }}>
          {win > 8 ? `${win}%` : ''}
        </div>
        <div className="bg-yellow-600 flex items-center justify-center transition-all" style={{ width: `${tie}%` }}>
          {tie > 5 ? `${tie}%` : ''}
        </div>
        <div className="bg-red-700 flex items-center justify-center transition-all" style={{ width: `${loss}%` }}>
          {loss > 8 ? `${loss}%` : ''}
        </div>
      </div>
      <div className="flex justify-between text-xs mt-1 text-slate-400">
        <span className="text-green-400">Win: {win}%</span>
        <span className="text-yellow-400">Tie: {tie}%</span>
        <span className="text-red-400">Loss: {loss}%</span>
      </div>
    </div>
  )
}

export default function EquityTab() {
  const [heroCards, setHeroCards] = useState([])
  const [villainCards, setVillainCards] = useState([])
  const [boardCards, setBoardCards] = useState([])
  const [selecting, setSelecting] = useState('hero') // hero | villain | board
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)

  const allSelected = [...heroCards, ...villainCards, ...boardCards]

  const getCurrentMax = () => {
    if (selecting === 'hero') return 2 - heroCards.length
    if (selecting === 'villain') return 2 - villainCards.length
    return 5 - boardCards.length
  }

  const toggleCard = (card) => {
    const rem = (arr) => arr.filter(c => c !== card)
    if (heroCards.includes(card)) { setHeroCards(rem); return }
    if (villainCards.includes(card)) { setVillainCards(rem); return }
    if (boardCards.includes(card)) { setBoardCards(rem); return }
    if (getCurrentMax() <= 0) return
    if (selecting === 'hero' && heroCards.length < 2) setHeroCards(p => [...p, card])
    else if (selecting === 'villain' && villainCards.length < 2) setVillainCards(p => [...p, card])
    else if (selecting === 'board' && boardCards.length < 5) setBoardCards(p => [...p, card])
  }

  const run = useCallback(() => {
    if (heroCards.length < 2 || villainCards.length < 2) return
    setRunning(true)
    setResult(null)
    setTimeout(() => {
      setResult(monteCarlo(heroCards, villainCards, boardCards, 10000))
      setRunning(false)
    }, 50)
  }, [heroCards, villainCards, boardCards])

  const reset = () => {
    setHeroCards([]); setVillainCards([]); setBoardCards([]); setResult(null)
  }

  const SelectorBtn = ({ id, label }) => (
    <button
      onClick={() => setSelecting(id)}
      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
        selecting === id ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <div>
        <h2 className="text-lg font-bold text-amber-400 mb-3">Equity Calculator</h2>

        <div className="mb-4 space-y-2">
          <CardDisplay cards={heroCards} onRemove={c => setHeroCards(p => p.filter(x => x !== c))} label="Hero Hand" max={2} />
          <CardDisplay cards={villainCards} onRemove={c => setVillainCards(p => p.filter(x => x !== c))} label="Villain Hand" max={2} />
          <CardDisplay cards={boardCards} onRemove={c => setBoardCards(p => p.filter(x => x !== c))} label="Board" max={5} />
        </div>

        <div className="mb-3">
          <div className="text-xs text-slate-400 mb-1">Adding cards to:</div>
          <div className="flex gap-2">
            <SelectorBtn id="hero" label="Hero" />
            <SelectorBtn id="villain" label="Villain" />
            <SelectorBtn id="board" label="Board" />
          </div>
        </div>

        <CardPicker selected={allSelected} onToggle={toggleCard} maxCards={9} />

        <div className="flex gap-3 mt-4">
          <button
            onClick={run}
            disabled={running || heroCards.length < 2 || villainCards.length < 2}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-3 rounded-xl transition-colors cursor-pointer"
          >
            {running ? '⚙️ Running...' : '📊 Run 10,000 Simulations'}
          </button>
          <button onClick={reset} className="px-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors cursor-pointer text-sm">
            Reset
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-amber-400 mb-3">Results</h2>
        {!result && !running && (
          <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-8 text-center text-slate-500">
            <p className="text-4xl mb-3">📊</p>
            <p>Select Hero + Villain hands<br/>and run the simulation</p>
          </div>
        )}
        {running && (
          <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-8 text-center text-slate-400">
            <div className="animate-spin text-4xl mb-3">⚙️</div>
            <p>Running Monte Carlo...</p>
          </div>
        )}
        {result && (
          <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-4">
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div className="bg-green-900/40 rounded-xl p-3 border border-green-700">
                <div className="text-2xl font-black text-green-400">{result.win}%</div>
                <div className="text-xs text-slate-400">Win</div>
              </div>
              <div className="bg-yellow-900/40 rounded-xl p-3 border border-yellow-700">
                <div className="text-2xl font-black text-yellow-400">{result.tie}%</div>
                <div className="text-xs text-slate-400">Tie</div>
              </div>
              <div className="bg-red-900/40 rounded-xl p-3 border border-red-700">
                <div className="text-2xl font-black text-red-400">{result.loss}%</div>
                <div className="text-xs text-slate-400">Loss</div>
              </div>
            </div>

            <EquityBar win={parseFloat(result.win)} tie={parseFloat(result.tie)} loss={parseFloat(result.loss)} />

            <p className="text-xs text-slate-500 mt-3 text-center">
              {result.iterations.toLocaleString()} simulations · random runouts
            </p>

            <div className="mt-4 bg-[#0f1923] rounded-xl p-3 border border-slate-700">
              <div className="text-xs text-amber-400 font-bold mb-2">Pot Odds Helper</div>
              <div className="text-sm text-slate-300">
                If villain bets <strong className="text-white">50% pot</strong>, you need <strong className="text-amber-400">25%</strong> equity to call profitably.
                {parseFloat(result.win) + parseFloat(result.tie) / 2 >= 25
                  ? <span className="text-green-400"> ✓ You have enough equity.</span>
                  : <span className="text-red-400"> ✗ You lack equity for a 50% pot bet call.</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

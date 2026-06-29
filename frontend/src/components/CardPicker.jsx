const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
const SUITS = ['s', 'h', 'd', 'c']
const SUIT_SYMBOLS = { s: '♠', h: '♥', d: '♦', c: '♣' }
const SUIT_COLORS = { s: 'text-slate-200', h: 'text-red-400', d: 'text-red-400', c: 'text-slate-200' }

export function cardLabel(card) {
  if (!card) return ''
  const rank = card.slice(0, -1)
  const suit = card.slice(-1)
  return `${rank}${SUIT_SYMBOLS[suit] || suit}`
}

export function CardDisplay({ cards, onRemove, label, max }) {
  return (
    <div className="mb-3">
      <div className="text-xs text-slate-400 mb-1">{label} ({cards.length}/{max})</div>
      <div className="flex gap-2 flex-wrap min-h-[52px]">
        {cards.map(c => {
          const suit = c.slice(-1)
          const rank = c.slice(0, -1)
          return (
            <button
              key={c}
              onClick={() => onRemove(c)}
              title="Click to remove"
              className={`w-10 h-14 rounded-lg border-2 border-slate-600 bg-[#1a2535] flex flex-col items-center justify-center text-sm font-bold leading-none cursor-pointer hover:border-red-400 hover:bg-red-900/20 transition-colors ${SUIT_COLORS[suit]}`}
            >
              <span>{rank}</span>
              <span className="text-base">{SUIT_SYMBOLS[suit]}</span>
            </button>
          )
        })}
        {cards.length < max && (
          <div className="w-10 h-14 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-600 text-xl">
            ?
          </div>
        )}
      </div>
    </div>
  )
}

export default function CardPicker({ selected, onToggle, maxCards = 7 }) {
  return (
    <div className="bg-[#1a2535] rounded-xl p-4 border border-slate-700">
      <p className="text-xs text-slate-400 mb-3">Click cards to select · Click selected card to deselect</p>
      <div className="grid gap-1">
        {SUITS.map(suit => (
          <div key={suit} className="flex gap-1">
            {RANKS.map(rank => {
              const card = rank + suit
              const isSelected = selected.includes(card)
              return (
                <button
                  key={card}
                  onClick={() => onToggle(card)}
                  disabled={!isSelected && selected.length >= maxCards}
                  className={`w-9 h-12 rounded text-xs font-bold leading-none flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-900 border-2 border-amber-300 scale-110 shadow-lg shadow-amber-500/30'
                      : selected.length >= maxCards
                      ? 'bg-[#0f1923] text-slate-600 border border-slate-700 cursor-not-allowed opacity-40'
                      : `bg-[#0f1923] border border-slate-600 hover:border-slate-400 hover:scale-105 ${SUIT_COLORS[suit]}`
                  }`}
                >
                  <span>{rank}</span>
                  <span className="text-sm">{SUIT_SYMBOLS[suit]}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

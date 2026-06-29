// GTO 6-max 100bb Cash Game Preflop Ranges
// Source: solver consensus (GTO Wizard, Upswing, solver runs)

export const RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2']

export function cellToHand(r, c) {
  if (r === c) return RANKS[r] + RANKS[r]
  if (r < c) return RANKS[r] + RANKS[c] + 's'
  return RANKS[c] + RANKS[r] + 'o'
}

export const HAND_GRID = Array.from({length: 13}, (_, r) =>
  Array.from({length: 13}, (_, c) => cellToHand(r, c))
)

// Flat list of all 169 hand types
export const ALL_HANDS = HAND_GRID.flat()

// ─── RFI Open Ranges ────────────────────────────────────────────

const UTG_OPEN = new Set([
  // Pairs 66+
  'AA','KK','QQ','JJ','TT','99','88','77','66',
  // Suited aces
  'AKs','AQs','AJs','ATs','A9s','A8s','A5s','A4s',
  // Suited kings
  'KQs','KJs','KTs',
  // Suited queens/jacks
  'QJs','QTs','JTs',
  // Suited connectors
  'T9s','98s','87s','76s',
  // Offsuit broadway
  'AKo','AQo','AJo','KQo','KJo',
])

const MP_OPEN = new Set([
  ...UTG_OPEN,
  // Extra pairs
  '55',
  // All suited aces
  'A7s','A6s','A3s','A2s',
  // Extra kings / queens / jacks
  'K9s','Q9s','J9s',
  // Extra connectors
  'T8s','65s','54s',
  // Extra offsuit
  'ATo','KTo','QJo',
])

const CO_OPEN = new Set([
  ...MP_OPEN,
  // Extra pairs
  '44','33',
  // Extra kings / queens / jacks
  'K8s','K7s','Q8s','J8s',
  // Extra suited connectors
  'T7s','97s','86s','75s','64s','53s','43s',
  // Extra offsuit
  'A9o','A8o','QTo','JTo','T9o','J9o','Q9o',
])

const BTN_OPEN = new Set([
  ...CO_OPEN,
  // Extra pairs
  '22',
  // Extra kings
  'K6s','K5s','K4s','K3s','K2s',
  // Extra queens / jacks
  'Q7s','Q6s','Q5s','J7s',
  // Extra tens / nines / eights
  'T6s','96s','85s',
  // Extra sevens / sixes / fives
  '75s','64s','53s', // already in CO... re-add is fine (Set deduplicates)
  '74s','63s','52s',
  // Extra offsuit aces
  'A7o','A6o','A5o','A4o','A3o','A2o',
  // Extra offsuit kings
  'K9o','K8o',
  // Extra offsuit queens / jacks / tens
  'Q9o','J9o','T8o','98o',
])

const SB_OPEN = new Set([
  ...BTN_OPEN,
  // SB vs BB: slightly wider on some suited combos
  'Q4s','J6s','T5s','T6s','97s',
  '74s','73s',
  '97o',
])

export const RFI = { UTG: UTG_OPEN, MP: MP_OPEN, CO: CO_OPEN, BTN: BTN_OPEN, SB: SB_OPEN }

export const RFI_POSITIONS = ['UTG','MP','CO','BTN','SB']

// ─── BB Defence Ranges ──────────────────────────────────────────
// Actions: '3' = 3-bet, 'C' = call, 'F' = fold

function makeDefence(threeBets, calls) {
  const map = {}
  for (const h of threeBets) map[h] = '3'
  for (const h of calls) map[h] = 'C'
  return map
}

const BB_VS_BTN = makeDefence(
  // 3-bet (value + bluff)
  ['AA','KK','QQ','JJ','TT','99','AKs','AQs','AJs','A5s','A4s','A3s','AKo','AQo','AJo'],
  // Call
  ['88','77','66','55','44','33','22',
   'ATs','A9s','A8s','A7s','A6s','A2s',
   'KQs','KJs','KTs','K9s',
   'QJs','QTs','Q9s','JTs','J9s',
   'T9s','T8s','98s','97s','87s','86s','76s','75s','65s','64s','54s',
   'ATo','A9o','A8o','KQo','KJo','KTo','QJo','QTo','JTo','T9o','98o','87o'],
)

const BB_VS_CO = makeDefence(
  ['AA','KK','QQ','JJ','TT','AKs','AQs','AJs','A5s','A4s','AKo','AQo'],
  ['99','88','77','66','55','44','33','22',
   'ATs','A9s','A8s','A7s','A6s','A3s','A2s',
   'KQs','KJs','KTs','K9s',
   'QJs','QTs','Q9s','JTs','J9s',
   'T9s','98s','87s','76s','65s',
   'AJo','ATo','A9o','KQo','KJo','QJo','JTo','T9o'],
)

const BB_VS_UTG = makeDefence(
  ['AA','KK','QQ','JJ','AKs','AQs','A5s','AKo','AQo'],
  ['TT','99','88','77','66','55','44','33','22',
   'AJs','ATs','A9s','A8s','A7s','A6s',
   'KQs','KJs','KTs',
   'QJs','QTs','JTs',
   'T9s','98s','87s','76s',
   'AJo','ATo','KQo','KJo'],
)

export const BB_VS = { BTN: BB_VS_BTN, CO: BB_VS_CO, UTG: BB_VS_UTG }

// ─── Utility ─────────────────────────────────────────────────────

export function getRFIAction(hand, pos) {
  return RFI[pos]?.has(hand) ? 'R' : 'F'
}

export function getBBAction(hand, raiserPos) {
  return BB_VS[raiserPos]?.[hand] || 'F'
}

export function countCombos(set) {
  let n = 0
  for (const h of set) {
    if (h[0] === h[1]) n += 6         // pair
    else if (h.endsWith('s')) n += 4   // suited
    else n += 12                       // offsuit
  }
  return n
}

export function rangePercent(set) {
  return ((countCombos(set) / 1326) * 100).toFixed(1)
}

// Random hand for drill (weighted by combo count)
const HAND_WEIGHTS = ALL_HANDS.map(h => {
  if (h[0] === h[1]) return 6
  if (h.endsWith('s')) return 4
  return 12
})
const TOTAL_WEIGHT = HAND_WEIGHTS.reduce((a, b) => a + b, 0)

export function randomHand() {
  let r = Math.random() * TOTAL_WEIGHT
  for (let i = 0; i < ALL_HANDS.length; i++) {
    r -= HAND_WEIGHTS[i]
    if (r <= 0) return ALL_HANDS[i]
  }
  return ALL_HANDS[ALL_HANDS.length - 1]
}

export function randomPosition(positions = RFI_POSITIONS) {
  return positions[Math.floor(Math.random() * positions.length)]
}

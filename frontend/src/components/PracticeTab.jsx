import { useState } from 'react'
import { generateScenario, evaluateAnswer } from '../api'
import { CardDisplay } from './CardPicker'

const DIFFICULTIES = ['easy', 'medium', 'hard']
const TOPICS = ['any', 'preflop', 'postflop', 'bluffing', 'value']
const ACTIONS = ['fold', 'call', 'check', 'raise']

const ACTION_STYLES = {
  fold:  'bg-red-900/40 border-red-600 hover:bg-red-800/60 text-red-200',
  call:  'bg-blue-900/40 border-blue-600 hover:bg-blue-800/60 text-blue-200',
  check: 'bg-slate-700/60 border-slate-500 hover:bg-slate-600/60 text-slate-200',
  raise: 'bg-green-900/40 border-green-600 hover:bg-green-800/60 text-green-200',
}

const ACTION_ICONS = { fold: '🚫', call: '✅', check: '☑️', raise: '⬆️' }

const GRADE_STYLES = {
  Excellent: 'bg-green-900/50 border-green-500 text-green-300',
  Good:      'bg-blue-900/50 border-blue-500 text-blue-300',
  Okay:      'bg-yellow-900/50 border-yellow-500 text-yellow-300',
  Wrong:     'bg-red-900/50 border-red-500 text-red-300',
}
const GRADE_ICONS = { Excellent: '🏆', Good: '👍', Okay: '😐', Wrong: '❌' }

function StatBadge({ label, value, color }) {
  return (
    <div className={`rounded-xl border px-4 py-2 text-center ${color}`}>
      <div className="text-xl font-black">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  )
}

export default function PracticeTab() {
  const [difficulty, setDifficulty] = useState('medium')
  const [topic, setTopic] = useState('any')
  const [scenario, setScenario] = useState(null)
  const [loading, setLoading] = useState(false)
  const [chosen, setChosen] = useState(null)
  const [result, setResult] = useState(null)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0 })

  const fetchScenario = async () => {
    setLoading(true)
    setScenario(null)
    setChosen(null)
    setResult(null)
    setError('')
    try {
      const data = await generateScenario({ difficulty, topic })
      setScenario(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async (action) => {
    if (evaluating || result) return
    setChosen(action)
    setEvaluating(true)
    try {
      const data = await evaluateAnswer({ scenario, chosen_action: action })
      setResult(data)
      setStats(s => ({
        total: s.total + 1,
        correct: s.correct + (data.correct ? 1 : 0),
        streak: data.correct ? s.streak + 1 : 0,
      }))
    } catch (e) {
      setError(e.message)
    } finally {
      setEvaluating(false)
    }
  }

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0

  return (
    <div className="mt-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatBadge label="Accuracy" value={`${accuracy}%`} color="bg-amber-900/30 border-amber-700 text-amber-300" />
        <StatBadge label="Correct" value={`${stats.correct}/${stats.total}`} color="bg-green-900/30 border-green-700 text-green-300" />
        <StatBadge label="Streak" value={`🔥${stats.streak}`} color="bg-orange-900/30 border-orange-700 text-orange-300" />
      </div>

      {/* Controls */}
      <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <div className="text-xs text-slate-400 mb-1">Difficulty</div>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors cursor-pointer ${
                    difficulty === d ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Focus</div>
            <div className="flex gap-2 flex-wrap">
              {TOPICS.map(t => (
                <button key={t} onClick={() => setTopic(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors cursor-pointer ${
                    topic === t ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}>{t}</button>
              ))}
            </div>
          </div>
          <button
            onClick={fetchScenario}
            disabled={loading}
            className="ml-auto bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold px-6 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            {loading ? '🎲 Dealing...' : scenario ? '🔄 Next Hand' : '🎲 Deal Hand'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-500 rounded-xl p-3 text-red-300 text-sm mb-4">{error}</div>
      )}

      {loading && (
        <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-12 text-center text-slate-400">
          <div className="animate-bounce text-4xl mb-3">🃏</div>
          <p>Generating scenario...</p>
        </div>
      )}

      {scenario && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Scenario */}
          <div className="space-y-3">
            <div className="bg-[#1a2535] rounded-xl border border-amber-700/50 p-4">
              <div className="text-amber-400 font-bold text-sm uppercase tracking-wide mb-3">
                📋 {scenario.title}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">{scenario.context}</p>

              <CardDisplay cards={scenario.hole_cards || []} onRemove={() => {}} label="Your Hand" max={2} />
              {scenario.board_cards?.length > 0 && (
                <CardDisplay cards={scenario.board_cards} onRemove={() => {}} label="Board" max={5} />
              )}

              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                <div className="bg-[#0f1923] rounded-lg p-2">
                  <span className="text-slate-400">Position: </span>
                  <span className="text-amber-400 font-bold">{scenario.position}</span>
                </div>
                <div className="bg-[#0f1923] rounded-lg p-2">
                  <span className="text-slate-400">Street: </span>
                  <span className="text-amber-400 font-bold capitalize">{scenario.street}</span>
                </div>
                <div className="bg-[#0f1923] rounded-lg p-2">
                  <span className="text-slate-400">Pot: </span>
                  <span className="text-white font-bold">${scenario.pot_size}</span>
                </div>
                <div className="bg-[#0f1923] rounded-lg p-2">
                  <span className="text-slate-400">To call: </span>
                  <span className="text-white font-bold">${scenario.bet_to_call}</span>
                  {scenario.bet_to_call > 0 && (
                    <span className="text-slate-400 text-xs ml-1">
                      ({((scenario.bet_to_call / (scenario.pot_size + scenario.bet_to_call)) * 100).toFixed(0)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {!result && (
              <div>
                <div className="text-xs text-slate-400 mb-2">What's your move?</div>
                <div className="grid grid-cols-2 gap-3">
                  {ACTIONS.filter(a => !(a === 'call' && scenario.bet_to_call === 0) && !(a === 'check' && scenario.bet_to_call > 0)).map(action => (
                    <button
                      key={action}
                      onClick={() => submitAnswer(action)}
                      disabled={evaluating}
                      className={`border-2 rounded-xl py-4 text-sm font-bold uppercase tracking-wide transition-all cursor-pointer disabled:opacity-50 ${ACTION_STYLES[action]} ${chosen === action ? 'ring-2 ring-white' : ''}`}
                    >
                      <div className="text-2xl mb-1">{ACTION_ICONS[action]}</div>
                      {action}
                    </button>
                  ))}
                </div>
                {evaluating && <p className="text-center text-slate-400 text-sm mt-3 animate-pulse">Evaluating...</p>}
              </div>
            )}
          </div>

          {/* Result */}
          <div>
            {!result && !evaluating && (
              <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-8 text-center text-slate-500 h-full flex flex-col items-center justify-center">
                <p className="text-4xl mb-3">🤔</p>
                <p>Choose your action<br/>to see the GTO answer</p>
              </div>
            )}

            {result && (
              <div className="space-y-3">
                {/* Grade */}
                <div className={`rounded-xl border-2 p-4 ${GRADE_STYLES[result.grade] || GRADE_STYLES.Okay}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{GRADE_ICONS[result.grade]}</span>
                    <div>
                      <div className="text-xl font-black">{result.grade}</div>
                      <div className="text-sm opacity-80">
                        You chose <strong className="uppercase">{chosen}</strong>
                        {result.correct
                          ? ' — correct!'
                          : ` · Correct: ${ACTION_ICONS[scenario.correct_action]} ${scenario.correct_action?.toUpperCase()} ${scenario.correct_sizing || ''}`}
                      </div>
                    </div>
                    {result.ev_impact && (
                      <div className="ml-auto text-right">
                        <div className="text-xs opacity-70">EV impact</div>
                        <div className="font-bold">{result.ev_impact}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feedback */}
                <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-4">
                  <div className="text-xs text-amber-400 font-bold mb-2 uppercase tracking-wide">Coaching Feedback</div>
                  <p className="text-sm text-slate-300 leading-relaxed">{result.feedback}</p>
                </div>

                {/* GTO explanation */}
                <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-4">
                  <div className="text-xs text-amber-400 font-bold mb-2 uppercase tracking-wide">GTO Explanation</div>
                  <p className="text-sm text-slate-300 leading-relaxed">{scenario.explanation}</p>
                </div>

                {/* Common trap */}
                {scenario.trap && (
                  <div className="bg-red-900/20 rounded-xl border border-red-800 p-4">
                    <div className="text-xs text-red-400 font-bold mb-2 uppercase tracking-wide">⚠️ Common Trap</div>
                    <p className="text-sm text-slate-300">{scenario.trap}</p>
                  </div>
                )}

                <button
                  onClick={fetchScenario}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl transition-colors cursor-pointer"
                >
                  🔄 Next Hand
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!scenario && !loading && (
        <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-12 text-center text-slate-500">
          <p className="text-5xl mb-4">🃏</p>
          <p className="text-lg mb-2 text-slate-400">Ready to practice?</p>
          <p>Select a difficulty and topic, then click <strong className="text-amber-400">Deal Hand</strong></p>
        </div>
      )}
    </div>
  )
}

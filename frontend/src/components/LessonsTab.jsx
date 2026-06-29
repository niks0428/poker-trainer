import { useState } from 'react'
import { fetchLesson } from '../api'

const TOPICS = [
  { id: 'pot_odds', label: '🧮 Pot Odds', desc: 'When is a call profitable?' },
  { id: 'position', label: '📍 Position', desc: 'Why BTN dominates' },
  { id: 'preflop_ranges', label: '🎯 Preflop Ranges', desc: 'What hands to open/fold' },
  { id: 'cbet', label: '🔥 C-Betting', desc: 'Continuation betting strategy' },
  { id: 'bluffing', label: '🎭 Bluffing', desc: 'Bluff frequency & spots' },
  { id: '3bet', label: '⬆️ 3-Betting', desc: 'When & how to 3-bet' },
  { id: 'board_texture', label: '🎲 Board Texture', desc: 'Reading wet vs dry boards' },
  { id: 'bankroll', label: '💰 Bankroll Mgmt', desc: 'Protect your roll' },
  { id: 'mtt', label: '🏆 Tournament ICM', desc: 'MTT pressure & bubble play' },
  { id: 'reads', label: '🔍 Villain Reads', label2: 'Player types & exploitation', desc: 'Exploit player tendencies' },
]

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^### (.*)/gm, '<h3>$1</h3>')
    .replace(/^## (.*)/gm, '<h2>$1</h2>')
    .replace(/^# (.*)/gm, '<h2>$1</h2>')
    .replace(/^- (.*)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, match => `<ul>${match}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])(.+)/gm, '$1')
}

export default function LessonsTab() {
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [question, setQuestion] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [chatQ, setChatQ] = useState('')

  const loadTopic = async (topic) => {
    setSelectedTopic(topic)
    setContent('')
    setChatHistory([])
    setError('')
    setLoading(true)
    try {
      const data = await fetchLesson({ topic: topic.id, question: '' })
      setContent(data.content)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const askQuestion = async () => {
    if (!chatQ.trim() || !selectedTopic) return
    const q = chatQ.trim()
    setChatQ('')
    setChatHistory(h => [...h, { role: 'user', text: q }])
    setLoading(true)
    try {
      const data = await fetchLesson({ topic: selectedTopic.id, question: q })
      setChatHistory(h => [...h, { role: 'assistant', text: data.content }])
    } catch (e) {
      setChatHistory(h => [...h, { role: 'assistant', text: 'Error: ' + e.message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
      {/* Topic list */}
      <div>
        <h2 className="text-lg font-bold text-amber-400 mb-3">Topics</h2>
        <div className="space-y-2">
          {TOPICS.map(t => (
            <button
              key={t.id}
              onClick={() => loadTopic(t)}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                selectedTopic?.id === t.id
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-[#1a2535] border-slate-700 hover:border-slate-500 text-slate-300'
              }`}
            >
              <div className="font-medium text-sm">{t.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Lesson content */}
      <div className="lg:col-span-2">
        <h2 className="text-lg font-bold text-amber-400 mb-3">
          {selectedTopic ? selectedTopic.label : 'Lesson'}
        </h2>

        {!selectedTopic && (
          <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-8 text-center text-slate-500">
            <p className="text-4xl mb-3">📚</p>
            <p>Choose a topic to start learning</p>
          </div>
        )}

        {loading && !content && (
          <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-8 text-center text-slate-400">
            <div className="animate-pulse text-4xl mb-3">📖</div>
            <p>Loading lesson...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-500 rounded-xl p-3 text-red-300 text-sm mb-3">
            {error}
          </div>
        )}

        {content && (
          <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-5 mb-4">
            <div
              className="lesson-content text-sm text-slate-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          </div>
        )}

        {/* Chat Q&A */}
        {selectedTopic && content && (
          <div className="bg-[#1a2535] rounded-xl border border-slate-700 p-4">
            <div className="text-xs text-amber-400 font-bold mb-3 uppercase tracking-wide">Ask a Question</div>

            {chatHistory.length > 0 && (
              <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
                {chatHistory.map((m, i) => (
                  <div key={i} className={`text-sm rounded-xl px-3 py-2 ${
                    m.role === 'user'
                      ? 'bg-amber-500/10 border border-amber-700 text-amber-200 ml-6'
                      : 'bg-slate-700 text-slate-300 mr-6'
                  }`}>
                    <div
                      className="lesson-content"
                      dangerouslySetInnerHTML={{ __html: m.role === 'assistant' ? renderMarkdown(m.text) : m.text }}
                    />
                  </div>
                ))}
                {loading && (
                  <div className="bg-slate-700 rounded-xl px-3 py-2 text-slate-400 text-sm animate-pulse mr-6">
                    Thinking...
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={chatQ}
                onChange={e => setChatQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askQuestion()}
                placeholder={`Ask about ${selectedTopic?.label?.replace(/^[^\s]+ /, '')}...`}
                className="flex-1 bg-[#0f1923] border border-slate-600 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={askQuestion}
                disabled={loading || !chatQ.trim()}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold px-4 rounded-lg transition-colors cursor-pointer text-sm"
              >
                Ask
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

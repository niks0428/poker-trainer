const BASE = import.meta.env.VITE_API_URL || '/api'

async function post(path, payload) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Server error')
  return res.json()
}

export const fetchAdvice = (payload) => post('/advice', payload)
export const fetchLesson = (payload) => post('/lesson', payload)
export const generateScenario = (payload) => post('/scenario/generate', payload)
export const evaluateAnswer = (payload) => post('/scenario/evaluate', payload)

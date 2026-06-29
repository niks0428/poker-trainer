const BASE = import.meta.env.VITE_API_URL || '/api'

export async function fetchAdvice(payload) {
  const res = await fetch(`${BASE}/advice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Server error')
  return res.json()
}

export async function fetchLesson(payload) {
  const res = await fetch(`${BASE}/lesson`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Server error')
  return res.json()
}

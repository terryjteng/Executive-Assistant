import { requireUser } from './_auth.js'

// Server-side proxy for the EA agent. The browser SDK points its baseURL at
// /api/anthropic; vercel.json rewrites /api/anthropic/<path> here as ?path=.
// Only the Messages endpoint and the models the app uses are allowed through.

const ALLOWED_PATHS = new Set(['v1/messages'])
const ALLOWED_MODELS = new Set(['claude-opus-4-7'])

export const config = { maxDuration: 300 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const path = String(req.query.path || '')
  if (!ALLOWED_PATHS.has(path)) return res.status(404).json({ error: 'Not found' })
  if (!(await requireUser(req, res, { role: 'super_admin' }))) return
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' })

  const body = req.body || {}
  if (!ALLOWED_MODELS.has(body.model)) return res.status(400).json({ error: 'Model not allowed' })

  const headers = {
    'content-type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': req.headers['anthropic-version'] || '2023-06-01',
  }
  if (req.headers['anthropic-beta']) headers['anthropic-beta'] = req.headers['anthropic-beta']

  const upstream = await fetch(`https://api.anthropic.com/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  res.status(upstream.status)
  res.setHeader('content-type', upstream.headers.get('content-type') || 'application/json')
  res.send(Buffer.from(await upstream.arrayBuffer()))
}

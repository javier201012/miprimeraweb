import express from 'express'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5175

const CSV_URLS = [
  'https://charts.spotify.com/regional/es/daily/latest/download',
  'https://spotifycharts.com/regional/es/daily/latest/download',
  'https://charts.spotify.com/regional/es/daily/latest/download?format=csv'
]

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  let start = 0
  for (let i = 0; i < lines.length; i++) {
    if (/^Position/i.test(lines[i].trim())) { start = i + 1; break }
  }
  const rows = []
  for (let i = start; i < lines.length; i++) {
    const line = lines[i]
    const fields = []
    let cur = ''
    let inQuotes = false
    for (let j = 0; j < line.length; j++) {
      const ch = line[j]
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === ',' && !inQuotes) { fields.push(cur); cur = ''; continue }
      cur += ch
    }
    fields.push(cur)
    if (fields.length >= 3) {
      const position = fields[0].trim()
      const track = fields[1].trim()
      const artist = fields[2].trim()
      rows.push({ position, track, artist })
    }
  }
  return rows
}

app.get('/api/charts/spain', async (req, res) => {
  // Try CSV public endpoints first
  for (const url of CSV_URLS) {
    try {
      const r = await axios.get(url, { responseType: 'text', timeout: 8000 })
      if (r.status >= 200 && r.status < 300) {
        const rows = parseCsv(r.data).slice(0, 10)
        return res.json({ source: 'csv', items: rows })
      }
    } catch (err) {
      console.warn('CSV fetch failed for', url, err.message)
      continue
    }
  }

  // Fallback: Spotify API using client credentials if provided in server env
  const clientId = process.env.VITE_SPOTIFY_CLIENT_ID
  const clientSecret = process.env.VITE_SPOTIFY_CLIENT_SECRET
  if (clientId && clientSecret) {
    try {
      const tokenRes = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({ grant_type: 'client_credentials' }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64') } }
      )
      const token = tokenRes.data.access_token
      const PLAYLIST_ID = '37i9dQZEVXbNFJfN1Vw8d'
      const url = `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?limit=10`
      const r2 = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 })
      const items = (r2.data.items || []).map(it => {
        const t = it.track || {}
        return { position: '', track: t.name, artist: (t.artists || []).map(a => a.name).join(', ') }
      })
      return res.json({ source: 'api', items })
    } catch (err) {
      console.error('Spotify API fallback failed', err.message)
    }
  }

  res.status(502).json({ error: 'No pudimos obtener las listas públicas (CSV) y no hay credenciales Spotify en el servidor.' })
})

app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`)
})

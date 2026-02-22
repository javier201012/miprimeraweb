import express from 'express'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

console.log('[SERVER] VITE_SPOTIFY_CLIENT_ID:', process.env.VITE_SPOTIFY_CLIENT_ID ? 'PRESENT' : 'MISSING')
console.log('[SERVER] VITE_SPOTIFY_CLIENT_SECRET:', process.env.VITE_SPOTIFY_CLIENT_SECRET ? 'PRESENT' : 'MISSING')

const app = express()
const PORT = process.env.PORT || 5175

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

const CSV_URLS = [
  'https://charts.spotify.com/regional/es/daily/latest/download',
  'https://spotifycharts.com/regional/es/daily/latest/download',
  'https://charts.spotify.com/regional/es/daily/latest/download?format=csv'
]

const SHAZAM_URLS = [
  'https://www.shazam.com/charts/top-200/spain',
  'https://www.shazam.com/es/charts/top-200/spain',
  'https://www.shazam.com/region/spain/top-200'
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
      // Clean HTML tags and collapse whitespace
      const clean = (s) => {
        if (!s) return ''
        // remove HTML tags
        let t = s.replace(/<[^>]*>/g, '')
        // decode common HTML entities
        t = t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        // collapse multiple spaces/newlines
        t = t.replace(/\s+/g, ' ').trim()
        return t
      }

      const position = clean(fields[0])
      // Some CSVs include "Track - Artist" in a single column; prefer explicit columns
      const track = clean(fields[1])
      const artist = clean(fields[2])
      rows.push({ position, track, artist })
    }
  }
  return rows
}

app.get('/api/charts/spain', async (req, res) => {
  // Try Shazam public pages first (scrape HTML for embedded JSON/title fields)
  for (const url of SHAZAM_URLS) {
    try {
      const r = await axios.get(url, { responseType: 'text', timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (r.status >= 200 && r.status < 300 && r.data) {
        const html = r.data
        // Attempt 1: extract JSON inside <script id="__NEXT_DATA__"> (Next.js pattern)
        const items = []
        const tryParseJsonScript = (html) => {
          const nxt = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)
          if (nxt && nxt[1]) {
            try {
              return JSON.parse(nxt[1])
            } catch (e) {
              // ignore
            }
          }
          return null
        }

        const tryParseWindowState = (html) => {
          const m = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/)
          if (m && m[1]) {
            try { return JSON.parse(m[1]) } catch (e) { }
          }
          // also try other common globals
          const m2 = html.match(/window\.__DATA__\s*=\s*(\{[\s\S]*?\});/)
          if (m2 && m2[1]) {
            try { return JSON.parse(m2[1]) } catch (e) { }
          }
          return null
        }

        const findTracksInObject = (obj) => {
          if (!obj || typeof obj !== 'object') return null
          if (Array.isArray(obj)) {
            // check if array items look like tracks
            if (obj.length > 0 && obj.every(it => it && (it.title || it.name) )) return obj
          }
          for (const k of Object.keys(obj)) {
            const val = obj[k]
            if (Array.isArray(val)) {
              if (val.length > 0 && val.every(it => it && (it.title || it.name || (it.track && it.track.name)))) return val
            }
            if (typeof val === 'object') {
              const found = findTracksInObject(val)
              if (found) return found
            }
          }
          return null
        }

        let parsed = tryParseJsonScript(html) || tryParseWindowState(html)
        let found = null
        if (parsed) {
          found = findTracksInObject(parsed)
        }

        if (found && Array.isArray(found)) {
          for (let i = 0; i < found.length && items.length < 10; i++) {
            const it = found[i]
            let title = it.title || (it.track && it.track.title) || it.name || ''
            let subtitle = it.subtitle || (it.artist && it.artist.name) || (it.artists && Array.isArray(it.artists) ? it.artists.map(a => a.name || a).join(', ') : '')
            if (!subtitle && it.track && it.track.artists) subtitle = (it.track.artists || []).map(a => a.name || a).join(', ')
            const clean = (s) => (s || '').toString().replace(/\\u([0-9A-Fa-f]{4})/g, (_, g1) => String.fromCharCode(parseInt(g1, 16))).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/<[^>]*>/g, '').trim()
            title = clean(title)
            subtitle = clean(subtitle)
            if (title) items.push({ position: (items.length + 1).toString(), track: title, artist: subtitle })
          }
        }

        // Fallback regex: search for title/subtitle pairs in HTML if JSON not found
        if (items.length === 0) {
          const re = /"title"\s*:\s*"([^"]+)"\s*,\s*"subtitle"\s*:\s*"([^"]+)"/g
          let m
          while ((m = re.exec(html)) && items.length < 10) {
            const clean = (s) => s.replace(/\\u([0-9A-Fa-f]{4})/g, (_, g1) => String.fromCharCode(parseInt(g1, 16))).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/<[^>]*>/g, '').trim()
            const title = clean(m[1])
            const artist = clean(m[2])
            items.push({ position: (items.length + 1).toString(), track: title, artist })
          }
        }

        if (items.length > 0) {
          return res.json({ source: 'shazam', items })
        }
      }
    } catch (err) {
      console.warn('Shazam fetch failed for', url, err.message)
      continue
    }
  }

  // Try CSV public endpoints next
  for (const url of CSV_URLS) {
    try {
      const r = await axios.get(url, { responseType: 'text', timeout: 8000 })
      if (r.status >= 200 && r.status < 300 && r.data) {
        const body = r.data
        // If response looks like HTML (not CSV), skip it
        const lower = body.slice(0, 1000).toLowerCase()
        if (/<html|<!doctype|<div|<script|<meta/.test(lower)) {
          console.warn('CSV URL returned HTML, skipping', url)
          continue
        }
        // Ensure CSV contains expected header
        if (!/position\s*,\s*track\s*,\s*artist/i.test(body)) {
          console.warn('CSV body missing expected header, skipping', url)
          continue
        }
        const rows = parseCsv(body).slice(0, 10)
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
      
      // Search for artist "Dani Martín"
      const artistName = 'Dani Martín'
      const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`
      const sres = await axios.get(searchUrl, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 })
      const artists = (sres.data.artists && sres.data.artists.items) || []
      if (artists.length === 0) throw new Error('Artist not found')
      
      const artist = artists[0]
      
      // Get albums from this artist
      const albumUrl = `https://api.spotify.com/v1/artists/${artist.id}/albums`
      const ares = await axios.get(albumUrl, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 })
      const albums = (ares.data.items || []).sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
      
      // Collect tracks from top 5 albums
      const allTracks = []
      for (const album of albums.slice(0, 5)) {
        try {
          const trackUrl = `https://api.spotify.com/v1/albums/${album.id}/tracks`
          const tres = await axios.get(trackUrl, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 })
          const tracks = tres.data.items || []
          tracks.forEach(t => {
            if (!allTracks.find(x => x.id === t.id)) {
              allTracks.push(t)
            }
          })
        } catch (e) {
          console.warn('Album tracks fetch failed:', e.message)
        }
      }
      
      // Sort by popularity, take top 10
      allTracks.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      const top10 = allTracks.slice(0, 10)
      const items = top10.map((t, idx) => ({
        position: (idx + 1).toString(),
        track: t.name,
        artist: artist.name
      }))
      
      return res.json({ source: 'api', artist: artist.name, items })
    } catch (err) {
      console.error('Spotify API fallback failed', err.message)
    }
  }

  res.status(502).json({ error: 'No pudimos obtener las listas públicas (CSV) y no hay credenciales Spotify en el servidor.' })
})

app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`)
})

import React, { useEffect, useState } from 'react'
import axios from 'axios'

// Strategy:
// 1) Try to fetch Spotify Charts CSV (public) from Spotify Charts site and parse it client-side.
// 2) If that fails and client credentials exist, fallback to Spotify Web API client-credentials flow.

const CSV_URLS = [
  'https://charts.spotify.com/regional/es/daily/latest/download',
  'https://spotifycharts.com/regional/es/daily/latest/download',
  'https://charts.spotify.com/regional/es/daily/latest/download?format=csv'
]

function parseCsv(text) {
  // Basic CSV parser that respects quoted fields.
  const lines = text.split(/\r?\n/).filter(Boolean)
  // Find header index (line that starts with "Position")
  let start = 0
  for (let i = 0; i < lines.length; i++) {
    if (/^Position/i.test(lines[i].trim())) { start = i + 1; break }
  }

  const rows = []
  for (let i = start; i < lines.length; i++) {
    const line = lines[i]
    // split CSV respecting quotes
    const fields = []
    let cur = ''
    let inQuotes = false
    for (let ch of line) {
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

export default function TopSongs() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [source, setSource] = useState(null)

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET

  useEffect(() => {
    let cancelled = false

    const fetchFromCsv = async () => {
      setLoading(true)
      try {
        // Prefer local proxy to avoid CORS (must point to port 5175)
        const proxyRes = await fetch('http://localhost:5175/api/charts/spain')
        if (proxyRes.ok) {
          const data = await proxyRes.json()
          if (data && data.items && data.items.length > 0) {
            if (!cancelled) {
              setTracks(data.items.slice(0, 10))
              setSource(data.source || 'proxy')
            }
            return
          }
        }
      } catch (e) {
        console.warn('Proxy fetch failed', e)
      }

      // Last-resort: try client-side CSV fallback (may hit CORS)
      for (const url of CSV_URLS) {
        try {
          const res = await fetch(url)
          if (!res.ok) throw new Error('no-csv')
          const text = await res.text()
          const rows = parseCsv(text).slice(0, 10)
          if (rows.length > 0) {
            if (!cancelled) setTracks(rows)
            return
          }
        } catch (err) {
          console.warn('CSV fetch failed for', url, err)
          continue
        }
      }

      if (!cancelled) setError('No se pudieron obtener las canciones públicamente. Ejecuta el proxy (`npm run server`) para evitar CORS.')
    }

    fetchFromCsv().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [clientId, clientSecret])

  if (error) return <div className="error" style={{ padding: '12px' }}>⚠️ {error}</div>
  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Cargando canciones...</div>
  if (tracks.length === 0) return <div>No hay canciones disponibles</div>

  return (
    <div className="top-songs">
      <div style={{ fontSize: '0.85rem', color: '#bbb', marginBottom: '8px' }}>Fuente: {source || 'desconocida'}</div>
      {tracks.slice(0, 10).map((t, i) => (
        <div key={(t.track || '') + i} className="video" style={{ cursor: 'pointer' }}>
          <div style={{ padding: '12px' }}>
            <div className="title" style={{ marginBottom: '6px', fontWeight: 700 }}>{t.track}</div>
            <div className="channel" style={{ marginBottom: '6px', color: '#666' }}>{t.artist}</div>
            <div style={{ fontSize: '0.85rem', color: '#999' }}>#{t.position || (i + 1)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

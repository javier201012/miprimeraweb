import React, { useEffect, useState } from 'react'
import axios from 'axios'

// Usaremos la playlist "Top 50 - Spain" de Spotify (requiere token).
// Añade en .env: VITE_SPOTIFY_CLIENT_ID y VITE_SPOTIFY_CLIENT_SECRET
const PLAYLIST_ID = '37i9dQZEVXbNFJfN1Vw8d' // Top 50 - Spain

export default function TopSongs() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET

  useEffect(() => {
    if (!clientId || !clientSecret) {
      setError('Configura VITE_SPOTIFY_CLIENT_ID y VITE_SPOTIFY_CLIENT_SECRET en .env')
      return
    }

    const fetchSpotify = async () => {
      try {
        setLoading(true)
        setError(null)
        const tokenRes = await axios.post(
          'https://accounts.spotify.com/api/token',
          new URLSearchParams({ grant_type: 'client_credentials' }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: 'Basic ' + btoa(`${clientId}:${clientSecret}`)
            }
          }
        )

        const token = tokenRes.data.access_token
        const url = `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?limit=12`
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 })

        const items = (res.data.items || []).map((it) => {
          const t = it.track || {}
          return {
            id: t.id,
            name: t.name,
            artists: (t.artists || []).map(a => a.name).join(', '),
            album: t.album?.name || '',
            img: t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || '',
            popularity: t.popularity || 0
          }
        })

        setTracks(items)
      } catch (err) {
        console.error('Spotify error:', err)
        setError('No se pudieron cargar las canciones desde Spotify')
      } finally {
        setLoading(false)
      }
    }

    fetchSpotify()
  }, [clientId, clientSecret])

  if (error) return <div className="error" style={{ padding: '12px' }}>⚠️ {error}</div>
  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Cargando canciones...</div>

  if (tracks.length === 0) return <div>No hay canciones disponibles</div>

  return (
    <div className="top-songs">
      {tracks.map((t, i) => (
        <a key={t.id || i} href={`https://open.spotify.com/track/${t.id}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="video">
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              {t.img && <img src={t.img} alt={t.name} style={{ width: '100%', display: 'block' }} />}
              <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>#{i + 1}</div>
            </div>
            <div style={{ padding: '12px' }}>
              <div className="title" style={{ marginBottom: '6px', fontWeight: 700 }}>{t.name}</div>
              <div className="channel" style={{ marginBottom: '6px', color: '#666' }}>{t.artists}</div>
              <div style={{ fontSize: '0.85rem', color: '#999' }}>{t.album} • Popularidad: {t.popularity}</div>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

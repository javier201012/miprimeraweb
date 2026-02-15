import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function TopSongs() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY

  useEffect(() => {
    if (!apiKey) {
      setError('API Key no configurada')
      return
    }

    const fetchVideos = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: {
            key: apiKey,
            part: 'snippet,statistics',
            chart: 'mostPopular',
            maxResults: 12
          },
          timeout: 10000
        })
        setVideos(response.data.items || [])
      } catch (err) {
        console.error('Error:', err)
        setError('No se pudieron cargar las canciones')
      } finally {
        setLoading(false)
      }
    }
    fetchVideos()
  }, [apiKey])

  if (error) {
    return <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', color: '#856404', padding: '12px', borderRadius: '6px' }}>⚠️ {error}{!apiKey && <p style={{ margin: '8px 0 0', fontSize: '0.9rem' }}>Configura VITE_YOUTUBE_API_KEY en .env</p>}</div>
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Cargando...</div>

  const formatViews = (v) => { const n = parseInt(v); if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'; if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'; return n }

  return (
    <div className="top-songs">
      {videos.map((v, idx) => (
        <a key={v.id} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="video">
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <img src={v.snippet.thumbnails.medium.url} alt={v.snippet.title} style={{ width: '100%', display: 'block' }} />
              <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>#{idx + 1}</div>
            </div>
            <div style={{ padding: '12px' }}>
              <div className="title" style={{ marginBottom: '8px' }}>{v.snippet.title.substring(0, 50)}...</div>
              <div className="channel" style={{ marginBottom: '8px' }}>{v.snippet.channelTitle}</div>
              <div style={{ fontSize: '0.85rem', color: '#999' }}>👁️ {formatViews(v.statistics.viewCount)} views</div>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

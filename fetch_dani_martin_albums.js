import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const clientId = process.env.VITE_SPOTIFY_CLIENT_ID
const clientSecret = process.env.VITE_SPOTIFY_CLIENT_SECRET
if (!clientId || !clientSecret) { console.error('Missing creds'); process.exit(1) }

const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

;(async () => {
  try {
    const tokenRes = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({ grant_type: 'client_credentials' }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${auth}` }, timeout: 10000 })
    const token = tokenRes.data.access_token
    
    // Search for artist Dani Martín
    const q = encodeURIComponent('Dani Martín')
    const searchUrl = `https://api.spotify.com/v1/search?q=${q}&type=artist&limit=1`
    const sres = await axios.get(searchUrl, { headers: { Authorization: `Bearer ${token}` } })
    const artists = (sres.data.artists && sres.data.artists.items) || []
    if (artists.length === 0) return console.error('No artists found')
    
    const artist = artists[0]
    console.log('Found artist:', artist.name, 'ID:', artist.id)
    
    // Get albums from this artist
    const albumUrl = `https://api.spotify.com/v1/artists/${artist.id}/albums`
    const ares = await axios.get(albumUrl, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 })
    const albums = (ares.data.items || []).sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
    
    console.log('Top albums:', albums.slice(0, 10).map(a => a.name).join(', '))
    
    // Collect tracks from albums
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
    
    // Sort by popularity (Spotify popularity field), take top 10
    allTracks.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    const top10 = allTracks.slice(0, 10)
    
    const items = top10.map((t, idx) => ({
      position: idx + 1,
      track: t.name,
      artist: artist.name,
      popularity: t.popularity
    }))
    
    console.log('\nTop 10 by popularity:')
    console.log(JSON.stringify({ source: 'api', artist: artist.name, items }, null, 2))
  } catch (e) {
    if (e.response) console.error('ERR_RESP', e.response.status, e.response.statusText)
    else console.error('ERR', e.message)
  }
})()

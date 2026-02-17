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
    
    // Search for the artist Dani Martín
    const q = encodeURIComponent('Dani Martín')
    const searchUrl = `https://api.spotify.com/v1/search?q=${q}&type=artist&limit=1`
    const sres = await axios.get(searchUrl, { headers: { Authorization: `Bearer ${token}` } })
    const artists = (sres.data.artists && sres.data.artists.items) || []
    if (artists.length === 0) return console.error('No artists found')
    
    const artist = artists[0]
    console.log('Found artist:', artist.name, 'ID:', artist.id)
    
    // Get top tracks for this artist
    const topUrl = `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?limit=10`
    const tres = await axios.get(topUrl, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 })
    const items = (tres.data.tracks || []).map((t, idx) => ({ position: idx+1, track: t.name, artist: artist.name }))
    console.log(JSON.stringify({ source: 'api', artist: artist.name, items }, null, 2))
  } catch (e) {
    if (e.response) console.error('ERR_RESP', e.response.status, e.response.statusText)
    else console.error('ERR', e.message)
  }
})()

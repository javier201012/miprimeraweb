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
    const PLAYLIST_ID = '37i9dQZEVXbNFJfN1Vw8d'
    const url = `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?limit=10`
    const r2 = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 })
    const items = (r2.data.items || []).map((it, idx) => ({ position: idx+1, track: it.track.name, artist: (it.track.artists||[]).map(a=>a.name).join(', ') }))
    console.log(JSON.stringify({ source: 'api', items }, null, 2))
  } catch (e) {
    if (e.response) console.error('ERR_RESP', e.response.status, JSON.stringify(e.response.data))
    else console.error('ERR', e.message)
  }
})()

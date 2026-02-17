import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const clientId = process.env.VITE_SPOTIFY_CLIENT_ID
const clientSecret = process.env.VITE_SPOTIFY_CLIENT_SECRET

if (!clientId || !clientSecret) {
  console.error('Missing CLIENT ID or SECRET in .env')
  process.exit(1)
}

const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

async function run() {
  try {
    const tokenRes = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({ grant_type: 'client_credentials' }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${auth}` }, timeout: 10000 })
    console.log('TOKEN_OK')
    console.log(JSON.stringify(tokenRes.data, null, 2))
  } catch (err) {
    if (err.response && err.response.data) console.error('ERROR_RESPONSE', JSON.stringify(err.response.data))
    else console.error('ERROR', err.message)
    process.exit(1)
  }
}

run()

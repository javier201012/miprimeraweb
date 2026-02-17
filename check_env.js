import dotenv from 'dotenv'
dotenv.config()
console.log('CLIENT_ID:', process.env.VITE_SPOTIFY_CLIENT_ID ? 'PRESENT' : 'MISSING')
console.log('CLIENT_SECRET:', process.env.VITE_SPOTIFY_CLIENT_SECRET ? 'PRESENT' : 'MISSING')

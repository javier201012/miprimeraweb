import axios from 'axios'

;(async () => {
  try {
    const r = await axios.get('http://localhost:5175/api/charts/spain', { timeout: 15000 })
    console.log(JSON.stringify(r.data, null, 2))
  } catch (e) {
    if (e.response) console.error('ERR_RESP', e.response.status, JSON.stringify(e.response.data))
    else console.error('ERR', e.message)
  }
})()

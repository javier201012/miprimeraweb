import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'

const API_URL = 'https://api.coingecko.com/api/v3/coins/markets'

export default function CryptoList() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchCryptos = useCallback(async () => {
    try {
      setError(null)
      const response = await axios.get(API_URL, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          sparkline: false
        },
        timeout: 10000
      })
      setCoins(response.data)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (err) {
      console.error('Error:', err)
      setError('No se pudieron cargar las criptomonedas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCryptos()
  }, [fetchCryptos])

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Cargando...</div>
  if (error) return <div className="error" style={{ padding: '12px' }}>⚠️ {error}</div>

  return (
    <div className="crypto-list">
      {lastUpdate && <div style={{ fontSize: '0.85rem', color: '#999', marginBottom: '12px', textAlign: 'right' }}>Actualizado: {lastUpdate}</div>}
      <table>
        <thead>
          <tr>
            <th style={{ width: '8%' }}>#</th>
            <th style={{ width: '40%' }}>Nombre</th>
            <th style={{ width: '22%' }}>Precio</th>
            <th style={{ width: '22%' }}>Market Cap</th>
            <th style={{ width: '8%' }}>24h %</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin, idx) => (
            <tr key={coin.id}>
              <td>{idx + 1}</td>
              <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={coin.image} alt={coin.symbol} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                <span><strong>{coin.name}</strong></span>
              </td>
              <td><strong>${parseFloat(coin.current_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</strong></td>
              <td>${coin.market_cap ? (coin.market_cap / 1e9).toFixed(2) + 'B' : 'N/A'}</td>
              <td><span className={coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}>{coin.price_change_percentage_24h ? coin.price_change_percentage_24h.toFixed(2) : '0.00'}%</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

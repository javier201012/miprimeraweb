import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'

const BSC_RPC = import.meta.env.VITE_BSC_RPC || 'https://bsc-dataseed.binance.org/'
const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
]

export default function WalletPanel() {
  const [provider, setProvider] = useState(null)
  const [bscProvider] = useState(new ethers.JsonRpcProvider(BSC_RPC))
  const [address, setAddress] = useState('')
  const [bnbBalance, setBnbBalance] = useState(null)
  const [tokens, setTokens] = useState([])
  const [newTokenAddress, setNewTokenAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (window.ethereum) {
      setProvider(new ethers.BrowserProvider(window.ethereum))
    }
  }, [])

  const connectWallet = async () => {
    try {
      setError(null)
      if (!window.ethereum) {
        setError('MetaMask no está instalado')
        return
      }
      
      const prov = new ethers.BrowserProvider(window.ethereum)
      await prov.send('eth_requestAccounts', [])
      const signer = await prov.getSigner()
      const addr = await signer.getAddress()
      
      setProvider(prov)
      setAddress(addr)
      await fetchBalances(addr)
    } catch (err) {
      console.error('Connection error:', err)
      setError('Error al conectar wallet')
    }
  }

  const fetchBalances = async (addr) => {
    if (!addr) return
    try {
      setLoading(true)
      
      const bnb = await bscProvider.getBalance(addr)
      setBnbBalance(ethers.formatEther(bnb))

      await updateTokenBalance(USDT_ADDRESS, addr)
    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar balances')
    } finally {
      setLoading(false)
    }
  }

  const updateTokenBalance = async (tokenAddr, walletAddr) => {
    try {
      const contract = new ethers.Contract(tokenAddr, ERC20_ABI, bscProvider)
      const [balance, decimals, symbol, name] = await Promise.all([
        contract.balanceOf(walletAddr),
        contract.decimals(),
        contract.symbol(),
        contract.name()
      ])
      
      const formatted = Number(balance) / 10 ** decimals
      
      setTokens(prev => {
        const filtered = prev.filter(t => t.address.toLowerCase() !== tokenAddr.toLowerCase())
        return [...filtered, { address: tokenAddr, symbol, name, balance: formatted, decimals }]
      })
    } catch (err) {
      console.error('Token error:', err)
      setTokens(prev => {
        const filtered = prev.filter(t => t.address.toLowerCase() !== tokenAddr.toLowerCase())
        return [...filtered, { address: tokenAddr, symbol: 'ERROR', name: 'Unknown', balance: 0 }]
      })
    }
  }

  const addToken = async () => {
    const tokenAddr = newTokenAddress.trim()
    if (!tokenAddr || !address) {
      setError('Ingresa una dirección válida')
      return
    }
    
    try {
      setError(null)
      await updateTokenBalance(tokenAddr, address)
      setNewTokenAddress('')
    } catch (err) {
      setError('Error al añadir token')
    }
  }

  const disconnect = () => {
    setAddress('')
    setBnbBalance(null)
    setTokens([])
    setNewTokenAddress('')
  }

  return (
    <div className="wallet-panel">
      {!address ? (
        <div>
          <button onClick={connectWallet} style={{ width: '100%' }}>
            🔐 Conectar MetaMask
          </button>
          {error && <div className="error" style={{ marginTop: '12px', padding: '10px' }}>⚠️ {error}</div>}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div className="addr" style={{ flex: 1, margin: 0, minWidth: '200px' }}>{address}</div>
            <button onClick={disconnect} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Desconectar</button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Cargando...</div>
          ) : (
            <>
              <div className="wallet-balance">
                <div className="balance-card">
                  <div className="label">BNB Balance</div>
                  <div className="value">{bnbBalance ? parseFloat(bnbBalance).toFixed(6) : '0.000000'} BNB</div>
                </div>

                {tokens.length > 0 && tokens.map(token => (
                  <div key={token.address} className="balance-card">
                    <div className="label">{token.symbol}</div>
                    <div className="value">{token.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
                  </div>
                ))}
              </div>

              <div className="add-token">
                <h4>➕ Agregar Token</h4>
                <input type="text" placeholder="Dirección del contrato (0x...)" value={newTokenAddress} onChange={(e) => setNewTokenAddress(e.target.value)} />
                <button onClick={addToken}>Cargar Token</button>
                {error && <div className="error" style={{ marginTop: '8px', padding: '8px' }}>⚠️ {error}</div>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

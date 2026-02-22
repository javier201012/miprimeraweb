import React from 'react'
import CryptoList from './components/CryptoList'
import TopSongs from './components/TopSongs'
import WalletPanel from './components/WalletPanel'
import './styles.css'

export default function App() {
  return (
    <div className="container">
      <header>
        <h1>💝 Agradecimiento Especial</h1>

        <img
          src="/papaymama.jpeg"
          alt="Papá y Mamá"
          className="family-photo"
        />

        <p className="formal">
          A mis padres, Francisco Javier Galán Vera y Gema Niño Agustino,
          <br />
          quienes me brindaron todo su amor, paciencia y una educación excepcional.
          <br />
          Este sitio está creado con cariño para ustedes.
        </p>
      </header>

      <main>
        <section>
          <h2>💰 Criptomonedas</h2>
          <p>
            Top 10 criptomonedas por capitalización de mercado. Datos en tiempo real.
          </p>
          <CryptoList />
        </section>

        <section>
          <h2>🎵 Canciones de Dani Martín</h2>
          <p>Las 10 canciones más populares de Dani Martín ordenadas por reproducciones.</p>
          <TopSongs />
        </section>

        <section>
          <h2>🔗 Panel Web3</h2>
          <p>
            Conecta tu wallet MetaMask para acceder a tus balances y tokens en Binance Smart Chain.
          </p>
          <WalletPanel />
        </section>
      </main>
    </div>
  )
}

import React, { useState } from 'react'
import CryptoList from './components/CryptoList'
import TopSongs from './components/TopSongs'
import WalletPanel from './components/WalletPanel'
import './styles.css'

export default function App() {
  const [photo, setPhoto] = useState(null)

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(URL.createObjectURL(file))
    }
  }

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
        
        <div className="photo-upload">
          <label>📸 Subir foto familiar personalizada</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
          />
          {photo && (
            <img 
              src={photo} 
              alt="Foto familiar" 
              className="preview" 
            />
          )}
        </div>
      </header>

      <main>
        <section>
          <h2>💰 Criptomonedas</h2>
          <p>
            Top 10 criptomonedas por capitalización de mercado. 
            Datos en tiempo real con precios actualizados.
          </p>
          <CryptoList />
        </section>

        <section>
          <h2>🎵 Canciones Populares</h2>
          <p>
            Descubre las canciones más reproducidas en YouTube.
            Configura tu API key en <code>.env</code> para activar esta sección.
          </p>
          <TopSongs />
        </section>

        <section>
          <h2>🔗 Panel Web3</h2>
          <p>
            Conecta tu wallet MetaMask para acceder a tu información
            en Binance Smart Chain. Visualiza balances y gestiona tokens.
          </p>
          <WalletPanel />
        </section>
      </main>
    </div>
  )
}

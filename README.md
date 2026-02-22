# Página familiar (Vite + React)

Proyecto pequeño para agradecer a los padres y mostrar:
- Cotizaciones top 10 (CoinGecko)
- Top canciones (YouTube Data API) — requiere `VITE_YOUTUBE_API_KEY`
- Conexión wallet Web3 y lectura de balances en Binance Smart Chain (BNB, USDT) y tokens añadidos por contrato

Instrucciones rápidas:

1. Instalar dependencias

```bash
npm install
```

2. Crear archivo `.env` a partir de `.env.example` y añadir tu API key de YouTube si quieres la sección de canciones:

```
VITE_YOUTUBE_API_KEY=TU_API_KEY
VITE_BSC_RPC=https://bsc-dataseed.binance.org/
VITE_PROXY_BASE_URL=http://localhost:5175
```

3. Ejecutar en desarrollo

```bash
npm run dev
```

Notas:
- La conexión Web3 usa `window.ethereum` (MetaMask). La lectura de balances se hace contra el RPC de BSC.
- La sección de canciones usa un proxy para evitar CORS. En local arranca `npm run server`.
- En despliegues (ej. Netlify), publica también el backend y configura `VITE_PROXY_BASE_URL=https://tu-backend`.
- Proporciona la foto familiar cuando quieras y la integro en el encabezado.

## Despliegue del proxy (Render) + Netlify

1. Sube este repo a GitHub (ya incluye `render.yaml`).
2. En Render: **New +** → **Blueprint** → selecciona el repo.
3. Render creará el servicio `miprimeraweb-proxy` y arrancará con `npm run server`.
4. Espera a que quede en estado **Live** y copia la URL, por ejemplo:

```text
https://miprimeraweb-proxy.onrender.com
```

5. En Netlify (sitio frontend):
	- Ve a **Site settings** → **Environment variables**.
	- Crea `VITE_PROXY_BASE_URL` con la URL de Render.
	- Vuelve a desplegar el sitio.

6. Comprobación rápida:
	- Salud del backend: `https://TU-BACKEND/api/health`
	- Endpoint de canciones: `https://TU-BACKEND/api/charts/spain`

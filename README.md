# Krypto Peněženka - Školní Projekt

React aplikace pro správu krypto peněženky s Express backendem.

## Funkce

✅ Login systém (bez hashování - školní projekt)  
✅ **Automatické zjišťování cen kryptoměn** z CoinGecko API  
✅ **Dropdown výběr z populárních kryptoměn** (Bitcoin, Ethereum, Dogecoin, atd.)  
✅ **Hash/adresa pro každou kryptoměnu**  
✅ Správa krypto měn s množstvím a real-time cenou  
✅ Kalkulace hodnoty portfolia  
✅ Dark/Light mode  
✅ Protected routes  
✅ Chybová stránka pro nevalidní URL  
✅ Moderní design  

## Instalace

```bash
npm install
```

## Spuštění

### Možnost 1: Spustit frontend a backend zvlášť

```bash
# Terminál 1 - Backend server
npm run server

# Terminál 2 - React frontend
npm start
```

### Možnost 2: Spustit oboje najednou (potřeba nainstalovat concurrently)

```bash
npm install concurrently --save-dev
npm run dev
```

## Podporované kryptoměny

- Bitcoin (BTC)
- Ethereum (ETH)
- Dogecoin (DOGE)
- Ripple (XRP)
- Cardano (ADA)
- Solana (SOL)
- Polkadot (DOT)
- Litecoin (LTC)
- Chainlink (LINK)
- Stellar (XLM)

Ceny jsou automaticky načítány v reálném čase z **CoinGecko API**.

## Přihlašovací údaje

- **Admin**: username: `admin`, password: `123`
- **User**: username: `user`, password: `heslo`

## Struktura projektu

```
src/
├── components/
│   ├── Login.js         # Přihlašovací stránka
│   ├── Dashboard.js     # Hlavní dashboard s krypto měnami
│   ├── NotFound.js      # 404 stránka
│   └── ProtectedRoute.js # Ochrana routes
├── contexts/
│   ├── AuthContext.js   # Autentizace
│   └── ThemeContext.js  # Dark/Light mode
└── App.js              # Hlavní komponenta s routing

server.js               # Express backend API
```

## API Endpoints

- `POST /api/login` - Přihlášení uživatele
- `GET /api/cryptos/:userId` - Získání krypto měn uživatele
- `POST /api/cryptos/:userId` - Přidání nové krypto měny
- `PUT /api/cryptos/:userId/:cryptoId` - Aktualizace krypto měny
- `DELETE /api/cryptos/:userId/:cryptoId` - Smazání krypto měny

## Technologie

- React 19
- React Router v7
- Express.js
- Axios
- Context API pro state management
- CSS3 s moderním designem


### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

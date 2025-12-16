const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Simulace databáze - v realném projektu by to bylo DB
const users = [
  { id: 1, username: 'admin', password: '123', cryptos: [] },
  { id: 2, username: 'user', password: 'heslo', cryptos: [] }
];

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username,
        cryptos: user.cryptos
      } 
    });
  } else {
    res.status(401).json({ success: false, message: 'Špatné přihlašovací údaje' });
  }
});

// Získání krypto měn uživatele
app.get('/api/cryptos/:userId', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.userId));
  if (user) {
    res.json({ success: true, cryptos: user.cryptos });
  } else {
    res.status(404).json({ success: false, message: 'Uživatel nenalezen' });
  }
});

// Přidání nové krypto měny
app.post('/api/cryptos/:userId', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.userId));
  if (user) {
    const newCrypto = {
      id: Date.now(),
      cryptoId: req.body.cryptoId,
      name: req.body.name,
      symbol: req.body.symbol,
      amount: req.body.amount,
      currentPrice: req.body.currentPrice,
      hash: req.body.hash
    };
    user.cryptos.push(newCrypto);
    res.json({ success: true, crypto: newCrypto });
  } else {
    res.status(404).json({ success: false, message: 'Uživatel nenalezen' });
  }
});

// Aktualizace krypto měny
app.put('/api/cryptos/:userId/:cryptoId', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.userId));
  if (user) {
    const cryptoIndex = user.cryptos.findIndex(c => c.id === parseInt(req.params.cryptoId));
    if (cryptoIndex !== -1) {
      user.cryptos[cryptoIndex] = { 
        ...user.cryptos[cryptoIndex], 
        ...req.body,
        id: user.cryptos[cryptoIndex].id // Zachovat původní ID
      };
      res.json({ success: true, crypto: user.cryptos[cryptoIndex] });
    } else {
      res.status(404).json({ success: false, message: 'Krypto nenalezeno' });
    }
  } else {
    res.status(404).json({ success: false, message: 'Uživatel nenalezen' });
  }
});

// Smazání krypto měny
app.delete('/api/cryptos/:userId/:cryptoId', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.userId));
  if (user) {
    user.cryptos = user.cryptos.filter(c => c.id !== parseInt(req.params.cryptoId));
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Uživatel nenalezen' });
  }
});

app.listen(PORT, () => {
  console.log(`Server běží na http://localhost:${PORT}`);
});

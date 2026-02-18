const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Cesta k databázovému souboru
const DB_PATH = path.join(__dirname, 'database.json');

// Funkce pro načtení databáze
function loadDatabase() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Chyba při načítání databáze:', error);
    return { users: [] };
  }
}

// Funkce pro uložení databáze
function saveDatabase(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Chyba při ukládání databáze:', error);
    return false;
  }
}

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = loadDatabase();
  const user = db.users.find(u => u.username === username && u.password === password);
  
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

// Registrace nového uživatele
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  const db = loadDatabase();

  // Zkontrolovat, zda uživatel už neexistuje
  const existingUser = db.users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Uživatelské jméno již existuje' });
  }

  // Vytvořit nového uživatele
  const newUser = {
    id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
    username,
    password,
    cryptos: []
  };

  db.users.push(newUser);
  saveDatabase(db);

  res.json({ 
    success: true, 
    user: { 
      id: newUser.id, 
      username: newUser.username,
      cryptos: newUser.cryptos
    } 
  });
});

// Získání krypto měn uživatele
app.get('/api/cryptos/:userId', (req, res) => {
  const db = loadDatabase();
  const user = db.users.find(u => u.id === parseInt(req.params.userId));
  if (user) {
    res.json({ success: true, cryptos: user.cryptos });
  } else {
    res.status(404).json({ success: false, message: 'Uživatel nenalezen' });
  }
});

// Přidání nové krypto měny
app.post('/api/cryptos/:userId', (req, res) => {
  const db = loadDatabase();
  const user = db.users.find(u => u.id === parseInt(req.params.userId));
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
    saveDatabase(db);
    res.json({ success: true, crypto: newCrypto });
  } else {
    res.status(404).json({ success: false, message: 'Uživatel nenalezen' });
  }
});

// Aktualizace krypto měny
app.put('/api/cryptos/:userId/:cryptoId', (req, res) => {
  const db = loadDatabase();
  const user = db.users.find(u => u.id === parseInt(req.params.userId));
  if (user) {
    const cryptoIndex = user.cryptos.findIndex(c => c.id === parseInt(req.params.cryptoId));
    if (cryptoIndex !== -1) {
      user.cryptos[cryptoIndex] = { 
        ...user.cryptos[cryptoIndex], 
        ...req.body,
        id: user.cryptos[cryptoIndex].id // Zachovat původní ID
      };
      saveDatabase(db);
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
  const db = loadDatabase();
  const user = db.users.find(u => u.id === parseInt(req.params.userId));
  if (user) {
    user.cryptos = user.cryptos.filter(c => c.id !== parseInt(req.params.cryptoId));
    saveDatabase(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Uživatel nenalezen' });
  }
});

// Servírování statických souborů z buildu (produkce)
app.use(express.static(path.join(__dirname, 'build')));

// Všechny ostatní requesty přesměruj na React app (fallback pro SPA routing)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server běží na http://localhost:${PORT}`);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://hudecekm23_db_user:Heslo@cluster0.tanyjjb.mongodb.net/?appName=Cluster0';
const DB_NAME = 'Users';

let db;

// Připojení k MongoDB
async function connectToMongoDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Připojeno k MongoDB Atlas');
  } catch (error) {
    console.error('Chyba při připojení k MongoDB:', error);
    process.exit(1);
  }
}

// Získání kolekce uživatelů
function getUsersCollection() {
  return db.collection('KryptoPenezenka');
}

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const usersCollection = getUsersCollection();
    const doc = await usersCollection.findOne({});
    
    if (!doc || !doc.users) {
      return res.status(401).json({ success: false, message: 'Špatné přihlašovací údaje' });
    }
    
    const user = doc.users.find(u => u.username === username && u.password === password);
    
    if (user) {
      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          username: user.username,
          cryptos: user.cryptos || []
        } 
      });
    } else {
      res.status(401).json({ success: false, message: 'Špatné přihlašovací údaje' });
    }
  } catch (error) {
    console.error('Chyba při přihlášení:', error);
    res.status(500).json({ success: false, message: 'Chyba serveru' });
  }
});

// Registrace nového uživatele
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const usersCollection = getUsersCollection();
    const doc = await usersCollection.findOne({});

    if (!doc) {
      return res.status(500).json({ success: false, message: 'Databáze není inicializována' });
    }

    // Zkontrolovat, zda uživatel už neexistuje
    const existingUser = doc.users.find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Uživatelské jméno již existuje' });
    }

    // Vytvořit nového uživatele
    const newUser = {
      id: doc.users.length > 0 ? Math.max(...doc.users.map(u => u.id)) + 1 : 1,
      username,
      password,
      cryptos: []
    };

    await usersCollection.updateOne(
      { _id: doc._id },
      { $push: { users: newUser } }
    );

    res.json({ 
      success: true, 
      user: { 
        id: newUser.id, 
        username: newUser.username,
        cryptos: newUser.cryptos
      } 
    });
  } catch (error) {
    console.error('Chyba při registraci:', error);
    res.status(500).json({ success: false, message: 'Chyba serveru' });
  }
});

// Získání krypto měn uživatele
app.get('/api/cryptos/:userId', async (req, res) => {
  try {
    const usersCollection = getUsersCollection();
    const doc = await usersCollection.findOne({});
    const user = doc?.users?.find(u => u.id === parseInt(req.params.userId));
    if (user) {
      res.json({ success: true, cryptos: user.cryptos || [] });
    } else {
      res.status(404).json({ success: false, message: 'Uživatel nenalezen' });
    }
  } catch (error) {
    console.error('Chyba při získávání krypto:', error);
    res.status(500).json({ success: false, message: 'Chyba serveru' });
  }
});

// Přidání nové krypto měny
app.post('/api/cryptos/:userId', async (req, res) => {
  try {
    const usersCollection = getUsersCollection();
    const userId = parseInt(req.params.userId);
    const newCrypto = {
      id: Date.now(),
      cryptoId: req.body.cryptoId,
      name: req.body.name,
      symbol: req.body.symbol,
      amount: req.body.amount,
      currentPrice: req.body.currentPrice,
      hash: req.body.hash
    };
    
    const result = await usersCollection.updateOne(
      { 'users.id': userId },
      { $push: { 'users.$.cryptos': newCrypto } }
    );
    
    if (result.matchedCount > 0) {
      res.json({ success: true, crypto: newCrypto });
    } else {
      res.status(404).json({ success: false, message: 'Uživatel nenalezen' });
    }
  } catch (error) {
    console.error('Chyba při přidávání krypto:', error);
    res.status(500).json({ success: false, message: 'Chyba serveru' });
  }
});

// Aktualizace krypto měny
app.put('/api/cryptos/:userId/:cryptoId', async (req, res) => {
  try {
    const usersCollection = getUsersCollection();
    const userId = parseInt(req.params.userId);
    const cryptoId = parseInt(req.params.cryptoId);
    
    // Nejdřív najdeme uživatele a krypto
    const doc = await usersCollection.findOne({});
    const user = doc?.users?.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Uživatel nenalezen' });
    }
    
    const cryptoIndex = (user.cryptos || []).findIndex(c => c.id === cryptoId);
    if (cryptoIndex === -1) {
      return res.status(404).json({ success: false, message: 'Krypto nenalezeno' });
    }
    
    const updatedCrypto = { ...user.cryptos[cryptoIndex], ...req.body, id: cryptoId };
    const userIndex = doc.users.findIndex(u => u.id === userId);
    
    await usersCollection.updateOne(
      { _id: doc._id },
      { $set: { [`users.${userIndex}.cryptos.${cryptoIndex}`]: updatedCrypto } }
    );
    
    res.json({ success: true, crypto: updatedCrypto });
  } catch (error) {
    console.error('Chyba při aktualizaci krypto:', error);
    res.status(500).json({ success: false, message: 'Chyba serveru' });
  }
});

// Smazání krypto měny
app.delete('/api/cryptos/:userId/:cryptoId', async (req, res) => {
  try {
    const usersCollection = getUsersCollection();
    const userId = parseInt(req.params.userId);
    const cryptoId = parseInt(req.params.cryptoId);
    
    const result = await usersCollection.updateOne(
      { 'users.id': userId },
      { $pull: { 'users.$.cryptos': { id: cryptoId } } }
    );
    
    if (result.matchedCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Uživatel nenalezen' });
    }
  } catch (error) {
    console.error('Chyba při mazání krypto:', error);
    res.status(500).json({ success: false, message: 'Chyba serveru' });
  }
});

// Servírování statických souborů z buildu (produkce)
app.use(express.static(path.join(__dirname, 'build')));

// Všechny ostatní requesty přesměruj na React app (fallback pro SPA routing)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Spuštění serveru po připojení k MongoDB
connectToMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
  });
});

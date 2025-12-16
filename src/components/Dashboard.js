import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import './Dashboard.css';

// Seznam podporovaných kryptoměn
const CRYPTO_OPTIONS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
  { id: 'ripple', name: 'Ripple', symbol: 'XRP' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
  { id: 'litecoin', name: 'Litecoin', symbol: 'LTC' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
  { id: 'stellar', name: 'Stellar', symbol: 'XLM' }
];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [cryptos, setCryptos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cryptoId: '',
    amount: '',
    hash: ''
  });

  const fetchCurrentPrices = async (cryptoList) => {
    if (cryptoList.length === 0) return [];
    
    try {
      const ids = cryptoList.map(c => c.cryptoId).join(',');
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=czk`
      );
      
      return cryptoList.map(crypto => ({
        ...crypto,
        currentPrice: response.data[crypto.cryptoId]?.czk || crypto.currentPrice || 0
      }));
    } catch (err) {
      console.error('Chyba při získávání cen:', err);
      return cryptoList;
    }
  };

  const loadCryptos = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/cryptos/${user.id}`);
      if (response.data.success) {
        // Načíst aktuální ceny pro všechny krypto měny
        const cryptosWithPrices = await fetchCurrentPrices(response.data.cryptos);
        setCryptos(cryptosWithPrices);
      }
    } catch (err) {
      console.error('Chyba při načítání krypto měn:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadCryptos();
    }
  }, [user, loadCryptos]);

  const handleAddCrypto = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Najít vybranou kryptoměnu
      const selectedCrypto = CRYPTO_OPTIONS.find(c => c.id === formData.cryptoId);
      if (!selectedCrypto) return;

      // Získat aktuální cenu z CoinGecko API
      const priceResponse = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${formData.cryptoId}&vs_currencies=czk`
      );
      
      const currentPrice = priceResponse.data[formData.cryptoId]?.czk || 0;

      // Uložit do backendu
      const response = await axios.post(`http://localhost:5000/api/cryptos/${user.id}`, {
        cryptoId: formData.cryptoId,
        name: selectedCrypto.name,
        symbol: selectedCrypto.symbol,
        amount: parseFloat(formData.amount),
        currentPrice: currentPrice,
        hash: formData.hash
      });

      if (response.data.success) {
        setCryptos([...cryptos, response.data.crypto]);
        setFormData({ cryptoId: '', amount: '', hash: '' });
        setShowForm(false);
      }
    } catch (err) {
      console.error('Chyba při přidávání krypto měny:', err);
      alert('Nepodařilo se načíst cenu kryptoměny. Zkuste to prosím znovu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCrypto = async (cryptoId) => {
    try {
      await axios.delete(`http://localhost:5000/api/cryptos/${user.id}/${cryptoId}`);
      setCryptos(cryptos.filter(c => c.id !== cryptoId));
    } catch (err) {
      console.error('Chyba při mazání krypto měny:', err);
    }
  };

  const calculateTotal = () => {
    return cryptos.reduce((sum, crypto) => sum + (crypto.amount * crypto.currentPrice), 0);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>💰 Krypto Peněženka</h1>
          <span className="username">Přihlášen jako: <strong>{user?.username}</strong></span>
        </div>
        <div className="header-right">
          <button onClick={toggleTheme} className="theme-toggle">
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Odhlásit se
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="portfolio-summary">
          <h2>Celková hodnota portfolia</h2>
          <div className="total-value">
            {calculateTotal().toFixed(2)} Kč
          </div>
        </div>

        <div className="crypto-section">
          <div className="section-header">
            <h2>Moje krypto měny</h2>
            <button onClick={() => setShowForm(!showForm)} className="add-btn">
              {showForm ? '✕ Zrušit' : '+ Přidat krypto'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleAddCrypto} className="crypto-form">
              <div className="form-row">
                <select
                  value={formData.cryptoId}
                  onChange={(e) => setFormData({ ...formData, cryptoId: e.target.value })}
                  required
                  className="crypto-select"
                >
                  <option value="">Vyberte kryptoměnu</option>
                  {CRYPTO_OPTIONS.map(crypto => (
                    <option key={crypto.id} value={crypto.id}>
                      {crypto.name} ({crypto.symbol})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.00000001"
                  placeholder="Množství"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Hash adresa (např. 05gaP480/M?-1drPt12967&d/)"
                  value={formData.hash}
                  onChange={(e) => setFormData({ ...formData, hash: e.target.value })}
                  required
                  className="hash-input"
                />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? '⏳ Načítání ceny...' : '✅ Přidat'}
              </button>
            </form>
          )}

          <div className="crypto-list">
            {cryptos.length === 0 ? (
              <div className="empty-state">
                <p>📊 Zatím nemáte žádné krypto měny</p>
                <p>Začněte přidáním své první krypto měny</p>
              </div>
            ) : (
              cryptos.map((crypto) => (
                <div key={crypto.id} className="crypto-card">
                  <div className="crypto-info">
                    <div className="crypto-header">
                      <h3>{crypto.name}</h3>
                      <span className="crypto-symbol">{crypto.symbol}</span>
                    </div>
                    <div className="crypto-hash">
                      <span className="label">🔑 Hash adresa:</span>
                      <span className="hash-value">{crypto.hash}</span>
                    </div>
                    <div className="crypto-details">
                      <div className="detail-item">
                        <span className="label">Množství:</span>
                        <span className="value">{crypto.amount}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Cena:</span>
                        <span className="value">{crypto.currentPrice.toFixed(2)} Kč</span>
                      </div>
                      <div className="detail-item total">
                        <span className="label">Celková hodnota:</span>
                        <span className="value">
                          {(crypto.amount * crypto.currentPrice).toFixed(2)} Kč
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteCrypto(crypto.id)} 
                    className="delete-btn"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

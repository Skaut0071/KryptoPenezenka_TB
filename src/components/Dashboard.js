import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import './Dashboard.css';

// Seznam podporovaných kryptoměn
const CRYPTO_OPTIONS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', icon: '₿' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', icon: 'Ð' },
  { id: 'ripple', name: 'Ripple', symbol: 'XRP', icon: '✕' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA', icon: '₳' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', icon: '◎' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', icon: '●' },
  { id: 'litecoin', name: 'Litecoin', symbol: 'LTC', icon: 'Ł' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', icon: '⬡' },
  { id: 'stellar', name: 'Stellar', symbol: 'XLM', icon: '*' }
];

// Pomocná funkce pro formátování čísel s oddělovačem tisíců
const formatNumber = (num, decimals = 8) => {
  if (!num && num !== 0) return '0';
  const number = parseFloat(num);
  if (isNaN(number)) return '0';
  
  // Pro velmi malá čísla zobraz více desetinných míst
  let formatted;
  if (number < 0.00001 && number > 0) {
    formatted = number.toFixed(decimals);
  } else if (number >= 1000) {
    // Pro velká čísla odděl tisíce mezerou
    const parts = number.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    formatted = parts.join('.');
  } else {
    formatted = number.toFixed(decimals).replace(/\.?0+$/, '');
  }
  
  return formatted;
};

// Funkce pro formátování měny (Kč)
const formatCurrency = (num) => {
  if (!num && num !== 0) return '0';
  const number = parseFloat(num);
  if (isNaN(number)) return '0';
  
  const parts = number.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join(',');
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [cryptos, setCryptos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [marketData, setMarketData] = useState([]);
  const [loadingMarket, setLoadingMarket] = useState(false);
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

  const handleAmountChange = (e) => {
    // Nahradit čárku tečkou pro správné desetinné číslo
    const value = e.target.value.replace(',', '.');
    setFormData({ ...formData, amount: value });
  };

  const loadMarketData = async () => {
    setLoadingMarket(true);
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=czk&order=market_cap_desc&per_page=50&page=1&sparkline=false'
      );
      setMarketData(response.data);
    } catch (err) {
      console.error('Chyba při načítání market dat:', err);
    } finally {
      setLoadingMarket(false);
    }
  };

  const handleNavClick = (section) => {
    setActiveSection(section);
    if (section === 'market' && marketData.length === 0) {
      loadMarketData();
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">💎 Krypto</div>
        </div>
        
        <div className="sidebar-user">
          <div className="sidebar-user-name">{user?.username}</div>
          <div className="sidebar-user-stats">
            <span>💰 {cryptos.length} aktiv</span>
            <span>•</span>
            <span>📈 {formatCurrency(calculateTotal())} Kč</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div 
            className={`sidebar-nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            📊 Dashboard
          </div>
          <div 
            className={`sidebar-nav-item ${activeSection === 'portfolio' ? 'active' : ''}`}
            onClick={() => handleNavClick('portfolio')}
          >
            💰 Portfolio
          </div>
          <div 
            className={`sidebar-nav-item ${activeSection === 'market' ? 'active' : ''}`}
            onClick={() => handleNavClick('market')}
          >
            📈 Trh & Ceník
          </div>
        </nav>

        <div className="sidebar-footer">
          <button onClick={toggleTheme} className="theme-toggle">
            {isDark ? '☀️ Světlý režim' : '🌙 Tmavý režim'}
          </button>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Odhlásit se
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Dashboard Section */}
        {activeSection === 'dashboard' && (
          <>
            {/* Stats Row */}
            <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-label">Celková hodnota</div>
            <div className="stat-value">{formatCurrency(calculateTotal())} Kč</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-label">Počet kryptoměn</div>
            <div className="stat-value">{cryptos.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-label">Nejlepší aktivo</div>
            <div className="stat-value">
              {cryptos.length > 0 
                ? cryptos.reduce((max, c) => (c.amount * c.currentPrice) > (max.amount * max.currentPrice) ? c : max, cryptos[0])?.symbol
                : '-'
              }
            </div>
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
                  type="text"
                  inputMode="decimal"
                  placeholder="Množství"
                  value={formData.amount}
                  onChange={handleAmountChange}
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
              cryptos.map((crypto) => {
                const cryptoData = CRYPTO_OPTIONS.find(c => c.id === crypto.cryptoId);
                const icon = cryptoData?.icon || '💎';
                
                return (
                <div key={crypto.id} className="crypto-card">
                  <div className="crypto-info">
                    <div className="crypto-header">
                      <span className="crypto-icon">{icon}</span>
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
                        <span className="value">{formatNumber(crypto.amount, 8)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Cena měny (ku 1.0):</span>
                        <span className="value">{formatCurrency(crypto.currentPrice)} Kč</span>
                      </div>
                      <div className="detail-item total">
                        <span className="label">Celková hodnota:</span>
                        <span className="value">
                          {formatCurrency(crypto.amount * crypto.currentPrice)} Kč
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
                );
              })
            )}
          </div>
        </div>
          </>
        )}

        {/* Portfolio Section */}
        {activeSection === 'portfolio' && (
          <div className="portfolio-section">
            <h2>📊 Detail portfolia</h2>
            <div className="portfolio-breakdown">
              {cryptos.length === 0 ? (
                <div className="empty-state">
                  <p>Zatím nemáte žádné kryptoměny v portfoliu</p>
                </div>
              ) : (
                <div className="portfolio-grid">
                  {cryptos.map((crypto) => {
                    const totalValue = crypto.amount * crypto.currentPrice;
                    const portfolioTotal = calculateTotal();
                    const percentage = portfolioTotal > 0 ? (totalValue / portfolioTotal * 100).toFixed(1) : 0;
                    
                    return (
                      <div key={crypto.id} className="portfolio-item">
                        <div className="portfolio-item-header">
                          <span className="portfolio-crypto-name">{crypto.name}</span>
                          <span className="portfolio-percentage">{percentage}%</span>
                        </div>
                        <div className="portfolio-progress">
                          <div 
                            className="portfolio-progress-bar" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="portfolio-item-details">
                          <span>{formatNumber(crypto.amount, 8)} {crypto.symbol}</span>
                          <span>{formatCurrency(totalValue)} Kč</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market Section */}
        {activeSection === 'market' && (
          <div className="market-section">
            <div className="section-header">
              <h2>📈 Trh kryptoměn</h2>
              <button onClick={loadMarketData} className="refresh-btn" disabled={loadingMarket}>
                {loadingMarket ? '⏳ Načítání...' : '🔄 Obnovit'}
              </button>
            </div>
            
            {loadingMarket && marketData.length === 0 ? (
              <div className="loading-state">Načítám data z trhu...</div>
            ) : (
              <div className="market-table">
                <div className="market-table-header">
                  <div className="market-col">#</div>
                  <div className="market-col">Kryptoměna</div>
                  <div className="market-col">Cena</div>
                  <div className="market-col">24h změna</div>
                  <div className="market-col">Tržní kapitalizace</div>
                </div>
                {marketData.map((coin, index) => (
                  <div key={coin.id} className="market-table-row">
                    <div className="market-col">{index + 1}</div>
                    <div className="market-col market-coin-info">
                      <img src={coin.image} alt={coin.name} className="market-coin-icon" />
                      <span className="market-coin-name">{coin.name}</span>
                      <span className="market-coin-symbol">{coin.symbol.toUpperCase()}</span>
                    </div>
                    <div className="market-col">{formatCurrency(coin.current_price)} Kč</div>
                    <div className={`market-col ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                      {coin.price_change_percentage_24h >= 0 ? '↑' : '↓'} {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                    </div>
                    <div className="market-col">{formatCurrency(coin.market_cap)} Kč</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

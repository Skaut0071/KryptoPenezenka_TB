import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('/api/login', {
        username,
        password
      });

      if (response.data.success) {
        login(response.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Chyba při přihlašování');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🔐 Krypto Peněženka</h1>
        <p className="subtitle">Přihlaste se do svého účtu</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Uživatelské jméno</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Zadejte username"
              required
            />
          </div>

          <div className="input-group">
            <label>Heslo</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Zadejte heslo"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn">
            Přihlásit se
          </button>
        </form>

        <div className="register-section">
          <p>Ještě nemáte účet?</p>
          <button 
            className="register-btn" 
            onClick={() => navigate('/register')}
          >
            Registrovat se
          </button>
        </div>

        <div className="demo-info">
          <p><strong>Demo účty:</strong></p>
          <p>admin / 123</p>
          <p>user / heslo</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

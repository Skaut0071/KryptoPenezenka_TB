import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './Login.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Hesla se neshodují');
      return;
    }

    if (password.length < 3) {
      setError('Heslo musí mít alespoň 3 znaky');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/register', {
        username,
        password
      });

      if (response.data.success) {
        login(response.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Chyba při registraci');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🔐 Registrace</h1>
        <p className="subtitle">Vytvořte si nový účet</p>
        
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

          <div className="input-group">
            <label>Potvrdit heslo</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Zadejte heslo znovu"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn">
            Registrovat se
          </button>
        </form>

        <div className="register-section">
          <p>Už máte účet?</p>
          <button 
            className="register-btn" 
            onClick={() => navigate('/login')}
          >
            Přihlásit se
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;

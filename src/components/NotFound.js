import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="notfound-container">
      <div className="notfound-content">
        <h1 className="error-code">404</h1>
        <h2>Stránka nenalezena</h2>
        <p>Omlouváme se, ale stránka kterou hledáte neexistuje.</p>
        <Link to="/dashboard" className="back-home-btn">
          🏠 Zpět na hlavní stránku
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

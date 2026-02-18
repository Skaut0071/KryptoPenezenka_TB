import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import NotFound from './components/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route 
        path="/" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" replace /> : <Register />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

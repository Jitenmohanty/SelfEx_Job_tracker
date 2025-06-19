import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await api.get(`${import.meta.env.VITE_BACKEND_URI}/api/users/profile`);
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
        setError('Authentication failed. Please login again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.post(`${import.meta.env.VITE_BACKEND_URI}/api/users/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data);
      setError(null);
      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const response = await api.post(`${import.meta.env.VITE_BACKEND_URI}/api/users/register`, { name, email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data);
      setError(null);
      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
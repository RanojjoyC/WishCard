import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('wishcard_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('wishcard_token') || '';
  });

  const [isLoggedOut, setIsLoggedOut] = useState(!currentUser);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('wishcard_user', JSON.stringify(currentUser));
      setIsLoggedOut(false);
    } else {
      localStorage.removeItem('wishcard_user');
      setIsLoggedOut(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('wishcard_token', token);
    } else {
      localStorage.removeItem('wishcard_token');
    }
  }, [token]);

  // Sync latest user profile from server
  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.user) {
        setCurrentUser(res.data.user);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
      }
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data?.success && res.data?.user) {
        setCurrentUser(res.data.user);
        setToken(res.data.token);
        setIsLoggedOut(false);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data?.message || 'Registration failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration error';
      return { success: false, message: msg };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success && res.data?.user) {
        setCurrentUser(res.data.user);
        setToken(res.data.token);
        setIsLoggedOut(false);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data?.message || 'Login failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken('');
    localStorage.removeItem('wishcard_user');
    localStorage.removeItem('wishcard_token');
    setIsLoggedOut(true);
  };

  const addCreditCard = async (cardData) => {
    try {
      const res = await api.post('/auth/card', cardData);
      if (res.data?.success) {
        const updatedCards = res.data.creditCards;
        const updated = { ...currentUser, creditCards: updatedCards };
        setCurrentUser(updated);
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Failed to add card' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const updateCard = async (cardId, cardData) => {
    try {
      const res = await api.put(`/auth/card/${cardId}`, cardData);
      if (res.data?.success) {
        const updatedCards = res.data.creditCards;
        const updated = { ...currentUser, creditCards: updatedCards };
        setCurrentUser(updated);
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Failed to update card' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const deleteCard = async (cardId) => {
    try {
      const res = await api.delete(`/auth/card/${cardId}`);
      if (res.data?.success) {
        const updatedCards = res.data.creditCards;
        const updated = { ...currentUser, creditCards: updatedCards };
        setCurrentUser(updated);
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Failed to delete card' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      if (res.data?.success) {
        setCurrentUser(res.data.user);
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Failed to update profile' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const updateLocation = async (coordinates, address) => {
    try {
      const res = await api.put('/auth/location', { coordinates, address });
      if (res.data?.success) {
        setCurrentUser(prev => ({ ...prev, location: res.data.location }));
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        token,
        isLoggedOut,
        login,
        register,
        logout,
        addCreditCard,
        updateCard,
        deleteCard,
        updateProfile,
        updateLocation,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => useContext(AuthContext);

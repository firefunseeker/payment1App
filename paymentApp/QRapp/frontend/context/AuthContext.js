import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState(null); // For users with multiple roles

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      const storedRole = await AsyncStorage.getItem('currentRole');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setCurrentRole(storedRole || (JSON.parse(storedUser).roles[0]));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData, authToken) => {
    try {
      await AsyncStorage.setItem('token', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setToken(authToken);
      setUser(userData);
      
      // Set default role
      const defaultRole = userData.roles.includes('admin') ? 'admin' : userData.roles[0];
      setCurrentRole(defaultRole);
      await AsyncStorage.setItem('currentRole', defaultRole);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user', 'currentRole']);
      setToken(null);
      setUser(null);
      setCurrentRole(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const switchRole = async (newRole) => {
    if (user && user.roles.includes(newRole)) {
      setCurrentRole(newRole);
      await AsyncStorage.setItem('currentRole', newRole);
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };
      await AsyncStorage.setItem('user', JSON.stringify(newUserData));
      setUser(newUserData);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const makeAuthenticatedRequest = async (url, options = {}) => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...options, ...defaultOptions });

    if (response.status === 401) {
      // Token expired or invalid
      await logout();
      throw new Error('Authentication expired. Please login again.');
    }

    return response;
  };

  const value = {
    user,
    token,
    currentRole,
    loading,
    login,
    logout,
    switchRole,
    updateUser,
    makeAuthenticatedRequest,
    isAuthenticated: !!token,
    isCustomer: currentRole === 'customer',
    isMerchant: currentRole === 'merchant',
    isAdmin: currentRole === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

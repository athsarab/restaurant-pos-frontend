import { useState, useEffect } from 'react';

export function useWebsiteAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      // Use separate storage keys for website auth (different from inventory auth)
      const token = localStorage.getItem('website_token');
      const userData = localStorage.getItem('website_user');

      if (token && userData) {
        // Verify token hasn't expired
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;

          if (payload.exp > currentTime) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            // Token expired, clear storage
            logout();
          }
        } catch (tokenError) {
          console.error('Error parsing token:', tokenError);
          logout();
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    // Store website-specific auth data (separate from inventory auth)
    localStorage.setItem('website_token', token);
    localStorage.setItem('website_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Only clear website auth, leave inventory auth intact
    localStorage.removeItem('website_token');
    localStorage.removeItem('website_user');
    localStorage.removeItem('website_table_preference');
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus
  };
}
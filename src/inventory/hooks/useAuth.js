import { useEffect, useState } from 'react';

// Hook to get current user info
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT token to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (payload.exp && payload.exp < currentTime) {
          // Token expired, clear storage and redirect to login
          console.log('Token expired, logging out...');
          localStorage.removeItem('token');
          window.location.href = '/inventory/login';
          return;
        }
        
        setUser({
          id: payload.id,
          role: payload.role,
          name: payload.name,
          email: payload.email
        });
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  return { user, loading };
}
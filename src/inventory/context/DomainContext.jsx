import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const DomainCtx = createContext({ domain: 'restaurant', setDomain: () => {} });

export function DomainProvider({ children }) {
  const [domain, setDomain] = useState(localStorage.getItem('domain') || 'restaurant');

  useEffect(() => {
    localStorage.setItem('domain', domain);
    // Set header for all API calls
    api.defaults.headers.common['x-domain'] = domain;
  }, [domain]);

  return <DomainCtx.Provider value={{ domain, setDomain }}>{children}</DomainCtx.Provider>;
}

export function useDomain() {
  return useContext(DomainCtx);
}

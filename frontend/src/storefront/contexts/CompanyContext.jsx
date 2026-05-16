import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../redux/slices/auth/axiosInstance';

const CompanyContext = createContext();

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }) => {
  const [company, setCompany] = useState({
    companyName: 'GULTRADERS',
    phone: '+92 311 4000096',
    address: 'Grand Dil jan Plaza, Block A, Shop #7,8,9, Opposite Fahad CNG Pump, Near Toyota Khyber, Ring Road Peshawar, KPK, Pakistan',
    logo: '/logo.jpeg'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await axiosInstance.get('/storefront-company');
        if (response.data && response.data.data) {
          setCompany(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch company information:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, []);

  return (
    <CompanyContext.Provider value={{ company, loading }}>
      {children}
    </CompanyContext.Provider>
  );
};

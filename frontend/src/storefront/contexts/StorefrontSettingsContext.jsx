import { createContext, useContext, useEffect, useState } from 'react';

const StorefrontSettingsContext = createContext({
  showPrices: true,
  heroTitle: 'Premium Car Accessories',
  heroSubtitle: 'Wholesale Dealers',
  loading: true,
});

export const StorefrontSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    showPrices: true,
    heroTitle: 'Premium Car Accessories',
    heroSubtitle: 'Wholesale Dealers',
    loading: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/storefront/settings');
        const json = await res.json();
        if (json.success && json.data) {
          setSettings({ ...json.data, loading: false });
        } else {
          setSettings(prev => ({ ...prev, loading: false }));
        }
      } catch {
        // Fail silently — use defaults
        setSettings(prev => ({ ...prev, loading: false }));
      }
    };
    fetchSettings();
  }, []);

  return (
    <StorefrontSettingsContext.Provider value={settings}>
      {children}
    </StorefrontSettingsContext.Provider>
  );
};

export const useStorefrontSettings = () => useContext(StorefrontSettingsContext);

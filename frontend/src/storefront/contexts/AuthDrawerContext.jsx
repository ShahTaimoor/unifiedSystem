import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthDrawerContext = createContext();

// Global function reference for non-React contexts
let globalOpenDrawer = null;

export const useAuthDrawer = () => {
  const context = useContext(AuthDrawerContext);
  if (!context) {
    throw new Error('useAuthDrawer must be used within AuthDrawerProvider');
  }
  return context;
};

// Global function to open drawer from anywhere (for non-React code)
export const openAuthDrawerGlobal = (mode = 'login') => {
  if (globalOpenDrawer) {
    globalOpenDrawer(mode);
  } else {
    // Fallback: dispatch custom event
    window.dispatchEvent(new CustomEvent('openAuthDrawer', { detail: { mode } }));
  }
};

export const AuthDrawerProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [initialMode, setInitialMode] = useState('login'); // 'login' or 'signup'

  const openDrawer = (mode = 'login') => {
    setInitialMode(mode);
    setOpen(true);
  };

  const closeDrawer = () => {
    setOpen(false);
  };

  // Set global function reference
  useEffect(() => {
    globalOpenDrawer = openDrawer;
    
    // Listen for custom events from non-React code
    const handleOpenDrawer = (event) => {
      openDrawer(event.detail?.mode || 'login');
    };
    
    window.addEventListener('openAuthDrawer', handleOpenDrawer);
    
    return () => {
      globalOpenDrawer = null;
      window.removeEventListener('openAuthDrawer', handleOpenDrawer);
    };
  }, []);

  return (
    <AuthDrawerContext.Provider value={{ open, openDrawer, closeDrawer, setOpen, initialMode }}>
      {children}
    </AuthDrawerContext.Provider>
  );
};


import type { GlobalProvider } from '@ladle/react';
import React, { useEffect } from 'react';
import '../src/app/globals.css';

export const Provider: GlobalProvider = ({ children, globalState }) => {
  useEffect(() => {
    if (globalState.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [globalState.theme]);

  return (
    <div className="font-sans text-primary bg-primary min-h-screen p-8">
      {children}
    </div>
  );
};

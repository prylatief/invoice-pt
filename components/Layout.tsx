import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="h-full flex flex-col p-4 md:p-6">
      {children}
    </div>
  );
};
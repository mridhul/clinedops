import React from 'react';
import GlassHeader from './GlassHeader';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <GlassHeader />
      <Sidebar />
      <main className="lg:ml-64 pt-16 min-h-screen pb-24 lg:pb-0 bg-background">
        <div className="px-4 md:px-8 py-10 md:py-12 max-w-7xl mx-auto space-y-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;

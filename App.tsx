import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { LeadSearch } from './pages/LeadSearch';
import { LeadsManager } from './pages/LeadsManager';
import { Outreach } from './pages/Outreach';
import { Strategy } from './pages/Strategy';
import { UsersPage } from './pages/UsersPage';
import { Settings } from './pages/Settings';
import { Templates } from './pages/Templates';
import { Campaigns } from './pages/Campaigns';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Landing } from './pages/Landing';
import { SystemStatus } from './components/SystemStatus';

function AuthenticatedApp() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading LocalLead Engine...</div>;
  }

  if (!user) {
    return <Landing />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'campaigns': return <Campaigns />;
      case 'lead-search': return <LeadSearch />;
      case 'leads': return <LeadsManager />;
      case 'templates': return <Templates />;
      case 'outreach': return <Outreach />;
      case 'strategy': return <Strategy />;
              case 'users': return <UsersPage />;
      40
        : return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <SystemStatus />
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 ml-64 flex flex-col h-full overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

import React, { useState } from 'react';
import { UserProfile } from './services/api';
import { Navbar } from './components/Navbar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { ComposeLetterView } from './views/ComposeLetterView';
import { LetterDetailView } from './views/LetterDetailView';

export function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'compose' | 'detail'>('dashboard');
  const [selectedLetterId, setSelectedLetterId] = useState<string>('');

  const handleLoginSuccess = (userToken: string, userData: UserProfile) => {
    setToken(userToken);
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
  };

  const handleSelectLetter = (id: string) => {
    setSelectedLetterId(id);
    setCurrentView('detail');
  };

  if (!token || !user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={user}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1 }}>
        {currentView === 'dashboard' && (
          <DashboardView
            user={user}
            onSelectLetter={handleSelectLetter}
            onNavigateCompose={() => setCurrentView('compose')}
          />
        )}

        {currentView === 'compose' && (
          <ComposeLetterView
            user={user}
            onBack={() => setCurrentView('dashboard')}
            onSubmitSuccess={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'detail' && (
          <LetterDetailView
            user={user}
            letterId={selectedLetterId}
            onBack={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        borderTop: '1px solid var(--border-glass)',
        fontSize: '0.8rem',
        color: 'var(--text-dim)',
        marginTop: 'auto'
      }}>
        SecureOffice-AI © 2026. Single-Tenant Enterprise Digital Correspondence Platform with Hybrid Cryptography & Agentic AI.
      </footer>
    </div>
  );
}

export default App;

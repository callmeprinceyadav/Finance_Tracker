import React, { useState, useRef } from 'react';
import { Upload, BarChart3, Settings, FileText, Sparkles } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { FileUpload } from './components/FileUpload';
import { Transactions } from './components/Transactions';
import { UploadResponse } from './types';

type ActiveTab = 'dashboard' | 'upload' | 'transactions';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const dashboardRefreshRef = useRef<(() => void) | null>(null);

  const handleUploadSuccess = (data: UploadResponse) => {
    console.log('✅ Session-based upload completed:', {
      totalParsed: data.totalParsed,
      totalSaved: data.totalSaved,
      previousDataPreserved: data.previousDataPreserved || 0,
      isNewSession: data.isNewSession || false,
      sessionMessage: data.sessionMessage
    });
    
    setShowUploadSuccess(true);
    
    if (dashboardRefreshRef.current) {
      dashboardRefreshRef.current();
    }
    
    const switchDelay = 2500;
    setTimeout(() => {
      setActiveTab('dashboard');
      setShowUploadSuccess(false);
      
      setTimeout(() => {
        if (dashboardRefreshRef.current) {
          dashboardRefreshRef.current();
        }
      }, 300);
    }, switchDelay);
  };

  const handleUploadError = (error: string) => {
    console.error('❌ Upload error:', error);
  };

  const navigationItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: BarChart3 },
    { id: 'upload' as ActiveTab, label: 'Upload', icon: Upload },
    { id: 'transactions' as ActiveTab, label: 'Transactions', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard refreshRef={dashboardRefreshRef} />;
        
      case 'upload':
        return (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Upload Bank Statement
              </h2>
              <p className="text-gray-600">
                Upload your bank statement to start a fresh session. Previous data will be preserved.
              </p>
            </div>
            
            {showUploadSuccess && (
              <div className="mb-6 glass-card-static p-4" style={{ borderLeft: '3px solid #10b981' }}>
                <div className="flex items-center">
                  <div className="text-success-400 mr-3">✅</div>
                  <div>
                    <h3 className="text-sm font-medium text-success-400">
                      New Session Started!
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Dashboard updated with fresh data. Previous transactions preserved.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <FileUpload 
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              className="mb-8"
            />
            
            <div className="glass-card-static p-6" style={{ borderLeft: '3px solid #6366f1' }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-500" />
                Session-Based Finance Tracker
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5">•</span>
                  Each upload starts a fresh session — previous data is preserved
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5">•</span>
                  Perfect for analyzing individual statements while keeping history safe
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5">•</span>
                  Use clear, high-quality PDF statements for best AI parsing
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5">•</span>
                  CSV files should include Date, Amount, and Description columns
                </li>
              </ul>
            </div>
          </div>
        );
        
      case 'transactions':
        return <Transactions />;
        
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', backgroundAttachment: 'fixed' }}>
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="p-2 rounded-xl gradient-indigo">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h1 className="ml-3 text-xl font-bold gradient-text-primary">
                  Finance Tracker
                </h1>
              </div>
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="relative flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300"
                    style={{
                      background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: isActive ? '#a78bfa' : '#94a3b8',
                      boxShadow: isActive ? '0 0 20px rgba(99, 102, 241, 0.1)' : 'none',
                    }}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                    {isActive && (
                      <span 
                        className="absolute bottom-0 left-1/2 h-0.5 rounded-full"
                        style={{
                          width: '60%',
                          transform: 'translateX(-50%)',
                          background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
            
            {/* Mobile Nav */}
            <nav className="md:hidden flex items-center gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="p-2.5 rounded-xl transition-all duration-300"
                    title={item.label}
                    style={{
                      background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: isActive ? '#a78bfa' : '#64748b',
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </nav>
            
            {/* Settings */}
            <div className="flex items-center">
              <button 
                className="p-2 rounded-xl transition-all duration-200"
                style={{ color: '#64748b' }}
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer style={{ 
        borderTop: '1px solid rgba(148, 163, 184, 0.06)',
        background: 'rgba(15, 23, 42, 0.5)',
        marginTop: '3rem',
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: '#64748b' }}>
              AI-Powered Finance Tracker — Built with MERN Stack
            </p>
            <p className="text-xs" style={{ color: '#475569' }}>
              Powered by Google Gemini
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

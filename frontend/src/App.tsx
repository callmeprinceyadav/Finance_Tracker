import React, { useState, useRef } from 'react';
import { Upload, BarChart3, Settings, FileText } from 'lucide-react';
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
    
    // Immediately refresh dashboard data for new session
    if (dashboardRefreshRef.current) {
      dashboardRefreshRef.current();
    }
    
    // Switch to dashboard faster for session-based uploads since it's always new data
    const switchDelay = 2500;
    setTimeout(() => {
      setActiveTab('dashboard');
      setShowUploadSuccess(false);
      
      // Additional refresh to ensure data is loaded
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
    { id: 'upload' as ActiveTab, label: 'Upload Statement', icon: Upload },
    { id: 'transactions' as ActiveTab, label: 'Transactions', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard refreshRef={dashboardRefreshRef} />;
        
      case 'upload':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Upload Bank Statement
              </h2>
              <p className="text-gray-600">
                💾 Upload your bank statement to start a fresh session. Previous data will be preserved in the database.
              </p>
            </div>
            
            {showUploadSuccess && (
              <div className="mb-6 bg-success-50 border border-success-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-success-400 mr-3">
                    ✅
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-success-800">
                      New Session Started!
                    </h3>
                    <p className="text-sm text-success-700 mt-1">
                      💾 Dashboard updated with fresh data. Previous transactions preserved in database.
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
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                💾 Session-Based Finance Tracker
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Each upload starts a fresh session - previous data is preserved in database</li>
                <li>• Perfect for analyzing individual statements while keeping historical data safe</li>
                <li>• Use clear, high-quality PDF statements for best AI parsing results</li>
                <li>• CSV files should include Date, Amount, and Description columns</li>
                <li>• Review AI-parsed transactions and correct any mistakes</li>
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <BarChart3 className="h-8 w-8 text-primary-600" />
                <h1 className="ml-3 text-xl font-bold text-gray-900">
                  Finance Tracker
                </h1>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            
            <nav className="md:hidden flex space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`p-2 rounded-md transition-colors ${
                      activeTab === item.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    title={item.label}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </nav>
            
            <div className="flex items-center">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              AI-Powered Finance Tracker - Built with MERN Stack
            </p>
            <p className="text-xs text-gray-400">
              Powered by Google Gemini for intelligent transaction parsing
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

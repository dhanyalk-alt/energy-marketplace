import React, { useState } from 'react';
import AIAssistant from './AIAssistant';
import Forecasting from './Forecasting';
import Trading from './Trading';
import Overview from './Overview';
import RecentSales from './RecentSales';
import EnergyFlowMap from './EnergyFlowMap';
import Market from './Market';
import Settings from './Settings';

export default function ProducerLayout({ onSwitchToConsumer, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const username = localStorage.getItem('username');
  const renderContent = () => {
    switch(activeTab) {
      case 'forecasting': return <Forecasting />;
      case 'trading': return <Trading />;
      case 'overview': return <Overview />;
      case 'sales': return <RecentSales />;
      case 'flow': return <EnergyFlowMap />;
      case 'market': return <Market />;
      case 'settings': return <Settings />;
      default: return <Overview />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {/* Top Header Row */}
      <header style={{ height: '60px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', backgroundColor: '#ffffff', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '30px', backgroundColor: '#c7d2fe', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>icon</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: '500', color: '#374151' }}>
  {username || 'User'}
</span>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e5e7eb' }}></div>
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
          >
            ☰
          </button>
          
          {menuOpen && (
            <div style={{ position: 'absolute', right: '20px', top: '55px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 50, padding: '8px', width: '220px' }}>
              <button 
                onClick={() => { onSwitchToConsumer(); setMenuOpen(false); }}
                style={{ width: '100%', textAlign: 'left', padding: '8px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}
              >
                log in as consumer
              </button>
              <button 
                onClick={onLogout}
                style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'none', color: '#dc2626', border: 'none', cursor: 'pointer', fontSize: '13px' }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Side Navigation Menu */}
        <aside style={{ width: '240px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '16px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ padding: '4px 16px', fontSize: '11px', color: '#9ca3af', fontWeight: 'bold' }}>feactures and navigation</span>
            <button onClick={() => setActiveTab('overview')} style={{ textAlign: 'left', padding: '10px 16px', background: activeTab === 'overview' ? '#f3f4f6' : 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Overview</button>
            <button onClick={() => setActiveTab('forecasting')} style={{ textAlign: 'left', padding: '10px 16px', background: activeTab === 'forecasting' ? '#f3f4f6' : 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Forecasting</button>
            <button onClick={() => setActiveTab('trading')} style={{ textAlign: 'left', padding: '10px 16px', background: activeTab === 'trading' ? '#f3f4f6' : 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Trading Page</button>
            <button onClick={() => setActiveTab('sales')} style={{ textAlign: 'left', padding: '10px 16px', background: activeTab === 'sales' ? '#f3f4f6' : 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Recent Sales</button>
            <button onClick={() => setActiveTab('flow')} style={{ textAlign: 'left', padding: '10px 16px', background: activeTab === 'flow' ? '#f3f4f6' : 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Energy Flow Map</button>
            <button onClick={() => setActiveTab('market')} style={{ textAlign: 'left', padding: '10px 16px', background: activeTab === 'market' ? '#f3f4f6' : 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Market Page</button>
          </div>
          <button onClick={() => setActiveTab('settings')} style={{ textAlign: 'left', padding: '10px 16px', background: activeTab === 'settings' ? '#f3f4f6' : 'none', border: 'none', cursor: 'pointer', fontSize: '14px', borderTop: '1px solid #f3f4f6', fontWeight: '500' }}>setting</button>
        </aside>

        {/* Dynamic Center Work Area */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: '#fafafa' }}>
          {renderContent()}
        </main>

        {/* Right Side Floating AI Bar */}
          <aside
  style={{
    width: '240px',
    borderLeft: '1px solid #e5e7eb',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#ffffff'
  }}
>
  <AIAssistant />
</aside>
      </div>
    </div>
  );
}
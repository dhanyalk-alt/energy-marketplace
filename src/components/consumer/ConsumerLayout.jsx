import React, { useState } from 'react';
import AIAssistant from './AIAssistant';
import ProducerMarketplace from './ProducerMarketplace';
import RequestBuying from './RequestBuying';
import Overview from './Overview';
import EnergyFlowMap from './EnergyFlowMap';
import ReviewProducers from './ReviewProducers';
import Settings from './Settings';

export default function ConsumerLayout({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);

  const renderContent = () => {
    switch(activeTab) {
      case 'marketplace': return <ProducerMarketplace onRedirectToRequests={() => setActiveTab('requests')} />;
      case 'requests': return <RequestBuying />;
      case 'overview': return <Overview />;
      case 'flow': return <EnergyFlowMap />;
      case 'reviews': return <ReviewProducers />;
      case 'settings': return <Settings />;
      default: return <Overview />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {/* Top Header Row */}
      <header style={{ height: '60px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', backgroundColor: '#ffffff', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '30px', backgroundColor: '#93c5fd', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>icon</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: '500', color: '#374151' }}>raju</span>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e5e7eb' }}></div>
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
          >
            ☰
          </button>
          
          {menuOpen && (
            <div style={{ position: 'absolute', right: '20px', top: '55px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 50, padding: '8px', width: '150px' }}>
              {/* Notice: Crucial restriction - no producer switch button exists here */}
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
            <button onClick={() => setActiveTab('marketplace')} style={{ textAlign: 'left', padding: '10px 16px', background: activeTab === 'marketplace' ? '#f3f4f6' : 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Market Directory</button>
            <button onClick={() => setActiveTab('requests')} style={{ textAlign: 'left', padding: '10px 16px', background: activeTab === 'requests' ? '#f3f4f6' : 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Request Page</button>
            <button onClick={() => setActiveTab('flow')} style={{ textAlign: 'left', padding: '10px 16px', background: activeTab === 'flow' ? '#f3f4f6' : 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Energy Flow Map</button>
            <button onClick={() => setActiveTab('reviews')} style={{ textAlign: 'left', padding: '10px 16px', background: activeTab === 'reviews' ? '#f3f4f6' : 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Review Page</button>
          </div>
          <button onClick={() => setActiveTab('settings')} style={{ textAlign: 'left', padding: '10px 16px', background: activeTab === 'settings' ? '#f3f4f6' : 'none', border: 'none', cursor: 'pointer', fontSize: '14px', borderTop: '1px solid #f3f4f6', fontWeight: '500' }}>setting</button>
        </aside>

        {/* Dynamic Center Work Area */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: '#fafafa' }}>
          {renderContent()}
        </main>

        {/* Right Side Floating AI Bar */}
        <aside style={{ width: '240px', borderLeft: '1px solid #e5e7eb', padding: '20px', display: 'flex', justifyContent: 'center', backgroundColor: '#ffffff' }}>
          <AIAssistant />
        </aside>
      </div>
    </div>
  );
}
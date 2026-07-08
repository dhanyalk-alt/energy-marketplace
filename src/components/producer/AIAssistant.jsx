import React from 'react';

export default function AIAssistant() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '200px' }}>
      {/* Robot Character Graphic Placeholder */}
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#d1d5db' }}></div>
      <div style={{ width: '60px', height: '60px', backgroundColor: '#d1d5db', borderRadius: '8px' }}></div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ width: '4px', height: '40px', backgroundColor: '#d1d5db' }}></div>
        <div style={{ width: '4px', height: '40px', backgroundColor: '#d1d5db' }}></div>
      </div>
      
      {/* Speech Bubble / Information Block */}
      <div style={{ border: '1px style #d1d5db', padding: '12px', borderRadius: '8px', backgroundColor: '#f9fafb', fontSize: '12px', color: '#9ca3af', textAlign: 'center', width: '100%' }}>
        this is ai assistance providing info
      </div>
    </div>
  );
}
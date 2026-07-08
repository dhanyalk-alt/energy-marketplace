import React from 'react';

export default function ProducerMarketplace({ onRedirectToRequests }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>Producer Directory Market</h3>
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>List showing all producer selling prices:</div>
        
        {/* Simulating empty entries containing target redirect actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ width: '100px', height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}></div>
          <button 
            onClick={onRedirectToRequests} 
            style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
          >
            Go to Request Page
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <div style={{ width: '100px', height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}></div>
          <button 
            onClick={onRedirectToRequests} 
            style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
          >
            Go to Request Page
          </button>
        </div>
      </div>
    </div>
  );
}
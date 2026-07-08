import React from 'react';

export default function Trading() {
  return (
    <div>
      <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>Trading Page</h3>
      
      {/* Set selling price section */}
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Set Your Selling Price ($/kWh):</label>
        <input type="number" disabled style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', width: '150px' }} />
      </div>

      {/* Buy requests section */}
      <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563' }}>Incoming Buy Requests</span>
        <div style={{ marginTop: '12px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #d1d5db', borderRadius: '6px', color: '#9ca3af', fontSize: '14px' }}>
          No pending requests
        </div>
      </div>
    </div>
  );
}
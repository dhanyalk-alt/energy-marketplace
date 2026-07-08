import React from 'react';

export default function RequestBuying() {
  return (
    <div>
      <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>Request Page</h3>
      <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#4b5563' }}>Send a buy request to a producer</p>
        <button disabled style={{ padding: '8px 16px', backgroundColor: '#d1d5db', color: '#9ca3af', border: 'none', borderRadius: '6px', cursor: 'not-allowed' }}>Send Buy Request</button>
      </div>
      <div style={{ height: '120px', border: '1px dashed #d1d5db', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>
        Waiting for producer approval list...
      </div>
    </div>
  );
}
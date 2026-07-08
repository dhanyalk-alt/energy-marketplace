import React from 'react';

export default function RecentSales() {
  return (
    <div>
      <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>Recent Sales & Reviews</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ height: '120px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '12px', color: '#9ca3af', fontSize: '14px' }}>List of recent sales...</div>
        <div style={{ height: '120px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '12px', color: '#9ca3af', fontSize: '14px' }}>Reviews you got for selling...</div>
      </div>
    </div>
  );
}
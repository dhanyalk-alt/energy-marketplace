import React from 'react';

export default function Overview() {
  return (
    <div>
      <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>Overview Page</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
        <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px', height: '80px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>1. How much energy you're generating right now</span>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px', height: '80px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>2. Money earned today, and how much you sold</span>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px', height: '80px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>3. Battery charge level</span>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px', height: '80px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>4. Live price chart placeholder</span>
        </div>
      </div>
      <div style={{ width: '100%', height: '180px', backgroundColor: '#f3f4f6', border: '2px dashed #d1d5db', borderRadius: '8px' }}></div>
    </div>
  );
}

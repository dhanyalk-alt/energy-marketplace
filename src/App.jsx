import React, { useState } from 'react';
import AuthGateway from './components/auth/AuthGateway';
import ProducerLayout from './components/producer/ProducerLayout';
import ConsumerLayout from './components/consumer/ConsumerLayout';

export default function App() {
  // Global auth state: 'guest' | 'producer' | 'consumer'
  const [userRole, setUserRole] = useState('guest');

  const handleLogin = (role) => {
    setUserRole(role);
  };

const handleLogout = () => {
  localStorage.removeItem('energy_marketplace_jwt');
  localStorage.removeItem('user_role');
  localStorage.removeItem('username');

  setUserRole('guest');
};

  const handleSwitchToConsumer = () => {
    setUserRole('consumer');
  };

  return (
    <>
      {userRole === 'guest' && (
      <AuthGateway onLoginSuccess={handleLogin} />
      )}
      
      {userRole === 'producer' && (
        <ProducerLayout 
          onSwitchToConsumer={handleSwitchToConsumer} 
          onLogout={handleLogout} 
        />
      )}
      
      {userRole === 'consumer' && (
        <ConsumerLayout 
          onLogout={handleLogout} 
        />
      )}
    </>
  );
}
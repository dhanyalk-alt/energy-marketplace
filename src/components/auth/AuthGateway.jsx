import React, { useState } from 'react';
import { User, Lock, Phone, ShieldCheck, Sun, Shield } from 'lucide-react';

export default function AuthGateway({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('login');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('producer');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (activeTab === 'register' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match!');
      return;
    }

    setLoading(true);

    const endpoint =
      activeTab === 'register'
        ? '/auth/register'
        : '/auth/login';

    const payload =
      activeTab === 'register'
        ? {
            username,
            phone_number: phoneNumber,
            password,
            role,
          }
        : {
            username,
            password,
            role,
          };

    try {
      const response = await fetch(
        `http://127.0.0.1:8000${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Authentication failed.'
        );
      }

if (activeTab === 'register') {
  alert('Registration successful! Please sign in.');

  setActiveTab('login');
  setUsername('');
  setPhoneNumber('');
  setPassword('');
  setConfirmPassword('');
  setRole('producer');
} else {
  if (data.access_token) {
    localStorage.setItem(
      'energy_marketplace_jwt',
      data.access_token
    );
  }

  localStorage.setItem(
    'user_role',
    data.role
  );
  localStorage.setItem('username', username);
  onLoginSuccess(data.role);
}
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.authCard}>
          <div style={styles.tabContainer}>
            <button
              onClick={() => {
                setActiveTab('login');
                setErrorMessage('');
              }}
              style={{
                ...styles.tab,
                ...(activeTab === 'login'
                  ? styles.activeTab
                  : {}),
              }}
            >
              Sign In
            </button>

            <button
              onClick={() => {
                setActiveTab('register');
                setErrorMessage('');
              }}
              style={{
                ...styles.tab,
                ...(activeTab === 'register'
                  ? styles.activeTab
                  : {}),
              }}
            >
              Register
            </button>
          </div>

          <h2 style={styles.formTitle}>
            {activeTab === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </h2>

          {errorMessage && (
            <div style={styles.errorBanner}>
              {errorMessage}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={styles.form}
          >
            <div style={styles.inputWrapper}>
              <label style={styles.label}>
                Username
              </label>

              <div style={styles.inputBox}>
                <User
                  size={18}
                  style={styles.inputIcon}
                />

                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  placeholder="Enter username"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            {activeTab === 'register' && (
              <>
                <div style={styles.inputWrapper}>
                  <label style={styles.label}>
                    Phone Number
                  </label>

                  <div style={styles.inputBox}>
                    <Phone
                      size={18}
                      style={styles.inputIcon}
                    />

                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) =>
                        setPhoneNumber(
                          e.target.value
                        )
                      }
                      placeholder="+91 XXXXX XXXXX"
                      required
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.inputWrapper}>
                  <label style={styles.label}>
                    Marketplace Role
                  </label>

                  <div style={styles.roleGrid}>
                    <div
                      onClick={() =>
                        setRole('producer')
                      }
                      style={{
                        ...styles.roleOption,
                        ...(role === 'producer'
                          ? styles.activeProducer
                          : {}),
                      }}
                    >
                      <Sun size={16} />
                      Solar Producer
                    </div>

                    <div
                      onClick={() =>
                        setRole('consumer')
                      }
                      style={{
                        ...styles.roleOption,
                        ...(role === 'consumer'
                          ? styles.activeConsumer
                          : {}),
                      }}
                    >
                      <Shield size={16} />
                      Consumer
                    </div>
                  </div>
                </div>
              </>
            )}

            <div style={styles.inputWrapper}>
              <label style={styles.label}>
                Password
              </label>

              <div style={styles.inputBox}>
                <Lock
                  size={18}
                  style={styles.inputIcon}
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            {activeTab === 'register' && (
              <div style={styles.inputWrapper}>
                <label style={styles.label}>
                  Confirm Password
                </label>

                <div style={styles.inputBox}>
                  <ShieldCheck
                    size={18}
                    style={styles.inputIcon}
                  />

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="••••••••"
                    required
                    style={styles.input}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={styles.primaryBtn}
            >
              {loading
                ? 'Processing...'
                : activeTab === 'login'
                ? 'Sign In'
                : 'Register Now'}
            </button>
          </form>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.brandingWrapper}>
          <div style={styles.logoMark}>⚡</div>
          <h1 style={styles.brandTitle}>
            Welcome to VoltShare
          </h1>
          <p style={styles.brandSubtitle}>
            The peer-to-peer decentralized digital
            energy wallet.
          </p>
        </div>
      </div>
    </div>
  );
}

/* KEEP YOUR EXISTING styles OBJECT BELOW THIS LINE */

// PREMIUM EXCLUSIVE GRAPHICAL INLINE STYLES LAYOUT
const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#eef2f6', overflow: 'hidden', fontFamily: 'sans-serif' },
  leftPanel: { flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', zIndex: 2 },
  authCard: { width: '100%', maxWidth: '400px', backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', padding: '36px', borderRadius: '24px', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)', border: '1px solid #ffffff' },
  tabContainer: { display: 'inline-flex', backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '12px', marginBottom: '32px' },
  tab: { padding: '8px 20px', border: 'none', background: 'none', fontSize: '14px', fontWeight: '600', color: '#64748b', cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s' },
  activeTab: { backgroundColor: '#ffffff', color: '#1e3a8a', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
  formTitle: { fontSize: '28px', fontWeight: '700', color: '#1e3a8a', marginBottom: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputWrapper: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569', marginLeft: '2px' },
  inputBox: { display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '0 16px', transition: 'all 0.2s' },
  inputIcon: { color: '#94a3b8', marginRight: '12px' },
  input: { flex: 1, padding: '14px 0', border: 'none', outline: 'none', fontSize: '14px', color: '#1e293b' },
  roleGrid: { display: 'flex', gap: '10px' },
  roleOption: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '12px', fontWeight: '600', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' },
  activeProducer: { borderColor: '#10b981', backgroundColor: '#f0fdf4', color: '#15803d' },
  activeConsumer: { borderColor: '#3b82f6', backgroundColor: '#eff6ff', color: '#1d4ed8' },
  primaryBtn: { padding: '16px', borderRadius: '14px', border: 'none', background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)', color: '#ffffff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' },
  footerLinks: { display: 'flex', justifyContent: 'space-between', marginTop: '24px', fontSize: '13px' },
  linkText: { color: '#3b82f6', cursor: 'pointer', fontWeight: '500' },
  legalText: { textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '32px' },
  errorBanner: { padding: '12px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', fontWeight: '500', border: '1px solid #fee2e2' },
  
  // RIGHT SIDE DESIGN STYLES
  rightPanel: { flex: '1.2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'radial-gradient(circle at 80% 20%, #eff6ff 0%, #dbeafe 100%)', padding: '60px', position: 'relative', overflow: 'hidden' },
  brandingWrapper: { position: 'relative', zIndex: 2 },
  logoMark: { fontSize: '36px', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 20px rgba(0,0,0,0.03)', marginBottom: '24px' },
  brandTitle: { fontSize: '36px', fontWeight: '800', color: '#1e3a8a', margin: 0 },
  brandSubtitle: { fontSize: '16px', color: '#60a5fa', fontWeight: '500', marginTop: '8px' },
  artworkContainer: { position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  glowAura: { position: 'absolute', width: '350px', height: '350px', borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa 0%, #10b981 100%)', filter: 'blur(70px)', opacity: 0.25 },
  deviceMockup: { position: 'relative', width: '220px', height: '320px', backgroundColor: '#ffffff', borderRadius: '24px', boxShadow: '0 30px 60px rgba(30,58,138,0.1)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid rgba(255,255,255,0.8)' },
  mockupHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  mockupAvatar: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0' },
  mockupLine: { height: '10px', width: '80px', backgroundColor: '#e2e8f0', borderRadius: '4px' },
  mockupBody: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' },
  mockupBar: { height: '14px', borderRadius: '6px', opacity: 0.8 }
};
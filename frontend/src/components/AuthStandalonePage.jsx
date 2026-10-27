import React, { useState } from 'react';
import { CreditCard, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthStandalonePage = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields - Blank defaults for legitimate user input
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [studentIdRoll, setStudentIdRoll] = useState('');
  
  // Optional initial card listing during registration
  const [hasCardToList, setHasCardToList] = useState(false);
  const [bankName, setBankName] = useState('HDFC Bank');
  const [cardType, setCardType] = useState('');
  const [last4Digits, setLast4Digits] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setErrorMsg(res.message || 'Invalid email or password');
        }
      } else {
        const payload = {
          name: fullName,
          email,
          password,
          phone,
          collegeName,
          studentIdRoll,
          bankName: hasCardToList ? bankName : '',
          cardType: hasCardToList ? cardType : '',
          last4Digits: hasCardToList ? last4Digits : ''
        };

        const res = await register(payload);
        if (!res.success) {
          setErrorMsg(res.message || 'Registration failed');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-page)',
      display: 'grid',
      gridTemplateColumns: '1.05fr 1.2fr',
      alignItems: 'stretch'
    }}>
      {/* Left Editorial Branding Banner */}
      <div style={{
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-light)',
        padding: '60px 54px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '50px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--btn-black)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <CreditCard size={20} color="#d49b55" />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-0.02em' }}>
              WishCard
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              VERIFIED ESCROW
            </span>
          </div>

          <div style={{
            fontSize: '0.74rem',
            fontWeight: '700',
            color: 'var(--text-light)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '18px'
          }}>
            Peer-to-Peer Discount Purchase Platform
          </div>

          <h1 style={{
            fontSize: '3rem',
            fontWeight: '800',
            lineHeight: 1.15,
            color: 'var(--text-dark)',
            letterSpacing: '-0.03em',
            marginBottom: '20px'
          }}>
            Good deals <br />
            start with <br />
            <span style={{ fontStyle: 'italic', fontWeight: '400', color: 'var(--primary-ochre)' }}>
              verified trust.
            </span>
          </h1>

          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '440px' }}>
            Match with nearby credit cardholders to claim bank discounts. Buyer deposits are held safely in escrow before orders are placed, with in-person inspection and handoff verification.
          </p>
        </div>

        {/* Trust Stamp Callout */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-light)',
          borderRadius: '18px',
          padding: '22px',
          maxWidth: '390px',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: '800'
            }}>
              ✓
            </div>
            <span style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--text-dark)' }}>
              Verified Peer Accounts
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            One account allows you to request discount items as a buyer or list your credit cards to earn 3% profit on purchases.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-light)' }}>
          <span>WishCard • Peer Escrow Vault</span>
          <span>Terms & Safety Guidelines</span>
        </div>
      </div>

      {/* Right Form Column */}
      <div style={{
        background: '#ffffff',
        padding: '50px 70px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflowY: 'auto'
      }}>
        <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
          {/* Top Step Counter */}
          <div style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-light)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
            {mode === 'login' ? '01 / SIGN IN' : '01 / ONBOARDING'}
          </div>

          <h2 style={{ fontSize: '2.1rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            {mode === 'login' ? 'Welcome back.' : 'Create an account.'}
          </h2>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '28px' }}>
            {mode === 'login'
              ? 'Sign in to access your purchase requests, listed cards, and deal escrows.'
              : 'Create a profile to request discounts or list your credit cards.'}
          </p>

          {errorMsg && (
            <div style={{
              background: 'var(--accent-rose-subtle)',
              border: '1px solid #fecaca',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              color: 'var(--accent-rose)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-body)', marginBottom: '6px' }}>
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kabir Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.88rem',
                    background: '#ffffff'
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-body)', marginBottom: '6px' }}>
                Email address
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.88rem',
                  background: '#ffffff'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-body)' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.88rem',
                  background: '#ffffff'
                }}
              />
            </div>

            {mode === 'register' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-body)', marginBottom: '4px' }}>
                      Campus / Area Location
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Block C / Indiranagar"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.82rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-body)', marginBottom: '4px' }}>
                      Phone / Mobile
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                {/* Optional: List a credit card right away */}
                <div style={{
                  background: 'var(--bg-subtle)',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasCardToList ? '10px' : '0' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                      Have a credit card to list? (Optional)
                    </div>
                    <input
                      type="checkbox"
                      checked={hasCardToList}
                      onChange={(e) => setHasCardToList(e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </div>

                  {hasCardToList && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '8px' }}>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.78rem' }}
                      >
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="SBI Card">SBI Card</option>
                        <option value="AMEX">AMEX</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Variant (e.g. Millennia)"
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value)}
                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.78rem' }}
                      />
                      <input
                        type="text"
                        maxLength="4"
                        placeholder="Last 4"
                        value={last4Digits}
                        onChange={(e) => setLast4Digits(e.target.value)}
                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.78rem', textAlign: 'center' }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '10px',
                background: 'var(--btn-black)',
                color: '#ffffff',
                padding: '14px',
                borderRadius: '999px',
                fontSize: '0.9rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Authenticating...' : mode === 'login' ? 'Sign in' : 'Create Account'}
              <ArrowRight size={16} color="#d49b55" />
            </button>
          </form>

          {/* Bottom Switcher */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '24px', marginTop: '30px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              {mode === 'login' ? 'New here? ' : 'Already have an account? '}
            </span>
            <button
              onClick={() => {
                setErrorMsg('');
                setMode(mode === 'login' ? 'register' : 'login');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-ochre)',
                fontWeight: '700',
                fontSize: '0.84rem',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthStandalonePage;

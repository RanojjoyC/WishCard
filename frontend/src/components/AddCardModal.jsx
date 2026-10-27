import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_BANKS } from '../constants/banks';

const AddCardModal = ({ isOpen, onClose }) => {
  const { addCreditCard, currentUser } = useAuth();

  const [formData, setFormData] = useState({
    bankName: SUPPORTED_BANKS[0].label,
    cardType: '',
    network: 'Visa',
    last4Digits: '',
    cardHolderName: '',
    specialOffers: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset form upon opening
  useEffect(() => {
    if (isOpen) {
      setFormData({
        bankName: SUPPORTED_BANKS[0].label,
        cardType: '',
        network: 'Visa',
        last4Digits: '',
        cardHolderName: currentUser?.name || '',
        specialOffers: ''
      });
      setErrorMsg('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const currentCount = currentUser?.creditCards?.length || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (currentCount >= 5) {
      setErrorMsg('Maximum 5 credit cards allowed per account.');
      return;
    }

    if (!formData.cardType.trim()) {
      setErrorMsg('Please enter your card variant name (e.g. Millennia, Regalia Gold).');
      return;
    }

    if (!/^\d{4}$/.test(formData.last4Digits)) {
      setErrorMsg('Last 4 digits must be exactly 4 digits.');
      return;
    }

    setLoading(true);
    const offersArray = formData.specialOffers
      ? formData.specialOffers.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const res = await addCreditCard({
      ...formData,
      specialOffers: offersArray
    });

    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message || 'Failed to list credit card');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      background: 'rgba(26, 24, 22, 0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-card)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
              List Credit Card ({currentCount}/5 Slots)
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Earn 3% profit per proxy order for campus students
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-subtle)',
              border: 'none',
              borderRadius: '999px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div style={{
            margin: '14px 24px 0',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--accent-rose-subtle)',
            color: 'var(--accent-rose)',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Security Alert */}
        <div style={{
          margin: '16px 24px 0',
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'var(--primary-ochre-subtle)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.74rem',
          color: 'var(--primary-ochre)'
        }}>
          <ShieldCheck size={16} color="var(--primary-ochre)" />
          <span>We never ask for your 16-digit card number, CVV or expiry date.</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-body)' }}>
              Issuing Bank
            </label>
            <select
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              style={{
                width: '100%',
                background: 'var(--bg-page)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '0.85rem'
              }}
            >
              {SUPPORTED_BANKS.map((b) => (
                <option key={b.id} value={b.label}>{b.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-body)' }}>
              Card Variant
            </label>
            <input
              type="text"
              required
              value={formData.cardType}
              onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
              placeholder="e.g. Millennia, Regalia Gold, Amazon Pay ICICI, Neo"
              style={{
                width: '100%',
                background: 'var(--bg-page)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-body)' }}>
                Network
              </label>
              <select
                value={formData.network}
                onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                style={{
                  width: '100%',
                  background: 'var(--bg-page)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '0.85rem'
                }}
              >
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="RuPay">RuPay</option>
                <option value="Amex">American Express</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-body)' }}>
                Last 4 Digits
              </label>
              <input
                type="text"
                maxLength="4"
                required
                value={formData.last4Digits}
                onChange={(e) => setFormData({ ...formData, last4Digits: e.target.value })}
                placeholder="8910"
                style={{
                  width: '100%',
                  background: 'var(--bg-page)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-body)' }}>
              Cardholder Special Offers (Optional, comma-separated)
            </label>
            <input
              type="text"
              value={formData.specialOffers}
              onChange={(e) => setFormData({ ...formData, specialOffers: e.target.value })}
              placeholder="e.g. 10% Instant Apple, 5% Amazon Cashback"
              style={{
                width: '100%',
                background: 'var(--bg-page)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || currentCount >= 5}
            style={{
              background: 'var(--btn-black)',
              color: '#ffffff',
              padding: '11px',
              borderRadius: '999px',
              fontSize: '0.88rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: currentCount >= 5 ? 'not-allowed' : 'pointer'
            }}
          >
            <Sparkles size={16} color="#d49b55" />
            {loading ? 'Adding...' : `Save & List Card (${currentCount + 1}/5)`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCardModal;

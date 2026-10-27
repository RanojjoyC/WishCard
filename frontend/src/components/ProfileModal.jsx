import React, { useState, useEffect } from 'react';
import { User, MapPin, CreditCard, ShieldCheck, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfileModal = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    collegeName: '',
    address: '',
    upiId: ''
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        collegeName: currentUser.collegeName || '',
        address: currentUser.location?.address || '',
        upiId: currentUser.upiId || ''
      });
      setFeedback(null);
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (formData.upiId && !formData.upiId.includes('@')) {
      setFeedback({ type: 'error', message: 'UPI ID format must be valid (e.g. yourname@okhdfcbank).' });
      return;
    }

    setLoading(true);
    const res = await updateProfile(formData);
    setLoading(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Profile & payout settings saved successfully!' });
    } else {
      setFeedback({ type: 'error', message: res.message || 'Failed to update profile.' });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 210,
      background: 'rgba(26, 24, 22, 0.5)',
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
        maxWidth: '480px',
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
              Campus Profile & Payout Settings
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Keep your contact, campus location, and real UPI ID up to date
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

        {feedback && (
          <div style={{
            margin: '14px 24px 0',
            padding: '10px 14px',
            borderRadius: '8px',
            background: feedback.type === 'error' ? 'var(--accent-rose-subtle)' : 'var(--accent-green-subtle)',
            color: feedback.type === 'error' ? 'var(--accent-rose)' : 'var(--accent-green)',
            border: `1px solid ${feedback.type === 'error' ? 'var(--accent-rose)' : 'var(--accent-green)'}`,
            fontSize: '0.78rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {feedback.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-body)', marginBottom: '4px' }}>
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '9px 12px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-body)', marginBottom: '4px' }}>
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '9px 12px', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-body)', marginBottom: '4px' }}>
                Campus / College Name
              </label>
              <input
                type="text"
                value={formData.collegeName}
                onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                placeholder="e.g. Campus Central Hostel"
                style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '9px 12px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-body)', marginBottom: '4px' }}>
              Meetup / Campus Location Label
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Block B, Room 304 or Library Plaza"
              style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '9px 12px', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-body)', marginBottom: '4px' }}>
              Payout UPI ID (Where Escrow sends your 3% profit + item refund)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. yourname@okhdfcbank or phone@paytm"
              value={formData.upiId}
              onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '9px 12px', fontSize: '0.85rem', fontWeight: '600' }}
            />
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Used when releasing verified escrow funds back to your bank account.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', padding: '9px 18px', borderRadius: '999px', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ background: 'var(--btn-black)', color: '#ffffff', border: 'none', padding: '9px 22px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;

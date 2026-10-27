import React, { useState } from 'react';
import { CreditCard, Plus, Trash2, Edit3, X, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_BANKS } from '../constants/banks';

const MyCardsModal = ({ isOpen, onClose, onOpenAddCard }) => {
  const { currentUser, updateCard, deleteCard } = useAuth();
  const [editingCard, setEditingCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const cards = currentUser?.creditCards || [];

  const handleStartEdit = (card) => {
    setFeedback(null);
    setEditingCard({
      _id: card._id,
      bankName: card.bankName,
      cardType: card.cardType,
      network: card.network || 'Visa',
      last4Digits: card.last4Digits,
      cardHolderName: card.cardHolderName || currentUser?.name || '',
      specialOffers: Array.isArray(card.specialOffers) ? card.specialOffers.join(', ') : (card.specialOffers || '')
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCard) return;
    setFeedback(null);

    if (!/^\d{4}$/.test(editingCard.last4Digits)) {
      setFeedback({ type: 'error', message: 'Last 4 digits must be exactly 4 digits.' });
      return;
    }

    setLoading(true);
    const offersArray = editingCard.specialOffers
      ? editingCard.specialOffers.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const res = await updateCard(editingCard._id, {
      ...editingCard,
      specialOffers: offersArray
    });

    setLoading(false);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Card details updated successfully!' });
      setEditingCard(null);
    } else {
      setFeedback({ type: 'error', message: res.message || 'Failed to update card.' });
    }
  };

  const handleDelete = async (cardId, cardDesc) => {
    if (!window.confirm(`Are you sure you want to remove your ${cardDesc}?`)) return;
    setLoading(true);
    setFeedback(null);
    const res = await deleteCard(cardId);
    setLoading(false);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Card removed successfully.' });
      if (editingCard?._id === cardId) setEditingCard(null);
    } else {
      setFeedback({ type: 'error', message: res.message || 'Failed to remove card.' });
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
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column'
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
              My Registered Credit Cards ({cards.length}/5)
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Manage the cards you use to accept campus proxy purchase slots
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

        {/* Feedback Alert */}
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

        {/* Body Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {editingCard ? (
            /* Edit Form */
            <form onSubmit={handleSaveEdit} style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
                  Edit Card Details
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.74rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-body)', marginBottom: '4px' }}>
                  Issuing Bank
                </label>
                <select
                  value={editingCard.bankName}
                  onChange={(e) => setEditingCard({ ...editingCard, bankName: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                >
                  {SUPPORTED_BANKS.map(b => (
                    <option key={b.id} value={b.label}>{b.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-body)', marginBottom: '4px' }}>
                  Card Variant
                </label>
                <input
                  type="text"
                  required
                  value={editingCard.cardType}
                  onChange={(e) => setEditingCard({ ...editingCard, cardType: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-body)', marginBottom: '4px' }}>
                    Network
                  </label>
                  <select
                    value={editingCard.network}
                    onChange={(e) => setEditingCard({ ...editingCard, network: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="RuPay">RuPay</option>
                    <option value="Amex">American Express</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-body)', marginBottom: '4px' }}>
                    Last 4 Digits
                  </label>
                  <input
                    type="text"
                    maxLength="4"
                    required
                    value={editingCard.last4Digits}
                    onChange={(e) => setEditingCard({ ...editingCard, last4Digits: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-body)', marginBottom: '4px' }}>
                  Offers & Cashbacks (Optional, comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10% Apple Instant, 5% Amazon Pay"
                  value={editingCard.specialOffers}
                  onChange={(e) => setEditingCard({ ...editingCard, specialOffers: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  style={{ background: 'var(--bg-page)', border: '1px solid var(--border-light)', padding: '7px 14px', borderRadius: '999px', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: 'var(--btn-black)', color: '#ffffff', border: 'none', padding: '7px 18px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : null}

          {/* Card List */}
          {cards.length === 0 ? (
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px dashed var(--border-light)',
              borderRadius: '12px',
              padding: '36px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <CreditCard size={36} color="var(--primary-ochre)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                No Credit Cards Registered
              </div>
              <p style={{ fontSize: '0.76rem', margin: '4px 0 16px', lineHeight: 1.4 }}>
                List your bank cards to appear in Nearby Cardholders and earn 3% commission on campus purchase requests.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddCard();
                }}
                style={{
                  background: 'var(--btn-black)',
                  color: '#ffffff',
                  padding: '9px 18px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} color="#d49b55" />
                Add Your First Card
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cards.map((card) => (
                <div
                  key={card._id}
                  style={{
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'var(--primary-ochre-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-ochre)'
                    }}>
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                          {card.bankName} {card.cardType}
                        </div>
                        {card.verified ? (
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: '700',
                            color: 'var(--accent-green)',
                            background: 'var(--accent-green-subtle)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <ShieldCheck size={11} />
                            Verified
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: '600',
                            color: 'var(--text-muted)',
                            background: 'var(--bg-subtle)',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            Self-Listed (Unverified)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        •••• {card.last4Digits} • {card.network || 'Visa'}
                        {card.specialOffers?.length > 0 && ` • ${card.specialOffers[0]}`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(card)}
                      title="Edit card"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: 'var(--text-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={13} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(card._id, `${card.bankName} (${card.last4Digits})`)}
                      title="Delete card"
                      style={{
                        background: 'var(--accent-rose-subtle)',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: 'var(--accent-rose)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cards.length > 0 && cards.length < 5 && !editingCard && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAddCard();
              }}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px dashed var(--border-card)',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '0.78rem',
                fontWeight: '700',
                color: 'var(--primary-ochre)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Plus size={15} />
              List Another Card ({cards.length}/5)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyCardsModal;

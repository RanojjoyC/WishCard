import React, { useState } from 'react';
import {
  CreditCard,
  MapPin,
  ShieldCheck,
  Star,
  MessageSquare,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { SUPPORTED_BANKS, getBankIdFromText } from '../constants/banks';

const CardHoldersView = ({ holders = [], onSelectHolderForRequest, onStartChatWithHolder }) => {
  const [selectedBank, setSelectedBank] = useState('ALL');

  const filtered = holders.filter(h => {
    if (selectedBank === 'ALL') return true;
    return h.creditCards?.some(c => {
      const bId = getBankIdFromText(c.bankName || '');
      return bId === selectedBank;
    });
  });

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
            Nearby Verified Campus Cardholders
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Campus peers with registered credit cards ready to place proxy discount orders on your behalf.
          </p>
        </div>
      </div>

      {/* Bank Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-light)', fontWeight: '600', marginRight: '4px' }}>
          Filter by Bank Card:
        </span>
        <button
          onClick={() => setSelectedBank('ALL')}
          style={{
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '0.74rem',
            fontWeight: '700',
            background: selectedBank === 'ALL' ? 'var(--text-dark)' : 'var(--bg-card)',
            color: selectedBank === 'ALL' ? '#ffffff' : 'var(--text-body)',
            border: selectedBank === 'ALL' ? 'none' : '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-subtle)',
            cursor: 'pointer'
          }}
        >
          All Banks
        </button>
        {SUPPORTED_BANKS.map((bank) => (
          <button
            key={bank.id}
            onClick={() => setSelectedBank(bank.id)}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: '700',
              background: selectedBank === bank.id ? 'var(--text-dark)' : 'var(--bg-card)',
              color: selectedBank === bank.id ? '#ffffff' : 'var(--text-body)',
              border: selectedBank === bank.id ? 'none' : '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-subtle)',
              cursor: 'pointer'
            }}
          >
            {bank.label}
          </button>
        ))}
      </div>

      {/* Grid of Cardholders */}
      {filtered.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-card)',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'var(--primary-ochre-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--primary-ochre)'
          }}>
            <CreditCard size={26} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '8px' }}>
            No Other Registered Cardholders Found
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Other campus students who register cards in their account will appear here. You can list your own cards using "My Cards" in the sidebar.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
          {filtered.map((holder) => (
            <div
              key={holder._id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--shadow-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                {/* Profile Top */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <img
                      src={holder.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(holder.name || 'User')}`}
                      alt={holder.name}
                      style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
                          {holder.name}
                        </h4>
                        <ShieldCheck size={16} color="var(--accent-green)" title="Verified Campus Student" />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {holder.collegeName || holder.location?.address || 'Campus Quad'}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    background: 'var(--accent-green-subtle)',
                    color: 'var(--accent-green)',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <MapPin size={11} />
                    {holder.distanceKm !== null ? `${holder.distanceKm} km` : 'distance unavailable'}
                  </span>
                </div>

                {/* Rating & Completed Deals */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  background: 'var(--bg-subtle)',
                  borderRadius: '10px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '700', color: 'var(--primary-ochre)' }}>
                    <Star size={14} fill="#a36222" color="#a36222" />
                    {holder.rating > 0 ? holder.rating.toFixed(1) : 'New'} ({holder.ratingsCount || 0} reviews)
                  </div>
                  <div style={{ height: '14px', width: '1px', background: 'var(--border-light)' }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Completed: <strong style={{ color: 'var(--text-dark)' }}>{holder.totalOrdersCompleted || 0} deals</strong>
                  </div>
                </div>

                {/* Available Listed Credit Cards */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                    Listed Credit Cards ({holder.creditCards?.length || 0}/5)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {holder.creditCards?.map((card, idx) => (
                      <div
                        key={card._id || idx}
                        style={{
                          background: 'var(--bg-page)',
                          border: '1px solid var(--border-card)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CreditCard size={15} color="var(--primary-ochre)" />
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)' }}>
                              {card.bankName} {card.cardType}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              •••• {card.last4Digits} {card.specialOffers?.length > 0 ? `• ${card.specialOffers[0]}` : ''}
                            </div>
                          </div>
                        </div>
                        {card.verified ? (
                          <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--accent-green)', background: 'var(--accent-green-subtle)', padding: '2px 7px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <ShieldCheck size={11} /> Verified
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '2px 7px', borderRadius: '4px' }}>
                            Self-Listed
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                <button
                  onClick={() => onStartChatWithHolder(holder)}
                  style={{
                    flex: 1,
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-body)',
                    padding: '9px 12px',
                    borderRadius: '999px',
                    fontSize: '0.76rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <MessageSquare size={14} />
                  Message
                </button>
                <button
                  onClick={() => onSelectHolderForRequest(holder)}
                  style={{
                    flex: 1.3,
                    background: 'var(--btn-black)',
                    color: '#ffffff',
                    padding: '9px 12px',
                    borderRadius: '999px',
                    fontSize: '0.76rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={14} color="#d49b55" />
                  Request Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CardHoldersView;

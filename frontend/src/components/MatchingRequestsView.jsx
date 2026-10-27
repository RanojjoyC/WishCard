import React, { useState } from 'react';
import {
  CreditCard,
  MapPin,
  Sparkles,
  MessageSquare,
  AlertCircle,
  X,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Lock
} from 'lucide-react';
import ProductThumbnail from './ProductThumbnail';
import { SUPPORTED_BANKS, getBankIdFromText } from '../constants/banks';

const MatchingRequestsView = ({ requests, currentUser, onSelectOrder, onAcceptSlot, onOpenChat }) => {
  const [selectedBank, setSelectedBank] = useState('ALL');
  const [confirmingReq, setConfirmingReq] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [bannerNotice, setBannerNotice] = useState(null);

  const currentUserId = (currentUser?._id || currentUser?.id || '').toString();

  const isUserTheRequester = (req) => {
    if (!currentUserId || !req.buyer) return false;
    const buyerId = (req.buyer._id || req.buyer.id || req.buyer).toString();
    return buyerId === currentUserId;
  };

  const getMatchingUserCard = (req) => {
    if (!currentUser?.creditCards?.length) return null;
    const reqBankId = getBankIdFromText(req.targetBank || '');

    return currentUser.creditCards.find(card => {
      const cardBankId = getBankIdFromText(card.bankName || '');
      const cardType = (card.cardType || '').toUpperCase();
      const reqRequirement = (req.targetCardRequirement || '').toUpperCase();

      return (
        (reqBankId && cardBankId === reqBankId) ||
        (cardType && reqRequirement.includes(cardType))
      );
    });
  };

  const handleInitiateTakeSlot = (req) => {
    setBannerNotice(null);

    if (isUserTheRequester(req)) {
      setBannerNotice({
        type: 'error',
        message: 'This is your own request! Nearby peers with the required card will take up this slot.'
      });
      return;
    }

    const matchingCard = getMatchingUserCard(req);
    if (!matchingCard) {
      const userCardsCount = currentUser?.creditCards?.length || 0;
      if (userCardsCount === 0) {
        setBannerNotice({
          type: 'error',
          message: `Card Required: You have not listed any credit cards yet. Click "My Cards" in the sidebar to add your ${req.targetBank} card.`
        });
      } else {
        setBannerNotice({
          type: 'error',
          message: `Card Mismatch: This purchase requires a ${req.targetBank} card. None of your ${userCardsCount} listed card(s) match.`
        });
      }
      return;
    }

    setConfirmingReq(req);
  };

  const handleConfirmAccept = async () => {
    if (!confirmingReq) return;
    setLoadingAction(true);
    setBannerNotice(null);

    const result = await onAcceptSlot(confirmingReq);
    setLoadingAction(false);
    setConfirmingReq(null);

    if (result && !result.success) {
      setBannerNotice({
        type: 'error',
        message: result.message || 'Could not claim slot'
      });
    } else {
      setBannerNotice({
        type: 'success',
        message: `Success! You claimed the slot for "${confirmingReq.productTitle}". The buyer will now lock funds in escrow.`
      });
    }
  };

  // Only open requested items appear in marketplace feed
  const filtered = requests.filter(r => {
    if (selectedBank === 'ALL') return true;
    const reqBankId = getBankIdFromText(r.targetBank || '');
    return reqBankId === selectedBank;
  });

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
            Open Campus Purchase Requests
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Campus peers looking for cardholders to place discounted online orders. Accept open slots to earn 3% profit in Escrow.
          </p>
        </div>
      </div>

      {/* Banner Feedback / Error Notice */}
      {bannerNotice && (
        <div style={{
          background: bannerNotice.type === 'error' ? 'var(--accent-rose-subtle)' : 'var(--accent-green-subtle)',
          border: `1px solid ${bannerNotice.type === 'error' ? 'var(--accent-rose)' : 'var(--accent-green)'}`,
          color: bannerNotice.type === 'error' ? 'var(--accent-rose)' : 'var(--accent-green)',
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '0.82rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {bannerNotice.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{bannerNotice.message}</span>
          </div>
          <button
            onClick={() => setBannerNotice(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', padding: '2px' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Bank Filter Chips using shared master list */}
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

      {/* Request Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtered.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-light)',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            No open requests match this filter. Check back soon or post a new request!
          </div>
        ) : (
          filtered.map((req) => {
            const isMine = isUserTheRequester(req);
            const netSaving = req.originalPrice && req.totalEscrowAmount 
              ? req.originalPrice - req.totalEscrowAmount 
              : 0;

            return (
              <div
                key={req._id}
                style={{
                  background: 'var(--bg-card)',
                  border: isMine ? '1px solid var(--primary-ochre)' : '1px solid var(--border-light)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  boxShadow: 'var(--shadow-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px'
                }}
              >
                {/* Left: Product Thumbnail & Specs */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                  <ProductThumbnail
                    src={req.productScreenshot}
                    alt={req.productTitle}
                    width={76}
                    height={76}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        color: 'var(--primary-ochre)',
                        background: 'var(--primary-ochre-subtle)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        textTransform: 'uppercase'
                      }}>
                        {req.store}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Posted by {req.buyer?.name || 'Peer'} {req.buyer?.collegeName ? `• ${req.buyer.collegeName}` : ''}
                      </span>
                      {isMine && (
                        <span style={{
                          background: 'var(--btn-black)',
                          color: '#ffffff',
                          fontSize: '0.65rem',
                          fontWeight: '800',
                          padding: '1px 8px',
                          borderRadius: '999px'
                        }}>
                          Your Request
                        </span>
                      )}
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-dark)', margin: '2px 0 4px' }}>
                      {req.productTitle}
                    </h4>

                    {req.productUrl && (
                      <div style={{ marginBottom: '6px' }}>
                        <a
                          href={req.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--primary-ochre)',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none'
                          }}
                        >
                          <ExternalLink size={12} />
                          Open product page on {req.store}
                        </a>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.75rem', color: 'var(--text-body)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-ochre)', fontWeight: '700' }}>
                        <CreditCard size={14} />
                        Requires: {req.targetCardRequirement}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                        <MapPin size={13} color="var(--accent-green)" />
                        {req.safeMeetupLocation} {req.distanceKm !== null ? `(~${req.distanceKm} km)` : '(distance unavailable)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle: Financials & Net Saving */}
                <div style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  minWidth: '240px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', fontWeight: '600' }}>
                      Escrow Deposit
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                      ₹{req.totalEscrowAmount?.toLocaleString()}
                    </div>
                    {netSaving > 0 && (
                      <div style={{ fontSize: '0.66rem', color: 'var(--accent-green)', fontWeight: '700', marginTop: '2px' }}>
                        Buyer saves ₹{netSaving.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div style={{ borderLeft: '1px solid var(--border-light)', paddingLeft: '16px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--primary-ochre)', fontWeight: '700' }}>
                      Holder Profit (3%)
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--primary-ochre)' }}>
                      + ₹{req.holderProfit?.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', minWidth: '170px' }}>
                  {isMine ? (
                    <button
                      onClick={() => onSelectOrder(req)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--primary-ochre)',
                        color: 'var(--primary-ochre)',
                        padding: '9px 16px',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Lock size={14} />
                      View Your Request
                    </button>
                  ) : (
                    <button
                      onClick={() => handleInitiateTakeSlot(req)}
                      style={{
                        width: '100%',
                        background: 'var(--btn-black)',
                        color: '#ffffff',
                        padding: '9px 16px',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Sparkles size={14} color="#d49b55" />
                      Take Up Slot (+₹{req.holderProfit})
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmingReq && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(13, 12, 11, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '18px',
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'var(--primary-ochre-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-ochre)'
                }}>
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
                    Confirm Taking Up Slot
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Campus Proxy Purchase
                  </div>
                </div>
              </div>

              <button
                onClick={() => setConfirmingReq(null)}
                style={{
                  background: 'var(--bg-page)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{
              background: 'var(--bg-page)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '18px'
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: '700' }}>
                Product Requested
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-dark)', marginTop: '2px' }}>
                {confirmingReq.productTitle}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', fontWeight: '700' }}>
                    Required Card
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--primary-ochre)', marginTop: '2px' }}>
                    {confirmingReq.targetBank}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', fontWeight: '700' }}>
                    Guaranteed Profit
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '900', color: 'var(--accent-green)', marginTop: '2px' }}>
                    +₹{confirmingReq.holderProfit?.toLocaleString()} (3%)
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '22px' }}>
              <strong>Workflow Protection:</strong> When you claim this slot, the buyer will deposit <strong>₹{confirmingReq.totalEscrowAmount?.toLocaleString()}</strong> into simulated platform escrow. You only make the payment on your card <em>after</em> the money is fully secured.
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmingReq(null)}
                disabled={loadingAction}
                style={{
                  flex: 1,
                  background: 'var(--bg-page)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-body)',
                  padding: '11px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAccept}
                disabled={loadingAction}
                style={{
                  flex: 1.5,
                  background: 'var(--btn-black)',
                  color: '#ffffff',
                  padding: '11px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={15} color="#d49b55" />
                {loadingAction ? 'Claiming Slot...' : 'Yes, Take Up Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingRequestsView;

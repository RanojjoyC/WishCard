import React, { useState } from 'react';
import { 
  CheckCircle2, 
  CreditCard, 
  Package, 
  DollarSign, 
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Check
} from 'lucide-react';
import api from '../api';
import ProductThumbnail from './ProductThumbnail';

const AdminEscrowPortal = ({ requests = [], onUpdateOrder, onRefreshRequests }) => {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const counts = {
    all: requests.length,
    awaitingEscrow: requests.filter(r => r.status === 'REQUESTED' || r.status === 'MATCHED').length,
    escrowFunded: requests.filter(r => r.status === 'ESCROW_FUNDED').length,
    purchased: requests.filter(r => r.status === 'PURCHASED' || r.status === 'DELIVERED_TO_HOLDER').length,
    readyForPayout: requests.filter(r => r.status === 'HANDOFF_COMPLETED').length,
    completed: requests.filter(r => r.status === 'ESCROW_RELEASED').length,
    disputes: requests.filter(r => r.status === 'DISPUTED').length
  };

  const filteredRequests = requests.filter(r => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'AWAITING_ESCROW') return r.status === 'REQUESTED' || r.status === 'MATCHED';
    if (selectedFilter === 'ESCROW_FUNDED') return r.status === 'ESCROW_FUNDED';
    if (selectedFilter === 'PURCHASED') return r.status === 'PURCHASED' || r.status === 'DELIVERED_TO_HOLDER';
    if (selectedFilter === 'READY_PAYOUT') return r.status === 'HANDOFF_COMPLETED';
    if (selectedFilter === 'COMPLETED') return r.status === 'ESCROW_RELEASED';
    if (selectedFilter === 'DISPUTES') return r.status === 'DISPUTED';
    return true;
  });

  const handleResolveRefundBuyer = async (request) => {
    const ref = window.prompt('Enter simulated refund transaction reference:', `REF_SIM_${Date.now()}`);
    if (ref === null) return;

    setActionLoadingId(request._id);
    setStatusMessage('');
    setErrorMessage('');
    try {
      const res = await api.post(`/requests/${request._id}/resolve-refund`, { referenceId: ref });
      if (res.data?.success) {
        onUpdateOrder(res.data.request);
        setStatusMessage(res.data.message || 'Refund to buyer recorded successfully.');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Refund error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolvePayHolder = async (request) => {
    const ref = window.prompt('Enter payout reference (e.g. UPI transfer reference):', `PAYOUT_SETTLE_${Date.now()}`);
    if (ref === null) return;

    setActionLoadingId(request._id);
    setStatusMessage('');
    setErrorMessage('');
    try {
      const res = await api.post(`/requests/${request._id}/resolve-payout`, { referenceId: ref });
      if (res.data?.success) {
        onUpdateOrder(res.data.request);
        setStatusMessage(res.data.message || 'Payout to holder recorded successfully.');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Payout error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'var(--btn-black)',
        borderRadius: '16px',
        padding: '28px 32px',
        color: '#ffffff',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-subtle)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              background: 'var(--primary-ochre)',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.68rem',
              fontWeight: '800',
              letterSpacing: '0.04em'
            }}>
              PLATFORM ESCROW ADMINISTRATION (SIMULATED LEDGER)
            </span>
          </div>
          <h2 style={{ fontSize: '1.7rem', fontWeight: '900', letterSpacing: '-0.02em', margin: '4px 0' }}>
            Escrow Settlement & Verification Vault
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#c4c0b6', maxWidth: '650px', lineHeight: 1.5, margin: 0 }}>
            Oversee deal lifecycles across all statuses, inspect order proofs, verify OTP handoffs, and settle disputes. Payments are simulated for campus demonstration.
          </p>
        </div>

        <button
          onClick={onRefreshRequests}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '999px',
            padding: '8px 16px',
            fontSize: '0.78rem',
            fontWeight: '700',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} />
          Refresh Orders
        </button>
      </div>

      {statusMessage && (
        <div style={{
          background: 'var(--accent-green-subtle)',
          border: '1px solid var(--accent-green)',
          color: 'var(--accent-green)',
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '0.82rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{
          background: 'var(--accent-rose-subtle)',
          border: '1px solid var(--accent-rose)',
          color: 'var(--accent-rose)',
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '0.82rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={16} />
          {errorMessage}
        </div>
      )}

      {/* Escrow Pipeline Lifecycle Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '24px' }}>
        {[
          { key: 'ALL', label: 'All Deals', count: counts.all, icon: CreditCard },
          { key: 'AWAITING_ESCROW', label: 'Awaiting Escrow', count: counts.awaitingEscrow, icon: CreditCard },
          { key: 'ESCROW_FUNDED', label: 'Escrow Locked', count: counts.escrowFunded, icon: CheckCircle2 },
          { key: 'PURCHASED', label: 'In Transit', count: counts.purchased, icon: Package },
          { key: 'COMPLETED', label: 'Completed', count: counts.completed, icon: CheckCircle2 },
          { key: 'DISPUTES', label: 'Disputes', count: counts.disputes, icon: AlertTriangle, highlight: counts.disputes > 0 }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setSelectedFilter(item.key)}
            style={{
              background: selectedFilter === item.key ? 'var(--btn-black)' : 'var(--bg-card)',
              color: selectedFilter === item.key ? '#ffffff' : 'var(--text-dark)',
              border: item.highlight && selectedFilter !== item.key 
                ? '2px solid var(--accent-rose)' 
                : '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'left',
              boxShadow: 'var(--shadow-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
              <item.icon size={15} color={selectedFilter === item.key ? '#d49b55' : 'var(--primary-ochre)'} />
              <span style={{
                fontSize: '1rem',
                fontWeight: '900',
                color: selectedFilter === item.key ? '#ffffff' : (item.highlight ? 'var(--accent-rose)' : 'var(--primary-ochre)')
              }}>
                {item.count}
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: '700' }}>
              {item.label}
            </div>
          </button>
        ))}
      </div>

      {/* Requests Table / List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredRequests.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-card)',
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '8px' }}>
              No Requests in This Stage
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
              Active and historic orders will populate here as users post and advance them through the state machine.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isEscrowLocked = req.paymentDetails?.isPaidToEscrow;
            const isSettled = req.status === 'ESCROW_RELEASED';
            const isDisputed = req.status === 'DISPUTED';
            const cardholderPayout = (req.discountedPrice || 0) + (req.holderProfit || 0);

            return (
              <div
                key={req._id}
                style={{
                  background: 'var(--bg-card)',
                  border: isDisputed ? '1px solid var(--accent-rose)' : '1px solid var(--border-light)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: 'var(--shadow-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <ProductThumbnail
                      src={req.productScreenshot}
                      alt={req.productTitle}
                      width={64}
                      height={64}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          color: 'var(--primary-ochre)',
                          background: 'var(--primary-ochre-subtle)',
                          padding: '2px 7px',
                          borderRadius: '6px'
                        }}>
                          {req.store}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          ID: {req._id}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
                        {req.productTitle}
                      </h4>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-body)', marginTop: '2px' }}>
                        Required: <strong style={{ color: 'var(--primary-ochre)' }}>{req.targetCardRequirement}</strong>
                      </div>
                    </div>
                  </div>

                  <span style={{
                    background: isSettled 
                      ? 'var(--accent-green-subtle)' 
                      : isDisputed
                        ? 'var(--accent-rose-subtle)'
                        : 'var(--bg-subtle)',
                    color: isSettled 
                      ? 'var(--accent-green)' 
                      : isDisputed
                        ? 'var(--accent-rose)'
                        : 'var(--text-dark)',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '0.74rem',
                    fontWeight: '800',
                    border: '1px solid var(--border-light)'
                  }}>
                    {isSettled ? '✓ Escrow Settled' : req.status}
                  </span>
                </div>

                {/* Workflow Breakdown */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  background: 'var(--bg-page)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase' }}>
                      1. Buyer
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-dark)', marginTop: '2px' }}>
                      {req.buyer?.name || 'Peer'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {req.buyer?.email || 'Campus Peer'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase' }}>
                      2. Cardholder Slot
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: req.matchedHolder ? 'var(--text-dark)' : 'var(--accent-amber)', marginTop: '2px' }}>
                      {req.matchedHolder ? req.matchedHolder.name : 'Waiting for Match'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {req.matchedHolder ? `UPI: ${req.matchedHolder.upiId || 'On file'}` : 'Open slot'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase' }}>
                      3. Platform Escrow
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: isEscrowLocked ? 'var(--accent-green)' : 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isEscrowLocked ? (
                        <>
                          <CheckCircle2 size={13} color="var(--accent-green)" />
                          ₹{req.totalEscrowAmount?.toLocaleString()} Locked
                        </>
                      ) : (
                        'Pending Deposit'
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Item ₹{req.discountedPrice?.toLocaleString()} + 3% ₹{req.holderProfit}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase' }}>
                      4. Proofs & Order
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: req.purchaseProof?.orderId ? 'var(--accent-green)' : 'var(--text-muted)', marginTop: '2px' }}>
                      {req.purchaseProof?.orderId ? req.purchaseProof.orderId : 'Not Purchased'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {req.receiptProof?.packagePhotoUrl ? 'Package photo on file' : (req.purchaseProof?.invoiceUrl ? 'Invoice on file' : 'Pending')}
                    </div>
                  </div>
                </div>

                {/* Dispute Resolution or Settlement Banner */}
                {isDisputed && (
                  <div style={{
                    background: 'var(--accent-rose-subtle)',
                    border: '1px solid var(--accent-rose)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={15} />
                        Active Dispute Raised
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', marginTop: '2px' }}>
                        Reason: {req.disputeReason || 'Unresolved delivery or condition issue'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleResolveRefundBuyer(req)}
                        disabled={actionLoadingId === req._id}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--accent-rose)',
                          color: 'var(--accent-rose)',
                          padding: '7px 14px',
                          borderRadius: '999px',
                          fontSize: '0.74rem',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <RotateCcw size={13} />
                        Refund Buyer (₹{req.totalEscrowAmount?.toLocaleString()})
                      </button>

                      <button
                        onClick={() => handleResolvePayHolder(req)}
                        disabled={actionLoadingId === req._id}
                        style={{
                          background: 'var(--btn-black)',
                          color: '#ffffff',
                          padding: '7px 14px',
                          borderRadius: '999px',
                          fontSize: '0.74rem',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Check size={13} color="#d49b55" />
                        Pay Holder (₹{cardholderPayout.toLocaleString()})
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer Action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-body)' }}>
                    Campus Meetup: <strong>{req.safeMeetupLocation}</strong>
                  </div>

                  {isSettled && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--accent-green)',
                      fontSize: '0.78rem',
                      fontWeight: '800'
                    }}>
                      <CheckCircle2 size={16} />
                      Payout Recorded: ₹{cardholderPayout.toLocaleString()} settled ({req.paymentDetails?.payoutReferenceId || 'UPI Payout'})
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminEscrowPortal;

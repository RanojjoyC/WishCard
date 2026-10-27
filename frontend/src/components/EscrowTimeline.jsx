import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle,
  XCircle
} from 'lucide-react';

const STEPS = [
  { key: 'REQUESTED', label: '1. Request Posted', desc: 'Item & card listed' },
  { key: 'MATCHED', label: '2. Slot Accepted', desc: 'Cardholder matched' },
  { key: 'ESCROW_FUNDED', label: '3. Escrow Paid', desc: 'Buyer locks funds' },
  { key: 'PURCHASED', label: '4. Card Order Placed', desc: 'Receipt uploaded' },
  { key: 'DELIVERED_TO_HOLDER', label: '5. Package Arrived', desc: 'Sealed box proof' },
  { key: 'HANDOFF_COMPLETED', label: '6. Campus Meetup', desc: 'OTP inspection' },
  { key: 'ESCROW_RELEASED', label: '7. Payout Released', desc: 'Holder gets 3% profit' }
];

const EscrowTimeline = ({ currentStatus }) => {
  if (currentStatus === 'CANCELLED') {
    return (
      <div style={{
        background: 'var(--accent-rose-subtle)',
        border: '1px solid var(--accent-rose)',
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: 'var(--accent-rose)'
      }}>
        <XCircle size={22} />
        <div>
          <div style={{ fontSize: '0.88rem', fontWeight: '800' }}>
            Request Cancelled
          </div>
          <div style={{ fontSize: '0.74rem', opacity: 0.9 }}>
            This transaction was terminated. If funds were deposited in escrow, a refund to the buyer has been marked.
          </div>
        </div>
      </div>
    );
  }

  if (currentStatus === 'DISPUTED') {
    return (
      <div style={{
        background: 'var(--accent-amber-subtle)',
        border: '1px solid var(--primary-ochre)',
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: 'var(--primary-ochre)'
      }}>
        <AlertTriangle size={22} />
        <div>
          <div style={{ fontSize: '0.88rem', fontWeight: '800' }}>
            Transaction Under Dispute
          </div>
          <div style={{ fontSize: '0.74rem', opacity: 0.9 }}>
            Escrow payout is frozen. Platform administrators will review purchase receipts, parcel photos, and chat logs to settle the transaction.
          </div>
        </div>
      </div>
    );
  }

  const getStepIndex = (status) => {
    switch (status) {
      case 'REQUESTED': return 0;
      case 'MATCHED': return 1;
      case 'ESCROW_FUNDED': return 2;
      case 'PURCHASED': return 3;
      case 'DELIVERED_TO_HOLDER': return 4;
      case 'HANDOFF_COMPLETED': return 5;
      case 'ESCROW_RELEASED': return 6;
      default: return 0;
    }
  };

  const activeIdx = getStepIndex(currentStatus);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '8px',
      position: 'relative'
    }}>
      {STEPS.map((step, idx) => {
        const isDone = idx < activeIdx;
        const isCurrent = idx === activeIdx;

        return (
          <div
            key={step.key}
            style={{
              background: isCurrent 
                ? 'var(--primary-ochre-subtle)' 
                : isDone 
                ? 'var(--accent-green-subtle)' 
                : 'var(--bg-subtle)',
              border: isCurrent 
                ? '1px solid var(--primary-ochre)' 
                : isDone 
                ? '1px solid #a7f3d0' 
                : '1px solid var(--border-light)',
              borderRadius: '10px',
              padding: '10px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: isDone 
                  ? 'var(--accent-green)' 
                  : isCurrent 
                  ? 'var(--primary-ochre)' 
                  : 'var(--text-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: '800'
              }}>
                {isDone ? '✓' : idx + 1}
              </div>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: '700',
                color: isDone ? 'var(--accent-green)' : isCurrent ? 'var(--primary-ochre)' : 'var(--text-light)'
              }}>
                {isDone ? 'Done' : isCurrent ? 'Active' : 'Pending'}
              </span>
            </div>
            <div>
              <div style={{
                fontSize: '0.74rem',
                fontWeight: '700',
                color: isCurrent ? 'var(--primary-ochre)' : isDone ? '#065f46' : 'var(--text-body)',
                lineHeight: 1.2
              }}>
                {step.label}
              </div>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {step.desc}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EscrowTimeline;

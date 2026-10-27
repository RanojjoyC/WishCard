import React, { useState } from 'react';
import { 
  ShoppingBag, 
  CreditCard, 
  Clock, 
  MapPin, 
  ArrowRight, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import ProductThumbnail from './ProductThumbnail';

const STATUS_LABELS = {
  REQUESTED: 'Awaiting Cardholder',
  MATCHED: 'Matched — Ready to Fund Escrow',
  ESCROW_FUNDED: 'Escrow Funded — Card Order Pending',
  PURCHASED: 'Order Placed — Package in Transit',
  DELIVERED_TO_HOLDER: 'Arrived — Meetup Ready',
  HANDOFF_COMPLETED: 'Handoff Verified',
  ESCROW_RELEASED: 'Completed & Escrow Settled',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed'
};

const MyOrdersView = ({ orders = [], currentUser, onSelectOrder }) => {
  const [filter, setFilter] = useState('ALL');

  const currentUserId = (currentUser?._id || currentUser?.id || '').toString();

  const myRequests = orders.filter(o => {
    const bId = (o.buyer?._id || o.buyer?.id || o.buyer || '').toString();
    return bId === currentUserId;
  });

  const myTakenSlots = orders.filter(o => {
    const hId = (o.matchedHolder?._id || o.matchedHolder?.id || o.matchedHolder || '').toString();
    return hId === currentUserId;
  });

  const displayed = filter === 'REQUESTS' ? myRequests : (filter === 'SLOTS' ? myTakenSlots : orders);

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
            My Deals & Slot History
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Find all your posted requests and accepted slots across active, completed, cancelled, and disputed states.
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-subtle)', padding: '3px', borderRadius: '10px' }}>
          <button
            onClick={() => setFilter('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: '700',
              background: filter === 'ALL' ? 'var(--btn-black)' : 'transparent',
              color: filter === 'ALL' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            All Deals ({orders.length})
          </button>
          <button
            onClick={() => setFilter('REQUESTS')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: '700',
              background: filter === 'REQUESTS' ? 'var(--primary-ochre)' : 'transparent',
              color: filter === 'REQUESTS' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            My Requests ({myRequests.length})
          </button>
          <button
            onClick={() => setFilter('SLOTS')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: '700',
              background: filter === 'SLOTS' ? 'var(--primary-ochre)' : 'transparent',
              color: filter === 'SLOTS' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            My Taken Slots ({myTakenSlots.length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {displayed.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-light)',
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <ShoppingBag size={36} color="var(--primary-ochre)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-dark)' }}>
              No Transactions Found
            </div>
            <p style={{ fontSize: '0.78rem', margin: '4px 0 0' }}>
              Your posted requests and claimed card slots will stay accessible here throughout their lifecycle.
            </p>
          </div>
        ) : (
          displayed.map((order) => {
            const isBuyer = (order.buyer?._id || order.buyer?.id || order.buyer || '').toString() === currentUserId;
            const friendlyStatus = STATUS_LABELS[order.status] || order.status;
            const isCompleted = order.status === 'ESCROW_RELEASED';
            const isCancelled = order.status === 'CANCELLED';
            const isDisputed = order.status === 'DISPUTED';

            return (
              <div
                key={order._id}
                style={{
                  background: 'var(--bg-card)',
                  border: isDisputed 
                    ? '1px solid var(--accent-rose)' 
                    : isCompleted 
                    ? '1px solid #a7f3d0' 
                    : '1px solid var(--border-light)',
                  borderRadius: '16px',
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: 'var(--shadow-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <ProductThumbnail
                    src={order.productScreenshot}
                    alt={order.productTitle}
                    width={64}
                    height={64}
                  />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: '800',
                        color: isBuyer ? 'var(--primary-ochre)' : 'var(--accent-green)',
                        background: isBuyer ? 'var(--primary-ochre-subtle)' : 'var(--accent-green-subtle)',
                        padding: '1px 7px',
                        borderRadius: '999px',
                        textTransform: 'uppercase'
                      }}>
                        {isBuyer ? 'Your Request' : 'You as Cardholder'}
                      </span>

                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {order.store} • {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.98rem', fontWeight: '800', color: 'var(--text-dark)', margin: '2px 0 4px' }}>
                      {order.productTitle}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      <span>Card: <strong style={{ color: 'var(--text-dark)' }}>{order.targetBank}</strong></span>
                      <span>Total Escrow: <strong style={{ color: 'var(--primary-ochre)' }}>₹{order.totalEscrowAmount?.toLocaleString()}</strong></span>
                      {order.safeMeetupLocation && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <MapPin size={12} color="var(--accent-green)" />
                          {order.safeMeetupLocation}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    background: isCompleted 
                      ? 'var(--accent-green-subtle)' 
                      : isCancelled
                      ? 'var(--accent-rose-subtle)'
                      : isDisputed
                      ? 'var(--accent-rose-subtle)'
                      : 'var(--bg-subtle)',
                    color: isCompleted 
                      ? 'var(--accent-green)' 
                      : isCancelled
                      ? 'var(--accent-rose)'
                      : isDisputed
                      ? 'var(--accent-rose)'
                      : 'var(--text-dark)',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '0.74rem',
                    fontWeight: '800',
                    border: '1px solid var(--border-light)'
                  }}>
                    {friendlyStatus}
                  </span>

                  <button
                    onClick={() => onSelectOrder(order)}
                    style={{
                      background: 'var(--btn-black)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '999px',
                      padding: '8px 16px',
                      fontSize: '0.76rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    View Details
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyOrdersView;

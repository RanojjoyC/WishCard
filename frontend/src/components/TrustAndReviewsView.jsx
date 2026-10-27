import React, { useState, useEffect } from 'react';
import { 
  Star, 
  ShieldCheck, 
  Award,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import api from '../api';

const TrustAndReviewsView = () => {
  const [ordersWithReviews, setOrdersWithReviews] = useState([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviewData();
  }, []);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests/my-orders');
      if (res.data?.success) {
        const orders = res.data.orders || [];
        const completed = orders.filter(r => r.status === 'ESCROW_RELEASED');
        const withReviews = orders.filter(
          r => r.ratings && (r.ratings.buyerReview || r.ratings.holderReview)
        );
        setTotalCompleted(completed.length);
        setOrdersWithReviews(withReviews);
      }
    } catch (err) {
      console.log('Error fetching reviews:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '980px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
            Trust & Community Reviews
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Verified ratings and reviews submitted directly after physical campus inspection and escrow settlement.
          </p>
        </div>

        <button
          onClick={fetchReviewData}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.78rem',
            fontWeight: '600',
            color: 'var(--text-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={13} />
          Refresh Reviews
        </button>
      </div>

      {/* Top Metric Cards */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '16px',
        padding: '24px 32px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        alignItems: 'center',
        marginBottom: '32px',
        boxShadow: 'var(--shadow-subtle)'
      }}>
        {/* Total Deals */}
        <div style={{ borderRight: '1px solid var(--border-light)', paddingRight: '20px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Your Completed Escrow Deals
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-dark)' }}>
              {totalCompleted}
            </span>
            <span style={{
              background: 'var(--accent-green-subtle)',
              color: 'var(--accent-green)',
              fontSize: '0.72rem',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <ShieldCheck size={12} />
              100% Protected
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '4px' }}>
            Funds verified in simulated platform vault prior to handoff
          </div>
        </div>

        {/* Reviews Submitted */}
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Verified Community Reviews
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-dark)' }}>
              {ordersWithReviews.length}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '4px' }}>
            Only transaction participants can submit reviews after completion
          </div>
        </div>
      </div>

      {/* Review List items or Empty State */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {ordersWithReviews.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-card)',
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--primary-ochre-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              color: 'var(--primary-ochre)'
            }}>
              <Award size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px' }}>
              No Reviews Yet
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
              Once you complete deals and submit feedback via order details, genuine peer reviews will populate here.
            </p>
          </div>
        ) : (
          ordersWithReviews.map((deal) => (
            <div
              key={deal._id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--shadow-subtle)',
                display: 'flex',
                gap: '20px'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                    {deal.productTitle}
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    color: 'var(--primary-ochre)',
                    background: 'var(--primary-ochre-subtle)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {deal.store}
                  </span>
                </div>

                {deal.ratings?.buyerReview && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-body)' }}>
                        Buyer Review ({deal.buyer?.name || 'Buyer'}):
                      </span>
                      <div style={{ display: 'flex', gap: '2px', color: 'var(--primary-ochre)' }}>
                        {[...Array(deal.ratings.buyerRating || 5)].map((_, i) => (
                          <Star key={i} size={12} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', margin: 0 }}>
                      "{deal.ratings.buyerReview}"
                    </p>
                  </div>
                )}

                {deal.ratings?.holderReview && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-body)' }}>
                        Cardholder Review ({deal.matchedHolder?.name || 'Cardholder'}):
                      </span>
                      <div style={{ display: 'flex', gap: '2px', color: 'var(--primary-ochre)' }}>
                        {[...Array(deal.ratings.holderRating || 5)].map((_, i) => (
                          <Star key={i} size={12} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', margin: 0 }}>
                      "{deal.ratings.holderReview}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TrustAndReviewsView;

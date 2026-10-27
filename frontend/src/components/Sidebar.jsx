import React from 'react';
import { 
  CreditCard, 
  Inbox, 
  Users, 
  MessageSquare, 
  Star, 
  ShieldCheck, 
  LogOut,
  Sparkles,
  ShieldAlert,
  Plus,
  ShoppingBag,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ 
  activeTab, 
  onSelectTab, 
  onOpenNewRequest, 
  onOpenMyCards, 
  onOpenProfile 
}) => {
  const { currentUser, logout } = useAuth();

  const isAdmin = currentUser?.email === 'admin@wishcard.com' || currentUser?.role === 'admin';
  const myCardsCount = currentUser?.creditCards?.length || 0;

  return (
    <aside style={{
      width: '260px',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '24px 16px',
      justifyContent: 'space-between'
    }}>
      <div>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px 24px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--btn-black)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <CreditCard size={18} color="#d49b55" />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-0.02em' }}>
              WishCard
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              {isAdmin ? 'Admin Escrow Vault' : 'Campus Peer Escrow'}
            </div>
          </div>
        </div>

        {/* Quick Dual Actions */}
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={onOpenNewRequest}
            style={{
              width: '100%',
              background: 'var(--btn-black)',
              color: '#ffffff',
              padding: '10px 14px',
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
            <Plus size={15} color="#d49b55" />
            Request Proxy Buy
          </button>

          <button
            onClick={onOpenMyCards}
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              color: 'var(--text-dark)',
              padding: '9px 14px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <CreditCard size={14} color="var(--primary-ochre)" />
            My Cards ({myCardsCount}/5)
          </button>
        </div>

        {/* Navigation Menu */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {isAdmin && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--primary-ochre)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px 6px' }}>
                Admin Operations
              </div>
              <button
                onClick={() => onSelectTab('admin_vault')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: '700',
                  background: activeTab === 'admin_vault' ? 'var(--btn-black)' : 'var(--primary-ochre-subtle)',
                  color: activeTab === 'admin_vault' ? '#ffffff' : 'var(--primary-ochre)',
                  textAlign: 'left',
                  border: '1px solid var(--primary-ochre)',
                  cursor: 'pointer'
                }}
              >
                <ShieldAlert size={17} color={activeTab === 'admin_vault' ? '#d49b55' : 'var(--primary-ochre)'} />
                <span style={{ flex: 1 }}>Escrow Vault & Payouts</span>
                <span style={{
                  background: 'var(--primary-ochre)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '999px'
                }}>
                  Admin
                </span>
              </button>
            </div>
          )}

          <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px 6px' }}>
            Campus Marketplace
          </div>

          <button
            onClick={() => onSelectTab('matching_requests')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: '600',
              background: activeTab === 'matching_requests' ? 'var(--primary-ochre-subtle)' : 'transparent',
              color: activeTab === 'matching_requests' ? 'var(--primary-ochre)' : 'var(--text-body)',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Inbox size={17} color={activeTab === 'matching_requests' ? 'var(--primary-ochre)' : 'var(--text-muted)'} />
            <span style={{ flex: 1 }}>Open Requests</span>
            <span style={{
              background: activeTab === 'matching_requests' ? 'var(--primary-ochre)' : 'var(--bg-subtle)',
              color: activeTab === 'matching_requests' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.68rem',
              fontWeight: '700',
              padding: '1px 7px',
              borderRadius: '999px'
            }}>
              Feed
            </span>
          </button>

          <button
            onClick={() => onSelectTab('my_orders')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: '600',
              background: activeTab === 'my_orders' ? 'var(--primary-ochre-subtle)' : 'transparent',
              color: activeTab === 'my_orders' ? 'var(--primary-ochre)' : 'var(--text-body)',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <ShoppingBag size={17} color={activeTab === 'my_orders' ? 'var(--primary-ochre)' : 'var(--text-muted)'} />
            <span style={{ flex: 1 }}>My Deals & Slots</span>
          </button>

          <button
            onClick={() => onSelectTab('card_holders')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: '600',
              background: activeTab === 'card_holders' ? 'var(--primary-ochre-subtle)' : 'transparent',
              color: activeTab === 'card_holders' ? 'var(--primary-ochre)' : 'var(--text-body)',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Users size={17} color={activeTab === 'card_holders' ? 'var(--primary-ochre)' : 'var(--text-muted)'} />
            <span>Nearby Cardholders</span>
          </button>

          <button
            onClick={() => onSelectTab('deal_chats')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: '600',
              background: activeTab === 'deal_chats' ? 'var(--primary-ochre-subtle)' : 'transparent',
              color: activeTab === 'deal_chats' ? 'var(--primary-ochre)' : 'var(--text-body)',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <MessageSquare size={17} color={activeTab === 'deal_chats' ? 'var(--primary-ochre)' : 'var(--text-muted)'} />
            <span style={{ flex: 1 }}>Deal Chatrooms</span>
            <span style={{
              background: 'var(--accent-green)',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: '700',
              padding: '1px 6px',
              borderRadius: '999px'
            }}>
              Live
            </span>
          </button>

          <button
            onClick={() => onSelectTab('trust_reviews')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: '600',
              background: activeTab === 'trust_reviews' ? 'var(--primary-ochre-subtle)' : 'transparent',
              color: activeTab === 'trust_reviews' ? 'var(--primary-ochre)' : 'var(--text-body)',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Star size={17} color={activeTab === 'trust_reviews' ? 'var(--primary-ochre)' : 'var(--text-muted)'} />
            <span>Trust & Reviews</span>
          </button>
        </div>
      </div>

      {/* User Capsule & Controls */}
      <div style={{
        borderTop: '1px solid var(--border-light)',
        paddingTop: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {/* Clickable user profile row */}
        <div 
          onClick={onOpenProfile}
          title="Click to edit profile & payout UPI"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '6px 8px',
            borderRadius: '10px',
            background: 'var(--bg-subtle)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={currentUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser?.name || 'User')}`}
              alt={currentUser?.name || 'User'}
              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-light)' }}
            />
            <div style={{ maxWidth: '130px', overflow: 'hidden' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-dark)', lineHeight: 1.2, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.name || 'Campus Student'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--primary-ochre)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontWeight: '600' }}>
                Edit Profile ↗
              </div>
            </div>
          </div>
          <div>
            {isAdmin ? (
              <span title="WishCard Administrator">
                <ShieldAlert size={18} color="var(--primary-ochre)" />
              </span>
            ) : (
              <span title="Verified Campus Student">
                <ShieldCheck size={18} color="var(--accent-green)" />
              </span>
            )}
          </div>
        </div>

        {/* Explicit Logout Button */}
        <button
          onClick={logout}
          style={{
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            color: 'var(--accent-rose)',
            padding: '7px 12px',
            borderRadius: '999px',
            fontSize: '0.74rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <LogOut size={13} />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

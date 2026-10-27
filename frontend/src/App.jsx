import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShieldCheck,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import api from './api';
import Sidebar from './components/Sidebar';
import MatchingRequestsView from './components/MatchingRequestsView';
import CardHoldersView from './components/CardHoldersView';
import TrustAndReviewsView from './components/TrustAndReviewsView';
import BuyerHolderChatroom from './components/BuyerHolderChatroom';
import OrderDetailsView from './components/OrderDetailsView';
import CreateRequestModal from './components/CreateRequestModal';
import AddCardModal from './components/AddCardModal';
import MyCardsModal from './components/MyCardsModal';
import ProfileModal from './components/ProfileModal';
import MyOrdersView from './components/MyOrdersView';
import AuthStandalonePage from './components/AuthStandalonePage';
import AdminEscrowPortal from './components/AdminEscrowPortal';
import { useAuth } from './context/AuthContext';

function App() {
  const { currentUser, token, isLoggedOut, updateLocation, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('matching_requests');
  const [requests, setRequests] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [adminAllOrders, setAdminAllOrders] = useState([]);
  const [holders, setHolders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeChatRequest, setActiveChatRequest] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [prefilledBank, setPrefilledBank] = useState('');
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [isMyCardsModalOpen, setIsMyCardsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Error banners for visibility
  const [fetchError, setFetchError] = useState('');

  const isAdmin = currentUser?.email === 'admin@wishcard.com' || currentUser?.role === 'admin';

  // Initial load and periodic polling every 4 seconds for 2-browser demo sync
  useEffect(() => {
    if (token) {
      fetchAllData();

      const pollInterval = setInterval(() => {
        pollDataQuietly();
      }, 4000);

      // Real browser geolocation without hardcoded campus defaults
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = [pos.coords.longitude, pos.coords.latitude];
            updateLocation(coords, currentUser?.location?.address || 'Campus Location (Verified GPS)');
          },
          (err) => {
            console.log('[Geolocation notice] Location prompt declined or unavailable:', err.message);
          },
          { timeout: 8000 }
        );
      }

      return () => clearInterval(pollInterval);
    }
  }, [token, isAdmin]);

  const fetchAllData = async () => {
    setFetchError('');
    await Promise.all([
      fetchMarketplaceRequests(),
      fetchMyOrders(),
      fetchNearbyHolders(),
      isAdmin ? fetchAdminOrders() : Promise.resolve(),
      refreshProfile()
    ]);
  };

  const pollDataQuietly = async () => {
    fetchMarketplaceRequests();
    fetchMyOrders();
    fetchNearbyHolders();
    if (isAdmin) fetchAdminOrders();
    // If an order is currently actively viewed, refresh it
    if (selectedOrder?._id && activeTab !== 'deal_chats') {
      try {
        const res = await api.get(`/requests/${selectedOrder._id}`);
        if (res.data?.success && res.data?.request) {
          // Double-check tab hasn't switched to deal_chats during fetch
          setSelectedOrder(prev => (prev?._id === res.data.request._id ? res.data.request : prev));
        }
      } catch (e) {
        // quiet poll
      }
    }
  };

  const fetchMarketplaceRequests = async () => {
    try {
      const res = await api.get('/requests/feed');
      if (res.data?.success) {
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      setFetchError(err.response?.data?.message || err.message || 'Error connecting to server');
    }
  };

  const fetchMyOrders = async () => {
    try {
      const res = await api.get('/requests/my-orders');
      if (res.data?.success) {
        setMyOrders(res.data.orders || []);
      }
    } catch (err) {
      // quiet error
    }
  };

  const fetchAdminOrders = async () => {
    try {
      const res = await api.get('/requests/admin/all');
      if (res.data?.success) {
        setAdminAllOrders(res.data.orders || []);
      }
    } catch (err) {
      // quiet error
    }
  };

  const fetchNearbyHolders = async () => {
    try {
      const res = await api.get('/holders/nearby');
      if (res.data?.success) {
        setHolders(res.data.holders || []);
      }
    } catch (err) {
      console.log('Error fetching holders:', err.message);
    }
  };

  const handleAcceptSlot = async (request) => {
    try {
      const res = await api.post(`/requests/${request._id}/accept`, {});
      if (res.data?.success) {
        handleUpdateOrder(res.data.request);
        fetchNearbyHolders();
        return { success: true, request: res.data.request };
      }
      return { success: false, message: res.data?.message || 'Failed to accept slot' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error accepting slot';
      return { success: false, message: msg };
    }
  };

  const handleUpdateOrder = (updatedOrder) => {
    setRequests(prev => prev.map(r => r._id === updatedOrder._id ? updatedOrder : r));
    setMyOrders(prev => {
      const exists = prev.some(r => r._id === updatedOrder._id);
      return exists ? prev.map(r => r._id === updatedOrder._id ? updatedOrder : r) : [updatedOrder, ...prev];
    });
    setAdminAllOrders(prev => prev.map(r => r._id === updatedOrder._id ? updatedOrder : r));
    if (selectedOrder && selectedOrder._id === updatedOrder._id) {
      setSelectedOrder(updatedOrder);
    }
  };

  const handleRequestCreated = (newReq) => {
    setRequests(prev => [newReq, ...prev]);
    setMyOrders(prev => [newReq, ...prev]);
    setSelectedOrder(newReq);
    setActiveTab('my_orders');
  };

  const handleOpenChat = (request) => {
    if (!request) return;
    setActiveChatRequest(request);
    setSelectedOrder(null);
    setActiveTab('deal_chats');
  };

  // Filter requests based on search bar input
  const filteredRequests = requests.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.productTitle?.toLowerCase().includes(q) ||
      r.store?.toLowerCase().includes(q) ||
      r.targetBank?.toLowerCase().includes(q) ||
      r.targetCardRequirement?.toLowerCase().includes(q)
    );
  });

  if (isLoggedOut) {
    return <AuthStandalonePage />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setSelectedOrder(null);
          setActiveTab(tab);
        }}
        onOpenNewRequest={() => {
          setPrefilledBank('');
          setIsRequestModalOpen(true);
        }}
        onOpenMyCards={() => setIsMyCardsModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header style={{
          height: '68px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 36px',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}>
          {/* Functional Search Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-page)',
            border: '1px solid var(--border-light)',
            borderRadius: '999px',
            padding: '8px 18px',
            width: '320px'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search products, stores, or bank cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '0.82rem',
                color: 'var(--text-dark)',
                width: '100%',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: 'var(--accent-green-subtle)',
              borderRadius: '999px',
              fontSize: '0.74rem',
              fontWeight: '700',
              color: 'var(--accent-green)'
            }}>
              <ShieldCheck size={14} />
              Campus Escrow Protection (Simulated Test Mode)
            </div>

            <button
              onClick={() => {
                if (myOrders.length > 0) {
                  setSelectedOrder(myOrders[0]);
                } else if (requests.length > 0) {
                  setSelectedOrder(requests[0]);
                } else {
                  setActiveTab('matching_requests');
                }
              }}
              style={{
                background: 'var(--btn-black)',
                borderRadius: '999px',
                padding: '9px 20px',
                fontSize: '0.78rem',
                fontWeight: '700',
                color: '#ffffff',
                boxShadow: 'var(--shadow-subtle)',
                letterSpacing: '0.02em',
                cursor: 'pointer'
              }}
            >
              ACTIVE ESCROW DEAL
            </button>
          </div>
        </header>

        {/* Failure / Retry Banner */}
        {fetchError && (
          <div style={{
            margin: '16px 36px 0',
            background: 'var(--accent-rose-subtle)',
            border: '1px solid var(--accent-rose)',
            color: 'var(--accent-rose)',
            padding: '12px 18px',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>Network error: {fetchError}. Please verify backend connection.</span>
            </div>
            <button
              onClick={fetchAllData}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--accent-rose)',
                color: 'var(--accent-rose)',
                padding: '5px 12px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        )}

        {/* Dynamic Main Body Content */}
        <main style={{ flex: 1, padding: '36px', overflowY: 'auto' }}>
          {selectedOrder && activeTab !== 'deal_chats' ? (
            <OrderDetailsView
              request={selectedOrder}
              currentUser={currentUser}
              onUpdateOrder={handleUpdateOrder}
              onBack={() => setSelectedOrder(null)}
              onOpenChat={(req) => handleOpenChat(req)}
            />
          ) : activeTab === 'admin_vault' ? (
            <AdminEscrowPortal
              requests={adminAllOrders.length > 0 ? adminAllOrders : requests}
              onUpdateOrder={handleUpdateOrder}
              onRefreshRequests={fetchAdminOrders}
            />
          ) : activeTab === 'my_orders' ? (
            <MyOrdersView
              orders={myOrders}
              currentUser={currentUser}
              onSelectOrder={(req) => setSelectedOrder(req)}
            />
          ) : activeTab === 'matching_requests' ? (
            <MatchingRequestsView
              requests={filteredRequests}
              currentUser={currentUser}
              onSelectOrder={(req) => setSelectedOrder(req)}
              onAcceptSlot={handleAcceptSlot}
              onOpenChat={(req) => handleOpenChat(req)}
            />
          ) : activeTab === 'card_holders' ? (
            <CardHoldersView
              holders={holders}
              onSelectHolderForRequest={(holder) => {
                const targetCard = holder.creditCards?.[0];
                setPrefilledBank(targetCard ? targetCard.bankName : '');
                setIsRequestModalOpen(true);
              }}
              onStartChatWithHolder={(holder) => {
                // Find matching deal with this holder or prompt user
                const existingDeal = myOrders.find(r => 
                  r.matchedHolder && (r.matchedHolder._id === holder._id || r.matchedHolder === holder._id)
                );
                if (existingDeal) {
                  handleOpenChat(existingDeal);
                } else {
                  alert(`To start a deal chat with ${holder.name}, please click "Request Buy" to open a purchase slot for their card.`);
                }
              }}
            />
          ) : activeTab === 'deal_chats' ? (() => {
            const currentUserId = (currentUser?._id || currentUser?.id || '').toString();
            // Use myOrders (which includes all completed/disputed/active matched deals) so chats never disappear!
            const myMatchedRequests = myOrders.filter(r => {
              const buyerId = (r.buyer?._id || r.buyer?.id || r.buyer || '').toString();
              const holderId = (r.matchedHolder?._id || r.matchedHolder?.id || r.matchedHolder || '').toString();
              return (buyerId && currentUserId === buyerId) || (holderId && currentUserId === holderId);
            });
            const effectiveActiveReq = activeChatRequest || (myMatchedRequests.length > 0 ? myMatchedRequests[0] : null);

            return (
              <BuyerHolderChatroom
                myMatchedRequests={myMatchedRequests}
                selectedRequest={effectiveActiveReq}
                onSelectRequest={(req) => handleOpenChat(req)}
                onProceedToEscrow={(req) => setSelectedOrder(req)}
              />
            );
          })() : (
            <TrustAndReviewsView
              onStartChatWithUser={() => {
                setActiveTab('matching_requests');
              }}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateRequestModal
        isOpen={isRequestModalOpen}
        prefilledTargetBank={prefilledBank}
        onClose={() => setIsRequestModalOpen(false)}
        onRequestCreated={handleRequestCreated}
      />

      <AddCardModal
        isOpen={isAddCardModalOpen}
        onClose={() => {
          setIsAddCardModalOpen(false);
          fetchNearbyHolders();
        }}
      />

      <MyCardsModal
        isOpen={isMyCardsModalOpen}
        onClose={() => {
          setIsMyCardsModalOpen(false);
          fetchNearbyHolders();
        }}
        onOpenAddCard={() => {
          setIsMyCardsModalOpen(false);
          setIsAddCardModalOpen(true);
        }}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

export default App;

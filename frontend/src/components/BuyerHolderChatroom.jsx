import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { 
  Send, 
  ShieldCheck, 
  Lock, 
  AlertTriangle, 
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BuyerHolderChatroom = ({ 
  myMatchedRequests = [], 
  selectedRequest, 
  onSelectRequest, 
  onProceedToEscrow 
}) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestObj, setRequestObj] = useState(selectedRequest || null);
  const [accessError, setAccessError] = useState('');
  const messagesEndRef = useRef(null);

  const activeReq = selectedRequest || requestObj;
  const requestId = activeReq?._id;

  useEffect(() => {
    setRequestObj(selectedRequest);
    setAccessError('');
  }, [selectedRequest]);

  useEffect(() => {
    if (!requestId) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [requestId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    if (!requestId) return;
    try {
      const res = await api.get(`/chat/${requestId}`);
      if (res.data?.success) {
        setMessages(res.data.messages || []);
        if (res.data.request) {
          setRequestObj(prev => ({ ...(prev || {}), ...res.data.request }));
        }
        setAccessError('');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessError(err.response.data?.message || 'Access Denied: Private Buyer-Cardholder Chat');
      } else {
        console.error('Fetch chat error:', err.message);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !requestId) return;

    try {
      setLoading(true);
      const res = await api.post(`/chat/${requestId}`, {
        message: inputMessage
      });

      if (res.data?.success) {
        setMessages(prev => [...prev, res.data.message]);
        setInputMessage('');
      }
    } catch (err) {
      console.error('Send message error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentUserId = (currentUser?._id || currentUser?.id || '').toString();
  const buyerId = (activeReq?.buyer?._id || activeReq?.buyer?.id || activeReq?.buyer || '').toString();
  const holderId = (activeReq?.matchedHolder?._id || activeReq?.matchedHolder?.id || activeReq?.matchedHolder || '').toString();
  const isBuyer = currentUserId && buyerId && currentUserId === buyerId;

  const partnerUser = isBuyer ? activeReq?.matchedHolder : activeReq?.buyer;
  const partnerName = partnerUser?.name || (isBuyer ? 'Matched Cardholder' : 'Buyer');
  const partnerRole = isBuyer ? 'Verified Cardholder' : 'Buyer';
  const partnerAvatar = partnerUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(partnerName)}`;

  if (!activeReq) {
    return (
      <div style={{ maxWidth: '1000px' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-card)',
          borderRadius: '16px',
          padding: '50px 30px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'var(--primary-ochre-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--primary-ochre)'
          }}>
            <MessageSquare size={26} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '8px' }}>
            Private Deal Chatrooms
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            When a request is accepted by a verified cardholder, an encrypted 1-on-1 transaction room is opened between both parties to coordinate specifications and safe meetup.
          </p>
        </div>
      </div>
    );
  }

  if (accessError) {
    return (
      <div style={{ maxWidth: '1000px' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--accent-rose)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <AlertTriangle size={36} color="var(--accent-rose)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-dark)' }}>
            Restricted Deal Chat
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '8px auto 0' }}>
            {accessError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1040px',
      display: 'grid',
      gridTemplateColumns: myMatchedRequests.length > 1 ? '280px 1fr' : '1fr',
      gap: '20px',
      height: '80vh'
    }}>
      {myMatchedRequests.length > 1 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 4px 6px' }}>
            My Active Deal Rooms ({myMatchedRequests.length})
          </div>
          {myMatchedRequests.map(r => {
            const isSelected = r._id === activeReq._id;
            return (
              <button
                key={r._id}
                onClick={() => onSelectRequest && onSelectRequest(r)}
                style={{
                  background: isSelected ? 'var(--primary-ochre-subtle)' : 'var(--bg-page)',
                  border: isSelected ? '1px solid var(--primary-ochre)' : '1px solid var(--border-light)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.productTitle}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: isSelected ? 'var(--primary-ochre)' : 'var(--text-muted)' }}>
                    {r.status}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Chat Area */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* Top Chat Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={partnerAvatar}
              alt={partnerName}
              style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border-light)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
                  {partnerName}
                </h3>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  color: 'var(--primary-ochre)',
                  background: 'var(--primary-ochre-subtle)',
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}>
                  {partnerRole}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Private Deal Channel
              </div>
            </div>
          </div>

          <button
            onClick={() => onProceedToEscrow(activeReq)}
            style={{
              background: 'var(--btn-black)',
              color: '#ffffff',
              padding: '8px 18px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Lock size={14} color="#d49b55" />
            View Escrow Pipeline
          </button>
        </div>

        {/* Messages Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: 'var(--bg-card)'
        }}>
          {messages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '380px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'var(--primary-ochre-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                color: 'var(--primary-ochre)'
              }}>
                <MessageSquare size={20} />
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px' }}>
                Private Verification Channel
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Coordinate deal specifications and campus meetup points here.
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const senderIdStr = (msg.sender?._id || msg.sender?.id || msg.sender || '').toString();
              const isMe = currentUserId && senderIdStr === currentUserId;
              return (
                <div
                  key={msg._id || idx}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                    {isMe ? 'You' : msg.senderName} ({msg.senderRole})
                  </div>
                  <div style={{
                    background: isMe ? 'var(--btn-black)' : 'var(--bg-subtle)',
                    color: isMe ? '#ffffff' : 'var(--text-dark)',
                    padding: '10px 16px',
                    borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    border: isMe ? 'none' : '1px solid var(--border-light)'
                  }}>
                    {msg.message}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-light)', marginTop: '3px' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Message Bar */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-light)',
            background: 'var(--bg-card)',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}
        >
          <input
            type="text"
            placeholder={`Message ${partnerName?.split(' ')[0] || 'partner'}...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--bg-page)',
              border: '1px solid var(--border-light)',
              borderRadius: '999px',
              padding: '11px 18px',
              fontSize: '0.85rem',
              color: 'var(--text-dark)'
            }}
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            style={{
              background: 'var(--btn-black)',
              color: '#ffffff',
              padding: '11px 22px',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: !inputMessage.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            <Send size={15} color="#d49b55" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default BuyerHolderChatroom;

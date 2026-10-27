import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles,
  Upload,
  AlertCircle,
  TrendingDown,
  Info
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_BANKS, getBankIdFromText } from '../constants/banks';

const CreateRequestModal = ({ isOpen, onClose, onRequestCreated, prefilledTargetBank = '' }) => {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    productTitle: '',
    productUrl: '',
    store: 'Amazon India',
    productScreenshot: '',
    targetBank: 'HDFC',
    targetCardRequirement: 'HDFC Bank Millennia / Regalia',
    originalPrice: '',
    discountedPrice: '',
    safeMeetupLocation: currentUser?.collegeName || 'Campus Central Quad'
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset form whenever modal opens or prefilled bank changes
  useEffect(() => {
    if (isOpen) {
      const bankId = prefilledTargetBank ? getBankIdFromText(prefilledTargetBank) : 'HDFC';
      const matchedBank = SUPPORTED_BANKS.find(b => b.id === bankId) || SUPPORTED_BANKS[0];
      setFormData({
        productTitle: '',
        productUrl: '',
        store: 'Amazon India',
        productScreenshot: '',
        targetBank: matchedBank.id,
        targetCardRequirement: matchedBank.defaultCard,
        originalPrice: '',
        discountedPrice: '',
        safeMeetupLocation: currentUser?.location?.address || currentUser?.collegeName || 'Campus Central Quad'
      });
      setErrorMsg('');
    }
  }, [isOpen, prefilledTargetBank, currentUser]);

  if (!isOpen) return null;

  const original = parseFloat(formData.originalPrice) || 0;
  const discounted = parseFloat(formData.discountedPrice) || 0;
  const holderProfit = Math.round(discounted * 0.03); // 3% profit for cardholder
  const platformFee = Math.max(15, Math.min(100, Math.round(discounted * 0.015)));
  const totalEscrow = discounted > 0 ? discounted + holderProfit + platformFee : 0;
  const netSaving = original > 0 && totalEscrow > 0 ? original - totalEscrow : 0;

  const handleBankChange = (newBankId) => {
    const bankObj = SUPPORTED_BANKS.find(b => b.id === newBankId);
    setFormData(prev => ({
      ...prev,
      targetBank: newBankId,
      targetCardRequirement: bankObj ? bankObj.defaultCard : `${newBankId} Credit Card`
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    try {
      setUploadingImage(true);
      setErrorMsg('');
      const res = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success && res.data?.url) {
        setFormData(prev => ({ ...prev, productScreenshot: res.data.url }));
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Image upload failed. You can paste an image URL instead.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const origVal = parseFloat(formData.originalPrice);
    const discVal = parseFloat(formData.discountedPrice);

    if (!formData.productTitle?.trim() || !formData.productUrl?.trim()) {
      setErrorMsg('Please enter a product title and product URL link.');
      return;
    }

    if (isNaN(origVal) || isNaN(discVal) || origVal <= 0 || discVal <= 0) {
      setErrorMsg('Prices must be positive numbers greater than ₹0.');
      return;
    }

    if (discVal > origVal) {
      setErrorMsg('Discounted price cannot be higher than the retail MRP.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/requests', {
        ...formData,
        originalPrice: parseFloat(formData.originalPrice),
        discountedPrice: parseFloat(formData.discountedPrice)
      });
      if (res.data?.success) {
        onRequestCreated(res.data.request);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to post request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      background: 'rgba(26, 24, 22, 0.45)',
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
        boxShadow: 'var(--shadow-card)'
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
              Post Campus Purchase Request
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Open a request slot for nearby campus cardholders with required bank cards
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

        {errorMsg && (
          <div style={{
            margin: '14px 24px 0',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--accent-rose-subtle)',
            color: 'var(--accent-rose)',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-body)' }}>
              Product Name & Specs
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apple iPad 10th Gen 64GB Blue"
              value={formData.productTitle}
              onChange={(e) => setFormData({ ...formData, productTitle: e.target.value })}
              style={{
                width: '100%',
                background: 'var(--bg-page)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-body)' }}>
                Store / Retailer
              </label>
              <select
                value={formData.store}
                onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                style={{
                  width: '100%',
                  background: 'var(--bg-page)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '0.85rem'
                }}
              >
                <option value="Amazon India">Amazon India</option>
                <option value="Apple Official Store">Apple Official Store</option>
                <option value="Flipkart">Flipkart</option>
                <option value="Croma">Croma</option>
                <option value="Reliance Digital">Reliance Digital</option>
                <option value="Myntra">Myntra</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-body)' }}>
                Required Credit Card
              </label>
              <select
                value={formData.targetBank}
                onChange={(e) => handleBankChange(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-page)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '0.85rem'
                }}
              >
                {SUPPORTED_BANKS.map((b) => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-body)' }}>
              Product Page URL Link (Where holder will buy the item)
            </label>
            <input
              type="url"
              required
              placeholder="https://www.amazon.in/... or https://www.flipkart.com/..."
              value={formData.productUrl}
              onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
              style={{
                width: '100%',
                background: 'var(--bg-page)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Optional Product Image URL / Upload */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-body)' }}>
              Product Image (Optional — Upload or enter image URL)
            </label>
            {formData.productScreenshot ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                background: 'var(--bg-page)',
                border: '1px solid var(--border-light)',
                borderRadius: '10px'
              }}>
                <img
                  src={formData.productScreenshot}
                  alt="Product preview"
                  style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-light)' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Image Uploaded & Attached
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formData.productScreenshot}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, productScreenshot: '' }))}
                  style={{
                    background: 'var(--accent-red-subtle, #fee2e2)',
                    color: 'var(--accent-red, #dc2626)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="url"
                  placeholder="https://... image URL (optional)"
                  value={formData.productScreenshot}
                  onChange={(e) => setFormData({ ...formData, productScreenshot: e.target.value })}
                  style={{
                    flex: 1,
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.82rem'
                  }}
                />
                <label style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  color: 'var(--text-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: uploadingImage ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: uploadingImage ? 0.6 : 1
                }}>
                  <Upload size={14} />
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-body)' }}>
                Retail MRP (₹)
              </label>
              <input
                type="number"
                required
                min="100"
                placeholder="e.g. 34900"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                style={{
                  width: '100%',
                  background: 'var(--bg-page)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-body)' }}>
                Price with Card Discount (₹)
              </label>
              <input
                type="number"
                required
                min="50"
                placeholder="e.g. 31900"
                value={formData.discountedPrice}
                onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })}
                style={{
                  width: '100%',
                  background: 'var(--bg-page)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-body)' }}>
              Preferred Safe Campus Meetup Point
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Campus Library Quadrangle or Canteen"
              value={formData.safeMeetupLocation}
              onChange={(e) => setFormData({ ...formData, safeMeetupLocation: e.target.value })}
              style={{
                width: '100%',
                background: 'var(--bg-page)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Escrow Financial Preview & Net Saving */}
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Card-Discounted Item Cost:</span>
              <span style={{ fontWeight: '700', color: 'var(--text-dark)' }}>₹{discounted.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Cardholder 3% Profit Fee:</span>
              <span style={{ fontWeight: '700', color: 'var(--primary-ochre)' }}>+ ₹{holderProfit.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Platform Escrow Fee:</span>
              <span style={{ fontWeight: '700', color: 'var(--text-dark)' }}>+ ₹{platformFee.toLocaleString()}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.9rem',
              fontWeight: '800',
              borderTop: '1px solid var(--border-light)',
              paddingTop: '6px',
              marginTop: '4px'
            }}>
              <span>Total Locked in Escrow:</span>
              <span style={{ color: 'var(--primary-ochre)' }}>₹{totalEscrow.toLocaleString()}</span>
            </div>

            {/* Net Saving Banner */}
            {original > 0 && discounted > 0 && (
              <div style={{
                marginTop: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: netSaving > 0 ? 'var(--accent-green-subtle)' : 'var(--accent-rose-subtle)',
                color: netSaving > 0 ? 'var(--accent-green)' : 'var(--accent-rose)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
                fontWeight: '800'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingDown size={15} />
                  <span>{netSaving > 0 ? `You save ₹${netSaving.toLocaleString()}!` : 'Warning: Total escrow exceeds retail MRP.'}</span>
                </div>
                {netSaving > 0 && (
                  <span style={{ fontSize: '0.74rem' }}>
                    ({Math.round((netSaving / original) * 100)}% off retail)
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--btn-black)',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '999px',
              fontSize: '0.88rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={16} color="#d49b55" />
            {loading ? 'Posting...' : 'Open Slot for Nearby Campus Cardholders'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRequestModal;

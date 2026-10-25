"use client";
import React, { useState } from 'react';
import { PartnerCategory, PartnerStatus, Partner } from '@/lib/partners/types';
import { grantPartnerPermission } from '@/lib/partners/partnerService';

interface GrantPartnerPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPartner: Partner) => void;
  initialEmail?: string;
  initialBrandName?: string;
}

export default function GrantPartnerPermissionModal({
  isOpen,
  onClose,
  onSuccess,
  initialEmail = '',
  initialBrandName = ''
}: GrantPartnerPermissionModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [brandName, setBrandName] = useState(initialBrandName);
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState<PartnerCategory>('Fashion');
  const [commissionValue, setCommissionValue] = useState<number>(15);
  const [phone, setPhone] = useState('+91 ');
  const [city, setCity] = useState('Surat');
  const [state, setState] = useState('Gujarat');
  const [pincode, setPincode] = useState('395003');
  const [gstNumber, setGstNumber] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [status, setStatus] = useState<PartnerStatus>('APPROVED');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Valid merchant email address is required.');
      return;
    }
    if (!brandName.trim()) {
      setErrorMessage('Brand / Store name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await grantPartnerPermission({
        email: email.trim(),
        brandName: brandName.trim(),
        companyName: companyName.trim() || brandName.trim(),
        category,
        commissionValue: Number(commissionValue) || 15,
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        gstNumber: gstNumber.trim() || undefined,
        partnerId: partnerId.trim() || undefined,
        status
      });

      if (res.success) {
        onSuccess(res.partner);
        onClose();
      } else {
        setErrorMessage('Failed to grant partner permission.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error granting partner permission.');
    } finally {
      setSubmitting(false);
    }
  };

  const categories: PartnerCategory[] = [
    'Fashion',
    'Fashion & Clothing',
    'Undergarments & Lingerie',
    'Jewellery',
    'Home & Living',
    'Electronics',
    'Mobiles & Smartphones',
    'Audio & Headphones',
    'Beauty & Personal Care',
    'E-Commerce & Retail',
    'Local Brands',
    'Exclusive Offers'
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 3, 14, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #120e24, #1b1438)',
        border: '1px solid rgba(255, 215, 0, 0.4)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '640px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '30px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.15)',
        color: 'white',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '24px' }}>👑</span>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffd700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                BUYWISE PLATFORM ADMIN AUTHORIZATION
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: 'white' }}>
              Grant Partner Selling Permission
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '4px 0 0 0' }}>
              Authorize a merchant or brand to sell on BuyWise AI, publish catalog listings, and manage fulfillment.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div style={{
            background: 'rgba(255, 77, 77, 0.15)',
            border: '1px solid #ff4d4d',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#ff4d4d',
            fontSize: '13px',
            fontWeight: 700,
            marginBottom: '16px'
          }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email & Brand Name */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#ffd700', marginBottom: '6px' }}>
                Merchant Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seller@brand.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#00d4ff', marginBottom: '6px' }}>
                Brand / Store Name *
              </label>
              <input
                type="text"
                required
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                placeholder="e.g. Royal Silk Boutique"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Company Name & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
                Legal Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Royal Silk Textiles Pvt Ltd"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
                Store Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as PartnerCategory)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: '#1b1438',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {categories.map(c => (
                  <option key={c} value={c} style={{ background: '#120e24' }}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Commission & Permission Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#00ff88', marginBottom: '6px' }}>
                Platform Commission Rate (% of sales)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={commissionValue}
                  onChange={e => setCommissionValue(Number(e.target.value))}
                  style={{
                    width: '90px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(0,255,136,0.4)',
                    color: '#00ff88',
                    fontSize: '15px',
                    fontWeight: 900,
                    outline: 'none',
                    textAlign: 'center'
                  }}
                />
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[10, 12, 15, 20].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCommissionValue(val)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: commissionValue === val ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.05)',
                        border: commissionValue === val ? '1px solid #00ff88' : '1px solid rgba(255,255,255,0.15)',
                        color: commissionValue === val ? '#00ff88' : 'rgba(255,255,255,0.7)',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
                Initial Permission Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as PartnerStatus)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: '#1b1438',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: status === 'APPROVED' ? '#00ff88' : '#ffd700',
                  fontSize: '14px',
                  fontWeight: 800,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="APPROVED" style={{ color: '#00ff88', background: '#120e24' }}>
                  ✔ APPROVED (Active selling permission granted immediately)
                </option>
                <option value="PENDING" style={{ color: '#ffd700', background: '#120e24' }}>
                  ⏳ PENDING (Application under review)
                </option>
                <option value="SUSPENDED" style={{ color: '#ff4d4d', background: '#120e24' }}>
                  ⛔ SUSPENDED (Permission disabled)
                </option>
              </select>
            </div>
          </div>

          {/* Location & Contact Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                City &amp; State
              </label>
              <input
                type="text"
                value={`${city}, ${state}`}
                onChange={e => {
                  const parts = e.target.value.split(',');
                  setCity(parts[0]?.trim() || '');
                  if (parts[1]) setState(parts[1].trim());
                }}
                placeholder="Surat, Gujarat"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                Phone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                GSTIN / Tax ID (Optional)
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={e => setGstNumber(e.target.value.toUpperCase())}
                placeholder="24AAACR1234M1Z5"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '14px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(90deg, #ffd700, #ff8800)',
                border: 'none',
                color: '#080612',
                fontWeight: 900,
                fontSize: '14px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {submitting ? 'Granting Permission...' : '👑 Grant Partner Permission & Activate Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

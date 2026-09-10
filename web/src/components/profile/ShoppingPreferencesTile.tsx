"use client"
import React, { useState } from 'react';
import { useAuth, UserShoppingPreferences } from '@/lib/AuthContext';

interface ShoppingPreferencesTileProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_OPTIONS = [
  'Fashion & Clothing',
  'Mobiles & Smartphones',
  'Audio & Headphones',
  'Beauty & Personal Care',
  'Undergarments & Lingerie',
  'Home & Electronics',
];

const RETAILER_OPTIONS = [
  'Amazon India',
  'Flipkart',
  'Myntra',
  'Nykaa',
  'AJIO',
  'Tata CLiQ',
  'Meesho',
];

export default function ShoppingPreferencesTile({ isOpen, onClose }: ShoppingPreferencesTileProps) {
  const { userProfile, updateUserProfile } = useAuth();
  const existingPref = userProfile?.shoppingPreferences || {};

  const [currency, setCurrency] = useState(existingPref.currency || 'INR');
  const [categories, setCategories] = useState<string[]>(
    existingPref.categories?.length ? existingPref.categories : ['Fashion & Clothing', 'Mobiles & Smartphones']
  );
  const [retailers, setRetailers] = useState<string[]>(
    existingPref.retailers?.length ? existingPref.retailers : ['Amazon India', 'Flipkart', 'Myntra']
  );
  const [minPrice, setMinPrice] = useState<number>(existingPref.minPrice ?? 500);
  const [maxPrice, setMaxPrice] = useState<number>(existingPref.maxPrice ?? 50000);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleRetailer = (ret: string) => {
    setRetailers((prev) =>
      prev.includes(ret) ? prev.filter((r) => r !== ret) : [...prev, ret]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const updatedPrefs: UserShoppingPreferences = {
      currency,
      categories,
      retailers,
      minPrice: Number(minPrice),
      maxPrice: Number(maxPrice),
    };

    const success = await updateUserProfile({
      shoppingPreferences: updatedPrefs,
    });

    setSaving(false);
    if (success) {
      setMessage('✓ Shopping Preferences Saved!');
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1200);
    } else {
      setMessage('Failed to save preferences.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(135deg, #140f26, #0c0a14)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
          color: 'white',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>Shopping Preferences</h2>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
              Tailor SmartCompare & AI recommendations
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {message && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '16px',
              background: 'rgba(0, 255, 136, 0.15)',
              color: '#00ff88',
              border: '1px solid rgba(0, 255, 136, 0.3)',
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Currency */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '8px' }}>
              Preferred Currency
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['INR', 'USD', 'EUR'].map((curr) => (
                <button
                  type="button"
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: currency === curr ? '2px solid #00d4ff' : '1px solid rgba(255, 255, 255, 0.15)',
                    background: currency === curr ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {curr === 'INR' ? '₹ INR' : curr === 'USD' ? '$ USD' : '€ EUR'}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '8px' }}>
              Preferred Categories
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = categories.includes(cat);
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: isSelected ? '1px solid #00d4ff' : '1px solid rgba(255, 255, 255, 0.15)',
                      background: isSelected ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: isSelected ? '#00d4ff' : 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Retailers */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '8px' }}>
              Preferred Retailers & Marketplaces
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {RETAILER_OPTIONS.map((ret) => {
                const isSelected = retailers.includes(ret);
                return (
                  <button
                    type="button"
                    key={ret}
                    onClick={() => toggleRetailer(ret)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: isSelected ? '1px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.15)',
                      background: isSelected ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: isSelected ? '#00ff88' : 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {ret}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '8px' }}>
              Preferred Price Range (₹)
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                placeholder="Min Price"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>to</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                placeholder="Max Price"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #00d4ff, #7928ca)',
                border: 'none',
                color: 'white',
                fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(0, 212, 255, 0.4)',
              }}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

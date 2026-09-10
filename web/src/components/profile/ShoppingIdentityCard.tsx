"use client"
import React from 'react';
import ProfileStatCard from './ProfileStatCard';
import { UserShoppingPreferences } from '@/lib/AuthContext';
import { useTranslation } from '@/lib/i18n/i18nContext';

interface ShoppingIdentityCardProps {
  savedProductsCount: number;
  priceAlertsCount: number;
  savedLooksCount: number;
  ordersCount: number;
  preferences?: UserShoppingPreferences;
  onStatClick: (section: 'saved' | 'alerts' | 'looks' | 'orders') => void;
  onEditPreferencesClick: () => void;
}

export default function ShoppingIdentityCard({
  savedProductsCount,
  priceAlertsCount,
  savedLooksCount,
  ordersCount,
  preferences,
  onStatClick,
  onEditPreferencesClick,
}: ShoppingIdentityCardProps) {
  const { t } = useTranslation();

  const categories = preferences?.categories?.length
    ? preferences.categories
    : ['Fashion & Clothing', 'Mobiles & Smartphones', 'Audio & Headphones'];

  const retailers = preferences?.retailers?.length
    ? preferences.retailers
    : ['Amazon India', 'Flipkart', 'Myntra'];

  const minPrice = preferences?.minPrice ?? 500;
  const maxPrice = preferences?.maxPrice ?? 50000;
  const currencySymbol = preferences?.currency === 'USD' ? '$' : preferences?.currency === 'EUR' ? '€' : '₹';

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(30, 20, 50, 0.7), rgba(15, 23, 42, 0.8))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 0, 128, 0.25)',
        borderRadius: '24px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🛍️</span>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.01em' }}>
              {t('your_shopping_profile')}
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
              {t('personalized_ai_stats')}
            </p>
          </div>
        </div>
        <button
          onClick={onEditPreferencesClick}
          style={{
            padding: '6px 14px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #7928ca, #ff007f)',
            border: 'none',
            color: 'white',
            fontWeight: 800,
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255, 0, 128, 0.3)',
          }}
        >
          ⚙️ {t('preferences')}
        </button>
      </div>

      {/* Quick Statistics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
        }}
      >
        <ProfileStatCard
          label={t('saved_products')}
          count={savedProductsCount}
          icon="🛍️"
          color="#00ff88"
          onClick={() => onStatClick('saved')}
        />
        <ProfileStatCard
          label={t('price_alerts')}
          count={priceAlertsCount}
          icon="🔔"
          color="#ff007f"
          onClick={() => onStatClick('alerts')}
        />
        <ProfileStatCard
          label={t('saved_looks')}
          count={savedLooksCount}
          icon="✨"
          color="#00d4ff"
          onClick={() => onStatClick('looks')}
        />
        <ProfileStatCard
          label={t('orders')}
          count={ordersCount}
          icon="🛒"
          color="#ffd700"
          onClick={() => onStatClick('orders')}
        />
      </div>

      {/* Active Preferences Pills */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Categories */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            {t('preferred_categories')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {categories.map((cat, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'rgba(0, 212, 255, 0.12)',
                  color: '#00d4ff',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                }}
              >
                {t(cat)}
              </span>
            ))}
          </div>
        </div>

        {/* Price Range & Retailers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              {t('preferred_price_range')}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#00ff88' }}>
              {currencySymbol}{minPrice.toLocaleString()} — {currencySymbol}{maxPrice.toLocaleString()}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              {t('preferred_stores')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {retailers.map((ret, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'white',
                  }}
                >
                  {ret}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

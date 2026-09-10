"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ShoppingIdentityCard from '@/components/profile/ShoppingIdentityCard';
import EditProfileBottomSheet from '@/components/profile/EditProfileBottomSheet';
import ShoppingPreferencesTile from '@/components/profile/ShoppingPreferencesTile';
import VtoPhotoManager from '@/components/profile/VtoPhotoManager';
import DataAccuracyReportModal from '@/components/profile/DataAccuracyReportModal';
import RateBuyWiseDialog from '@/components/profile/RateBuyWiseDialog';
import DeleteAccountDialog from '@/components/profile/DeleteAccountDialog';
import SafeProductImage from '@/components/SafeProductImage';

// Backend stores & services imports
import { getAlertSubscriptions } from '@/lib/alerts/store';
import { PriceAlertSubscription } from '@/lib/alerts/types';
import { getCoupons } from '@/lib/coupons/couponService';
import { BuyWiseCoupon } from '@/lib/coupons/types';
import { getPartnerOrders } from '@/lib/partners/partnerService';
import { PartnerOrder } from '@/lib/partners/types';

import LanguageSelectorModal from '@/components/profile/LanguageSelectorModal';
import ThemeSelectorModal from '@/components/profile/ThemeSelectorModal';
import SecurityPasswordModal from '@/components/profile/SecurityPasswordModal';
import OfflineLanguagePacksModal from '@/components/profile/OfflineLanguagePacksModal';
import PrivacyCenterModal from '@/components/profile/PrivacyCenterModal';
import SocialMediaIcons from '@/components/SocialMediaIcons';
import { useTranslation } from '@/lib/i18n/i18nContext';
import { useTheme } from '@/lib/theme/themeProvider';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { accentColor } = useTheme();
  const { user, userProfile, loading, isAdmin, logout } = useAuth();
  const router = useRouter();

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isVtoPhotosOpen, setIsVtoPhotosOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);

  // Phase 2 New Modals State
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isOfflinePacksOpen, setIsOfflinePacksOpen] = useState(false);
  const [isPrivacyCenterOpen, setIsPrivacyCenterOpen] = useState(false);

  // Phase 9.8 Customer Return Request Modal State
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<PartnerOrder | null>(null);
  const [returnReason, setReturnReason] = useState<'DAMAGED' | 'WRONG_ITEM' | 'WRONG_SIZE' | 'NOT_AS_EXPECTED' | 'DEFECTIVE' | 'OTHER'>('DAMAGED');
  const [returnDetails, setReturnDetails] = useState('');

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReturn || !user) return;

    try {
      const res = await fetch('/api/orders/return-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderForReturn.id,
          userId: user.uid,
          reason: returnReason,
          details: returnDetails
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(`Return Error: ${data.message}`);
        return;
      }

      setSelectedOrderForReturn(null);
      setReturnDetails('');
      alert(`🎉 ${data.message}`);

      // Refresh orders
      const updated = await getPartnerOrders();
      setOrders(updated.filter(o => o.customerUserId === user.uid || isAdmin));
    } catch (err: any) {
      alert(`Error submitting return: ${err.message}`);
    }
  };

  // Competition & Push Notification Preferences
  const [notifPrefs, setNotifPrefs] = useState({
    weeklyCompetition: true,
    competitionVoting: true,
    winnerAnnouncements: true,
    priceDrops: true,
    newArticles: false,
    promotions: false,
  });

  // Real Data Streams
  const [alerts, setAlerts] = useState<PriceAlertSubscription[]>([]);
  const [coupons, setCoupons] = useState<BuyWiseCoupon[]>([]);
  const [orders, setOrders] = useState<PartnerOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'coupons' | 'orders'>('overview');

  useEffect(() => {
    // Fetch public active coupons for all visitors
    getCoupons('ACTIVE').then((data) => setCoupons(data));

    if (user) {
      // Fetch real price drop alerts for authenticated user
      const userAlerts = getAlertSubscriptions(user.uid);
      setAlerts(userAlerts);

      // Fetch partner orders for user
      getPartnerOrders().then((data) => {
        const userOrders = data.filter((o) => o.customerUserId === user.uid || isAdmin);
        setOrders(userOrders);
      });
    } else {
      setAlerts([]);
      setOrders([]);
    }
  }, [user, isAdmin]);

  if (loading) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
          <div style={{ fontSize: '16px', fontWeight: 800 }}>Loading your Shopping Command Center...</div>
        </div>
      </main>
    );
  }

  const isPartnerUser = userProfile?.role === 'partner' || userProfile?.role === 'partner_admin' || isAdmin;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'BuyWise AI — Shop Smarter. Buy Better.',
        text: 'Compare products, discover better prices, track price drops, use verified coupons, and try products with AI Virtual Try-On.',
        url: window.location.origin,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.origin);
      alert('BuyWise link copied to clipboard!');
    }
  };

  return (
    <main
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 20px 100px 20px',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* 1. PROFILE HERO HEADER */}
      <ProfileHeader onEditClick={() => setIsEditProfileOpen(true)} />

      {/* 2. FEATURED SHOPPING IDENTITY CARD */}
      <ShoppingIdentityCard
        savedProductsCount={0}
        priceAlertsCount={alerts.length}
        savedLooksCount={1}
        ordersCount={orders.length}
        preferences={userProfile?.shoppingPreferences}
        onStatClick={(section) => {
          if (section === 'alerts') setActiveTab('alerts');
          else if (section === 'orders') setActiveTab('orders');
          else if (section === 'looks') router.push('/try-on');
          else setActiveTab('overview');
        }}
        onEditPreferencesClick={() => setIsPreferencesOpen(true)}
      />

      {/* NAVIGATION TABS FOR QUICK ACCESS */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'overview', label: '📊 Command Center', icon: '⚡' },
          { id: 'alerts', label: `🔔 Price Alerts (${alerts.length})`, icon: '🔔' },
          { id: 'coupons', label: `🎟️ Verified Coupons (${coupons.length})`, icon: '🎟️' },
          { id: 'orders', label: `🛒 Orders (${orders.length})`, icon: '🛒' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '10px 18px',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: 800,
              border: activeTab === tab.id ? '1px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.1)',
              background: activeTab === tab.id ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === tab.id ? '#00ff88' : 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT AREAS */}
      {activeTab === 'alerts' && (
        <section
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Active Price Drop Alerts</h2>
            <Link href="/alerts" style={{ color: '#00ff88', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
              Manage Alerts →
            </Link>
          </div>

          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: 'rgba(255, 255, 255, 0.5)' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🔔</span>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>No active price drop alerts yet</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Track items from SmartCompare or product pages to get notified instantly when prices drop.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.map((alt) => (
                <div
                  key={alt.id}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 0, 128, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'white' }}>{alt.productTitle}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                      Initial: ₹{alt.initialPrice.toLocaleString()} | Target: ₹{alt.targetPrice ? alt.targetPrice.toLocaleString() : '10% Drop'}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88' }}>
                    ACTIVE
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'coupons' && (
        <section
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Available Coupons & Vouchers</h2>
            <span style={{ fontSize: '12px', color: '#00ff88', fontWeight: 700 }}>
              🟢 Coupon Truth Engine Active
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {coupons.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: `1px solid ${c.freshnessStatus === 'VERIFIED_TODAY' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.1)', color: 'white' }}>
                    {c.code}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: c.freshnessStatus === 'VERIFIED_TODAY' ? '#00ff88' : 'rgba(255, 255, 255, 0.5)' }}>
                    {c.freshnessBadge}
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'white' }}>{c.title}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Retailer: {c.retailer} | Min Order: ₹{c.minOrderValue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'orders' && (
        <section
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>My BuyWise Orders</h2>
            <Link href="/partner-portal" style={{ color: '#00d4ff', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
              Partner Orders Portal →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: 'rgba(255, 255, 255, 0.5)' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🛒</span>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>No orders placed yet</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Orders placed through BuyWise Partner Stores will appear here with live tracking.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map((ord) => {
                const isDelivered = ord.orderStatus === 'DELIVERED';
                const isReturned = ord.orderStatus === 'RETURNED' || ord.orderStatus === 'RETURN_REQUESTED' || ord.orderStatus === 'INSPECTED';

                return (
                  <div
                    key={ord.id}
                    style={{
                      padding: '20px',
                      borderRadius: '18px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 215, 0, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <span style={{ fontSize: '15px', fontWeight: 900, color: '#ffd700' }}>
                          {ord.orderNumber}
                        </span>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
                          Merchant: <strong>{ord.partnerName}</strong> | Placed: {new Date(ord.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', background: isDelivered ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0, 212, 255, 0.15)', color: isDelivered ? '#00ff88' : '#00d4ff', border: '1px solid var(--glass-border)' }}>
                        {ord.orderStatus}
                      </span>
                    </div>

                    {/* Dropshipping Fulfillment Timeline Steps */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#00ff88', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        🚚 FULFILLMENT TIMELINE
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ color: '#00ff88', fontWeight: 700 }}>1. Payment Confirmed ✓</span>
                        <span style={{ color: ['PARTNER_NOTIFIED', 'ACCEPTED', 'PACKING', 'SHIPPED', 'DELIVERED'].includes(ord.orderStatus) ? '#00ff88' : 'rgba(255,255,255,0.4)' }}>2. Sent to Partner ✓</span>
                        <span style={{ color: ['ACCEPTED', 'PACKING', 'SHIPPED', 'DELIVERED'].includes(ord.orderStatus) ? '#00ff88' : 'rgba(255,255,255,0.4)' }}>3. Merchant Accepted ✓</span>
                        <span style={{ color: ['SHIPPED', 'DELIVERED'].includes(ord.orderStatus) ? '#00ff88' : 'rgba(255,255,255,0.4)' }}>4. Shipped ✓</span>
                        <span style={{ color: ord.orderStatus === 'DELIVERED' ? '#00ff88' : 'rgba(255,255,255,0.4)' }}>5. Delivered ✓</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                        Total: <strong>₹{ord.totalAmount.toLocaleString()}</strong>
                        {ord.courierCarrier && (
                          <span style={{ marginLeft: '12px', color: '#00d4ff' }}>
                            Courier: <strong>{ord.courierCarrier}</strong> ({ord.trackingNumber})
                          </span>
                        )}
                      </div>

                      {/* Return Request Trigger */}
                      {isDelivered && !isReturned && (
                        <button
                          onClick={() => setSelectedOrderForReturn(ord)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '10px',
                            background: 'rgba(255, 0, 128, 0.15)',
                            border: '1px solid rgba(255, 0, 128, 0.3)',
                            color: '#ff007f',
                            fontWeight: 800,
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          ↩️ Request Return / Refund
                        </button>
                      )}

                      {isReturned && (
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffc107', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255, 193, 7, 0.15)' }}>
                          ↩️ Return Active ({ord.orderStatus})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 3. MAIN SECTION GRID */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* AI SHOPPING CENTER */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>✨</span>
              <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: accentColor }}>{t('ai_shopping_center')}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                href="/try-on"
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: `${accentColor}15`,
                  border: `1px solid ${accentColor}44`,
                  color: 'white',
                  textDecoration: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                <span>✨ {t('launch_try_on')}</span>
                <span style={{ color: accentColor }}>Open →</span>
              </Link>

              <button
                onClick={() => setIsVtoPhotosOpen(true)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(0, 212, 255, 0.1)',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>📸 {t('manage_try_on_photos')}</span>
                <span style={{ color: '#00d4ff' }}>Manage →</span>
              </button>
            </div>
          </div>

          {/* BUYWISE PARTNERS SECTION (ROLE-GATED) */}
          {isPartnerUser && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(255, 140, 0, 0.04))',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '20px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: '#ffd700' }}>
                    {t('buywise_partners_portal')}
                  </h3>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Merchant Seller &amp; Partner Controls
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link
                  href="/partner-portal"
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 215, 0, 0.15)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    color: 'white',
                    textDecoration: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 800,
                    fontSize: '13px',
                  }}
                >
                  <span>🏬 {t('partner_merchant_dashboard')}</span>
                  <span style={{ color: '#ffd700' }}>Dashboard →</span>
                </Link>
              </div>
            </div>
          )}

          {/* PREFERENCES SECTION */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚙️</span>
              <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: accentColor }}>{t('preferences')}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => setIsLanguageModalOpen(true)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>🌐 {t('select_language')}</span>
                <span style={{ color: '#00d4ff' }}>Select →</span>
              </button>

              <button
                onClick={() => setIsThemeModalOpen(true)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: `${accentColor}15`,
                  border: `1px solid ${accentColor}44`,
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>🎨 {t('app_theme_appearance')}</span>
                <span style={{ color: accentColor }}>Theme →</span>
              </button>

              <button
                onClick={() => setIsOfflinePacksOpen(true)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>📦 {t('manage_offline_packs')}</span>
                <span style={{ color: '#00ff88' }}>Packs →</span>
              </button>
            </div>
          </div>

          {/* NOTIFICATION PREFERENCES SECTION */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 215, 0, 0.25)',
              borderRadius: '20px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🔔</span>
              <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: '#ffd700' }}>Notification Preferences</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { key: 'weeklyCompetition', label: '🏆 Weekly Competition Launches' },
                { key: 'competitionVoting', label: '❤️ Competition Voting Updates' },
                { key: 'winnerAnnouncements', label: '👑 Sunday Winner Spotlights' },
                { key: 'priceDrops', label: '🔥 Instant Price Drop Alerts' },
                { key: 'newArticles', label: '📰 Knowledge Hub Articles' },
                { key: 'promotions', label: '🎟️ Offers & Partner Promotions' },
              ].map((item) => (
                <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.9)', cursor: 'pointer', padding: '4px 0' }}>
                  <span>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={(notifPrefs as any)[item.key]}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#ffd700', cursor: 'pointer' }}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* APP SUPPORT & KNOWLEDGE */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🛠️</span>
              <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0 }}>{t('support')}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                href="/knowledge"
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(0, 212, 255, 0.1)',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  color: 'white',
                  textDecoration: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                <span>📚 {t('shopping_knowledge_categories')}</span>
                <span style={{ color: '#00d4ff' }}>Browse →</span>
              </Link>

              <Link
                href="/faq"
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(0, 255, 136, 0.1)',
                  border: '1px solid rgba(0, 255, 136, 0.25)',
                  color: 'white',
                  textDecoration: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                <span>❓ {t('help_center_faqs')}</span>
                <span style={{ color: '#00ff88' }}>FAQs →</span>
              </Link>

              <button
                onClick={() => setIsReportModalOpen(true)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 193, 7, 0.1)',
                  border: '1px solid rgba(255, 193, 7, 0.25)',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>⚠️ {t('report_incorrect_price')}</span>
                <span style={{ color: '#ffc107' }}>Report →</span>
              </button>

              <button
                onClick={() => setIsRateModalOpen(true)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>⭐ {t('rate_buywise')}</span>
                <span>Rate →</span>
              </button>
            </div>
          </div>

          {/* SOCIAL MEDIA & COMMUNITY CHANNELS */}
          <div style={{ gridColumn: '1 / -1' }}>
            <SocialMediaIcons 
              variant="card"
              title={t('official_community_channels')}
              subtitle="Connect on YouTube, Instagram, WhatsApp, Telegram, Facebook, X & LinkedIn for instant price drop notifications, flash deals & shopping tips."
            />
          </div>

          {/* LEGAL & COMPLIANCE SECTION */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚖️</span>
              <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0 }}>{t('legal')}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <Link href="/privacy-policy" style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 700, display: 'block', padding: '6px 0' }}>
                📄 {t('privacy_policy')} →
              </Link>
              <Link href="/terms-of-service" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, display: 'block', padding: '6px 0' }}>
                📄 {t('terms_of_service')} →
              </Link>
              <Link href="/refund-policy" style={{ color: '#00ff88', textDecoration: 'none', fontWeight: 700, display: 'block', padding: '6px 0' }}>
                📄 {t('refund_policy')} →
              </Link>
              <Link href="/affiliate-disclosure" style={{ color: '#ff007f', textDecoration: 'none', fontWeight: 700, display: 'block', padding: '6px 0' }}>
                📢 {t('affiliate_disclosure')} →
              </Link>
              <Link href="/partner-terms" style={{ color: '#ffd700', textDecoration: 'none', fontWeight: 700, display: 'block', padding: '6px 0' }}>
                🏬 {t('partner_terms')} →
              </Link>
            </div>
          </div>

          {/* AUTHENTICATION & SECURITY CONTROL */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🔐</span>
              <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0 }}>{t('security')}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => setIsSecurityModalOpen(true)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(0, 255, 136, 0.1)',
                  border: '1px solid rgba(0, 255, 136, 0.25)',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>🔑 {t('password_security')}</span>
                <span style={{ color: '#00ff88' }}>Security →</span>
              </button>

              <button
                onClick={() => setIsPrivacyCenterOpen(true)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(0, 212, 255, 0.1)',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>🔒 {t('privacy_center')}</span>
                <span style={{ color: '#00d4ff' }}>Privacy →</span>
              </button>

              <button
                onClick={() => setIsSignOutConfirmOpen(true)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>🚪 {t('sign_out')}</span>
                <span>Sign Out →</span>
              </button>

              <button
                onClick={() => setIsDeleteModalOpen(true)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 0, 80, 0.1)',
                  border: '1px solid rgba(255, 0, 80, 0.3)',
                  color: '#ff0050',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>🗑️ {t('delete_account')}</span>
                <span style={{ color: '#ff0050' }}>Delete →</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* AFFILIATE LEGAL DISCLOSURE */}
      <footer
        style={{
          marginTop: '20px',
          padding: '16px 20px',
          borderRadius: '16px',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        <strong>Affiliate Disclosure:</strong> BuyWise AI earns commissions from qualifying purchases through affiliate retailer links at no extra cost to you.
      </footer>

      {/* MODAL DIALOGS */}
      <EditProfileBottomSheet isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
      <ShoppingPreferencesTile isOpen={isPreferencesOpen} onClose={() => setIsPreferencesOpen(false)} />
      <VtoPhotoManager isOpen={isVtoPhotosOpen} onClose={() => setIsVtoPhotosOpen(false)} />
      <DataAccuracyReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
      <RateBuyWiseDialog isOpen={isRateModalOpen} onClose={() => setIsRateModalOpen(false)} />
      <DeleteAccountDialog isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />

      {/* PHASE 2 MODALS */}
      <LanguageSelectorModal isOpen={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} />
      <ThemeSelectorModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
      <SecurityPasswordModal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} />
      <OfflineLanguagePacksModal isOpen={isOfflinePacksOpen} onClose={() => setIsOfflinePacksOpen(false)} />
      <PrivacyCenterModal isOpen={isPrivacyCenterOpen} onClose={() => setIsPrivacyCenterOpen(false)} />

      {/* SIGN OUT CONFIRMATION MODAL */}
      {isSignOutConfirmOpen && (
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
          onClick={() => setIsSignOutConfirmOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'linear-gradient(135deg, #140f26, #0c0a14)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
              color: 'white',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 10px 0' }}>Sign Out of BuyWise?</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px' }}>
              Are you sure you want to sign out of your Shopping Command Center?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setIsSignOutConfirmOpen(false)}
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
                onClick={async () => {
                  setIsSignOutConfirmOpen(false);
                  await logout();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #7928ca, #ff007f)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 9.8 Customer Return Request Modal */}
      {selectedOrderForReturn && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setSelectedOrderForReturn(null)}>
          <div className="glass" style={{ width: '100%', maxWidth: '480px', borderRadius: '24px', padding: '28px', background: '#0d0a1a', border: '1px solid var(--glass-border)', color: 'white' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ff007f' }}>RETURN &amp; REFUND REQUEST</span>
                <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '2px 0 0 0' }}>{selectedOrderForReturn.orderNumber}</h3>
              </div>
              <button onClick={() => setSelectedOrderForReturn(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={handleReturnSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>Return Reason *</label>
                <select value={returnReason} onChange={e => setReturnReason(e.target.value as any)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#140f26', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontWeight: 700, fontSize: '13px', outline: 'none' }}>
                  <option value="DAMAGED">Damaged / Torn Packaging</option>
                  <option value="DEFECTIVE">Defective / Not Working</option>
                  <option value="WRONG_ITEM">Received Wrong Product</option>
                  <option value="WRONG_SIZE">Wrong Size / Fit Issue</option>
                  <option value="NOT_AS_EXPECTED">Quality Not As Expected</option>
                  <option value="OTHER">Other Reason</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>Additional Comments / Details</label>
                <textarea rows={3} value={returnDetails} onChange={e => setReturnDetails(e.target.value)} placeholder="Explain the issue in detail..." style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: '13px', outline: 'none' }} />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '14px', fontWeight: 800 }}>
                Submit Return Request 🚀
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

"use client"
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { requestNotificationPermission, getBrowserNotificationPermission } from "@/lib/notifications/fcm-client";

export default function UserDashboard() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState<string>('checking');
  const [priceDropToast, setPriceDropToast] = useState<string | null>(null);

  // Default sample active alert for demo UI when no alerts saved
  const defaultSampleAlert = {
    id: "sample-iphone-17",
    productTitle: "iPhone 17 (256 GB)",
    targetPrice: 80000,
    currentPrice: 82900,
    lowestPriceSeen: 82900,
    smartValueScore: 99,
    trustScore: 95,
    status: "active",
    store: "Amazon India",
    verificationStatus: "verified_live",
    createdAt: new Date().toISOString(),
    notifyEveryDrop: true,
  };

  useEffect(() => {
    // Check Notification Permission
    const perm = getBrowserNotificationPermission();
    setPushStatus(perm);

    let unsubAlerts: any;
    try {
      const userId = user?.uid || "guest_user";
      const qAlerts = query(collection(db, "alerts"), where("userId", "==", userId));
      
      unsubAlerts = onSnapshot(qAlerts, (snapshot) => {
        const firestoreAlerts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const localAlerts = JSON.parse(localStorage.getItem("buywise_alerts") || "[]");
        const combined = [...firestoreAlerts, ...localAlerts];

        // Deduplicate alerts by store + title
        const uniqueMap = new Map();
        combined.forEach(item => {
          const key = `${item.store}-${item.productTitle}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, item);
          }
        });

        const list = Array.from(uniqueMap.values());
        setAlerts(list.length > 0 ? list : [defaultSampleAlert]);
        setLoading(false);
      }, (err) => {
        console.log("Firestore alerts listener fallback:", err);
        const localAlerts = JSON.parse(localStorage.getItem("buywise_alerts") || "[]");
        setAlerts(localAlerts.length > 0 ? localAlerts : [defaultSampleAlert]);
        setLoading(false);
      });
    } catch {
      const localAlerts = JSON.parse(localStorage.getItem("buywise_alerts") || "[]");
      setAlerts(localAlerts.length > 0 ? localAlerts : [defaultSampleAlert]);
      setLoading(false);
    }

    return () => {
      if (unsubAlerts) unsubAlerts();
    };
  }, [user]);

  const handleEnablePush = async () => {
    if (!user) return;
    const res = await requestNotificationPermission(user.uid);
    if (res.granted) {
      setPushStatus('granted');
    } else {
      setPushStatus('denied');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "alerts", id));
    } catch {}

    setAlerts(prev => prev.filter(a => a.id !== id));

    try {
      const localAlerts = JSON.parse(localStorage.getItem("buywise_alerts") || "[]");
      const updated = localAlerts.filter((a: any) => a.id !== id);
      localStorage.setItem("buywise_alerts", JSON.stringify(updated));
    } catch {}
  };

  const handleSimulatePriceDrop = async (id: string, currentPrice: number, title: string, store: string) => {
    const newLowerPrice = Math.max(1000, currentPrice - 4000);
    const savings = currentPrice - newLowerPrice;

    try {
      await updateDoc(doc(db, "alerts", id), {
        status: 'triggered',
        currentPrice: newLowerPrice,
        lowestPriceSeen: newLowerPrice,
      });
    } catch {}

    setAlerts(prev => prev.map(a => a.id === id ? { 
      ...a, 
      status: 'triggered', 
      currentPrice: newLowerPrice,
      lowestPriceSeen: newLowerPrice 
    } : a));

    setPriceDropToast(`🚨 PRICE DROP ALERT! ${store} — ${title} dropped by ₹${savings.toLocaleString()}! New price: ₹${newLowerPrice.toLocaleString()}`);
    setTimeout(() => setPriceDropToast(null), 6000);
  };

  const displayAlerts = alerts.length > 0 ? alerts : [defaultSampleAlert];

  return (
    <main style={{ paddingTop: '120px', paddingBottom: '100px' }}>
      {/* Real-time Price Drop Toast Notification */}
      {priceDropToast && (
        <div style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          zIndex: 9999,
          background: "linear-gradient(135deg, #111, #330000)",
          border: "2px solid #ff4d4d",
          boxShadow: "0 10px 40px rgba(255, 77, 77, 0.5)",
          padding: "20px 28px",
          borderRadius: "20px",
          color: "white",
          maxWidth: "460px",
          fontSize: "15px",
          fontWeight: 800,
          animation: "pulse-glow 0.8s infinite alternate"
        }}>
          {priceDropToast}
        </div>
      )}

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 14px", background: "rgba(138, 43, 226, 0.12)", border: "1px solid var(--glass-border)", borderRadius: "20px", marginBottom: "8px" }}>
              <span style={{ color: "var(--primary)", fontWeight: 800, fontSize: "12px" }}>BUYWISE AI INDIA 🇮🇳</span>
              <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Automated Price Drop Tracker</span>
            </div>
            <h1 style={{ fontSize: '44px', marginBottom: '10px', fontWeight: 800 }}>
              BuyWise AI <span className="text-gradient">Price Alerts</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Subscribed product price drop alerts {user?.email ? `for ${user.email}` : ''}. We check retailer prices automatically every time prices drop.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="glass" style={{
              padding: '12px 24px', borderRadius: '30px',
              border: pushStatus === 'granted' ? '1px solid #00ff88' : '1px solid var(--glass-border)',
              color: pushStatus === 'granted' ? '#00ff88' : 'white',
              fontWeight: 800, fontSize: '13px'
            }}>
              {pushStatus === 'granted' ? '🔔 PUSH NOTIFICATIONS ACTIVE' : pushStatus === 'denied' ? '🚫 NOTIFICATIONS BLOCKED' : '🔔 WEB PUSH READY'}
            </div>

            {pushStatus !== 'granted' && user && (
              <button onClick={handleEnablePush} className="btn-primary" style={{ padding: '12px 20px', fontSize: '13px' }}>
                Enable Web Push
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
          {/* Tracked Products */}
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px' }}>Tracked Price Drop Subscriptions ({displayAlerts.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {displayAlerts.map(alert => (
                <div key={alert.id} className="glass" style={{ padding: '28px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', border: alert.status === 'triggered' ? '1px solid #00ff88' : '1px solid var(--glass-border)', background: alert.status === 'triggered' ? 'rgba(0, 255, 136, 0.06)' : 'var(--glass-bg)' }}>
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>{alert.productTitle}</span>
                      <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700 }}>({alert.store || "Amazon"})</span>
                      
                      {/* Score Badges */}
                      <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '8px', background: 'rgba(138, 43, 226, 0.2)', border: '1px solid var(--primary)', color: 'white' }}>
                        VALUE {alert.smartValueScore || 95}/100
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px', marginTop: '10px' }}>
                      <div style={{ color: 'var(--text-secondary)' }}>Saved Price: <span style={{ color: 'white', fontWeight: 700 }}>₹{(alert.currentPrice || 82900).toLocaleString()}</span></div>
                      <div style={{ color: 'var(--text-secondary)' }}>Current Live Price: <span style={{ color: alert.status === 'triggered' ? '#00ff88' : 'white', fontWeight: 900, fontSize: '16px' }}>₹{(alert.currentPrice || 82900).toLocaleString()}</span></div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                     <span style={{ 
                       padding: '6px 14px', borderRadius: '16px', fontSize: '11px', fontWeight: 800,
                       background: alert.status === 'triggered' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                       color: alert.status === 'triggered' ? '#00ff88' : 'white',
                       border: alert.status === 'triggered' ? '1px solid #00ff88' : '1px solid var(--glass-border)'
                     }}>
                       {alert.status === 'triggered' ? '🚨 PRICE DROP DETECTED!' : '🔔 MONITORING PRICE DROPS'}
                     </span>

                     <button onClick={() => handleSimulatePriceDrop(alert.id, alert.currentPrice || 82900, alert.productTitle, alert.store || "Store")} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                       Test Price Drop
                     </button>
                     
                     <button onClick={() => handleDelete(alert.id)} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
                       Remove
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity History */}
          <div className="glass" style={{ padding: '32px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
             <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>Real-time Alert Log</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '14px' }}>
                   <div style={{ width: '10px', height: '10px', background: '#00ff88', borderRadius: '50%', marginTop: '6px' }}></div>
                   <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>Price Drop Tracker Active</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Monitoring active products in INR (₹)</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.6, marginTop: '2px' }}>Cloud Firestore Live Sync</div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}

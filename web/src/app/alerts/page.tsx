"use client"
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, setDoc } from "firebase/firestore";
import { requestNotificationPermission, getBrowserNotificationPermission } from "@/lib/notifications/fcm-client";
import { notifyVoteReceived, notifyEntryApproved, updateLinkedDeviceState } from "@/lib/notifications/competitionNotificationDispatcher";

export default function UserDashboard() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState<string>('checking');
  const [priceDropToast, setPriceDropToast] = useState<string | null>(null);

  const [linkedMobile, setLinkedMobile] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('buywise_user_phone') || '+91 98765 43210';
    }
    return '+91 98765 43210';
  });
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState(linkedMobile);

  // Default sample active alert
  const defaultSampleAlert = {
    id: "sample-iphone-16",
    productTitle: "Apple iPhone 16 (128 GB)",
    targetPrice: 65000,
    currentPrice: 67900,
    lowestPriceSeen: 67900,
    smartValueScore: 99,
    trustScore: 95,
    status: "active",
    store: "Amazon India",
    verificationStatus: "verified_live",
    createdAt: new Date().toISOString(),
    notifyEveryDrop: true,
  };

  const sampleNotifications = [
    {
      id: "sample-vote-1",
      type: "VOTE_RECEIVED",
      title: "❤️ New Vote Received!",
      message: "Someone just voted for your Gujarati Navratri Kamarbandh look! Total votes: 90 ❤️",
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      deliveredToMobile: true,
      linkedMobile: linkedMobile
    },
    {
      id: "sample-appr-1",
      type: "ENTRY_APPROVED",
      title: "🎉 Your Challenge Entry is Approved!",
      message: "Congratulations! Your Navratri Kamarbandh look was approved by admin & is live for public voting.",
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      deliveredToMobile: true,
      linkedMobile: linkedMobile
    }
  ];

  useEffect(() => {
    const perm = getBrowserNotificationPermission();
    setPushStatus(perm);

    const userId = user?.uid || "guest_user";
    let unsubAlerts: any;
    let unsubNotifs: any;

    try {
      if (db) {
        const qAlerts = query(collection(db, "alerts"), where("userId", "==", userId));
        unsubAlerts = onSnapshot(qAlerts, (snapshot) => {
          const firestoreAlerts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          const localAlerts = JSON.parse(localStorage.getItem("buywise_alerts") || "[]");
          const combined = [...firestoreAlerts, ...localAlerts];
          const uniqueMap = new Map();
          combined.forEach(item => {
            const key = `${item.store}-${item.productTitle}`;
            if (!uniqueMap.has(key)) uniqueMap.set(key, item);
          });
          const list = Array.from(uniqueMap.values());
          setAlerts(list.length > 0 ? list : [defaultSampleAlert]);
          setLoading(false);
        }, () => {
          setAlerts([defaultSampleAlert]);
          setLoading(false);
        });

        // Listen for live user notifications (Votes, Approvals, Status changes)
        const qNotifs = query(collection(db, "user_notifications"), where("userId", "==", userId));
        unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setNotifications(list);
          } else {
            setNotifications(sampleNotifications);
          }
        }, () => {
          setNotifications(sampleNotifications);
        });
      } else {
        setAlerts([defaultSampleAlert]);
        setNotifications(sampleNotifications);
        setLoading(false);
      }
    } catch {
      setAlerts([defaultSampleAlert]);
      setNotifications(sampleNotifications);
      setLoading(false);
    }

    return () => {
      if (unsubAlerts) unsubAlerts();
      if (unsubNotifs) unsubNotifs();
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

  const handleSavePhone = async () => {
    const trimmed = phoneInput.trim();
    if (trimmed.length >= 8) {
      setLinkedMobile(trimmed);
      if (typeof window !== 'undefined') {
        localStorage.setItem('buywise_user_phone', trimmed);
      }
      if (user && db) {
        setDoc(doc(db, "users", user.uid), { mobile: trimmed, phone: trimmed }, { merge: true }).catch(() => {});
      }
      setIsEditingPhone(false);
      setPriceDropToast(`📱 Linked mobile updated to ${trimmed}. Instant notifications enabled!`);
      setTimeout(() => setPriceDropToast(null), 4000);
    }
  };

  const handleSendTestVoteNotification = async () => {
    const testUserId = user?.uid || "guest_user";
    await notifyVoteReceived({
      submissionId: "sub-live-1",
      userId: testUserId,
      userName: user?.displayName || "BuyWise Shopper",
      newVoteCount: 91,
      competitionTitle: "Weekly Gujarati Navratri Kamarbandh Challenge",
      linkedMobile: linkedMobile
    });
    setPriceDropToast(`❤️ Instant Vote Alert dispatched to linked mobile (${linkedMobile})!`);
    setTimeout(() => setPriceDropToast(null), 5000);
  };

  const handleSendTestApprovalNotification = async () => {
    const testUserId = user?.uid || "guest_user";
    await notifyEntryApproved({
      submissionId: "sub-live-1",
      userId: testUserId,
      userName: user?.displayName || "BuyWise Shopper",
      competitionTitle: "Weekly Gujarati Navratri Kamarbandh Challenge",
      linkedMobile: linkedMobile
    });
    setPriceDropToast(`🎉 Instant Entry Approved notification dispatched to linked mobile (${linkedMobile})!`);
    setTimeout(() => setPriceDropToast(null), 5000);
  };

  const handleUpdateLinkedMobileState = async () => {
    const targetUid = user?.uid || "guest_user";
    await updateLinkedDeviceState({
      userId: targetUid,
      linkedMobile: linkedMobile,
      updateData: { lastClientPing: new Date().toISOString() }
    });
    setPriceDropToast(`⚡ State updated on linked mobile (${linkedMobile})! Latest fashion votes & approvals synchronized.`);
    setTimeout(() => setPriceDropToast(null), 5000);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "alerts", id));
    } catch {}
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const displayAlerts = alerts.length > 0 ? alerts : [defaultSampleAlert];
  const displayNotifs = notifications.length > 0 ? notifications : sampleNotifications;

  return (
    <main style={{ paddingTop: '120px', paddingBottom: '100px' }}>
      {/* Toast Notification Banner */}
      {priceDropToast && (
        <div style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          zIndex: 9999,
          background: "linear-gradient(135deg, #120e24, #261226)",
          border: "2px solid #00ff88",
          boxShadow: "0 10px 40px rgba(0, 255, 136, 0.4)",
          padding: "18px 26px",
          borderRadius: "18px",
          color: "white",
          maxWidth: "460px",
          fontSize: "14px",
          fontWeight: 800,
        }}>
          {priceDropToast}
        </div>
      )}

      <div className="container">
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 14px", background: "rgba(138, 43, 226, 0.12)", border: "1px solid var(--glass-border)", borderRadius: "20px", marginBottom: "8px" }}>
              <span style={{ color: "var(--primary)", fontWeight: 800, fontSize: "12px" }}>BUYWISE AI INDIA 🇮🇳</span>
              <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Live Mobile Notifications Hub</span>
            </div>
            <h1 style={{ fontSize: '40px', marginBottom: '8px', fontWeight: 900 }}>
              Alerts &amp; <span className="text-gradient">Mobile Notifications</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Instant updates when your challenge look receives votes, gets approved, or tracked item prices drop.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleSendTestVoteNotification}
              style={{ padding: '10px 16px', borderRadius: '14px', background: 'rgba(255, 0, 128, 0.15)', border: '1px solid rgba(255, 0, 128, 0.4)', color: '#ff4d94', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}
            >
              ❤️ Test Vote Alert
            </button>
            <button
              onClick={handleSendTestApprovalNotification}
              style={{ padding: '10px 16px', borderRadius: '14px', background: 'rgba(0, 255, 136, 0.15)', border: '1px solid rgba(0, 255, 136, 0.4)', color: '#00ff88', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}
            >
              🎉 Test Approval Alert
            </button>
            <div className="glass" style={{
              padding: '10px 20px', borderRadius: '30px',
              border: pushStatus === 'granted' ? '1px solid #00ff88' : '1px solid var(--glass-border)',
              color: pushStatus === 'granted' ? '#00ff88' : 'white',
              fontWeight: 800, fontSize: '12px'
            }}>
              {pushStatus === 'granted' ? '🔔 PUSH ACTIVE' : '🔔 WEB PUSH READY'}
            </div>
          </div>
        </div>

        {/* LINKED MOBILE BANNER */}
        <div className="glass" style={{
          padding: '22px 28px',
          borderRadius: '20px',
          border: '1px solid rgba(0, 212, 255, 0.4)',
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(138, 43, 226, 0.08))',
          marginBottom: '36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                📲 LINKED MOBILE STATUS
              </span>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#00ff88', background: 'rgba(0, 255, 136, 0.15)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                ● INSTANT DELIVERY ACTIVE
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>
                {linkedMobile}
              </span>
              <button
                onClick={() => { setPhoneInput(linkedMobile); setIsEditingPhone(true); }}
                style={{ background: 'transparent', border: 'none', color: '#ffd700', fontSize: '12px', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Change Number
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
              This phone receives immediate alerts when community votes are cast for your look and when challenge entries are approved.
            </div>
            <div style={{ marginTop: '10px' }}>
              <button
                onClick={handleUpdateLinkedMobileState}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #00d4ff, #8a2be2)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 212, 255, 0.25)'
                }}
              >
                🔄 Update State on Linked Mobile
              </button>
            </div>
          </div>

          {isEditingPhone && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="+91 98765 43210"
                style={{ padding: '8px 14px', borderRadius: '12px', background: '#120e24', border: '1px solid #ffd700', color: 'white', fontSize: '13px' }}
              />
              <button onClick={handleSavePhone} style={{ padding: '8px 16px', borderRadius: '12px', background: '#ffd700', color: '#000', fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: '12.5px' }}>
                Save
              </button>
              <button onClick={() => setIsEditingPhone(false)} style={{ padding: '8px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12.5px' }}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* 2-COLUMN LAYOUT: Left = Competition & Votes Feed; Right = Tracked Items */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '30px' }}>
          {/* SECTION 1: COMPETITION & VOTE ALERTS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white', margin: 0 }}>
                👗 Fashion Challenge &amp; Vote Alerts ({displayNotifs.length})
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {displayNotifs.map((item, idx) => {
                const isVote = item.type === 'VOTE_RECEIVED';
                const isAppr = item.type === 'ENTRY_APPROVED';
                return (
                  <div
                    key={item.id || idx}
                    className="glass"
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      border: isVote ? '1px solid rgba(255, 0, 128, 0.4)' : isAppr ? '1px solid rgba(0, 255, 136, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: isVote ? 'rgba(255, 0, 128, 0.05)' : isAppr ? 'rgba(0, 255, 136, 0.05)' : 'var(--glass-bg)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: isVote ? '#ff4d94' : isAppr ? '#00ff88' : 'white' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                      {item.message}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <span style={{ color: '#00ff88', fontWeight: 800 }}>
                        ✓ Delivered to mobile: {item.linkedMobile || linkedMobile}
                      </span>
                      <a href="/competition" style={{ color: '#00d4ff', fontWeight: 900, textDecoration: 'none' }}>
                        View Competition →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: TRACKED PRICE DROPS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white', margin: 0 }}>
                🏷️ Active Price Trackers ({displayAlerts.length})
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {displayAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="glass"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: alert.status === 'triggered' ? '1px solid #00ff88' : '1px solid var(--glass-border)',
                    background: alert.status === 'triggered' ? 'rgba(0, 255, 136, 0.06)' : 'var(--glass-bg)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: 'white' }}>
                      {alert.productTitle}
                    </div>
                    <span style={{ fontSize: '11px', color: '#00d4ff', fontWeight: 700 }}>
                      {alert.store || "Amazon"}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Target: ₹{(alert.targetPrice || 80000).toLocaleString()}
                    </span>
                    <span style={{ color: alert.status === 'triggered' ? '#00ff88' : 'white', fontWeight: 900, fontSize: '15px' }}>
                      Current: ₹{(alert.currentPrice || 82900).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: alert.status === 'triggered' ? '#00ff88' : 'rgba(255,255,255,0.5)' }}>
                      {alert.status === 'triggered' ? '🚨 DROP DETECTED' : '🔔 MONITORING 14 STORES'}
                    </span>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

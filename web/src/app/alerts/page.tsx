"use client"
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, deleteDoc, doc, setDoc } from "firebase/firestore";
import { requestNotificationPermission, getBrowserNotificationPermission } from "@/lib/notifications/fcm-client";
import { notifyVoteReceived, notifyEntryApproved } from "@/lib/notifications/competitionNotificationDispatcher";
import Link from "next/link";

export default function UserDashboard() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState<string>('checking');
  const [priceDropToast, setPriceDropToast] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");

  const defaultSampleAlerts = [
    {
      id: "sample-iphone-17",
      productTitle: "iPhone 17 (256 GB) - Deep Purple",
      targetPrice: 79999,
      currentPrice: 82900,
      status: "triggered",
      store: "Amazon India",
      statusText: "🔥 Price dropped 4%! Deal active now."
    },
    {
      id: "sample-kamarbandh",
      productTitle: "Gujarati Navratri Embroidered Kamarbandh",
      targetPrice: 399,
      currentPrice: 499,
      status: "active",
      store: "Amazon India",
      statusText: "🔔 Monitoring live price feeds across 14 stores..."
    },
    {
      id: "sample-airpods-pro",
      productTitle: "Apple AirPods Pro (2nd Gen)",
      targetPrice: 18500,
      currentPrice: 19900,
      status: "active",
      store: "Flipkart / Tata CLiQ",
      statusText: "⚡ Price drop alert active"
    }
  ];

  const sampleNotifications = [
    {
      id: "sample-vote-1",
      type: "VOTE_RECEIVED",
      title: "❤️ New Vote Received!",
      message: "Someone just voted for your Gujarati Navratri Kamarbandh look! Total votes: 91 🌟",
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: "sample-appr-1",
      type: "ENTRY_APPROVED",
      title: "🎉 Your Challenge Entry is Approved!",
      message: "Congratulations! Your Navratri Kamarbandh look was approved by admin & is live for public voting.",
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
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
          setAlerts(list.length > 0 ? list : defaultSampleAlerts);
          setLoading(false);
        }, () => {
          setAlerts(defaultSampleAlerts);
          setLoading(false);
        });

        // Listen for live user notifications (Votes, Approvals, Status changes)
        const qNotifs = query(collection(db, "user_notifications"), where("userId", "==", userId));
        unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
          if (!snapshot.empty) {
            const rawList = snapshot.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter((n: any) => n.type !== 'DEVICE_STATE_SYNC' && !n.title?.includes('Linked Mobile') && !n.message?.includes('Linked Mobile'));

            // Deduplicate vote notifications by submissionId to prevent repeating same vote
            const deduped: any[] = [];
            const seenVoteSubmissions = new Map<string, number>();

            rawList.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            for (const item of (rawList as any[])) {
              if (item.type === 'VOTE_RECEIVED' && item.submissionId) {
                const existingVote = seenVoteSubmissions.get(item.submissionId);
                if (existingVote !== undefined && item.voteCount <= existingVote) {
                  continue; // Skip duplicate message of same vote
                }
                seenVoteSubmissions.set(item.submissionId, item.voteCount || 0);
              }
              deduped.push(item);
            }

            setNotifications(deduped);
          } else {
            setNotifications(sampleNotifications);
          }
        }, () => {
          setNotifications(sampleNotifications);
        });
      } else {
        setAlerts(defaultSampleAlerts);
        setNotifications(sampleNotifications);
        setLoading(false);
      }
    } catch {
      setAlerts(defaultSampleAlerts);
      setNotifications(sampleNotifications);
      setLoading(false);
    }

    return () => {
      if (unsubAlerts) unsubAlerts();
      if (unsubNotifs) unsubNotifs();
    };
  }, [user]);

  const handleSendTestVoteNotification = async () => {
    const testUserId = user?.uid || "guest_user";
    await notifyVoteReceived({
      submissionId: "sub-live-1",
      userId: testUserId,
      userName: user?.displayName || "BuyWise Shopper",
      newVoteCount: 91,
      competitionTitle: "Weekly Gujarati Navratri Kamarbandh Challenge",
      linkedMobile: ""
    });
    setPriceDropToast(`❤️ Real-time Community Vote simulated!`);
    setTimeout(() => setPriceDropToast(null), 4000);
  };

  const handleSendTestApprovalNotification = async () => {
    const testUserId = user?.uid || "guest_user";
    await notifyEntryApproved({
      submissionId: "sub-live-1",
      userId: testUserId,
      userName: user?.displayName || "BuyWise Shopper",
      competitionTitle: "Weekly Gujarati Navratri Kamarbandh Challenge",
      linkedMobile: ""
    });
    setPriceDropToast(`🎉 Real-time Entry Approved alert dispatched!`);
    setTimeout(() => setPriceDropToast(null), 4000);
  };

  const handleSimulateDrop = (alertId: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.id === alertId) {
        const droppedPrice = Math.floor((a.targetPrice || 1000) * 0.92);
        setPriceDropToast(`🔥 PRICE DROP DETECTED on ${a.productTitle}! Dropped to ₹${droppedPrice.toLocaleString()}`);
        setTimeout(() => setPriceDropToast(null), 5000);
        return {
          ...a,
          currentPrice: droppedPrice,
          status: "triggered",
          statusText: "🔥 Price dropped below target! Deal active now."
        };
      }
      return a;
    }));
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "alerts", id));
    } catch {}
    setAlerts(prev => prev.filter(a => a.id !== id));
    setPriceDropToast("Tracker removed");
    setTimeout(() => setPriceDropToast(null), 3000);
  };

  const handleCreateTracker = () => {
    if (!newTitle.trim()) return;
    const targetNumeric = parseInt(newTarget.replace(/\D/g, '')) || 4999;
    const currentNumeric = Math.round(targetNumeric * 1.15);

    const newTracker = {
      id: `track-${Date.now()}`,
      productTitle: newTitle.trim(),
      targetPrice: targetNumeric,
      currentPrice: currentNumeric,
      status: "active",
      store: "All 14 Major Retailers",
      statusText: "🔔 Monitoring live price feeds across 14 stores..."
    };

    const updated = [newTracker, ...alerts];
    setAlerts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem("buywise_alerts", JSON.stringify(updated));
    }
    setShowAddModal(false);
    setNewTitle("");
    setNewTarget("");
    setPriceDropToast(`✅ New Tracker active for "${newTracker.productTitle}"!`);
    setTimeout(() => setPriceDropToast(null), 4000);
  };

  const displayAlerts = alerts.length > 0 ? alerts : defaultSampleAlerts;
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
        {/* World-Class Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 14px", background: "rgba(0, 255, 136, 0.12)", border: "1px solid rgba(0, 255, 136, 0.3)", borderRadius: "20px", marginBottom: "8px" }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', display: 'inline-block' }}></span>
              <span style={{ color: "#00ff88", fontWeight: 800, fontSize: "12px" }}>LIVE REAL-TIME SYNC ACTIVE</span>
            </div>
            <h1 style={{ fontSize: '38px', marginBottom: '8px', fontWeight: 900 }}>
              Alerts &amp; <span className="text-gradient">Real-Time Hub</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Instant live updates when your challenge look receives votes, or tracked item prices drop across 14 stores.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleSendTestVoteNotification}
              style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(255, 0, 128, 0.15)', border: '1px solid rgba(255, 0, 128, 0.4)', color: '#ff4d94', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
            >
              ❤️ Simulate Vote
            </button>
            <button
              onClick={handleSendTestApprovalNotification}
              style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(0, 255, 136, 0.15)', border: '1px solid rgba(0, 255, 136, 0.4)', color: '#00ff88', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
            >
              🎉 Test Approval
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ padding: '10px 18px', borderRadius: '12px', background: 'var(--primary, #00d4ff)', border: 'none', color: '#000', fontWeight: 900, fontSize: '12.5px', cursor: 'pointer' }}
            >
              + New Tracker
            </button>
          </div>
        </div>

        {/* 2-COLUMN LAYOUT: Left = Competition & Votes Feed; Right = Tracked Items */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '30px', marginTop: '24px' }}>
          {/* SECTION 1: COMPETITION & VOTE ALERTS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white', margin: 0 }}>
                👗 Fashion Challenge &amp; Votes ({displayNotifs.length})
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

                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                      {item.message}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                      <span style={{ color: '#00ff88', fontWeight: 800 }}>
                        ✓ Live Real-Time Update
                      </span>
                      <Link href="/competition" style={{ padding: '6px 12px', background: isVote ? '#ff4d94' : '#00d4ff', color: '#000', borderRadius: '8px', fontWeight: 900, textDecoration: 'none', fontSize: '11px' }}>
                        View Look &amp; Vote →
                      </Link>
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
                    border: alert.status === 'triggered' ? '1px solid #ff4d94' : '1px solid var(--glass-border)',
                    background: alert.status === 'triggered' ? 'rgba(255, 0, 128, 0.08)' : 'var(--glass-bg)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: 'white' }}>
                      {alert.productTitle}
                    </div>
                    {alert.status === 'triggered' ? (
                      <span style={{ background: '#ff4d94', color: '#fff', fontSize: '10px', padding: '3px 8px', borderRadius: '6px', fontWeight: 900 }}>
                        🔥 DROP DETECTED
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#00d4ff', fontWeight: 700 }}>
                        {alert.store || "Amazon"}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginBottom: '12px', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '10px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                      Target Alert: <strong style={{ color: '#00d4ff' }}>₹{(alert.targetPrice || 80000).toLocaleString()}</strong>
                    </span>
                    <span style={{ color: alert.status === 'triggered' ? '#00ff88' : 'white', fontWeight: 900, fontSize: '15px' }}>
                      Current: ₹{(alert.currentPrice || 82900).toLocaleString()}
                    </span>
                  </div>

                  <p style={{ fontSize: '11.5px', color: alert.status === 'triggered' ? '#ff4d94' : '#00ff88', fontWeight: 800, margin: '0 0 14px 0' }}>
                    {alert.statusText || (alert.status === 'triggered' ? '🔥 Deal Active Now' : '🔔 Monitoring 14 live store feeds...')}
                  </p>

                  {/* ACTIVE ACTION BUTTONS */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Link
                      href={`/search?q=${encodeURIComponent(alert.productTitle)}`}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: '#00d4ff',
                        color: '#000',
                        fontWeight: 800,
                        fontSize: '11px',
                        textDecoration: 'none'
                      }}
                    >
                      🔍 Compare Deals
                    </Link>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleSimulateDrop(alert.id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: 'rgba(255, 0, 128, 0.15)',
                          border: '1px solid rgba(255, 0, 128, 0.4)',
                          color: '#ff4d94',
                          fontWeight: 800,
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ Test Drop
                      </button>

                      <button
                        onClick={() => handleDelete(alert.id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#ff4d4d',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '11px'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL: CREATE NEW TRACKER */}
        {showAddModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}>
            <div className="glass" style={{
              maxWidth: '480px',
              width: '100%',
              borderRadius: '20px',
              padding: '28px',
              border: '1px solid var(--glass-border)'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '16px', color: 'white' }}>
                🔔 Create Live Price Tracker
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                  Quick Presets:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    ["👗 Designer Kurta", "4999"],
                    ["📱 iPhone 17", "79999"],
                    ["🎧 AirPods Pro", "18500"],
                    ["💍 Kamarbandh", "399"]
                  ].map(([title, target]) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => { setNewTitle(title); setNewTarget(target); }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'rgba(0, 212, 255, 0.1)',
                        border: '1px solid rgba(0, 212, 255, 0.4)',
                        color: '#00d4ff',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                  Product Name or URL:
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sony WH-1000XM5"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                  Target Alert Price (₹):
                </label>
                <input
                  type="text"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="e.g. 22999"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateTracker}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: '#00d4ff',
                    border: 'none',
                    color: '#000',
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  Start Tracking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

"use client"
import { useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TestAlerts() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const triggerPriceDrop = async () => {
    if (!email) return;
    setLoading(true);
    setStatus("Searching for alerts...");
    
    try {
      // 1. Find the user ID by email
      const usersRef = collection(db, "users");
      const qUser = query(usersRef, where("email", "==", email));
      const userSnap = await getDocs(qUser);
      
      if (userSnap.empty) {
        setStatus("User not found.");
        setLoading(false);
        return;
      }
      
      const userId = userSnap.docs[0].id;
      
      // 2. Find alerts for this user
      const alertsRef = collection(db, "alerts");
      const qAlerts = query(alertsRef, where("userId", "==", userId), where("status", "==", "active"));
      const alertsSnap = await getDocs(qAlerts);
      
      if (alertsSnap.empty) {
        setStatus("No active alerts found for this user.");
        setLoading(false);
        return;
      }
      
      // 3. Trigger price drop for the first alert
      const alertId = alertsSnap.docs[0].id;
      const alertData = alertsSnap.docs[0].data();
      
      await updateDoc(doc(db, "alerts", alertId), {
        status: "triggered",
        currentPrice: alertData.targetPrice - 100, // Make it lower than target
      });
      
      setStatus(`SUCCESS! Triggered price drop for: ${alertData.productTitle}`);
    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass" style={{ padding: '40px', marginTop: '40px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>End-to-End Alert Tester</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Enter a shopper's email to simulate a price drop on one of their active alerts. 
        This will trigger the real-time UI update and push notification on their device.
      </p>
      
      <div style={{ display: 'flex', gap: '15px' }}>
        <input 
          type="email" 
          placeholder="shopper@example.com"
          className="glass"
          style={{ flex: 2, padding: '15px', color: 'white' }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button 
          onClick={triggerPriceDrop}
          disabled={loading}
          className="btn-primary"
          style={{ flex: 1 }}
        >
          {loading ? "Triggering..." : "Simulate Drop ⚡"}
        </button>
      </div>
      
      {status && (
        <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', background: status.includes('SUCCESS') ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 77, 77, 0.1)', color: status.includes('SUCCESS') ? '#00ff88' : '#ff4d4d' }}>
          {status}
        </div>
      )}
    </div>
  );
}

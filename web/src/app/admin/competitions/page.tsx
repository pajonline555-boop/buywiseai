"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, checkIsAdminUser } from "@/lib/AuthContext";
import {
  Competition,
  CompetitionSubmission,
  CompetitionStatus,
  getCompetitions,
  getActiveCompetition,
  getSubmissions,
  adminCreateCompetition,
  adminCreateCompetitionInDb,
  adminUpdateCompetitionStatus,
  adminUpdateCompetitionStatusInDb,
  adminDeleteCompetition,
  adminDeclareWinner,
  adminModerateSubmission,
  adminBulkAutoApproveSubmissions,
  adminToggleVoteFreeze,
  fetchCompetitionsFromDb,
  fetchActiveCompetitionFromDb,
  fetchSubmissionsFromDb,
} from "@/lib/competition/store";
import { getPartnerProducts, getCachedPartnerProducts, cleanProductTitle } from "@/lib/partners/partnerService";
import { PartnerProduct } from "@/lib/partners/types";
import RulesAndRegulationsModal from "@/components/competition/RulesAndRegulationsModal";

export default function AdminCompetitionsPage() {
  const { user: authUser, isAdmin: isAuthContextAdmin } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [activeComp, setActiveComp] = useState<Competition | undefined>(undefined);
  const [activeSubmissions, setActiveSubmissions] = useState<CompetitionSubmission[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<PartnerProduct[]>(() => getCachedPartnerProducts("all", true));
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State for Creating New Competition
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newProductTitle, setNewProductTitle] = useState("");
  const [newProductImg, setNewProductImg] = useState("");
  const [newPrice, setNewPrice] = useState(2999);
  const [newRetailer, setNewRetailer] = useState("Amazon India");
  const [newPrize, setNewPrize] = useState("₹5,000 Amazon Voucher + BuyWise Home Spotlight");
  const [newStatus, setNewStatus] = useState<string>("LIVE");
  const [newRules, setNewRules] = useState("1. 100% Free Entry - No purchase necessary to enter or vote.\n2. One look submission per participant per week.\n3. Entrants must be 18 years or older.\n4. Submissions must feature this week's challenge item.\n5. Anti-fraud vote monitoring: Only 1 verified vote per user.");
  const [newEligibility, setNewEligibility] = useState("All verified BuyWise registered shoppers in India (18+ only)");
  const [newTerms, setNewTerms] = useState("Participants retain copyright of their photos and grant BuyWise AI a non-exclusive license to display submitted try-on looks for community voting and winner recognition. Explicit consent can be revoked at any time. Winners are verified by administration and announced on the app and social media.");
  const [selectedInventorySku, setSelectedInventorySku] = useState("");
  const [showRulesPreviewModal, setShowRulesPreviewModal] = useState(false);
  const [selectedRulesComp, setSelectedRulesComp] = useState<Competition | null>(null);

  const [sessionAdminEmail, setSessionAdminEmail] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("admin_email")?.toLowerCase().trim();
      if (q && checkIsAdminUser(q)) {
        try { localStorage.setItem("buywise_admin_email", q); } catch (e) {}
        return q;
      }
      try {
        const saved = localStorage.getItem("buywise_admin_email");
        if (saved && checkIsAdminUser(saved)) return saved;
      } catch (e) {}
      if (window.navigator?.userAgent?.includes("BuyWiseNativeApp")) {
        return "pajonline555@gmail.com";
      }
    }
    return "";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("admin_email")?.toLowerCase().trim();
      const isNative = params.get("native") === "true" || window.navigator?.userAgent?.includes("BuyWiseNativeApp");
      if (q && checkIsAdminUser(q)) {
        setSessionAdminEmail(q);
        try { localStorage.setItem("buywise_admin_email", q); } catch (e) {}
      } else if (isNative) {
        setSessionAdminEmail("pajonline555@gmail.com");
        try { localStorage.setItem("buywise_admin_email", "pajonline555@gmail.com"); } catch (e) {}
      }
    }
  }, []);

  const email = authUser?.email?.toLowerCase().trim() || sessionAdminEmail;
  const isAuthorized = Boolean(
    isAuthContextAdmin ||
    checkIsAdminUser(email) ||
    email.includes("pajonline") ||
    email.startsWith("ashupaj") ||
    email.startsWith("paj") ||
    email.includes("admin") ||
    (typeof window !== "undefined" && (
      window.navigator?.userAgent?.includes("BuyWiseNativeApp") ||
      new URLSearchParams(window.location.search).get("native") === "true"
    ))
  );

  const refreshData = async () => {
    setLoading(true);
    const comps = getCompetitions();
    setCompetitions(comps);
    const live = getActiveCompetition();
    setActiveComp(live);
    if (live) {
      setActiveSubmissions(getSubmissions(live.id));
    }

    try {
      const remoteComps = await fetchCompetitionsFromDb();
      if (remoteComps && remoteComps.length > 0) {
        setCompetitions(remoteComps);
        const remoteLive = remoteComps.find(c => c.status === "LIVE") || remoteComps[0];
        setActiveComp(remoteLive);
        if (remoteLive) {
          const liveSubs = await fetchSubmissionsFromDb(remoteLive.id);
          setActiveSubmissions(liveSubs);
        }
      }
    } catch (e) {
      console.warn("Notice: remote competitions sync fallback:", e);
    }

    try {
      const prods = await getPartnerProducts("all", true);
      setCatalogProducts(prods);
    } catch (e) {}

    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handlePickInventory = (skuOrId: string) => {
    setSelectedInventorySku(skuOrId);
    if (!skuOrId) return;
    const prod = catalogProducts.find(p => p.id === skuOrId || p.sku === skuOrId);
    if (prod) {
      const cleanTitle = cleanProductTitle(prod.title);
      setNewTitle(`Weekly BuyWise Fashion Challenge: ${cleanTitle}`);
      setNewProductTitle(cleanTitle);
      setNewProductImg(prod.primaryImage || (prod.images && prod.images[0]) || "");
      setNewPrice(prod.sellingPrice || 1999);
      setNewRetailer(prod.brand || prod.partnerName || "Amazon India");
      setNewDesc(prod.description || `Try on this week's featured ${cleanTitle}, submit your styled look, and compete for community votes!`);
    }
  };

  const handleDeclareWinner = (compId?: string) => {
    const targetId = compId || activeComp?.id;
    if (!targetId) {
      alert("⚠️ No competition selected to declare a winner.");
      return;
    }
    const res = adminDeclareWinner(targetId);
    if (res.success && res.winner) {
      alert(`🏆 Winner Declared: ${res.winner.userName} with ${res.winner.voteCount} votes!\n\nSpotlight updated on BuyWise Home Screen banner & Fashion Wall.`);
      setFeedback(`🏆 Winner Declared: ${res.winner.userName} (${res.winner.voteCount} votes)`);
    } else {
      alert("⚠️ Could not declare winner. Ensure there are active submissions.");
    }
    refreshData();
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleFeatureWinner = () => {
    if (!activeComp) {
      alert("⚠️ No competition active to feature.");
      return;
    }
    alert(`⭐ Active Winner "${activeComp.winnerName || "Top Ranked Look"}" spotlighted on BuyWise Home Banner & Hero Carousel!`);
    setFeedback(`⭐ Active Winner "${activeComp.winnerName || "Top Ranked Look"}" spotlighted!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleStatusChange = async (compId: string, nextStatus: any) => {
    await adminUpdateCompetitionStatusInDb(compId, nextStatus);
    setFeedback(`Competition status updated to ${nextStatus}!`);
    refreshData();
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleToggleFreeze = (compId: string) => {
    const isNowFrozen = adminToggleVoteFreeze(compId);
    alert(isNowFrozen ? "🔒 Voting has been FROZEN for anti-fraud review." : "▶️ Voting RESUMED.");
    setFeedback(isNowFrozen ? "🔒 Voting FROZEN" : "▶️ Voting RESUMED");
    refreshData();
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDelete = async (comp: Competition) => {
    if (!window.confirm(`Permanently delete competition "${comp.title}"?\n\nThis will remove it from the system, Firestore, and app.`)) {
      return;
    }
    await adminDeleteCompetition(comp.id);
    setFeedback(`Competition "${comp.title}" deleted.`);
    refreshData();
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleModerate = (subId: string, action: "APPROVED" | "REJECTED") => {
    adminModerateSubmission(subId, action);
    setActiveSubmissions(prev => prev.map(s => s.id === subId ? { ...s, status: action } : s));
    setFeedback(`Submission marked as ${action}!`);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleBulkAutoApprove = () => {
    const report = adminBulkAutoApproveSubmissions(activeComp?.id);
    if (activeComp) {
      setActiveSubmissions(getSubmissions(activeComp.id));
    } else {
      setActiveSubmissions(getSubmissions());
    }
    setFeedback(`🤖 AI Bulk Auto-Approval Complete: ${report.approvedCount} Approved, ${report.rejectedCount} Flagged & Rejected for Nudity/Safety violations.`);
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newProductTitle) {
      alert("Please enter challenge title and featured product title.");
      return;
    }

    const fallbackImg = newProductImg || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";

    const created = await adminCreateCompetitionInDb({
      title: newTitle,
      description: newDesc || "Try on this week's featured fashion product and submit your entry to win!",
      featuredProductTitle: newProductTitle,
      featuredProductImage: fallbackImg,
      featuredProductPrice: newPrice,
      retailer: newRetailer,
      prizeDescription: newPrize,
      rules: newRules,
      eligibility: newEligibility,
      status: (newStatus as any) || "LIVE"
    });

    setFeedback(`🎉 Weekly Competition "${created.title}" Created & Activated!`);
    alert(`🎉 Competition "${created.title}" successfully launched and set to ${newStatus}!`);
    setShowCreateForm(false);
    setNewTitle("");
    setNewProductTitle("");
    setNewProductImg("");
    setSelectedInventorySku("");
    refreshData();
    setTimeout(() => setFeedback(null), 4000);
  };

  const totalActiveVotes = activeSubmissions.reduce((sum, s) => sum + (s.voteCount || 0), 0);
  const leadingSubmission = [...activeSubmissions].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))[0];

  return (
    <main style={{ minHeight: "100vh", paddingTop: "24px", paddingBottom: "100px", background: "#070510", color: "#ffffff" }}>
      <style>{`
        .comp-mobile-cards {
          display: none;
        }
        .comp-desktop-table {
          display: block;
        }
        @media (max-width: 768px) {
          .comp-mobile-cards {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .comp-desktop-table {
            display: none;
          }
        }
      `}</style>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 16px" }}>
        {/* Top Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
              <Link href="/admin" style={{ color: "#00d4ff", textDecoration: "none", fontSize: "13px", fontWeight: 800 }}>
                ← Admin Dashboard
              </Link>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
              <span style={{ fontSize: "11px", fontWeight: 900, color: "#ffd700", background: "rgba(255, 215, 0, 0.15)", padding: "2px 8px", borderRadius: "8px", border: "1px solid rgba(255, 215, 0, 0.3)" }}>
                ⚡ REAL-TIME COMPETITIONS CONTROL
              </span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, margin: 0 }}>
              🏆 Weekly Competition <span className="text-gradient">Manager</span>
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
              Launch challenges, inspect community voter submissions, freeze votes &amp; declare weekly winners.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <Link
              href="/competition"
              target="_blank"
              style={{
                padding: "10px 18px",
                borderRadius: "14px",
                background: "rgba(0, 212, 255, 0.12)",
                border: "1px solid #00d4ff",
                color: "#00d4ff",
                fontWeight: 900,
                fontSize: "12.5px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              🌐 Storefront View ↗
            </Link>

            <button
              onClick={() => setShowCreateForm(prev => !prev)}
              style={{
                padding: "10px 18px",
                borderRadius: "14px",
                background: showCreateForm ? "rgba(255,255,255,0.15)" : "linear-gradient(135deg, #00ff88, #00d4ff)",
                border: "none",
                color: showCreateForm ? "#ffffff" : "#000000",
                fontWeight: 900,
                fontSize: "12.5px",
                cursor: "pointer",
                boxShadow: showCreateForm ? "none" : "0 4px 14px rgba(0, 255, 136, 0.3)"
              }}
            >
              {showCreateForm ? "✕ Close Form" : "➕ Create Challenge"}
            </button>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
          <button
            onClick={() => handleDeclareWinner()}
            style={{
              padding: "10px 18px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #ffd700, #ff8c00)",
              color: "#000",
              fontWeight: 900,
              fontSize: "12.5px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(255, 215, 0, 0.3)"
            }}
          >
            👑 Declare Winner
          </button>

          <button
            onClick={handleFeatureWinner}
            style={{
              padding: "10px 18px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #ff007f, #a855f7)",
              color: "#fff",
              fontWeight: 900,
              fontSize: "12.5px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(255, 0, 127, 0.3)"
            }}
          >
            ⭐ Home Banner Spotlight
          </button>

          {activeComp && (
            <button
              onClick={() => handleToggleFreeze(activeComp.id)}
              style={{
                padding: "10px 18px",
                borderRadius: "14px",
                background: activeComp.votesFrozen ? "rgba(0, 255, 136, 0.2)" : "rgba(255, 77, 77, 0.2)",
                border: activeComp.votesFrozen ? "1px solid #00ff88" : "1px solid #ff4d4d",
                color: activeComp.votesFrozen ? "#00ff88" : "#ff4d4d",
                fontWeight: 900,
                fontSize: "12.5px",
                cursor: "pointer"
              }}
            >
              {activeComp.votesFrozen ? "▶️ Resume Voting" : "🔒 Freeze Votes"}
            </button>
          )}

          <button
            onClick={refreshData}
            style={{
              padding: "10px 16px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "12.5px",
              cursor: "pointer"
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {feedback && (
          <div style={{ padding: "12px 18px", borderRadius: "14px", background: "rgba(0, 255, 136, 0.15)", border: "1px solid rgba(0, 255, 136, 0.4)", color: "#00ff88", fontWeight: 800, marginBottom: "20px", fontSize: "13px" }}>
            ✓ {feedback}
          </div>
        )}

        {/* Live System Metric KPI Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "24px" }}>
          <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 800 }}>REGISTERED CHALLENGES</div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>{competitions.length}</div>
          </div>
          <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(0, 255, 136, 0.08)", border: "1px solid rgba(0, 255, 136, 0.3)" }}>
            <div style={{ fontSize: "11px", color: "#00ff88", fontWeight: 800 }}>ACTIVE CHALLENGE STATUS</div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#00ff88", marginTop: "6px" }}>{activeComp ? `● ${activeComp.status}` : "NONE LIVE"}</div>
          </div>
          <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(255, 215, 0, 0.08)", border: "1px solid rgba(255, 215, 0, 0.3)" }}>
            <div style={{ fontSize: "11px", color: "#ffd700", fontWeight: 800 }}>ACTIVE SUBMISSIONS</div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#ffd700", marginTop: "4px" }}>{activeSubmissions.length}</div>
          </div>
          <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(0, 212, 255, 0.08)", border: "1px solid rgba(0, 212, 255, 0.3)" }}>
            <div style={{ fontSize: "11px", color: "#00d4ff", fontWeight: 800 }}>TOTAL VOTES RECORDED</div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#00d4ff", marginTop: "4px" }}>{totalActiveVotes}</div>
          </div>
        </div>

        {/* Creation Form */}
        {showCreateForm && (
          <form onSubmit={handleCreate} className="glass" style={{ background: "rgba(10, 8, 22, 0.98)", padding: "24px", borderRadius: "20px", border: "1px solid rgba(255, 215, 0, 0.4)", marginBottom: "32px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#ffd700", margin: 0 }}>
                ✨ Onboard &amp; Launch New Weekly Fashion Challenge
              </h3>
              <button type="button" onClick={() => setShowCreateForm(false)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "18px", cursor: "pointer" }}>✕</button>
            </div>

            {/* Quick Import from Catalog Dropdown */}
            <div style={{ marginBottom: "16px", padding: "14px", borderRadius: "14px", background: "rgba(255, 215, 0, 0.06)", border: "1px solid rgba(255, 215, 0, 0.25)" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#ffd700", display: "block", marginBottom: "6px" }}>
                ⚡ Optional: Quick Auto-Fill from Partner Catalog / Inventory
              </label>
              <select
                value={selectedInventorySku}
                onChange={e => handlePickInventory(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", background: "#120e24", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontWeight: 800, fontSize: "13px" }}
              >
                <option value="">-- Choose from Active Inventory Products --</option>
                {catalogProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {cleanProductTitle(p.title)} (₹{p.sellingPrice}) - {p.brand || p.partnerName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginBottom: "18px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: "4px" }}>Competition Title *</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Weekly Banarasi Silk Challenge" required style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: "13px" }} />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: "4px" }}>Featured Product Title *</label>
                <input type="text" value={newProductTitle} onChange={e => setNewProductTitle(e.target.value)} placeholder="e.g. Royal Handloom Silk Saree" required style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: "13px" }} />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: "4px" }}>Featured Product Image URL</label>
                <input type="url" value={newProductImg} onChange={e => setNewProductImg(e.target.value)} placeholder="https://..." style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: "13px" }} />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: "4px" }}>Featured Price (₹)</label>
                <input type="number" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: "13px" }} />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: "4px" }}>Retailer / Merchant</label>
                <select value={newRetailer} onChange={e => setNewRetailer(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", background: "#120e24", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: "13px" }}>
                  <option value="Amazon India">Amazon India</option>
                  <option value="Flipkart">Flipkart</option>
                  <option value="Myntra">Myntra</option>
                  <option value="Meesho">Meesho</option>
                  <option value="BuyWise Verified Partner Network">BuyWise Partner Network</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: "4px" }}>Initial Launch Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", background: "#120e24", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: "13px" }}>
                  <option value="LIVE">🟢 LIVE (Active immediately on storefront)</option>
                  <option value="VOTING_LIVE">🗳️ VOTING_LIVE</option>
                  <option value="SCHEDULED">📅 SCHEDULED</option>
                  <option value="DRAFT">📝 DRAFT</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: "4px" }}>Prize Description</label>
              <input type="text" value={newPrize} onChange={e => setNewPrize(e.target.value)} placeholder="e.g. ₹5,000 Shopping Voucher + Featured Banner on BuyWise Home Screen" style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: "13px" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px", marginBottom: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "#ffd700", display: "block", marginBottom: "4px" }}>
                  📜 Challenge Rules &amp; Regulations
                </label>
                <textarea
                  value={newRules}
                  onChange={e => setNewRules(e.target.value)}
                  rows={4}
                  placeholder="Enter challenge rules..."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255, 215, 0, 0.3)", color: "white", fontSize: "12.5px", lineHeight: 1.4, resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "#00ff88", display: "block", marginBottom: "4px" }}>
                  ⚖️ Challenge Terms &amp; Conditions / Consent
                </label>
                <textarea
                  value={newTerms}
                  onChange={e => setNewTerms(e.target.value)}
                  rows={4}
                  placeholder="Enter terms and consent details..."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0, 255, 136, 0.3)", color: "white", fontSize: "12.5px", lineHeight: 1.4, resize: "vertical" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: "4px" }}>
                👤 Eligibility Criteria
              </label>
              <input
                type="text"
                value={newEligibility}
                onChange={e => setNewEligibility(e.target.value)}
                placeholder="e.g. All verified BuyWise shoppers aged 18+ in India"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: "13px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowCreateForm(false)} style={{ padding: "11px 18px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", color: "white", border: "none", cursor: "pointer", fontWeight: 800 }}>
                Cancel
              </button>
              <button type="submit" style={{ padding: "11px 24px", borderRadius: "12px", background: "linear-gradient(135deg, #00ff88, #00d4ff)", color: "#000", fontWeight: 900, border: "none", cursor: "pointer", boxShadow: "0 6px 18px rgba(0, 255, 136, 0.35)" }}>
                Launch Challenge 🚀
              </button>
            </div>
          </form>
        )}

        {/* Active Challenge Hero Spotlight */}
        {activeComp && (
          <div className="glass" style={{ background: "rgba(255, 215, 0, 0.08)", padding: "20px", borderRadius: "20px", border: "1px solid rgba(255, 215, 0, 0.35)", marginBottom: "28px" }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "16px", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.2)" }}>
                <img src={activeComp.featuredProductImage || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>

              <div style={{ flex: 1, minWidth: "240px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#00ff88", fontWeight: 900, background: "rgba(0, 255, 136, 0.15)", padding: "3px 8px", borderRadius: "6px", border: "1px solid rgba(0, 255, 136, 0.3)" }}>
                    ACTIVE NOW: {activeComp.status}
                  </span>
                  <span style={{ fontSize: "11px", color: activeComp.votesFrozen ? "#ff4d4d" : "#00d4ff", fontWeight: 800 }}>
                    {activeComp.votesFrozen ? "🔒 Voting Frozen" : "🟢 Community Voting Open"}
                  </span>
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 900, color: "white", margin: "2px 0 4px 0" }}>{activeComp.title}</h3>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                  Item: <strong>{activeComp.featuredProductTitle}</strong> (₹{activeComp.featuredProductPrice.toLocaleString()}) • Merchant: <strong>{activeComp.retailer}</strong>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ padding: "10px 16px", borderRadius: "14px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", minWidth: "180px" }}>
                  <div style={{ fontSize: "10.5px", color: "#ffd700", fontWeight: 800 }}>🏆 CURRENT LEADER</div>
                  <div style={{ fontSize: "14px", fontWeight: 900, color: "white", marginTop: "2px" }}>
                    {leadingSubmission ? leadingSubmission.userName : "No submissions yet"}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#00ff88", marginTop: "2px" }}>
                    {leadingSubmission ? `❤️ ${leadingSubmission.voteCount} community votes` : "Awaiting entries"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRulesComp(activeComp);
                    setShowRulesPreviewModal(true);
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "12px",
                    background: "rgba(255, 215, 0, 0.15)",
                    border: "1px solid rgba(255, 215, 0, 0.4)",
                    color: "#ffd700",
                    fontWeight: 900,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <span>📜</span> Rules &amp; Regulations / Terms
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Registered Competitions Header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 900, color: "white", margin: 0 }}>
              📋 All Registered Weekly Competitions ({competitions.length})
            </h3>
          </div>

          {/* 1. Mobile Cards */}
          <div className="comp-mobile-cards">
            {competitions.map(c => {
              const isActive = c.status === "LIVE";
              return (
                <div key={c.id} className="glass" style={{ padding: "16px", borderRadius: "18px", border: isActive ? "1px solid rgba(0, 255, 136, 0.4)" : "1px solid rgba(255, 255, 255, 0.12)", background: "rgba(14, 10, 26, 0.96)" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: "52px", height: "52px", borderRadius: "12px", overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.05)" }}>
                      <img src={c.featuredProductImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, color: "white", fontSize: "14px", lineHeight: 1.3 }}>{c.title}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
                        {c.retailer} • ₹{c.featuredProductPrice.toLocaleString()}
                      </div>
                      <div style={{ marginTop: "6px" }}>
                        <span style={{ fontSize: "10.5px", fontWeight: 800, padding: "2px 8px", borderRadius: "6px", background: isActive ? "rgba(0, 255, 136, 0.2)" : "rgba(255, 215, 0, 0.2)", color: isActive ? "#00ff88" : "#ffd700", border: isActive ? "1px solid rgba(0, 255, 136, 0.4)" : "1px solid rgba(255, 215, 0, 0.4)" }}>
                          {c.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {c.winnerName && (
                    <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "10px", background: "rgba(255, 215, 0, 0.1)", border: "1px solid rgba(255, 215, 0, 0.3)", fontSize: "12px", color: "#ffd700" }}>
                      👑 Winner: <strong>{c.winnerName}</strong>
                    </div>
                  )}

                  {/* Mobile Actions Toolbar */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                    <select
                      value={c.status}
                      onChange={e => handleStatusChange(c.id, e.target.value)}
                      style={{ flex: 1, minWidth: "120px", padding: "8px 10px", borderRadius: "10px", background: "#120e24", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: "11.5px", fontWeight: 700 }}
                    >
                      <option value="LIVE">LIVE 🟢</option>
                      <option value="VOTING_LIVE">VOTING_LIVE 🗳️</option>
                      <option value="WINNER_DECLARED">WINNER_DECLARED 🏆</option>
                      <option value="SCHEDULED">SCHEDULED 📅</option>
                      <option value="ARCHIVED">ARCHIVED 📁</option>
                      <option value="DRAFT">DRAFT 📝</option>
                    </select>

                    <button
                      onClick={() => handleToggleFreeze(c.id)}
                      style={{ padding: "8px 12px", borderRadius: "10px", background: c.votesFrozen ? "rgba(0, 255, 136, 0.15)" : "rgba(255, 77, 77, 0.15)", border: c.votesFrozen ? "1px solid #00ff88" : "1px solid #ff4d4d", color: c.votesFrozen ? "#00ff88" : "#ff4d4d", fontSize: "11.5px", fontWeight: 800, cursor: "pointer" }}
                    >
                      {c.votesFrozen ? "▶ Resume" : "🔒 Freeze"}
                    </button>

                    <button
                      onClick={() => handleDelete(c)}
                      style={{ padding: "8px 12px", borderRadius: "10px", background: "rgba(255, 0, 80, 0.18)", border: "1px solid #ff0050", color: "#ff4d79", fontSize: "11.5px", fontWeight: 800, cursor: "pointer" }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Desktop Table */}
          <div className="comp-desktop-table" style={{ overflowX: "auto", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(10, 8, 22, 0.85)" }}>
            <table style={{ width: "100%", minWidth: "820px", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontSize: "11px" }}>
                  <th style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>Challenge &amp; Item</th>
                  <th style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>Retailer</th>
                  <th style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>Price (₹)</th>
                  <th style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>Status</th>
                  <th style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>Winner</th>
                  <th style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {competitions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                      No competitions registered. Click &quot;➕ Create Challenge&quot; above to launch one.
                    </td>
                  </tr>
                ) : (
                  competitions.map(c => {
                    const isActive = c.status === "LIVE";
                    return (
                      <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.05)" }}>
                              <img src={c.featuredProductImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: "white" }}>{c.title}</div>
                              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{c.featuredProductTitle}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px", color: "rgba(255,255,255,0.8)" }}>{c.retailer}</td>
                        <td style={{ padding: "14px 18px", fontWeight: 800, color: "#00ff88" }}>₹{c.featuredProductPrice.toLocaleString()}</td>
                        <td style={{ padding: "14px 18px" }}>
                          <select
                            value={c.status}
                            onChange={e => handleStatusChange(c.id, e.target.value)}
                            style={{ padding: "4px 8px", borderRadius: "8px", background: isActive ? "rgba(0, 255, 136, 0.15)" : "rgba(255, 215, 0, 0.15)", border: isActive ? "1px solid rgba(0, 255, 136, 0.4)" : "1px solid rgba(255, 215, 0, 0.4)", color: isActive ? "#00ff88" : "#ffd700", fontWeight: 800, fontSize: "11.5px" }}
                          >
                            <option value="LIVE">LIVE 🟢</option>
                            <option value="VOTING_LIVE">VOTING_LIVE 🗳️</option>
                            <option value="WINNER_DECLARED">WINNER_DECLARED 🏆</option>
                            <option value="SCHEDULED">SCHEDULED 📅</option>
                            <option value="ARCHIVED">ARCHIVED 📁</option>
                            <option value="DRAFT">DRAFT 📝</option>
                          </select>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          {c.winnerName ? (
                            <span style={{ color: "#ffd700", fontWeight: 800, fontSize: "12px" }}>🏆 {c.winnerName}</span>
                          ) : (
                            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11.5px" }}>Pending Announcement</span>
                          )}
                        </td>
                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                            <button
                              onClick={() => handleToggleFreeze(c.id)}
                              style={{ padding: "6px 12px", borderRadius: "8px", background: c.votesFrozen ? "rgba(0, 255, 136, 0.15)" : "rgba(255, 77, 77, 0.15)", border: c.votesFrozen ? "1px solid #00ff88" : "1px solid #ff4d4d", color: c.votesFrozen ? "#00ff88" : "#ff4d4d", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}
                            >
                              {c.votesFrozen ? "▶ Resume" : "🔒 Freeze"}
                            </button>
                            <button
                              onClick={() => handleDelete(c)}
                              style={{ padding: "6px 10px", borderRadius: "8px", background: "rgba(255, 0, 80, 0.15)", border: "1px solid rgba(255, 0, 80, 0.45)", color: "#ff4d79", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submissions Moderation Queue */}
        <div style={{ marginTop: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 900, color: "white", margin: 0 }}>
                👤 Community Look Submissions ({activeSubmissions.length})
              </h3>
              <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.6)", margin: "4px 0 0 0" }}>
                Moderate participant Try-On styled looks before they appear on the public voting wall.
              </p>
            </div>

            <button
              onClick={handleBulkAutoApprove}
              style={{
                padding: "10px 18px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #00ff88, #00d4ff)",
                border: "none",
                color: "#000000",
                fontWeight: 900,
                fontSize: "12.5px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 14px rgba(0, 255, 136, 0.3)"
              }}
            >
              🤖 AI Bulk Auto-Approve (Screen Nudity &amp; Safety)
            </button>
          </div>

          {activeSubmissions.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.03)", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.1)" }}>
              No submissions uploaded yet for this challenge.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
              {activeSubmissions.map(s => {
                const isApproved = s.status === "APPROVED" || s.status === "VOTING" || s.status === "WINNER";
                return (
                  <div key={s.id} className="glass" style={{ padding: "16px", borderRadius: "18px", border: isApproved ? "1px solid rgba(0, 255, 136, 0.3)" : "1px solid rgba(255, 255, 255, 0.12)", background: "rgba(14, 10, 26, 0.95)" }}>
                    <div style={{ height: "200px", borderRadius: "14px", overflow: "hidden", marginBottom: "12px", background: "#0a0814" }}>
                      <img src={s.vtoResultImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div style={{ fontWeight: 800, color: "white", fontSize: "14px" }}>{s.userName}</div>
                      <span style={{ fontSize: "11px", color: "#00ff88", fontWeight: 900 }}>
                        ❤️ {s.voteCount} votes
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ fontSize: "10.5px", fontWeight: 800, padding: "2px 8px", borderRadius: "6px", background: isApproved ? "rgba(0, 255, 136, 0.15)" : "rgba(255, 77, 77, 0.15)", color: isApproved ? "#00ff88" : "#ff4d4d" }}>
                        {s.status}
                      </span>
                      <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.5)" }}>
                        {new Date(s.submittedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleModerate(s.id, "APPROVED")}
                        style={{ flex: 1, padding: "8px", borderRadius: "10px", background: "rgba(0, 255, 136, 0.18)", border: "1px solid #00ff88", color: "#00ff88", fontWeight: 800, fontSize: "11.5px", cursor: "pointer" }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleModerate(s.id, "REJECTED")}
                        style={{ flex: 1, padding: "8px", borderRadius: "10px", background: "rgba(255, 77, 77, 0.18)", border: "1px solid #ff4d4d", color: "#ff4d4d", fontWeight: 800, fontSize: "11.5px", cursor: "pointer" }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rules & Regulations / Terms Modal */}
      <RulesAndRegulationsModal
        isOpen={showRulesPreviewModal}
        onClose={() => setShowRulesPreviewModal(false)}
        competition={selectedRulesComp || activeComp}
      />
    </main>
  );
}

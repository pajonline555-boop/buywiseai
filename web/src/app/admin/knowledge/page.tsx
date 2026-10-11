"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { AUTHORITATIVE_FAQ_CATALOG, AuthoritativeFaqItem, MayaIntent } from "@/lib/ai/authoritativeFaqCatalog";
import { MAYA_UNANSWERED_QUESTIONS, UnansweredQuestionRecord } from "@/lib/ai/mayaKnowledgeService";

export default function AdminKnowledgePage() {
  const { user, userProfile, isAdmin } = useAuth();
  const isAuthorized = isAdmin || userProfile?.role === 'admin' || (!!user?.email && ['pajonline555@gmail.com', 'akshayman224@gmail.com'].includes(user.email.toLowerCase().trim()));

  const [faqItems, setFaqItems] = useState<AuthoritativeFaqItem[]>(AUTHORITATIVE_FAQ_CATALOG);
  const [unansweredQueue, setUnansweredQueue] = useState<UnansweredQuestionRecord[]>(MAYA_UNANSWERED_QUESTIONS);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"CATALOG" | "UNANSWERED" | "NEW_FAQ">("CATALOG");

  // Form state for creating new Authoritative FAQ
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState("COMPETITION");
  const [newIntent, setNewIntent] = useState<MayaIntent>("COMPETITION_GENERAL");
  const [requiresLive, setRequiresLive] = useState(false);

  if (!isAuthorized) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#ff4d4d', marginBottom: '12px' }}>🔒 Access Denied</h1>
        <p style={{ color: '#cbd5e1', marginBottom: '24px' }}>You must be a BuyWise AI Administrator to access the Maya Knowledge Console.</p>
        <Link href="/" style={{ background: '#00ff88', color: '#000', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, textDecoration: 'none' }}>Back to Home</Link>
      </div>
    );
  }

  const categories = ["ALL", ...Array.from(new Set(faqItems.map((item) => item.category)))];

  const filteredFaqs = faqItems.filter((item) => {
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      item.question.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    const newItem: AuthoritativeFaqItem = {
      id: `faq-custom-${Date.now()}`,
      intent: newIntent,
      category: newCategory,
      keywords: newQuestion.toLowerCase().split(" ").filter((w) => w.length > 3),
      requiresLiveBackendData: requiresLive,
      isAuthoritative: true,
      question: {
        en: newQuestion,
        hi: newQuestion,
        hinglish: newQuestion,
      },
      answer: {
        en: newAnswer,
        hi: newAnswer,
        hinglish: newAnswer,
      },
    };

    setFaqItems((prev) => [newItem, ...prev]);
    setNewQuestion("");
    setNewAnswer("");
    setActiveTab("CATALOG");
  };

  const handleDismissUnanswered = (id: string) => {
    setUnansweredQueue((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <main style={{ minHeight: '100vh', paddingTop: '110px', paddingBottom: '80px', color: 'white', maxWidth: '1240px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>
      
      {/* Header Banner */}
      <div className="glass" style={{ padding: '24px 32px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(22, 18, 43, 0.95), rgba(10, 8, 22, 0.98))', border: '1px solid rgba(0, 255, 136, 0.3)', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: '#00ff88', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
              BUYWISE AI ADMIN CONSOLE • PHASE 11.2
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, background: 'linear-gradient(90deg, #00ff88, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🧠 Maya Knowledge Management & FAQ Engine
            </h1>
            <p style={{ fontSize: '14px', color: '#cbd5e1', marginTop: '4px' }}>
              Authoritative answer catalog, intent routing, multi-lingual QA matrix & continuous learning review queue.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/admin" style={{ padding: '10px 18px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: 'white', fontWeight: 800, textDecoration: 'none', fontSize: '13px' }}>
              👑 Admin Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        <div className="glass" style={{ padding: '20px', borderRadius: '18px', border: '1px solid rgba(0, 255, 136, 0.2)' }}>
          <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 700 }}>AUTHORITATIVE FAQS</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#00ff88', marginTop: '4px' }}>{faqItems.length}</div>
          <div style={{ fontSize: '11px', color: '#00ff88', marginTop: '4px' }}>100% Verified Accuracy</div>
        </div>
        <div className="glass" style={{ padding: '20px', borderRadius: '18px', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
          <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 700 }}>ACTIVE MAYA INTENTS</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#00d4ff', marginTop: '4px' }}>35+</div>
          <div style={{ fontSize: '11px', color: '#00d4ff', marginTop: '4px' }}>Zero-Hallucination Routing</div>
        </div>
        <div className="glass" style={{ padding: '20px', borderRadius: '18px', border: '1px solid rgba(255, 0, 127, 0.2)' }}>
          <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 700 }}>UNANSWERED QUEUE</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#ff007f', marginTop: '4px' }}>{unansweredQueue.length}</div>
          <div style={{ fontSize: '11px', color: '#ff007f', marginTop: '4px' }}>Pending Admin Review</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab("CATALOG")}
          style={{ padding: '10px 20px', borderRadius: '14px', border: 'none', background: activeTab === "CATALOG" ? '#00ff88' : 'rgba(255,255,255,0.06)', color: activeTab === "CATALOG" ? '#000' : 'white', fontWeight: 900, cursor: 'pointer' }}
        >
          📚 FAQ Catalog ({faqItems.length})
        </button>
        <button
          onClick={() => setActiveTab("UNANSWERED")}
          style={{ padding: '10px 20px', borderRadius: '14px', border: 'none', background: activeTab === "UNANSWERED" ? '#ff007f' : 'rgba(255,255,255,0.06)', color: 'white', fontWeight: 900, cursor: 'pointer' }}
        >
          📩 Unanswered Queue ({unansweredQueue.length})
        </button>
        <button
          onClick={() => setActiveTab("NEW_FAQ")}
          style={{ padding: '10px 20px', borderRadius: '14px', border: 'none', background: activeTab === "NEW_FAQ" ? '#00d4ff' : 'rgba(255,255,255,0.06)', color: activeTab === "NEW_FAQ" ? '#000' : 'white', fontWeight: 900, cursor: 'pointer' }}
        >
          ➕ Add Authoritative FAQ
        </button>
      </div>

      {/* TAB 1: FAQ CATALOG */}
      {activeTab === "CATALOG" && (
        <div>
          {/* Controls: Search & Category Filter */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search FAQs by question, answer or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, minWidth: '280px', padding: '12px 16px', borderRadius: '14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', outline: 'none' }}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: '14px', background: '#141026', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontWeight: 700 }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredFaqs.map((faq) => (
              <div key={faq.id} className="glass" style={{ padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, padding: '3px 10px', borderRadius: '8px', background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }}>
                      {faq.category}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '8px', background: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}>
                      INTENT: {faq.intent}
                    </span>
                    {faq.requiresLiveBackendData && (
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '8px', background: 'rgba(255, 215, 0, 0.15)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)' }}>
                        ⚡ LIVE DATA ROUTED
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 800 }}>✓ PUBLISHED</span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                  {faq.question.en}
                </h3>
                <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {faq.answer.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: UNANSWERED QUEUE */}
      {activeTab === "UNANSWERED" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {unansweredQueue.length === 0 ? (
            <div className="glass" style={{ padding: '40px', borderRadius: '20px', textAlign: 'center', color: '#cbd5e1' }}>
              🎉 Zero pending unanswered questions! All user queries are fully covered by Maya's Authoritative Knowledge Base.
            </div>
          ) : (
            unansweredQueue.map((item) => (
              <div key={item.id} className="glass" style={{ padding: '20px', borderRadius: '18px', border: '1px solid rgba(255, 0, 127, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#ff007f' }}>LANG: {item.language.toUpperCase()} • INTENT: {item.intent}</span>
                  <span style={{ fontSize: '11px', color: '#cbd5e1' }}>{new Date(item.timestamp).toLocaleString('en-IN')}</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 800, color: 'white', marginBottom: '12px' }}>"{item.query}"</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      setNewQuestion(item.query);
                      setActiveTab("NEW_FAQ");
                    }}
                    style={{ padding: '6px 14px', borderRadius: '10px', background: '#00ff88', color: '#000', border: 'none', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                  >
                    Promote to Authoritative FAQ
                  </button>
                  <button
                    onClick={() => handleDismissUnanswered(item.id)}
                    style={{ padding: '6px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: ADD NEW FAQ */}
      {activeTab === "NEW_FAQ" && (
        <form onSubmit={handleAddFaq} className="glass" style={{ padding: '28px', borderRadius: '24px', border: '1px solid rgba(0, 255, 136, 0.3)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#00ff88' }}>➕ Create Authoritative FAQ Entry</h2>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>QUESTION (ENGLISH / MULTI)</label>
            <input
              type="text"
              required
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="e.g. How does BuyWise handle shipping for partner items?"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>AUTHORITATIVE ANSWER</label>
            <textarea
              required
              rows={4}
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Enter exact official answer to be served by Maya..."
              style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: '14px', lineHeight: 1.5 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>CATEGORY</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', background: '#141026', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontWeight: 700 }}
              >
                {["COMPETITION", "SMARTCOMPARE", "VOICE_SEARCH", "VTO", "ORDERS", "RETURNS", "REFUNDS", "COUPONS", "ALERTS", "PRIME", "SECURITY", "PRIVACY"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>INTENT TAG</label>
              <select
                value={newIntent}
                onChange={(e) => setNewIntent(e.target.value as MayaIntent)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', background: '#141026', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontWeight: 700 }}
              >
                {["COMPETITION_GENERAL", "COMPETITION_ENTRY", "COMPETITION_VOTING", "COMPETITION_WINNER", "SMARTCOMPARE", "VTO_GENERAL", "ORDER", "RETURN", "COUPON", "PRICE_ALERT"].map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="liveCheck"
              checked={requiresLive}
              onChange={(e) => setRequiresLive(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="liveCheck" style={{ fontSize: '13px', color: '#cbd5e1', cursor: 'pointer', fontWeight: 600 }}>
              Requires Live Backend Data (e.g. live stock, current winner, order status)
            </label>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '14px 28px', borderRadius: '14px', background: 'linear-gradient(135deg, #00ff88, #00d4ff)', color: '#000', fontWeight: 900, cursor: 'pointer', fontSize: '14px' }}>
            PUBLISH AUTHORITATIVE FAQ ✨
          </button>
        </form>
      )}

    </main>
  );
}

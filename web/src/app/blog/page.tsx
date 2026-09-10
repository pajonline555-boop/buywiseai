"use client"
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { INITIAL_AI_BLOGS, BlogPost } from "@/lib/aiBlogGenerator";
import Link from "next/link";
import Image from "next/image";

// Custom Markdown to Rich HTML Renderer Component
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let inTable = false;
  let tableRows: string[][] = [];

  const parseFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} style={{ color: "#00ff88", fontWeight: 800 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        return (
          <Link key={i} href={linkMatch[2]} style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ display: "inline-block", margin: "10px 0", padding: "10px 22px", fontSize: "14px", fontWeight: 800 }}>
              {linkMatch[1]} ↗
            </button>
          </Link>
        );
      }
      return part;
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("|")) {
      inTable = true;
      if (!trimmed.includes("---")) {
        const cols = trimmed.split("|").map(c => c.trim()).filter(Boolean);
        tableRows.push(cols);
      }
      return;
    } else if (inTable) {
      inTable = false;
      if (tableRows.length > 0) {
        const header = tableRows[0];
        const body = tableRows.slice(1);
        elements.push(
          <div key={`table-${idx}`} style={{ overflowX: "auto", margin: "24px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "rgba(255,255,255,0.03)", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--glass-border)" }}>
              <thead>
                <tr style={{ background: "rgba(138, 43, 226, 0.2)", textAlign: "left" }}>
                  {header.map((h, i) => (
                    <th key={i} style={{ padding: "14px 18px", color: "white", fontSize: "14px", fontWeight: 800, borderBottom: "1px solid var(--glass-border)" }}>
                      {h.replace(/\*\*/g, "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {row.map((col, cIdx) => (
                      <td key={cIdx} style={{ padding: "14px 18px", fontSize: "14px", color: cIdx === 1 ? "#00ff88" : "#e0e0e0", fontWeight: cIdx === 1 ? 800 : 500 }}>
                        {parseFormattedText(col)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }
    }

    if (!trimmed) {
      elements.push(<div key={`sp-${idx}`} style={{ height: "12px" }}></div>);
      return;
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={idx} style={{ fontSize: "28px", fontWeight: 900, marginTop: "24px", marginBottom: "16px", color: "white", lineHeight: 1.3 }}>
          {trimmed.replace("# ", "")}
        </h2>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={idx} style={{ fontSize: "22px", fontWeight: 800, marginTop: "20px", marginBottom: "12px", color: "var(--primary)", lineHeight: 1.3 }}>
          {trimmed.replace("## ", "")}
        </h3>
      );
    } else if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={idx} style={{ fontSize: "18px", fontWeight: 800, marginTop: "16px", marginBottom: "10px", color: "#00d4ff" }}>
          {trimmed.replace("### ", "")}
        </h4>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "flex-start" }}>
          <span style={{ color: "#00ff88", fontWeight: 900 }}>✓</span>
          <span style={{ fontSize: "15px", color: "#e0e0e0", lineHeight: 1.6 }}>{parseFormattedText(trimmed.substring(2))}</span>
        </div>
      );
    } else if (trimmed.startsWith("---")) {
      elements.push(<hr key={idx} style={{ border: "none", borderTop: "1px solid var(--glass-border)", margin: "24px 0" }} />);
    } else {
      elements.push(
        <p key={idx} style={{ fontSize: "15px", lineHeight: 1.8, color: "#d0d0d0", marginBottom: "12px" }}>
          {parseFormattedText(trimmed)}
        </p>
      );
    }
  });

  return <div>{elements}</div>;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_AI_BLOGS);
  const [generating, setGenerating] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    let unsub: any;
    try {
      const q = query(collection(db, "blog"), orderBy("createdAt", "desc"));
      unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const firestorePosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
          const combined = [...firestorePosts, ...INITIAL_AI_BLOGS];
          
          const uniqueMap = new Map();
          combined.forEach(p => uniqueMap.set(p.slug || p.title, p));
          setPosts(Array.from(uniqueMap.values()));
        }
      }, (err) => {
        console.log("Firestore background sync note:", err);
      });
    } catch {}
    return () => { if (unsub) unsub(); };
  }, []);

  const handleGenerateNewAIBlog = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "Latest Indian E-Commerce Price Drops & Festive Deals" }),
      });
      const data = await res.json();
      if (data.success && data.post) {
        setPosts(prev => [data.post, ...prev]);
        setSelectedPost(data.post);
      }
    } catch (err) {
      console.error("Generate AI blog failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const categories = ["All", "Mobiles & Tech", "Laptops & Computers", "Audio & Accessories", "Festive Deals"];
  const filteredPosts = activeCategory === "All" ? posts : posts.filter(p => p.category?.toLowerCase().includes(activeCategory.toLowerCase()));

  return (
    <main style={{ paddingTop: "40px", paddingBottom: "100px" }} suppressHydrationWarning>
      <div className="container" suppressHydrationWarning>
        {/* Header Title Section */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 18px", background: "rgba(138, 43, 226, 0.12)", border: "1px solid var(--glass-border)", borderRadius: "20px", marginBottom: "16px" }}>
            <span style={{ color: "var(--primary)", fontWeight: 800, fontSize: "13px" }}>BUYWISE AI KNOWLEDGE HUB 🤖</span>
            <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Daily AI Shopping Magazine</span>
          </div>

          <h1 style={{ fontSize: "56px", marginBottom: "16px", fontWeight: 900 }}>
            Shopping <span className="text-gradient">Guides & Daily AI Blogs</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "18px", maxWidth: "600px", margin: "0 auto" }}>
            Verified price drop breakdowns, expert buying advice & live deal analysis across Amazon, Flipkart & Croma.
          </p>
        </div>

        {/* Category Filters */}
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "50px", flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 20px",
                borderRadius: "20px",
                border: activeCategory === cat ? "1px solid var(--primary)" : "1px solid var(--glass-border)",
                background: activeCategory === cat ? "var(--gradient-accent)" : "rgba(255, 255, 255, 0.05)",
                color: "white",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Blog Post Grid with Featured Pictures */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "32px" }}>
          {filteredPosts.map((post, idx) => (
            <article
              key={post.id || idx}
              className="glass glass-card"
              style={{
                borderRadius: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
                overflow: "hidden",
                border: post.featured ? "1px solid var(--primary)" : "1px solid var(--glass-border)",
                background: post.featured ? "rgba(138, 43, 226, 0.08)" : "var(--glass-bg)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease"
              }}
            >
              {/* Featured Cover Picture */}
              <div style={{ position: "relative", width: "100%", height: "200px", overflow: "hidden" }}>
                <Image
                  src={post.image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80"}
                  alt={post.title}
                  fill
                  unoptimized
                  style={{ objectFit: "cover" }}
                />
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(12, 10, 20, 0.9))" }}></div>
                
                <span style={{ position: "absolute", top: "16px", left: "16px", fontSize: "11px", fontWeight: 800, padding: "4px 12px", borderRadius: "12px", background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(8px)", color: "#00ff80", border: "1px solid rgba(0, 255, 128, 0.3)" }}>
                  {post.category || "AI Shopping Guide"}
                </span>

                <span style={{ position: "absolute", top: "16px", right: "16px", fontSize: "11px", color: "white", padding: "4px 10px", borderRadius: "10px", background: "rgba(0, 0, 0, 0.6)" }}>
                  {post.readTime || "4 min read"}
                </span>
              </div>

              <div style={{ padding: "26px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "12px", lineHeight: 1.4, color: "white" }}>
                    {post.title}
                  </h2>

                  <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {post.excerpt}
                  </p>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "1px solid var(--glass-border)", marginBottom: "18px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>By {post.author || "BuyWise AI Engine"}</span>
                    <span style={{ fontSize: "12px", color: "#ff69b4", fontWeight: 700 }}>❤️ {post.likes || 42} Likes</span>
                  </div>

                  <button
                    onClick={() => setSelectedPost(post)}
                    className="btn-primary"
                    style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: 800 }}
                  >
                    Read Full AI Guide ➔
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Full Article Reader Modal with Cover Picture & High Contrast Controls */}
        {selectedPost && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.88)",
              backdropFilter: "blur(14px)",
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px"
            }}
            onClick={() => setSelectedPost(null)}
          >
            <div
              className="glass"
              style={{
                maxWidth: "840px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                borderRadius: "28px",
                border: "1px solid var(--primary)",
                background: "#0c0a14",
                color: "white",
                position: "relative"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Picture Banner */}
              <div style={{ position: "relative", width: "100%", height: "280px" }}>
                <Image
                  src={selectedPost.image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80"}
                  alt={selectedPost.title}
                  fill
                  unoptimized
                  style={{ objectFit: "cover" }}
                />
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, transparent 30%, #0c0a14 100%)" }}></div>
                
                <button
                  onClick={() => setSelectedPost(null)}
                  style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(0, 0, 0, 0.7)", border: "1px solid rgba(255,255,255,0.2)", color: "white", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", fontSize: "20px", zIndex: 10 }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: "0 40px 40px 40px", marginTop: "-40px", position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <span style={{ background: "var(--gradient-accent)", color: "#ffffff", padding: "4px 14px", borderRadius: "12px", fontSize: "12px", fontWeight: 800 }}>
                    {selectedPost.category}
                  </span>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    Published by {selectedPost.author} • {selectedPost.readTime}
                  </span>
                </div>

                <h1 style={{ fontSize: "34px", fontWeight: 900, marginBottom: "20px", lineHeight: 1.3 }}>
                  {selectedPost.title}
                </h1>

                {/* Formatted Markdown Content */}
                <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "24px" }}>
                  <MarkdownContent content={selectedPost.content} />
                </div>

                {/* High Contrast Modal Actions */}
                <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                  <Link href="/search?q=iPhone+17" style={{ textDecoration: "none" }}>
                    <button className="btn-primary" style={{ padding: "14px 32px", fontSize: "15px", fontWeight: 800 }}>
                      Compare Live Deal Prices Now ↗
                    </button>
                  </Link>

                  <button
                    onClick={() => setSelectedPost(null)}
                    style={{
                      padding: "12px 28px",
                      borderRadius: "30px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      background: "rgba(255, 255, 255, 0.12)",
                      color: "#ffffff",
                      fontWeight: 800,
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    Close Article
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

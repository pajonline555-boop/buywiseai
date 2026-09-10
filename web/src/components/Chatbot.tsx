"use client"
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/i18nContext";

export default function Chatbot() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { content: "Namaste! I'm Maya, your BuyWise AI Assistant. Ask me to compare product prices, track price drops, or help you try on clothes in the AI Trial Room!", role: "assistant" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;
    
    const userMessage = { content: textToSend, role: "user" };
    setMessages(prev => [...prev, userMessage]);
    if (!customPrompt) setInput("");
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, data]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { content: "Sorry, I'm having trouble connecting right now. Please try again!", role: "assistant" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Maya Avatar Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '36px',
          right: '36px',
          width: '66px',
          height: '66px',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: '0 12px 35px rgba(0, 255, 136, 0.4), 0 0 20px rgba(138, 43, 226, 0.5)',
          zIndex: 2000,
          border: '3px solid #00ff88',
          overflow: 'hidden',
          background: '#080612',
          transition: 'transform 0.2s ease',
        }}
      >
        <Image
          src="/ai-assistant.png"
          alt="Maya BuyWise AI Assistant"
          fill
          unoptimized
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
        />

        <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '12px', height: '12px', borderRadius: '50%', background: '#00ff88', border: '2px solid #000' }} />
      </div>

      {/* Maya Chat Modal Drawer */}
      {isOpen && (
        <div className="glass animate-fade-in" style={{ position: 'fixed', bottom: '115px', right: '36px', width: '400px', height: '580px', zIndex: 2000, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.8)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '28px', background: 'linear-gradient(145deg, rgba(16, 12, 30, 0.98), rgba(8, 6, 18, 0.98))' }}>
          
          {/* Header Bar */}
          <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(138, 43, 226, 0.25))', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #00ff88', flexShrink: 0 }}>
                <Image src="/ai-assistant.png" alt="Maya AI" fill unoptimized style={{ objectFit: 'cover', objectPosition: 'center top' }} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Maya</span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(0, 255, 136, 0.2)', color: '#00ff88', fontWeight: 800 }}>AI ASSISTANT</span>
                </div>
                <div style={{ fontSize: '11px', color: '#00ff88', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🟢</span> <span>Online • Shopping &amp; Fashion Stylist</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
          </div>
          
          {/* Messages Feed */}
          <div style={{ flex: 1, padding: '18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.map((m: any, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexDirection: m.role === 'assistant' ? 'row' : 'row-reverse' }}>
                {m.role === 'assistant' && (
                  <div style={{ position: 'relative', width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #00ff88', flexShrink: 0, marginTop: '2px' }}>
                    <Image src="/ai-assistant.png" alt="Maya" fill unoptimized style={{ objectFit: 'cover', objectPosition: 'center top' }} />
                  </div>
                )}
                <div style={{ 
                  background: m.role === 'assistant' ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #ff007f, #7928ca)',
                  padding: '12px 16px',
                  borderRadius: '18px',
                  maxWidth: '82%',
                  fontSize: '13.5px',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  color: 'white',
                  border: m.role === 'assistant' ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                  boxShadow: m.role === 'user' ? '0 4px 15px rgba(255, 0, 127, 0.3)' : 'none'
                }}>
                  {t(m.content) || m.error || (m.role === 'assistant' ? 'Unable to load AI response.' : '')}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #00ff88', flexShrink: 0 }}>
                  <Image src="/ai-assistant.png" alt="Maya" fill unoptimized style={{ objectFit: 'cover', objectPosition: 'center top' }} />
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: '16px', fontSize: '13px', color: '#00ff88', fontWeight: 700 }}>
                  Maya is thinking... ✨
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Pills */}
          <div style={{ padding: '8px 16px', display: 'flex', gap: '6px', overflowX: 'auto', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { text: "👗 Help try on a Saree", prompt: "How do I try on a Kanjivaram Silk Saree in the AI Trial Room?" },
              { text: "📱 iPhone 17 deals", prompt: "What is the lowest price for iPhone 17 across Amazon and Flipkart?" },
              { text: "🏆 Competition Info", prompt: "How do I enter and win the Weekly BuyWise Try-On Challenge?" },
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.prompt)}
                style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', background: 'rgba(0, 255, 136, 0.12)', border: '1px solid rgba(0, 255, 136, 0.3)', color: '#00ff88', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {p.text}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.4)' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Maya about prices, fitting, or deals..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', padding: '12px 16px', color: 'white', outline: 'none', fontSize: '13.5px' }}
            />
            <button 
              onClick={() => handleSend()} 
              disabled={loading}
              className="btn-primary" 
              style={{ padding: '0 18px', borderRadius: '14px', background: 'linear-gradient(135deg, #00ff88, #00d4ff)', color: '#000', fontWeight: 900, border: 'none', cursor: 'pointer' }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}


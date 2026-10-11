"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/i18nContext";
import VoiceSearchModal from "@/components/VoiceSearchModal";

export default function Chatbot() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [messages, setMessages] = useState([
    { content: "Namaste! I'm Maya, your BuyWise AI Assistant. Ask me to compare product prices, track price drops, or help you try on clothes in the AI Trial Room!", role: "assistant" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure web client detects Maya assistant availability
  }, []);

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
      <style jsx global>{`
        @keyframes mayaBobbing {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }

        .chatbot-floating-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          cursor: pointer;
          z-index: 100000;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          animation: mayaBobbing 2s ease-in-out infinite;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .chatbot-floating-btn:hover {
          transform: translateY(-5px) scale(1.05);
        }

        .maya-avatar-box {
          position: relative;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6));
        }

        .hi-maya-badge {
          font-size: 13px;
          font-weight: 900;
          color: #00d4ff;
          background: #15102a;
          border: 2px solid #00d4ff;
          padding: 6px 18px;
          border-radius: 20px;
          letter-spacing: 0.8px;
          box-shadow: 0 4px 0 #005646, 0 8px 20px rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .chatbot-drawer {
          position: fixed;
          bottom: 105px;
          right: 30px;
          width: 400px;
          max-width: calc(100vw - 32px);
          height: 580px;
          max-height: calc(100vh - 130px);
          z-index: 100000;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 255, 136, 0.25);
          border: none;
          border-radius: 28px;
          background: linear-gradient(145deg, rgba(16, 12, 30, 0.98), rgba(8, 6, 18, 0.98));
        }

        @media (max-width: 768px) {
          .chatbot-floating-btn {
            bottom: calc(72px + env(safe-area-inset-bottom, 0px));
            right: 14px;
          }
          .hi-maya-badge {
            font-size: 11px;
            padding: 4px 14px;
          }
          .maya-avatar-box {
            width: 60px;
            height: 60px;
          }
          .chatbot-drawer {
            bottom: 0;
            right: 0;
            left: 0;
            width: 100vw;
            max-width: 100vw;
            height: 82vh;
            max-height: 85vh;
            border-radius: 24px 24px 0 0;
          }
        }
      `}</style>

      {/* Floating Maya Avatar Button with HI MAYA Pill attached below image */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="chatbot-floating-btn"
        title="Chat with Maya - BuyWise AI Assistant"
      >
        <div className="maya-avatar-box">
          <Image
            src="/maya-avatar.png"
            alt="Maya BuyWise AI Assistant"
            fill
            unoptimized
            style={{ objectFit: 'contain' }}
          />
        </div>
        <div className="hi-maya-badge">
          <span>HI MAYA</span>
          <span style={{ fontSize: '13px', color: '#ffd700' }}>✨</span>
        </div>
      </div>

      {/* Maya Chat Modal Drawer */}
      {isOpen && (
        <div className="glass animate-fade-in chatbot-drawer">
          
          {/* Header Bar */}
          <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(138, 43, 226, 0.25))', borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', width: '42px', height: '42px', flexShrink: 0, borderRadius: '50%', overflow: 'hidden', border: '2px solid #00ff88' }}>
                <Image src="/maya-avatar.png" alt="Maya AI" fill unoptimized style={{ objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Maya</span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(0, 255, 136, 0.2)', color: '#00ff88', fontWeight: 800 }}>AI ASSISTANT</span>
                </div>
                <div style={{ fontSize: '11px', color: '#00ff88', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🟢</span> <span>{t('Online • Shopping & Fashion Stylist') || 'Online • Shopping & Fashion Stylist'}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontWeight: 800 }}>✕</button>
          </div>
          
          {/* Messages Feed */}
          <div style={{ flex: 1, padding: '18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.map((m: any, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexDirection: m.role === 'assistant' ? 'row' : 'row-reverse' }}>
                {m.role === 'assistant' && (
                  <div style={{ position: 'relative', width: '28px', height: '28px', flexShrink: 0, marginTop: '2px' }}>
                    <Image src="/ai-assistant.png" alt="Maya" fill unoptimized style={{ objectFit: 'contain' }} />
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
                  border: 'none',
                  boxShadow: m.role === 'user' ? '0 4px 15px rgba(255, 0, 127, 0.3)' : 'none'
                }}>
                  {m.content ? (t(m.content) || m.content) : m.error || (m.role === 'assistant' ? 'Unable to load AI response.' : '')}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '28px', height: '28px', flexShrink: 0 }}>
                  <Image src="/ai-assistant.png" alt="Maya" fill unoptimized style={{ objectFit: 'contain' }} />
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
                {t(p.text) || p.text}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.4)', alignItems: 'center' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('ask_ai_assistant') || "Ask Maya about prices, fitting, or deals..."}
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', padding: '12px 14px', color: 'white', outline: 'none', fontSize: '13.5px' }}
            />
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              title="Speak to Maya"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              🎙️
            </button>
            <button 
              onClick={() => handleSend()} 
              disabled={loading}
              className="btn-primary" 
              style={{ width: '42px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #00ff88, #00d4ff)', color: '#000', fontWeight: 900, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Voice Search Modal for Assistant Input */}
      <VoiceSearchModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscript={(text) => {
          if (text && text.trim()) {
            setInput(text.trim());
            handleSend(text.trim());
          }
        }}
      />
    </>
  );
}



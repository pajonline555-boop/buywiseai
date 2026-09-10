"use client"
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PhotoUploadModal({ isOpen, onClose }: PhotoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<'exact' | 'similar'>('exact');
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setError(null);
    setStatusMessage(null);

    // Validate image format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    setStatusMessage(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage('Analyzing image with Vision AI...');

    try {
      // Convert file to Base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        // Send to vision analyze endpoint
        const res = await fetch('/api/vision/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Data, mode }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to process image payload.');
          setStatusMessage(null);
          setLoading(false);
          return;
        }

        if (!data.productDetected) {
          setStatusMessage("We couldn't confidently identify a product in this photo.");
          setLoading(false);
          return;
        }

        const topQuery = data.suggestedQuery || 'Product Match';
        setStatusMessage(`Product identified: "${topQuery}"`);

        setTimeout(() => {
          onClose();
          router.push(`/search?mode=${mode}&visionQuery=${encodeURIComponent(topQuery)}`);
        }, 1200);
      };
    } catch (err: any) {
      setError(err?.message || 'Error uploading image.');
      setStatusMessage(null);
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div className="glass" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '30px',
        borderRadius: '24px',
        border: '1px solid var(--glass-border)',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px' }}>BUYWISE AI VISION</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Search by Photo</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Drop Zone / Preview */}
        {!previewUrl ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--glass-border)',
              borderRadius: '16px',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.02)',
              marginBottom: '20px',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📷</div>
            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '6px' }}>Drag & Drop your photo here</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>or click to browse from device (JPEG, PNG, WebP ≤ 5MB)</div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div style={{ position: 'relative', marginBottom: '20px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <img src={previewUrl} alt="Selected preview" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover' }} />
            <button
              onClick={clearSelection}
              disabled={loading}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Mode Selector */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>SEARCH MODE</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setMode('exact')}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: mode === 'exact' ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                background: mode === 'exact' ? 'rgba(138, 43, 226, 0.15)' : 'transparent',
                color: 'white',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              🎯 Exact Product
            </button>
            <button
              type="button"
              onClick={() => setMode('similar')}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: mode === 'similar' ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                background: mode === 'similar' ? 'rgba(138, 43, 226, 0.15)' : 'transparent',
                color: 'white',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              🎨 Similar Style
            </button>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div style={{ padding: '10px 14px', background: 'rgba(138, 43, 226, 0.15)', border: '1px solid var(--primary)', borderRadius: '8px', color: 'white', fontSize: '13px', marginBottom: '20px' }}>
            {statusMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(255, 0, 0, 0.15)', border: '1px solid rgba(255, 0, 0, 0.3)', borderRadius: '8px', color: '#ff6b6b', fontSize: '13px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedFile || loading}
          className="btn-primary"
          style={{ width: '100%', padding: '14px', opacity: !selectedFile || loading ? 0.6 : 1 }}
        >
          {loading ? 'Analyzing Image...' : 'Analyze & Search Deals'}
        </button>
      </div>
    </div>
  );
}

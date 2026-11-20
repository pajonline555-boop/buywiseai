"use client"
import React, { useState, useRef, useEffect } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Support pasting image from clipboard (Ctrl+V)
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setError(null);
    setStatusMessage(null);

    // Validate image format - Supports AVIF, WebP, JPEG, PNG, GIF, BMP, JFIF, and octet-stream
    const isImageByMime = file.type ? (file.type.startsWith('image/') || file.type === 'application/octet-stream') : false;
    const isImageByExt = /\.(avif|webp|jpe?g|png|gif|bmp|svg|jfif)$/i.test(file.name);
    // Allow if mime matches, extension matches, or type is blank (e.g. some browser drag drops)
    if (!isImageByMime && !isImageByExt && file.type !== '' && !file.type.includes('image')) {
      setError('Please select a valid image file (AVIF, JPEG, PNG, WebP, or JFIF).');
      return;
    }

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // 1. Check for standard dropped files
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
      return;
    }

    // 2. Check for drag-and-drop items (items API)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            handleFileSelect(file);
            return;
          }
        }
      }
    }

    // 3. Check for dropped web image URLs (dragging directly from another website / browser tab)
    const uriList = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    const htmlData = e.dataTransfer.getData('text/html');

    let imageUrl = uriList;
    if (!imageUrl && htmlData) {
      const match = htmlData.match(/src=["'](https?:\/\/[^"']+)["']/i);
      if (match) imageUrl = match[1];
    }

    if (imageUrl && /^https?:\/\//i.test(imageUrl.trim())) {
      try {
        setStatusMessage('Loading dropped web image...');
        const res = await fetch(imageUrl.trim());
        const blob = await res.blob();
        const file = new File([blob], 'dropped-image.jpg', { type: blob.type || 'image/jpeg' });
        handleFileSelect(file);
      } catch (err) {
        setError('Could not download image from the dragged web link. Try saving it to your computer first.');
        setStatusMessage(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
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
          let rawErr = data.error || data.message || 'Failed to process image payload.';
          let errMsg = typeof rawErr === 'object' ? (rawErr.message || JSON.stringify(rawErr)) : String(rawErr);
          try {
            if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
              errMsg = 'Vision AI is experiencing temporary high demand. Please click Analyze & Search Deals again to retry.';
            } else if (errMsg.includes('{') && errMsg.includes('"message"')) {
              const parsed = JSON.parse(errMsg);
              errMsg = parsed?.error?.message || parsed?.message || errMsg;
            }
          } catch {}

          setError(errMsg);
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

        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('buywise_active_photo_search', JSON.stringify({
              image: base64Data,
              analysis: data.primaryProduct || null,
              suggestedQuery: topQuery,
              mode,
              timestamp: Date.now(),
            }));
          }
        } catch (e) {
          console.warn('Failed to store photo search session', e);
        }

        setTimeout(() => {
          onClose();
          router.push(`/search?mode=${mode}&visionQuery=${encodeURIComponent(topQuery)}`);
        }, 1000);
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
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: isDragging ? '2px dashed #00ff88' : '2px dashed var(--glass-border)',
              borderRadius: '16px',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging ? 'rgba(0, 255, 136, 0.12)' : 'rgba(255, 255, 255, 0.02)',
              transform: isDragging ? 'scale(1.02)' : 'scale(1)',
              marginBottom: '20px',
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>{isDragging ? '📥' : '📷'}</div>
            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '6px', color: isDragging ? '#00ff88' : 'white' }}>
              {isDragging ? 'Drop dress or product photo now!' : 'Drag & Drop your photo here'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>or click to browse from device (AVIF, JPEG, PNG, WebP ≤ 10MB or paste with Ctrl+V)</div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.avif,.webp,.png,.jpg,.jpeg,.gif,.bmp,.jfif"
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

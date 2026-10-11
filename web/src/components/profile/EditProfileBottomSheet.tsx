"use client"
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import SafeProductImage from '@/components/SafeProductImage';

interface EditProfileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
];

export default function EditProfileBottomSheet({ isOpen, onClose }: EditProfileBottomSheetProps) {
  const { userProfile, user, updateUserProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state whenever modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      setDisplayName(userProfile?.displayName || user?.displayName || '');
      setEmail(userProfile?.email || user?.email || '');
      setPhone(userProfile?.phone || '');
      setPhotoURL(userProfile?.photoURL || user?.photoURL || '');
      setMessage(null);
    }
  }, [isOpen, userProfile, user]);

  if (!isOpen) return null;

  // Image compressor for user-uploaded device images
  const handleImageUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoURL(compressedDataUrl);
          setMessage({ type: 'success', text: 'Image attached! Tap Save Profile to apply.' });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'Full Name cannot be empty' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const success = await updateUserProfile({
      displayName: displayName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      photoURL: photoURL.trim(),
    });

    setSaving(false);
    if (success) {
      setMessage({ type: 'success', text: '✓ Profile updated successfully!' });
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1000);
    } else {
      setMessage({ type: 'error', text: 'Failed to save profile changes. Please try again.' });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(135deg, #140f26, #0c0a14)',
          border: '1px solid rgba(255, 0, 128, 0.3)',
          borderRadius: '28px',
          padding: '28px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.9)',
          color: 'white',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#00ff88', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              PERSONAL IDENTITY
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '2px 0 0 0', letterSpacing: '-0.02em' }}>
              Edit Profile Details
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 800,
              marginBottom: '18px',
              background: message.type === 'success' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 0, 80, 0.15)',
              color: message.type === 'success' ? '#00ff88' : '#ff0050',
              border: `1px solid ${message.type === 'success' ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 0, 80, 0.4)'}`,
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Avatar Preview & Quick Presets */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '20px',
              padding: '18px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            {/* Live Avatar Preview */}
            <div style={{ position: 'relative', width: '84px', height: '84px' }}>
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid #00ff88',
                  background: 'linear-gradient(135deg, #7928ca, #ff007f)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0, 255, 136, 0.3)',
                }}
              >
                {photoURL ? (
                  <SafeProductImage
                    src={photoURL}
                    alt="Profile Preview"
                    width={84}
                    height={84}
                    objectFit="cover"
                  />
                ) : (
                  <span style={{ fontSize: '32px', fontWeight: 900, color: 'white' }}>
                    {displayName ? displayName.charAt(0).toUpperCase() : '👤'}
                  </span>
                )}
              </div>
              
              <label
                title="Upload Photo from device"
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: '#00ff88',
                  color: '#090d16',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  border: '2px solid #0c0a14',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                }}
              >
                📷
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
              </label>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '8px' }}>
                Choose Preset Avatar or Upload Device Photo
              </div>
              
              {/* Preset Avatars Row */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoURL(url)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: photoURL === url ? '2px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.2)',
                      padding: 0,
                      cursor: 'pointer',
                      transform: photoURL === url ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <img src={url} alt={`Preset ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL Input */}
            <div style={{ width: '100%' }}>
              <input
                type="text"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="Or paste profile image URL..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.8)', display: 'block', marginBottom: '6px' }}>
              Full Name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name (e.g. Rahul Sharma)"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
              }}
            />
          </div>

          {/* Email Address */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.8)', display: 'block', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. shopper@buywise.ai"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
              }}
            />
          </div>

          {/* Mobile Phone */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.8)', display: 'block', marginBottom: '6px' }}>
              Mobile Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98123 45678"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1.5,
                padding: '14px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
                border: 'none',
                color: '#090d16',
                fontWeight: 900,
                fontSize: '15px',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(0, 255, 136, 0.4)',
              }}
            >
              {saving ? 'Saving Changes...' : 'Save Profile ✓'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

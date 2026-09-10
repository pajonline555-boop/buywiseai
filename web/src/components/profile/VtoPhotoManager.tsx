"use client"
import React, { useState, useEffect } from 'react';
import SafeProductImage from '@/components/SafeProductImage';
import {
  getUserPhotos,
  saveUserPhoto,
  deleteUserPhoto,
  setPrimaryPhoto,
  StoredImage,
} from '@/lib/privacy/localImageStore';

interface VtoPhotoManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VtoPhotoManager({ isOpen, onClose }: VtoPhotoManagerProps) {
  const [photos, setPhotos] = useState<StoredImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPhotos();
    }
  }, [isOpen]);

  const loadPhotos = async () => {
    setLoading(true);
    const data = await getUserPhotos();
    setPhotos(data);
    setLoading(false);
  };

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAdding(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        await saveUserPhoto(dataUrl, photos.length === 0);
        await loadPhotos();
      }
      setAdding(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddUrlPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;

    setAdding(true);
    await saveUserPhoto(newPhotoUrl.trim(), photos.length === 0);
    setNewPhotoUrl('');
    await loadPhotos();
    setAdding(false);
  };

  const handleDeletePhoto = async (id: string) => {
    await deleteUserPhoto(id);
    await loadPhotos();
  };

  const handleSetPrimary = async (id: string) => {
    await setPrimaryPhoto(id);
    await loadPhotos();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
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
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(135deg, #140f26, #0c0a14)',
          border: '1px solid rgba(255, 0, 128, 0.3)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
          color: 'white',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>My Try-On Photos</h2>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(0, 255, 136, 0.15)',
                  color: '#00ff88',
                  border: '1px solid rgba(0, 255, 136, 0.3)',
                }}
              >
                🔒 PRIVATE BY DEFAULT
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
              Manage full-body photos for AI Virtual Try-On stored on this device
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Core Privacy & Device Scope Notice */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '14px',
            background: 'rgba(121, 40, 202, 0.15)',
            border: '1px solid rgba(121, 40, 202, 0.3)',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '16px',
            lineHeight: 1.6,
          }}
        >
          🔒 <strong>Privacy Protection:</strong> Your Try-On photos are private by default and visible only to you. When AI processing requires an external service, the image is securely transmitted temporarily for processing. BuyWise does not publish or share your photos with other users without your explicit permission.
        </div>

        {/* Device-Change Warning */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.25)',
            fontSize: '11px',
            color: '#ffc107',
            marginBottom: '20px',
            lineHeight: 1.5,
          }}
        >
          📱 <strong>Device Storage Notice:</strong> Your private photos are stored in local IndexedDB storage on this device. They will not automatically appear on another device or browser.
        </div>

        {/* Photos Grid */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.8)' }}>
              Private Device Photos ({photos.length})
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Stored in Local IndexedDB</span>
          </div>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              Loading local storage...
            </div>
          ) : photos.length === 0 ? (
            <div
              style={{
                padding: '30px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '16px',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '13px',
              }}
            >
              No private photos stored yet. Upload a full-body photograph to enable AI Try-On.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
              {photos.map((item) => (
                <div
                  key={item.id}
                  style={{
                    position: 'relative',
                    aspectRatio: '3/4',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: item.isPrimary ? '2px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.15)',
                    background: '#090d16',
                  }}
                >
                  <SafeProductImage
                    src={item.imageData}
                    alt="Private Try-On model photo"
                    objectFit="cover"
                    aspectRatio="3/4"
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      display: 'flex',
                      gap: '4px',
                      flexDirection: 'column',
                    }}
                  >
                    {item.isPrimary && (
                      <span
                        style={{
                          fontSize: '8px',
                          fontWeight: 900,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: '#00ff88',
                          color: '#090d16',
                        }}
                      >
                        PRIMARY
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '8px',
                        fontWeight: 900,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        color: 'white',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      🔒 PRIVATE
                    </span>
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      bottom: '6px',
                      left: '6px',
                      right: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '4px',
                    }}
                  >
                    {!item.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(item.id)}
                        style={{
                          flex: 1,
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '4px 0',
                          borderRadius: '6px',
                          background: 'rgba(0, 212, 255, 0.85)',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePhoto(item.id)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: 'rgba(255, 0, 80, 0.85)',
                        border: 'none',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Delete local photo"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>
            Add Local Photo
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <label
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ff007f, #7928ca)',
                color: 'white',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'center',
                display: 'block',
              }}
            >
              📁 Choose File from Device
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={adding}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <form onSubmit={handleAddUrlPhoto} style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <input
              type="url"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
              placeholder="Or paste secure image URL (https://...)"
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'white',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={adding || !newPhotoUrl.trim()}
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 800,
                fontSize: '13px',
                cursor: adding || !newPhotoUrl.trim() ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {adding ? 'Saving...' : '+ Save URL'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

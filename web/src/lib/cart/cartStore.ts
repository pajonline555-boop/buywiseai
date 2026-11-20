"use client";

import { useSyncExternalStore } from 'react';
import { generateCartWhatsAppLink, WhatsAppCartItem } from '../commerce/whatsappCommerce';

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  brand?: string;
  store: string;
  retailerId: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  selectedSize?: string;
  selectedColor?: string;
  quantity: number;
  itemType: 'PARTNER' | 'EXTERNAL_RETAILER';
  productUrl: string;
  affiliateUrl?: string;
  inStock?: boolean;
  addedAt: string;
}

const CART_STORAGE_KEY = 'buywise_shopping_cart_v1';
const CART_UPDATE_EVENT = 'buywise_cart_updated';

export function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to read cart from localStorage', e);
    return [];
  }
}

export function saveStoredCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(CART_UPDATE_EVENT));
  } catch (e) {
    console.warn('Failed to save cart to localStorage', e);
  }
}

export function addToCart(item: Omit<CartItem, 'id' | 'addedAt'>): CartItem {
  const current = getStoredCart();
  const existingIndex = current.findIndex(
    (i) => i.productId === item.productId && i.selectedSize === item.selectedSize && i.selectedColor === item.selectedColor
  );

  let updated: CartItem[];
  let finalItem: CartItem;

  if (existingIndex > -1) {
    updated = [...current];
    updated[existingIndex].quantity += item.quantity || 1;
    finalItem = updated[existingIndex];
  } else {
    finalItem = {
      ...item,
      id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      quantity: item.quantity || 1,
      addedAt: new Date().toISOString(),
    };
    updated = [finalItem, ...current];
  }

  saveStoredCart(updated);
  return finalItem;
}

export function updateCartQuantity(cartItemId: string, newQuantity: number): void {
  const current = getStoredCart();
  if (newQuantity <= 0) {
    removeFromCart(cartItemId);
    return;
  }
  const updated = current.map((i) => (i.id === cartItemId ? { ...i, quantity: newQuantity } : i));
  saveStoredCart(updated);
}

export function removeFromCart(cartItemId: string): void {
  const current = getStoredCart();
  const updated = current.filter((i) => i.id !== cartItemId);
  saveStoredCart(updated);
}

export function clearCart(): void {
  saveStoredCart([]);
}

function subscribeCart(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CART_UPDATE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CART_UPDATE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

let cachedSnapshot: CartItem[] = [];
let cachedRaw: string | null = null;

function getCartSnapshot(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedSnapshot = raw ? JSON.parse(raw) : [];
    }
  } catch (e) {
    console.warn('Failed to read cart snapshot from localStorage', e);
  }
  return cachedSnapshot;
}

const emptyServerCart: CartItem[] = [];
function getServerCartSnapshot(): CartItem[] {
  return emptyServerCart;
}

/**
 * Custom React Hook for live cart state across any component
 */
export function useCart() {
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const isLoaded = typeof window !== 'undefined';

  const partnerItems = items.filter((i) => i.itemType === 'PARTNER');
  const externalItems = items.filter((i) => i.itemType === 'EXTERNAL_RETAILER');

  const partnerSubtotal = partnerItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const totalItemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  const getPartnerWhatsAppOrderUrl = () => {
    const waItems: WhatsAppCartItem[] = partnerItems.map((i) => ({
      id: i.productId,
      title: i.title,
      brand: i.brand,
      store: i.store,
      price: i.price,
      quantity: i.quantity,
      selectedSize: i.selectedSize,
      selectedColor: i.selectedColor,
      url: i.productUrl,
    }));
    return generateCartWhatsAppLink(waItems, partnerSubtotal);
  };

  return {
    items,
    partnerItems,
    externalItems,
    partnerSubtotal,
    totalItemCount,
    isLoaded,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getPartnerWhatsAppOrderUrl,
  };
}

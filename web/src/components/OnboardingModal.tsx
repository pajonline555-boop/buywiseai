'use client';

import React, { useState, useEffect } from 'react';

interface OnboardingCard {
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
}

const CARDS: OnboardingCard[] = [
  {
    title: 'Welcome to BuyWise AI',
    subtitle: 'Your intelligent shopping companion for live price comparison, virtual trial room, and verified deals.',
    emoji: '🛍️',
    color: '#00F2FE'
  },
  {
    title: 'Compare Before You Buy',
    subtitle: 'Compare products, prices, ratings, and available offers across 14 supported Indian retailers instantly.',
    emoji: '⚡',
    color: '#10B981'
  },
  {
    title: 'Search Smarter',
    subtitle: 'Type or speak using 🎙️ voice search (Hindi, English, Hinglish) to find what you need.',
    emoji: '🎙️',
    color: '#F59E0B'
  },
  {
    title: 'Try Before You Decide',
    subtitle: 'Use BuyWise AI Try-On where supported to preview eligible fashion products on your photos.',
    emoji: '✨',
    color: '#EC4899'
  },
  {
    title: 'Smart Value + Shopping Trust',
    subtitle: 'See independent shopping signals, price history graphs, and verified merchant scores before deciding.',
    emoji: '🛡️',
    color: '#10B981'
  },
  {
    title: 'Discover BuyWise Store',
    subtitle: 'Explore partner merchant products, Gen-G specials, and track your orders seamlessly.',
    emoji: '🏬',
    color: '#8B5CF6'
  },
  {
    title: "You're Ready!",
    subtitle: 'Compare. Discover. Shop smarter with BuyWise AI.',
    emoji: '🚀',
    color: '#00F2FE'
  }
];

export function OnboardingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  const card = CARDS[currentIndex];

  const handleComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasCompletedBuyWiseWebOnboarding', 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-3xl border border-purple-500/30 bg-[#120F24] p-6 shadow-2xl text-white">
        {/* Header: Skip */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-xl font-black tracking-wider text-cyan-400">BuyWise AI</span>
          <button
            onClick={handleComplete}
            className="text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest px-3 py-1 rounded-full bg-white/5"
          >
            Skip
          </button>
        </div>

        {/* Poster Card */}
        <div className="text-center py-8 px-4 rounded-2xl bg-[#1A1633] border border-white/5 shadow-inner">
          <div className="text-6xl mb-4">{card.emoji}</div>
          <h2 className="text-2xl font-black mb-3">{card.title}</h2>
          <p className="text-sm text-gray-300 leading-relaxed max-w-sm mx-auto">{card.subtitle}</p>
        </div>

        {/* Indicator Dots */}
        <div className="flex justify-center items-center gap-2 my-6">
          {CARDS.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-6 bg-cyan-400' : 'w-2 bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-2">
          {currentIndex > 0 ? (
            <button
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="text-sm text-gray-400 hover:text-white font-semibold"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={() => {
              if (currentIndex < CARDS.length - 1) {
                setCurrentIndex((prev) => prev + 1);
              } else {
                handleComplete();
              }
            }}
            className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider text-black transition-transform hover:scale-105 shadow-lg"
            style={{ backgroundColor: card.color }}
          >
            {currentIndex === CARDS.length - 1 ? 'Start Shopping ➔' : 'Next ➔'}
          </button>
        </div>
      </div>
    </div>
  );
}

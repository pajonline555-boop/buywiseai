"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'system' | 'dark' | 'light';

export interface ThemeColorBall {
  id: string;
  name: string;
  color: string;
  glow: string;
  gradient: string;
}

export const PRESET_COLOR_BALLS: ThemeColorBall[] = [
  { id: 'violet', name: 'Neon Violet', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', gradient: 'linear-gradient(135deg, #a855f7, #ff007f)' },
  { id: 'emerald', name: 'Cyber Emerald', color: '#00ff88', glow: 'rgba(0, 255, 136, 0.4)', gradient: 'linear-gradient(135deg, #00ff88, #00b8ff)' },
  { id: 'sapphire', name: 'Ocean Sapphire', color: '#00d4ff', glow: 'rgba(0, 212, 255, 0.4)', gradient: 'linear-gradient(135deg, #00d4ff, #3b82f6)' },
  { id: 'sunset', name: 'Sunset Gold', color: '#ff9900', glow: 'rgba(255, 153, 0, 0.4)', gradient: 'linear-gradient(135deg, #ff9900, #ff5500)' },
  { id: 'crimson', name: 'Crimson Red', color: '#ff0055', glow: 'rgba(255, 0, 85, 0.4)', gradient: 'linear-gradient(135deg, #ff0055, #e11d48)' },
  { id: 'sakura', name: 'Sakura Pink', color: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
];

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  activeTheme: 'dark' | 'light';
  accentColor: string;
  setAccentColor: (color: string) => void;
  presetBalls: ThemeColorBall[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [activeTheme, setActiveTheme] = useState<'dark' | 'light'>('dark');
  const [accentColor, setAccentColorState] = useState<string>('#a855f7');

  useEffect(() => {
    const savedTheme = localStorage.getItem('buywise_theme') as ThemeMode;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
    const savedAccent = localStorage.getItem('buywise_accent_color');
    if (savedAccent) {
      setAccentColorState(savedAccent);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let resolved: 'dark' | 'light' = 'dark';

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolved = prefersDark ? 'dark' : 'dark';
    } else {
      resolved = theme;
    }

    setActiveTheme(resolved);
    root.setAttribute('data-theme', resolved);

    // Apply Dynamic Color Ball Accent to CSS Variables
    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--accent-glow', `${accentColor}66`);
    root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${accentColor}, #ff007f)`);

    if (resolved === 'light') {
      root.style.setProperty('--bg-primary', '#0f172a');
      root.style.setProperty('--bg-color', '#070510');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#cbd5e1');
      root.style.setProperty('--glass-bg', 'rgba(14, 10, 26, 0.95)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.15)');
    } else {
      root.style.setProperty('--bg-primary', '#0C0A14');
      root.style.setProperty('--bg-color', '#070510');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#cbd5e1');
      root.style.setProperty('--glass-bg', 'rgba(14, 10, 26, 0.95)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.15)');
    }
  }, [theme, accentColor]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('buywise_theme', mode);
  };

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    localStorage.setItem('buywise_accent_color', color);
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        setTheme, 
        activeTheme, 
        accentColor, 
        setAccentColor, 
        presetBalls: PRESET_COLOR_BALLS 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'dark' as ThemeMode,
      setTheme: () => {},
      activeTheme: 'dark' as 'dark' | 'light',
      accentColor: '#a855f7',
      setAccentColor: () => {},
      presetBalls: PRESET_COLOR_BALLS,
    };
  }
  return context;
};

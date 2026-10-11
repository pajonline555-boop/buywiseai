"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'system' | 'dark' | 'light' | 'high-contrast';

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
  activeTheme: ThemeMode;
  accentColor: string;
  setAccentColor: (color: string) => void;
  presetBalls: ThemeColorBall[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [activeTheme, setActiveTheme] = useState<ThemeMode>('dark');
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
    let resolved: ThemeMode = 'dark';

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolved = prefersDark ? 'dark' : 'light';
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
      root.style.setProperty('--bg-primary', '#f8fafc');
      root.style.setProperty('--bg-color', '#f1f5f9');
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--text-secondary', '#475569');
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.94)');
      root.style.setProperty('--glass-border', 'rgba(15, 23, 42, 0.15)');
      root.style.setProperty('--card-bg', '#ffffff');
    } else if (resolved === 'high-contrast') {
      root.style.setProperty('--bg-primary', '#000000');
      root.style.setProperty('--bg-color', '#000000');
      root.style.setProperty('--text-primary', '#ffff00');
      root.style.setProperty('--text-secondary', '#ffffff');
      root.style.setProperty('--glass-bg', '#0d0d0d');
      root.style.setProperty('--glass-border', '#00ffff');
      root.style.setProperty('--card-bg', '#111111');
    } else {
      root.style.setProperty('--bg-primary', '#0C0A14');
      root.style.setProperty('--bg-color', '#070510');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#cbd5e1');
      root.style.setProperty('--glass-bg', 'rgba(14, 10, 26, 0.95)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.15)');
      root.style.setProperty('--card-bg', '#141026');
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

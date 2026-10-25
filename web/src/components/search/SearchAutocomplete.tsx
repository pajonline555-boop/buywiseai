"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  SearchHistoryItem,
  getHistorySuggestions,
  saveSearchQuery,
  removeSearchQuery,
  clearSearchHistory,
} from "@/lib/search/searchHistory";

export interface SearchAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  scopeKey?: string | null;
  autoFocus?: boolean;
  className?: string;
  formStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  childrenTrailing?: React.ReactNode;
}

export default function SearchAutocomplete({
  value,
  onChange,
  onSearch,
  placeholder = "Search Indian products or paste query...",
  scopeKey = null,
  autoFocus = false,
  className = "",
  formStyle = {},
  inputStyle = {},
  childrenTrailing,
}: SearchAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchHistoryItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load matching suggestions based on current value
  const refreshSuggestions = useCallback(
    (currentVal: string) => {
      const items = getHistorySuggestions(currentVal, scopeKey, 8);
      setSuggestions(items);
      setActiveIndex(-1);
    },
    [scopeKey]
  );

  useEffect(() => {
    refreshSuggestions(value);
  }, [value, refreshSuggestions]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowClearConfirm(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const handleInputFocus = () => {
    refreshSuggestions(value);
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    refreshSuggestions(newVal);
    setIsOpen(true);
  };

  const handleSelectSuggestion = (item: SearchHistoryItem) => {
    onChange(item.query);
    saveSearchQuery(item.query, scopeKey);
    setIsOpen(false);
    onSearch(item.query);
  };

  const handleRemoveItem = (e: React.MouseEvent, item: SearchHistoryItem) => {
    e.stopPropagation();
    e.preventDefault();
    removeSearchQuery(item.query, scopeKey);
    refreshSuggestions(value);
    // Keep focus in input
    inputRef.current?.focus();
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    clearSearchHistory(scopeKey);
    setSuggestions([]);
    setShowClearConfirm(false);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (activeIndex >= 0 && activeIndex < suggestions.length) {
      const selected = suggestions[activeIndex];
      onChange(selected.query);
      saveSearchQuery(selected.query, scopeKey);
      onSearch(selected.query);
    } else if (value.trim()) {
      saveSearchQuery(value.trim(), scopeKey);
      onSearch(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        setIsOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1 < suggestions.length ? prev + 1 : 0));
        break;

      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : suggestions.length - 1));
        break;

      case "Enter":
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          e.preventDefault();
          const selected = suggestions[activeIndex];
          onChange(selected.query);
          saveSearchQuery(selected.query, scopeKey);
          setIsOpen(false);
          onSearch(selected.query);
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const activeDescendantId =
    activeIndex >= 0 && activeIndex < suggestions.length
      ? `search-suggestion-item-${activeIndex}`
      : undefined;

  return (
    <div
      ref={containerRef}
      className={`search-autocomplete-container ${className}`}
      style={{ position: "relative", width: "100%", maxWidth: "100%" }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "center",
          position: "relative",
          width: "100%",
          ...formStyle,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen && suggestions.length > 0}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls="buywise-search-history-listbox"
          aria-activedescendant={activeDescendantId}
          autoComplete="off"
          spellCheck="false"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: "#ffffff",
            outline: "none",
            fontSize: "15px",
            minWidth: 0,
            ...inputStyle,
          }}
        />

        {childrenTrailing}
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          id="buywise-search-history-listbox"
          role="listbox"
          aria-label="Recent Searches and Suggestions"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "rgba(14, 10, 28, 0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(168, 85, 247, 0.35)",
            borderRadius: "18px",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(168, 85, 247, 0.15)",
            zIndex: 1000,
            overflow: "hidden",
            animation: "fadeInDropdown 0.15s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 16px 6px 16px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: "#a855f7",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🕒</span>
              <span>{value.trim() ? "Matching Previous Searches" : "Recent Searches"}</span>
            </div>

            {!showClearConfirm ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowClearConfirm(true);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f43f5e")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                Clear all
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: "#f43f5e", fontWeight: 700 }}>Confirm?</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    background: "#f43f5e",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "2px 8px",
                    fontSize: "10px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Yes, clear
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowClearConfirm(false);
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "2px 8px",
                    fontSize: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* List of Suggestions */}
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: "6px 0",
              maxHeight: "280px",
              overflowY: "auto",
            }}
          >
            {suggestions.map((item, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <li
                  key={`${item.normalized}-${idx}`}
                  id={`search-suggestion-item-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 16px",
                    cursor: "pointer",
                    background: isSelected
                      ? "linear-gradient(90deg, rgba(168, 85, 247, 0.25), rgba(236, 72, 153, 0.15))"
                      : "transparent",
                    borderLeft: isSelected ? "3px solid #a855f7" : "3px solid transparent",
                    transition: "background 0.15s, border-left 0.15s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <span style={{ fontSize: "14px", color: isSelected ? "#a855f7" : "#64748b" }}>
                      🕒
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: isSelected ? "#ffffff" : "#e2e8f0",
                        fontWeight: isSelected ? 700 : 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.query}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleRemoveItem(e, item)}
                    title={`Remove "${item.query}" from history`}
                    aria-label={`Remove ${item.query} from search history`}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#64748b",
                      fontSize: "14px",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: "8px",
                      transition: "color 0.2s, background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#f43f5e";
                      e.currentTarget.style.background = "rgba(244, 63, 94, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#64748b";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

"use client";

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/i18nContext';

interface ArticleMarkdownRendererProps {
  content: string;
}

export const ArticleMarkdownRenderer: React.FC<ArticleMarkdownRendererProps> = ({ content }) => {
  const { t } = useTranslation();

  const parseInlineElements = (text: string) => {
    // Regex matches [label](url) OR **bold**
    const tokenRegex = /(\[.*?\]\(.*?\))|(\*\*.*?\*\*)/g;
    const parts = text.split(tokenRegex).filter(Boolean);

    return parts.map((part, pIdx) => {
      // Check if it's a markdown link [Label](/url)
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const href = linkMatch[2];
        const isExternal = href.startsWith('http');
        
        return (
          <Link
            key={pIdx}
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            style={{ textDecoration: 'none', display: 'inline-block', margin: '4px 6px 4px 0' }}
          >
            <button
              style={{
                padding: '10px 20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, var(--primary, #00d4ff), #00ff88)',
                color: '#000000',
                fontWeight: 900,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0, 255, 136, 0.35)',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {t(label)}
            </button>
          </Link>
        );
      }

      // Check if it's bold text **bold**
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} style={{ color: '#00ff88', fontWeight: 800 }}>
            {t(part.slice(2, -2))}
          </strong>
        );
      }

      // Regular text string
      return t(part);
    });
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentTableLines: string[] = [];

  const flushTable = (tableIdx: number) => {
    if (currentTableLines.length === 0) return;

    const rows = currentTableLines
      .filter((line) => !line.includes('---'))
      .map((line) => line.split('|').map((col) => col.trim()).filter(Boolean));

    if (rows.length > 0) {
      const header = rows[0];
      const body = rows.slice(1);

      elements.push(
        <div key={`table-${tableIdx}`} style={{ overflowX: 'auto', margin: '24px 0' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <thead>
              <tr style={{ background: 'rgba(0, 212, 255, 0.15)', textAlign: 'left' }}>
                {header.map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: '14px 18px',
                      color: '#00d4ff',
                      fontSize: '13px',
                      fontWeight: 900,
                      borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    {t(h.replace(/\*\*/g, ''))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    background: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  {row.map((col, cIdx) => (
                    <td
                      key={cIdx}
                      style={{
                        padding: '12px 18px',
                        fontSize: '13px',
                        color: cIdx === 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                        fontWeight: cIdx === 0 ? 700 : 400,
                      }}
                    >
                      {parseInlineElements(col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    currentTableLines = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Collect Markdown Table lines
    if (trimmed.startsWith('|')) {
      currentTableLines.push(trimmed);
      return;
    } else if (currentTableLines.length > 0) {
      flushTable(idx);
    }

    if (!trimmed) {
      elements.push(<div key={`sp-${idx}`} style={{ height: '10px' }} />);
      return;
    }

    // Headers
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2
          key={idx}
          style={{
            fontSize: '24px',
            fontWeight: 900,
            color: 'white',
            marginTop: '24px',
            marginBottom: '14px',
            lineHeight: 1.3,
          }}
        >
          {t(trimmed.replace('# ', ''))}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3
          key={idx}
          style={{
            fontSize: '19px',
            fontWeight: 800,
            color: '#00d4ff',
            marginTop: '20px',
            marginBottom: '12px',
            lineHeight: 1.3,
          }}
        >
          {t(trimmed.replace('## ', ''))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4
          key={idx}
          style={{
            fontSize: '16px',
            fontWeight: 800,
            color: '#00ff88',
            marginTop: '16px',
            marginBottom: '10px',
          }}
        >
          {t(trimmed.replace('### ', ''))}
        </h4>
      );
      return;
    }

    // Horizontal Rule
    if (trimmed.startsWith('---')) {
      elements.push(
        <hr
          key={idx}
          style={{
            border: 'none',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            margin: '22px 0',
          }}
        />
      );
      return;
    }

    // List Items (- or *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listContent = trimmed.substring(2).trim();
      elements.push(
        <div
          key={idx}
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '10px',
            alignItems: 'center',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: 1.6,
          }}
        >
          <span style={{ color: '#00ff88', fontWeight: 900, fontSize: '16px' }}>•</span>
          <div style={{ flex: 1 }}>{parseInlineElements(listContent)}</div>
        </div>
      );
      return;
    }

    // Standard Paragraph
    elements.push(
      <p
        key={idx}
        style={{
          fontSize: '14px',
          lineHeight: 1.75,
          color: 'rgba(255, 255, 255, 0.88)',
          marginBottom: '12px',
        }}
      >
        {parseInlineElements(trimmed)}
      </p>
    );
  });

  // Flush any table at end of content
  if (currentTableLines.length > 0) {
    flushTable(lines.length);
  }

  return <div>{elements}</div>;
};

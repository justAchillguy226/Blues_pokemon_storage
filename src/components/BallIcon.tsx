'use client';

import React from 'react';
import { BallType } from '@/lib/types';

export function BallIcon({
  ball,
  size = 28,
}: {
  ball: BallType;
  size?: number;
}) {
  if (!ball) return null;

  switch (ball) {
    case 'poke':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <defs>
            <radialGradient id="pokeRed" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ff6b6b" />
              <stop offset="55%" stopColor="#ee1515" />
              <stop offset="100%" stopColor="#a60000" />
            </radialGradient>
            <radialGradient id="ballWhite" cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#e8eef5" />
              <stop offset="100%" stopColor="#b8c4d0" />
            </radialGradient>
          </defs>
          <circle cx="18" cy="18" r="15" fill="url(#ballWhite)" stroke="#222" strokeWidth="1.6" />
          <path
            d="M3 18 A15 15 0 0 1 33 18 Z"
            fill="url(#pokeRed)"
            stroke="#222"
            strokeWidth="1.4"
          />
          <rect x="3" y="16.5" width="30" height="3" fill="#222" />
          <circle cx="18" cy="18" r="4.8" fill="#ffffff" stroke="#222" strokeWidth="2" />
          <circle cx="18" cy="18" r="2.2" fill="#f0f4f8" stroke="#99a" strokeWidth="0.8" />
          <ellipse cx="13" cy="10" rx="3.5" ry="1.8" transform="rotate(-25 13 10)" fill="rgba(255,255,255,0.45)" />
        </svg>
      );

    case 'great':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <defs>
            <radialGradient id="greatBlue" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#4da6ff" />
              <stop offset="55%" stopColor="#1b63d8" />
              <stop offset="100%" stopColor="#0b3582" />
            </radialGradient>
          </defs>
          <circle cx="18" cy="18" r="15" fill="#eef3f8" stroke="#222" strokeWidth="1.6" />
          <path
            d="M3 18 A15 15 0 0 1 33 18 Z"
            fill="url(#greatBlue)"
            stroke="#222"
            strokeWidth="1.4"
          />
          {/* Red accents */}
          <path d="M6.5 13.5 L12.5 7.5 L15 9.5 L8.5 16 Z" fill="#ee2222" />
          <path d="M29.5 13.5 L23.5 7.5 L21 9.5 L27.5 16 Z" fill="#ee2222" />
          <rect x="3" y="16.5" width="30" height="3" fill="#222" />
          <circle cx="18" cy="18" r="4.8" fill="#ffffff" stroke="#222" strokeWidth="2" />
          <circle cx="18" cy="18" r="2.2" fill="#f0f4f8" stroke="#99a" strokeWidth="0.8" />
        </svg>
      );

    case 'ultra':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <defs>
            <radialGradient id="ultraDark" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#555b66" />
              <stop offset="60%" stopColor="#262930" />
              <stop offset="100%" stopColor="#111317" />
            </radialGradient>
          </defs>
          <circle cx="18" cy="18" r="15" fill="#eef3f8" stroke="#222" strokeWidth="1.6" />
          <path
            d="M3 18 A15 15 0 0 1 33 18 Z"
            fill="url(#ultraDark)"
            stroke="#222"
            strokeWidth="1.4"
          />
          {/* Yellow H stripes */}
          <path
            d="M9 17 V7.5 C9 6.5 12 6.5 12 7.5 V17 Z M24 17 V7.5 C24 6.5 27 6.5 27 7.5 V17 Z"
            fill="#f7c61b"
          />
          <path d="M10.5 7.5 H25.5 V10.2 H10.5 Z" fill="#f7c61b" />
          <rect x="3" y="16.5" width="30" height="3" fill="#222" />
          <circle cx="18" cy="18" r="4.8" fill="#ffffff" stroke="#222" strokeWidth="2" />
          <circle cx="18" cy="18" r="2.2" fill="#f0f4f8" stroke="#99a" strokeWidth="0.8" />
        </svg>
      );

    case 'master':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <defs>
            <radialGradient id="masterPurple" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#b967ff" />
              <stop offset="55%" stopColor="#7b2cbf" />
              <stop offset="100%" stopColor="#480ca8" />
            </radialGradient>
          </defs>
          <circle cx="18" cy="18" r="15" fill="#eef3f8" stroke="#222" strokeWidth="1.6" />
          <path
            d="M3 18 A15 15 0 0 1 33 18 Z"
            fill="url(#masterPurple)"
            stroke="#222"
            strokeWidth="1.4"
          />
          {/* Pink bumps */}
          <ellipse cx="9.5" cy="9.5" rx="4" ry="2.8" transform="rotate(-30 9.5 9.5)" fill="#e6399b" />
          <ellipse cx="26.5" cy="9.5" rx="4" ry="2.8" transform="rotate(30 26.5 9.5)" fill="#e6399b" />
          {/* White M */}
          <path
            d="M14 14.5 V9.5 L18 13 L22 9.5 V14.5"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="3" y="16.5" width="30" height="3" fill="#222" />
          <circle cx="18" cy="18" r="4.8" fill="#ffffff" stroke="#222" strokeWidth="2" />
          <circle cx="18" cy="18" r="2.2" fill="#f0f4f8" stroke="#99a" strokeWidth="0.8" />
        </svg>
      );

    case 'premier':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <defs>
            <radialGradient id="premierWhite" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="65%" stopColor="#e9f1f7" />
              <stop offset="100%" stopColor="#b8c9d9" />
            </radialGradient>
          </defs>
          <circle cx="18" cy="18" r="15" fill="url(#premierWhite)" stroke="#667788" strokeWidth="1.6" />
          <rect x="3" y="16.7" width="30" height="2.6" fill="#e52525" />
          <circle cx="18" cy="18" r="4.8" fill="#ffffff" stroke="#e52525" strokeWidth="2" />
          <circle cx="18" cy="18" r="2.1" fill="#ffffff" stroke="#e52525" strokeWidth="1" />
          <ellipse cx="13" cy="10" rx="3.5" ry="1.8" transform="rotate(-25 13 10)" fill="rgba(255,255,255,0.8)" />
        </svg>
      );

    case 'beast':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="15" fill="#1d3587" stroke="#0d1b4c" strokeWidth="1.6" />
          {/* Cyan energy grid lines */}
          <ellipse cx="18" cy="18" rx="14" ry="7" stroke="#4cc9f0" strokeWidth="1.4" />
          <ellipse cx="18" cy="18" rx="7" ry="14" stroke="#4cc9f0" strokeWidth="1.4" />
          {/* Gold/Yellow outer ridges */}
          <path d="M6 9 L11 12 M30 9 L25 12 M6 27 L11 24 M30 27 L25 24" stroke="#f9c74f" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="18" cy="18" r="14.2" stroke="#f9c74f" strokeWidth="1.8" strokeDasharray="5 4" />
          <circle cx="18" cy="18" r="4.8" fill="#4cc9f0" stroke="#f9c74f" strokeWidth="2" />
          <circle cx="18" cy="18" r="2" fill="#ffffff" />
        </svg>
      );

    case 'safari':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="15" fill="#eef3f8" stroke="#222" strokeWidth="1.6" />
          <path
            d="M3 18 A15 15 0 0 1 33 18 Z"
            fill="#5f8d37"
            stroke="#222"
            strokeWidth="1.4"
          />
          {/* Camo spots */}
          <ellipse cx="12" cy="11" rx="4.2" ry="2.6" fill="#a47e3b" />
          <ellipse cx="22" cy="9.5" rx="3.8" ry="2.2" fill="#3b5e21" />
          <ellipse cx="25" cy="14" rx="3.5" ry="2" fill="#c29b53" />
          <ellipse cx="9" cy="14.5" rx="2.8" ry="1.8" fill="#3b5e21" />
          <rect x="3" y="16.5" width="30" height="3" fill="#222" />
          <circle cx="18" cy="18" r="4.8" fill="#ffffff" stroke="#222" strokeWidth="2" />
          <circle cx="18" cy="18" r="2.2" fill="#f0f4f8" stroke="#99a" strokeWidth="0.8" />
        </svg>
      );

    case 'incubator':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          {/* Top cap */}
          <ellipse cx="18" cy="6.5" rx="8.5" ry="2.5" fill="#8ecae6" stroke="#457b9d" strokeWidth="1.2" />
          {/* Glass body */}
          <rect
            x="9.5"
            y="6.5"
            width="17"
            height="21"
            rx="2"
            fill="rgba(190, 233, 255, 0.55)"
            stroke="#5fa8d3"
            strokeWidth="1.4"
          />
          {/* Left & Right frame bars */}
          <line x1="11.5" y1="7" x2="11.5" y2="27" stroke="#ffffff" strokeWidth="1.5" />
          {/* Orange cushion inside */}
          <ellipse cx="18" cy="24.5" rx="6.2" ry="2.6" fill="#fb8500" stroke="#c86400" strokeWidth="1" />
          <ellipse cx="18" cy="24" rx="4.5" ry="1.6" fill="#ffb703" />
          {/* Base */}
          <path d="M8.5 27.5 H27.5 L26 31.5 H10 Z" fill="#457b9d" stroke="#1d3557" strokeWidth="1.2" />
        </svg>
      );

    case 'egg':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <defs>
            <radialGradient id="eggGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#e8f3ff" />
              <stop offset="60%" stopColor="#90b8f8" />
              <stop offset="100%" stopColor="#4c75c9" />
            </radialGradient>
          </defs>
          <path
            d="M18 4.5 C11.5 4.5 7.5 14 7.5 21.5 C7.5 27.8 12.2 31.5 18 31.5 C23.8 31.5 28.5 27.8 28.5 21.5 C28.5 14 24.5 4.5 18 4.5 Z"
            fill="url(#eggGrad)"
            stroke="#3b5ea8"
            strokeWidth="1.4"
          />
          {/* Egg spots */}
          <ellipse cx="14" cy="13" rx="2.6" ry="3.2" transform="rotate(-15 14 13)" fill="#4361ee" opacity="0.65" />
          <ellipse cx="22" cy="17" rx="3" ry="3.6" transform="rotate(20 22 17)" fill="#4361ee" opacity="0.65" />
          <ellipse cx="13.5" cy="23.5" rx="3.2" ry="2.5" transform="rotate(10 13.5 23.5)" fill="#4361ee" opacity="0.65" />
          <ellipse cx="21" cy="26" rx="2.1" ry="1.8" fill="#4361ee" opacity="0.65" />
        </svg>
      );

    default:
      return null;
  }
}

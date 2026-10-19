'use client';

import React, { useRef, useState } from 'react';
import { BackgroundStyle, PokemonStorageItem } from '@/lib/types';
import { formatDexNumber, getPokemonSpriteUrl } from '@/lib/pokedex';
import { BallIcon } from './BallIcon';

// Compress and convert any selected image file into a clean JPEG Data URL
export function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('讀取圖片檔案失敗'));
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => {
        resolve(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

const ACCOUNT_COLORS = [
  { bg: '#eef4ff', text: '#1d4ed8', border: '#bfdbfe' },
  { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  { bg: '#fdf4ff', text: '#86198f', border: '#f5d0fe' },
  { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' },
];

export function getAccountColor(accountName: string) {
  let hash = 0;
  for (let i = 0; i < accountName.length; i++) {
    hash = accountName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ACCOUNT_COLORS[Math.abs(hash) % ACCOUNT_COLORS.length];
}

function getBackgroundCardStyle(style: BackgroundStyle): React.CSSProperties {
  switch (style) {
    case 'mystic':
      return {
        background:
          'linear-gradient(160deg, #dce8f9 0%, #c8daf2 45%, #d6dee8 100%)',
      };
    case 'instinct':
      return {
        background:
          'linear-gradient(160deg, #f3e9d2 0%, #ebd9b4 45%, #dfd5c4 100%)',
      };
    case 'valor':
      return {
        background:
          'linear-gradient(160deg, #f8dede 0%, #efc9c9 45%, #e4d2d2 100%)',
      };
    case 'location_park':
      return {
        background:
          'linear-gradient(180deg, #dff2ff 0%, #eef9eb 52%, #cbe8ba 100%)',
      };
    case 'location_city':
      return {
        background:
          'linear-gradient(180deg, #dcebff 0%, #ebf3ff 55%, #ffd9d2 100%)',
      };
    case 'wormhole':
      return {
        background:
          'linear-gradient(160deg, #d8d4f2 0%, #c3e2f7 50%, #dcd3ea 100%)',
      };
    case 'special':
      return {
        background:
          'linear-gradient(160deg, #f5e6ff 0%, #e0f2fe 50%, #fef3c7 100%)',
      };
    default:
      return {
        background: '#ffffff',
      };
  }
}

function BackgroundWatermark({ style }: { style: BackgroundStyle }) {
  if (style === 'none') return null;

  if (style === 'mystic') {
    return (
      <svg
        viewBox="0 0 120 120"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.32,
          pointerEvents: 'none',
        }}
      >
        <polygon
          points="60,8 108,36 92,106 60,114 28,106 12,36"
          fill="none"
          stroke="#72a7e5"
          strokeWidth="4"
        />
        <path
          d="M60 22 L72 48 L104 34 L82 66 L96 86 L60 76 L24 86 L38 66 L16 34 L48 48 Z"
          fill="#8cc0f9"
        />
      </svg>
    );
  }

  if (style === 'instinct') {
    return (
      <svg
        viewBox="0 0 120 120"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.34,
          pointerEvents: 'none',
        }}
      >
        <polygon
          points="60,8 110,45 86,110 34,110 10,45"
          fill="none"
          stroke="#e0b354"
          strokeWidth="4"
        />
        <path
          d="M60 18 L74 46 L108 28 L84 62 L102 78 L60 74 L18 78 L36 62 L12 28 L46 46 Z"
          fill="#f2cc6e"
        />
      </svg>
    );
  }

  if (style === 'valor') {
    return (
      <svg
        viewBox="0 0 120 120"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.28,
          pointerEvents: 'none',
        }}
      >
        <circle cx="60" cy="58" r="46" fill="none" stroke="#e07a7a" strokeWidth="4" />
        <path
          d="M60 16 C75 35 98 30 88 64 C80 86 68 96 60 104 C52 96 40 86 32 64 C22 30 45 35 60 16 Z"
          fill="#ee9b9b"
        />
      </svg>
    );
  }

  if (style === 'location_park') {
    return (
      <svg
        viewBox="0 0 120 140"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.45,
          pointerEvents: 'none',
        }}
      >
        <circle cx="92" cy="26" r="14" fill="#fff3b0" />
        <ellipse cx="25" cy="95" rx="38" ry="26" fill="#8fd694" />
        <ellipse cx="90" cy="98" rx="45" ry="28" fill="#77c37d" />
        <rect x="18" y="102" width="84" height="18" rx="6" fill="#e9edc9" />
      </svg>
    );
  }

  if (style === 'location_city') {
    return (
      <svg
        viewBox="0 0 120 140"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.42,
          pointerEvents: 'none',
        }}
      >
        <path d="M92 15 L96 115 H80 L88 15 Z" fill="#f28482" />
        <rect x="83" y="55" width="12" height="5" fill="#ffffff" />
        <rect x="81" y="82" width="15" height="6" fill="#ffffff" />
        <rect x="14" y="75" width="22" height="50" fill="#a8dadc" />
        <rect x="40" y="88" width="24" height="37" fill="#bcd4e6" />
      </svg>
    );
  }

  return null;
}

export function buildCardDisplayTitle(item: PokemonStorageItem): string {
  const parts: string[] = [];
  if (item.isShiny) parts.push('Shiny');
  parts.push(item.nameEn);
  if (item.isCostume && item.costumeName) {
    parts.push(item.costumeName);
  }
  if (item.hasBackground && item.backgroundName) {
    parts.push(item.backgroundName);
  } else if (item.isGigantamax) {
    parts.push('Gigantamax');
  }
  return parts.join(' ');
}

export function PokemonCard({
  item,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onUpdateScreenshot,
  onPreviewScreenshot,
}: {
  item: PokemonStorageItem;
  selected?: boolean;
  onSelect?: (item: PokemonStorageItem) => void;
  onEdit?: (item: PokemonStorageItem) => void;
  onDelete?: (id: string) => void;
  onUpdateScreenshot?: (item: PokemonStorageItem, screenshotUrl: string) => void;
  onPreviewScreenshot?: (item: PokemonStorageItem) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const bgStyle = getBackgroundCardStyle(item.backgroundStyle);
  const accColor = getAccountColor(item.account);
  const displayTitle = buildCardDisplayTitle(item);
  const showSnowflake =
    (item.hasBackground && !item.isLocationCard) || item.tags.includes('Purified');

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onUpdateScreenshot) return;
    const dataUrl = await fileToCompressedDataUrl(file);
    onUpdateScreenshot(item, dataUrl);
    e.target.value = '';
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/') && onUpdateScreenshot) {
      const dataUrl = await fileToCompressedDataUrl(file);
      onUpdateScreenshot(item, dataUrl);
    }
  }

  return (
    <div
      onClick={() => onSelect?.(item)}
      style={{
        ...bgStyle,
        position: 'relative',
        border: selected ? '2.5px solid #2563eb' : '1.5px solid #d4d8dd',
        borderRadius: '10px',
        padding: '10px 8px 10px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '235px',
        cursor: onSelect ? 'pointer' : 'default',
        overflow: 'hidden',
        boxShadow: selected
          ? '0 0 0 3px rgba(37, 99, 235, 0.2)'
          : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
      }}
    >
      <BackgroundWatermark style={item.backgroundStyle} />

      {/* Top Row: Left Status Icons (Shiny, Costume, Background/Location) & Right Ball Icon */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {item.isShiny && (
              <span
                title="Shiny (異色)"
                style={{
                  fontSize: '15px',
                  lineHeight: 1,
                  filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.8))',
                }}
              >
                ✨
              </span>
            )}
            {item.isCostume && (
              <span
                title={`Costume: ${item.costumeName || '特殊裝扮'}`}
                style={{ fontSize: '15px', lineHeight: 1 }}
              >
                🎩
              </span>
            )}
            {item.isGigantamax && (
              <span title="Gigantamax (超極巨化)" style={{ fontSize: '14px', lineHeight: 1 }}>
                👑
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {showSnowflake && (
              <span
                title={item.backgroundName || 'Special Background / Purified'}
                style={{
                  fontSize: '14px',
                  lineHeight: 1,
                  color: '#4a90d9',
                  fontWeight: 'bold',
                }}
              >
                ❄️
              </span>
            )}
            {item.isLocationCard && (
              <span
                title={item.backgroundName || 'Location Card (地區背卡)'}
                style={{ fontSize: '14px', lineHeight: 1 }}
              >
                🌐
              </span>
            )}
          </div>
        </div>

        {/* Top-right: Ball icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {item.ball && (
            <div title={`Ball: ${item.ball}`}>
              <BallIcon ball={item.ball} size={22} />
            </div>
          )}
        </div>
      </div>

      {/* Account Tag Pill & Status Classification Badges (在庫存中 / 在願望清單 / 已排定交易 / 售出) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          marginTop: '3px',
          width: '100%',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '1px 7px',
            borderRadius: '999px',
            background: accColor.bg,
            color: accColor.text,
            border: `1px solid ${accColor.border}`,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={`所屬帳號：${item.account}`}
        >
          👤 {item.account}
        </span>

        {item.status === 'inventory' && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #93c5fd',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title="狀態：在庫存中 (In My Inventory)"
          >
            📦 在庫存中
          </span>
        )}

        {item.status === 'wishlist' && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fcd34d',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title="狀態：在願望清單 (On My Wishlist)"
          >
            ★ 在願望清單
          </span>
        )}

        {item.status === 'scheduled_trade' && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: '#fff7ed',
              color: '#c2410c',
              border: '1px solid #fdba74',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={`已排定交易對象：${item.tradePartner || '未填寫'}`}
          >
            🤝 已排定交易{item.tradePartner ? `：${item.tradePartner}` : ''}
          </span>
        )}

        {item.status === 'sold' && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: '#ecfdf5',
              color: '#047857',
              border: '1px solid #6ee7b7',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={`出售價格：${item.soldPrice || '50NTD'}`}
          >
            💰 出售：{item.soldPrice || '50NTD'}
          </span>
        )}
      </div>

      {/* Center Sprite */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '2px 0',
        }}
      >
        <div style={{ position: 'relative', width: '68px', height: '68px' }}>
          {item.isCostume && item.costumeName.toLowerCase().includes('hat') && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                left: '24px',
                fontSize: '13px',
                zIndex: 3,
                pointerEvents: 'none',
              }}
            >
              🎉
            </span>
          )}
          <img
            src={getPokemonSpriteUrl(item.dexNumber, item.isShiny)}
            alt={item.nameZh}
            loading="lazy"
            style={{
              width: '68px',
              height: '68px',
              objectFit: 'contain',
              imageRendering: 'auto',
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))',
            }}
          />
        </div>
      </div>

      {/* Title & Subtitle */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#475569',
            marginBottom: '1px',
          }}
        >
          {formatDexNumber(item.dexNumber)} {item.nameZh}
        </div>
        <div
          style={{
            fontSize: '13px',
            lineHeight: '1.25',
            color: '#1e293b',
            fontWeight: 500,
            wordBreak: 'break-word',
          }}
        >
          {displayTitle}
        </div>
      </div>

      {/* Tags & GBL Info Pills */}
      {(item.tags.length > 0 || item.gblTags.length > 0) && (
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '3px',
            marginTop: '6px',
            width: '100%',
          }}
        >
          {item.tags.map((t) => (
            <span
              key={t}
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '999px',
                background: 'rgba(226, 232, 240, 0.9)',
                color: '#334155',
                fontWeight: 600,
              }}
            >
              {t}
            </span>
          ))}
          {item.gblTags.map((g) => (
            <span
              key={g}
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '999px',
                background: 'rgba(224, 231, 255, 0.92)',
                color: '#3730a3',
                fontWeight: 600,
              }}
            >
              {g}
            </span>
          ))}
        </div>
      )}

      {item.notes && (
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            fontSize: '10.5px',
            color: '#475569',
            marginTop: '3px',
            textAlign: 'center',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={item.notes}
        >
          📝 {item.notes}
        </div>
      )}

      {/* Actual Game Screenshot Slot at Bottom of Card (實際圖片插入區) */}
      {(item.screenshotUrl || onUpdateScreenshot) && (
        <div
          onClick={(e) => e.stopPropagation()}
          onDragOver={(e) => {
            if (!onUpdateScreenshot) return;
            e.preventDefault();
            e.stopPropagation();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            marginTop: '8px',
            paddingTop: '6px',
            borderTop: '1px dashed rgba(100, 116, 139, 0.3)',
          }}
        >
          {onUpdateScreenshot && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          )}

          {item.screenshotUrl ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div
                onClick={() => onPreviewScreenshot?.(item)}
                title="點擊放大檢視完整遊戲截圖"
                style={{
                  width: '100%',
                  background: '#0f172a',
                  borderRadius: '8px',
                  padding: '4px',
                  border: '1px solid #94a3b8',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: onPreviewScreenshot ? 'zoom-in' : 'default',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={item.screenshotUrl}
                  alt={`${item.nameZh} 實際截圖`}
                  style={{
                    width: '100%',
                    maxHeight: '230px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    display: 'block',
                  }}
                />
              </div>

              {onUpdateScreenshot && (
                <div style={{ display: 'flex', gap: '4px', width: '100%', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      background: 'rgba(255,255,255,0.9)',
                      color: '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    📷 更換圖片
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateScreenshot(item, '')}
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #fecaca',
                      background: 'rgba(255,255,255,0.9)',
                      color: '#b91c1c',
                      cursor: 'pointer',
                    }}
                  >
                    移除圖片
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '8px 6px',
                borderRadius: '6px',
                border: dragOver ? '1.5px dashed #2563eb' : '1.5px dashed #94a3b8',
                background: dragOver
                  ? 'rgba(219, 234, 254, 0.7)'
                  : 'rgba(255, 255, 255, 0.65)',
                color: '#475569',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              📷 點此插入實際圖片
              <div style={{ fontSize: '9.5px', fontWeight: 400, color: '#64748b' }}>
                （或將遊戲截圖拖曳至此）
              </div>
            </button>
          )}
        </div>
      )}

      {/* Quick Action Bar at bottom of card */}
      {(onEdit || onDelete) && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            gap: '6px',
            marginTop: '6px',
            paddingTop: '4px',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(item)}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                background: 'rgba(255,255,255,0.85)',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              編輯
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid #fecaca',
                background: 'rgba(254,242,242,0.9)',
                color: '#b91c1c',
                cursor: 'pointer',
              }}
            >
              刪除
            </button>
          )}
        </div>
      )}
    </div>
  );
}

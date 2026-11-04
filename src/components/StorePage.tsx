import React, { useState, useMemo } from 'react';
import type { StoreItem } from '../firebase';
import { recordStoreItemView, recordStoreItemAction } from '../firebase';
import { DriveImage } from './DriveImage';
import { translations, type Language } from '../i18n';
import {
  ShoppingBag,
  Search,
  Download,
  ExternalLink,
  Tag,
  Layers,
  Sparkles,
  Smartphone,
  Package,
  Check,
  Eye,
  MessageCircle,
  X,
  CheckCircle2,
  DollarSign,
  Gift,
} from 'lucide-react';

interface StorePageProps {
  items: StoreItem[];
  lang?: Language;
  onBackToHome: () => void;
}

type StoreTab = 'all' | 'products' | 'apps' | 'free' | 'paid';

export const StorePage: React.FC<StorePageProps> = ({ items, lang = 'ku', onBackToHome }) => {
  const t = translations[lang] || translations.ku;
  const [activeTab, setActiveTab] = useState<StoreTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);

  // Filter items
  const filteredItems = useMemo(() => {
    let result = items;

    if (activeTab === 'products') {
      result = result.filter((i) => i.kind === 'product');
    } else if (activeTab === 'apps') {
      result = result.filter((i) => i.kind === 'app');
    } else if (activeTab === 'free') {
      result = result.filter((i) => i.priceType === 'free');
    } else if (activeTab === 'paid') {
      result = result.filter((i) => i.priceType === 'paid');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((i) => {
        const matchTitle = (i.title || '').toLowerCase().includes(q);
        const matchDesc = (i.description || '').toLowerCase().includes(q);
        const matchCategory = (i.category || '').toLowerCase().includes(q);
        const matchPlatform = (i.appPlatform || '').toLowerCase().includes(q);
        return matchTitle || matchDesc || matchCategory || matchPlatform;
      });
    }

    return result;
  }, [items, activeTab, searchQuery]);

  const handleOpenItem = (item: StoreItem) => {
    setSelectedItem(item);
    recordStoreItemView(item.id);
  };

  const handleDownloadApp = (item: StoreItem) => {
    recordStoreItemAction(item.id, 'download');
    if (item.downloadUrl) {
      window.open(item.downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOrderWhatsApp = (item: StoreItem) => {
    recordStoreItemAction(item.id, 'order');
    const priceStr = item.priceType === 'free' ? 'بێبەرامبەر' : `${item.price.toLocaleString()} ${item.currency === 'USD' ? '$' : 'د.ع'}`;
    const text = `سڵاو ئەیوبی، دەمەوێت داواکاری بۆ ئەم بەرهەمە بکەم:\nناوی بەرهەم: ${item.title}\nجۆر: ${item.kind === 'app' ? 'ئەپڵیکەیشن' : 'کاڵا'}\nنرخ: ${priceStr}\nکۆدی بەرهەم: ${item.id}`;
    window.open(`https://wa.me/9647501234567?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="wrap" style={{ paddingTop: '24px', paddingBottom: '70px' }}>
      {/* Store Hero Banner */}
      <div
        className="glass rv in"
        style={{
          padding: '30px',
          borderRadius: '24px',
          marginBottom: '26px',
          background: 'radial-gradient(ellipse at top right, rgba(94, 200, 255, 0.12), rgba(123, 109, 255, 0.08) 50%, rgba(255, 255, 255, 0.02) 100%)',
          border: '1px solid var(--line2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--ice), var(--vio))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#05080f',
              boxShadow: '0 0 20px rgba(94, 200, 255, 0.4)',
            }}
          >
            <ShoppingBag size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3.8vw, 2.3rem)', margin: 0, fontWeight: 800 }}>
              {t.store_title}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.94rem', margin: '4px 0 0' }}>
              {t.store_desc}
            </p>
          </div>
        </div>

        {/* Quick Highlights */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginTop: '18px',
            paddingTop: '16px',
            borderTop: '1px solid var(--line)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--muted)' }}>
            <Package size={15} style={{ color: 'var(--ice)' }} />
            <span>کۆی بەرهەمەکان: <strong>{items.length}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--muted)' }}>
            <Smartphone size={15} style={{ color: 'var(--vio)' }} />
            <span>ئەپ و بەرنامەکان: <strong>{items.filter((i) => i.kind === 'app').length}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--muted)' }}>
            <Gift size={15} style={{ color: 'var(--s)' }} />
            <span>بەخۆڕایی (Free): <strong>{items.filter((i) => i.priceType === 'free').length}</strong></span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ marginBottom: '22px' }}>
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '10px',
            scrollbarWidth: 'none',
          }}
        >
          {[
            { id: 'all', label: t.store_tab_all, count: items.length },
            { id: 'products', label: t.store_tab_products, count: items.filter((i) => i.kind === 'product').length },
            { id: 'apps', label: t.store_tab_apps, count: items.filter((i) => i.kind === 'app').length },
            { id: 'free', label: t.store_tab_free, count: items.filter((i) => i.priceType === 'free').length },
            { id: 'paid', label: t.store_tab_paid, count: items.filter((i) => i.priceType === 'paid').length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as StoreTab)}
                style={{
                  background: isActive ? 'linear-gradient(135deg, var(--ice), var(--vio))' : 'rgba(255, 255, 255, 0.05)',
                  color: isActive ? '#05080f' : 'var(--text)',
                  border: '1px solid var(--line2)',
                  padding: '9px 18px',
                  borderRadius: '12px',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)',
                    padding: '2px 7px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginTop: '14px' }}>
          <input
            type="text"
            placeholder={t.store_search_placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '13px 44px 13px 18px',
              borderRadius: '14px',
              border: '1px solid var(--line2)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--text)',
              fontSize: '0.94rem',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <Search
            size={18}
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ice)',
              pointerEvents: 'none',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              پاککردنەوە
            </button>
          )}
        </div>
      </div>

      {/* Store Items Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredItems.map((item) => {
          const isFree = item.priceType === 'free';
          const isApp = item.kind === 'app';
          const priceDisplay = isFree
            ? t.store_free_badge
            : `${item.price.toLocaleString()} ${item.currency === 'USD' ? '$' : 'د.ع'}`;

          return (
            <div
              key={item.id}
              className="glass rv in"
              onClick={() => handleOpenItem(item)}
              style={{
                padding: '18px',
                borderRadius: '20px',
                border: '1px solid var(--line)',
                background: 'rgba(255, 255, 255, 0.035)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                position: 'relative',
              }}
            >
              <div>
                {/* Image / Thumbnail */}
                <div
                  style={{
                    width: '100%',
                    height: isApp ? '150px' : '180px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--line2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px',
                    position: 'relative',
                  }}
                >
                  {item.imageUrl ? (
                    <DriveImage
                      url={item.imageUrl}
                      backupUrl={item.backupUrl}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ color: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      {isApp ? <Smartphone size={38} style={{ color: 'var(--ice)', opacity: 0.6 }} /> : <Package size={38} style={{ color: 'var(--vio)', opacity: 0.6 }} />}
                      <span style={{ fontSize: '0.78rem' }}>{item.title}</span>
                    </div>
                  )}

                  {/* Kind badge (Amazon product vs PlayStore App) */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      fontSize: '0.72rem',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      background: isApp ? 'rgba(94, 200, 255, 0.9)' : 'rgba(123, 109, 255, 0.9)',
                      color: '#05080f',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {isApp ? '📱 ئەپڵیکەیشن' : '🛍️ کاڵا'}
                  </span>

                  {/* Free badge */}
                  {isFree && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        background: 'rgba(158, 230, 181, 0.9)',
                        color: '#05080f',
                      }}
                    >
                      بێبەرامبەر
                    </span>
                  )}
                </div>

                {/* Category & Platform chip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {item.category && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--muted)',
                      }}
                    >
                      {item.category}
                    </span>
                  )}
                  {isApp && item.appPlatform && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(94, 200, 255, 0.1)',
                        color: 'var(--ice)',
                        fontWeight: 600,
                      }}
                    >
                      {item.appPlatform === 'android' ? 'Android APK' : item.appPlatform === 'windows' ? 'Windows' : item.appPlatform}
                    </span>
                  )}
                  {isApp && item.appVersion && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                      v{item.appVersion}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--text)',
                    margin: '0 0 6px',
                    lineHeight: 1.4,
                  }}
                >
                  {item.title}
                </h3>

                {/* Description */}
                {item.description && (
                  <p
                    style={{
                      fontSize: '0.86rem',
                      color: 'var(--muted)',
                      margin: '0 0 14px',
                      lineHeight: 1.6,
                      maxHeight: '44px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.description}
                  </p>
                )}
              </div>

              {/* Card Footer: Price & Action */}
              <div
                style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block' }}>نرخ:</span>
                  <span
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: isFree ? 'var(--s)' : 'var(--text)',
                    }}
                  >
                    {priceDisplay}
                  </span>
                </div>

                {isApp && item.downloadUrl ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadApp(item);
                    }}
                    className="btn pri"
                    style={{
                      padding: '7px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      gap: '6px',
                    }}
                  >
                    <Download size={14} />
                    <span>داونلۆد</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOrderWhatsApp(item);
                    }}
                    className="btn"
                    style={{
                      padding: '7px 12px',
                      fontSize: '0.82rem',
                      gap: '6px',
                      borderColor: 'rgba(37, 211, 102, 0.4)',
                      color: '#25D366',
                    }}
                  >
                    <MessageCircle size={14} />
                    <span>کڕین / داواکردن</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div
          className="glass"
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            borderRadius: '20px',
            color: 'var(--muted)',
            marginTop: '20px',
          }}
        >
          <ShoppingBag size={48} style={{ color: 'var(--ice)', opacity: 0.4, marginBottom: '14px' }} />
          <p style={{ fontSize: '1.05rem', marginBottom: '8px', color: 'var(--text)' }}>
            {searchQuery ? `هیچ ئەنجامێک بۆ "${searchQuery}" نەدۆزرایەوە` : t.store_empty}
          </p>
          <small style={{ fontSize: '0.82rem' }}>
            دەتوانیت لە ڕێگەی پەڕەی ئەدمینەوە کاڵا و ئەپی نوێ زیاد بکەیت.
          </small>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(5, 8, 16, 0.84)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedItem(null);
          }}
        >
          <div
            className="glass rv in"
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '24px',
              border: '1px solid var(--line2)',
              background: 'rgba(11, 16, 32, 0.96)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              padding: '26px',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              style={{
                position: 'absolute',
                top: '18px',
                left: '18px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            {/* Media Image */}
            {selectedItem.imageUrl && (
              <div
                style={{
                  width: '100%',
                  maxHeight: '260px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  marginBottom: '18px',
                  background: 'rgba(0,0,0,0.4)',
                }}
              >
                <DriveImage
                  url={selectedItem.imageUrl}
                  backupUrl={selectedItem.backupUrl}
                  alt={selectedItem.title}
                  style={{ width: '100%', maxHeight: '260px', objectFit: 'contain' }}
                />
              </div>
            )}

            {/* Title & Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.74rem',
                  padding: '3px 10px',
                  borderRadius: '8px',
                  background: selectedItem.kind === 'app' ? 'rgba(94, 200, 255, 0.15)' : 'rgba(123, 109, 255, 0.15)',
                  color: selectedItem.kind === 'app' ? 'var(--ice)' : 'var(--vio)',
                  fontWeight: 700,
                }}
              >
                {selectedItem.kind === 'app' ? '📱 ئەپڵیکەیشن' : '🛍️ کاڵا'}
              </span>
              {selectedItem.category && (
                <span
                  style={{
                    fontSize: '0.74rem',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--muted)',
                  }}
                >
                  {selectedItem.category}
                </span>
              )}
              {selectedItem.kind === 'app' && selectedItem.appPlatform && (
                <span
                  style={{
                    fontSize: '0.74rem',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    background: 'rgba(94, 200, 255, 0.1)',
                    color: 'var(--ice)',
                  }}
                >
                  {selectedItem.appPlatform}
                </span>
              )}
              {selectedItem.kind === 'app' && selectedItem.appSize && (
                <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                  قەبارە: {selectedItem.appSize}
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 10px', color: 'var(--text)' }}>
              {selectedItem.title}
            </h2>

            {/* Price Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 18px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--line2)',
                marginBottom: '16px',
              }}
            >
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>نرخی بەرهەم:</span>
                <span
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: selectedItem.priceType === 'free' ? 'var(--s)' : 'var(--text)',
                  }}
                >
                  {selectedItem.priceType === 'free'
                    ? 'بێبەرامبەر (Free)'
                    : `${selectedItem.price.toLocaleString()} ${selectedItem.currency === 'USD' ? '$' : 'دیناری عێراقی'}`}
                </span>
              </div>

              {selectedItem.views !== undefined && (
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Eye size={15} style={{ color: 'var(--ice)' }} />
                  <span>{selectedItem.views || 0} بینین</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.92rem', color: 'var(--muted)', margin: '0 0 8px' }}>وردەکاری و تایبەتمەندییەکان:</h4>
              <p style={{ fontSize: '0.94rem', lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                {selectedItem.description || 'هیچ زانیارییەکی زیاتر لەسەر ئەم بەرهەمە نەنووسراوە.'}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {selectedItem.kind === 'app' && selectedItem.downloadUrl ? (
                <button
                  type="button"
                  onClick={() => handleDownloadApp(selectedItem)}
                  className="btn pri"
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    gap: '8px',
                    justifyContent: 'center',
                  }}
                >
                  <Download size={18} />
                  <span>داونلۆدکردنی ئەپ ({selectedItem.appSize || 'ڕاستەوخۆ'})</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => handleOrderWhatsApp(selectedItem)}
                className="btn"
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  gap: '8px',
                  justifyContent: 'center',
                  color: '#25D366',
                  borderColor: 'rgba(37, 211, 102, 0.4)',
                  background: 'rgba(37, 211, 102, 0.08)',
                }}
              >
                <MessageCircle size={18} />
                <span>{selectedItem.kind === 'app' ? 'پەیوەندی بە گەشەپێدەر' : 'داواکردن بە واتسئاپ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

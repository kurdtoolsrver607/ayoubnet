import React, { useState, useMemo } from 'react';
import { extractDriveFileId } from '../firebase';
import { ExternalLink, Maximize2, X, RefreshCw } from 'lucide-react';

interface DriveImageProps {
  url: string;
  backupUrl?: string;
  alt?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const DriveImage: React.FC<DriveImageProps> = ({
  url,
  backupUrl,
  alt = '',
  style,
  className,
}) => {
  const fileId = extractDriveFileId(url);
  const [retryIndex, setRetryIndex] = useState(0);
  const [useBackup, setUseBackup] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // If already a base64 data URL
  if (!fileId || url.startsWith('data:image/')) {
    return (
      <>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '14px',
            marginTop: '12px',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--line)',
          }}
        >
          <img
            src={url}
            alt={alt}
            loading="lazy"
            decoding="async"
            style={{
              maxWidth: '100%',
              width: '100%',
              maxHeight: '560px',
              borderRadius: '13px',
              display: 'block',
              objectFit: 'contain',
              ...style,
            }}
            className={className}
            onClick={() => setIsZoomed(true)}
          />
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(6, 9, 18, 0.75)',
              color: 'var(--text)',
              border: '1px solid var(--line2)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              backdropFilter: 'blur(6px)',
            }}
            title="گەورەکردن"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        {/* Zoom Lightbox */}
        {isZoomed && (
          <div
            onClick={() => setIsZoomed(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'rgba(0, 0, 0, 0.92)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              cursor: 'zoom-out',
            }}
          >
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
            <img
              src={url}
              alt={alt}
              style={{
                maxWidth: '94vw',
                maxHeight: '92vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
              }}
            />
          </div>
        )}
      </>
    );
  }

  // Multi-source fallback list specifically optimized for custom domains (ayoubi.site)
  const sources = useMemo(() => {
    return [
      // 1. Google Drive direct thumbnail (works cross-origin without 302 redirects)
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
      // 2. High-speed Cloudflare image proxy with WebP optimization (bypasses all CORS and Referer restrictions on ayoubi.site)
      `https://wsrv.nl/?url=drive.google.com/uc?id=${fileId}&output=webp`,
      // 3. Alternative global image proxy
      `https://images.weserv.nl/?url=drive.google.com/uc?id=${fileId}`,
      // 4. Google User Content CDN
      `https://lh3.googleusercontent.com/d/${fileId}=s1600`,
      // 5. Standard UC link
      `https://drive.google.com/uc?export=view&id=${fileId}`,
    ];
  }, [fileId]);

  let currentSrc = sources[retryIndex] || sources[0];
  if (useBackup && backupUrl) {
    currentSrc = backupUrl;
  }

  const handleImageError = () => {
    if (retryIndex < sources.length - 1) {
      setRetryIndex((prev) => prev + 1);
    } else if (backupUrl && !useBackup) {
      setUseBackup(true);
    } else {
      setUseIframeFallback(true);
    }
  };

  if (useIframeFallback) {
    return (
      <div
        style={{
          position: 'relative',
          marginTop: '12px',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid var(--line)',
          background: '#060912',
        }}
      >
        <iframe
          src={`https://drive.google.com/file/d/${fileId}/preview`}
          style={{
            width: '100%',
            height: '420px',
            border: 'none',
            display: 'block',
            backgroundColor: '#060912',
          }}
          title={alt || 'Google Drive File'}
          allow="autoplay"
        />
        <a
          href={`https://drive.google.com/file/d/${fileId}/view?usp=sharing`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            background: 'rgba(6, 9, 18, 0.88)',
            color: 'var(--text)',
            border: '1px solid var(--line2)',
            borderRadius: '8px',
            padding: '5px 12px',
            fontSize: '0.78rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none',
            backdropFilter: 'blur(8px)',
          }}
        >
          <ExternalLink size={13} />
          <span>کردنەوە لە گووگڵ درایڤ</span>
        </a>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '14px',
          marginTop: '12px',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--line)',
          minHeight: loaded ? 'auto' : '180px',
        }}
      >
        {!loaded && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%)',
              backgroundSize: '200% 100%',
              animation: 'loadingShimmer 1.8s infinite',
            }}
          />
        )}

        <img
          src={currentSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={handleImageError}
          onLoad={() => setLoaded(true)}
          style={{
            maxWidth: '100%',
            width: '100%',
            maxHeight: '560px',
            borderRadius: '13px',
            display: 'block',
            objectFit: 'contain',
            cursor: 'zoom-in',
            opacity: loaded ? 1 : 0.8,
            transition: 'opacity 0.25s',
            ...style,
          }}
          className={className}
          onClick={() => setIsZoomed(true)}
        />

        <button
          type="button"
          onClick={() => setIsZoomed(true)}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(6, 9, 18, 0.75)',
            color: 'var(--text)',
            border: '1px solid var(--line2)',
            borderRadius: '8px',
            padding: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            backdropFilter: 'blur(6px)',
          }}
          title="گەورەکردن"
        >
          <Maximize2 size={14} />
        </button>

        <a
          href={`https://drive.google.com/file/d/${fileId}/view?usp=sharing`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: 'rgba(6, 9, 18, 0.82)',
            color: 'var(--text)',
            border: '1px solid var(--line2)',
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '0.74rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            textDecoration: 'none',
            backdropFilter: 'blur(6px)',
          }}
        >
          <ExternalLink size={12} />
          <span>گووگڵ درایڤ</span>
        </a>
      </div>

      {/* Zoom Modal */}
      {isZoomed && (
        <div
          onClick={() => setIsZoomed(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: 'zoom-out',
          }}
        >
          <button
            type="button"
            onClick={() => setIsZoomed(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
          <img
            src={currentSrc}
            alt={alt}
            referrerPolicy="no-referrer"
            style={{
              maxWidth: '94vw',
              maxHeight: '92vh',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            }}
          />
        </div>
      )}
    </>
  );
};

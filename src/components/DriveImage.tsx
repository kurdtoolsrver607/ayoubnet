import React, { useState } from 'react';
import { extractDriveFileId, GOOGLE_DRIVE_WEBAPP_URL } from '../firebase';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';

interface DriveImageProps {
  url: string;
  alt?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const DriveImage: React.FC<DriveImageProps> = ({ url, alt = '', style, className }) => {
  const fileId = extractDriveFileId(url);
  const [retryIndex, setRetryIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // If not a Google Drive URL, use the raw url with no-referrer
  if (!fileId) {
    return (
      <img
        src={url}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        style={{
          maxWidth: '100%',
          borderRadius: '12px',
          display: 'block',
          border: '1px solid var(--line)',
          ...style,
        }}
        className={className}
      />
    );
  }

  // List of high-reliability image endpoints
  const sources = [
    `https://lh3.googleusercontent.com/d/${fileId}=s1200`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`,
    `${GOOGLE_DRIVE_WEBAPP_URL}?id=${fileId}`,
    `https://docs.google.com/uc?export=view&id=${fileId}`,
  ];

  const currentSrc = sources[retryIndex] || sources[0];

  const handleImageError = () => {
    if (retryIndex < sources.length - 1) {
      setRetryIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div
        style={{
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px dashed var(--line2)',
          borderRadius: '12px',
          textAlign: 'center',
          marginTop: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '8px' }}>
          <ImageIcon size={18} />
          <span>وێنەی بڵاوکراوە لە گووگڵ درایڤ</span>
        </div>
        <a
          href={`https://drive.google.com/file/d/${fileId}/view?usp=sharing`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          style={{ padding: '6px 14px', fontSize: '0.82rem', gap: '6px' }}
        >
          <ExternalLink size={14} />
          <span>کردنەوە و بینینی وێنە</span>
        </a>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', marginTop: '8px' }}>
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={handleImageError}
        style={{
          maxWidth: '100%',
          width: 'auto',
          maxHeight: '520px',
          borderRadius: '12px',
          display: 'block',
          border: '1px solid var(--line)',
          objectFit: 'contain',
          ...style,
        }}
        className={className}
      />
    </div>
  );
};

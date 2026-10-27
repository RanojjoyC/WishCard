import React, { useState } from 'react';
import { Package } from 'lucide-react';

const ProductThumbnail = ({ 
  src, 
  alt = 'Product image', 
  width = 64, 
  height = 64, 
  borderRadius = '10px',
  style = {}
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          minWidth: typeof width === 'number' ? `${width}px` : width,
          minHeight: typeof height === 'number' ? `${height}px` : height,
          borderRadius,
          background: 'var(--bg-subtle, #f3f0ea)',
          border: '1px solid var(--border-light, #e4ded5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted, #7c766e)',
          ...style
        }}
        title={alt}
      >
        <Package size={Math.max(16, Math.min(32, Math.round((typeof width === 'number' ? width : 60) * 0.35)))} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        minWidth: typeof width === 'number' ? `${width}px` : width,
        minHeight: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
        objectFit: 'cover',
        border: '1px solid var(--border-light, #e4ded5)',
        background: 'var(--bg-subtle, #f3f0ea)',
        ...style
      }}
    />
  );
};

export default ProductThumbnail;

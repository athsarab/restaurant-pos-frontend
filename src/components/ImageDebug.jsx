import React from 'react';
import { getImageUrl } from '../utils/imageUtils';

const ImageDebug = () => {
  const testImage = '/uploads/dish-1759318849181-226043151.jpg';
  const generatedUrl = getImageUrl(testImage);
  
  console.log('Image Debug:', {
    isDev: import.meta.env.DEV,
    testImage,
    generatedUrl,
    apiBase: import.meta.env.VITE_API_BASE
  });

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      padding: '10px', 
      border: '1px solid #ccc',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Image Debug Info</h4>
      <p><strong>Environment:</strong> {import.meta.env.DEV ? 'Development' : 'Production'}</p>
      <p><strong>Original Path:</strong> {testImage}</p>
      <p><strong>Generated URL:</strong> {generatedUrl}</p>
      <p><strong>API Base:</strong> {import.meta.env.VITE_API_BASE}</p>
      
      <div style={{ marginTop: '10px' }}>
        <h5>Test Image:</h5>
        <img 
          src={generatedUrl} 
          alt="Test" 
          style={{ maxWidth: '100px', display: 'block' }}
          onLoad={() => console.log('✅ Debug image loaded:', generatedUrl)}
          onError={() => console.error('❌ Debug image failed:', generatedUrl)}
        />
      </div>
    </div>
  );
};

export default ImageDebug;
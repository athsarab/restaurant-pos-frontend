import React from 'react';
import { Download } from 'lucide-react';
import { useInventoryPDF } from '../hooks/useInventoryPDF';

/**
 * PDF Export Button Component
 * Provides a clean, reusable button for downloading inventory PDF reports
 */
export const PDFExportButton = ({ 
  inventoryData, 
  className = "",
  onSuccess,
  onError,
  variant = "default" // default, minimal, large
}) => {
  const { isGeneratingPDF, generatePDF } = useInventoryPDF();

  const handleClick = () => {
    generatePDF(inventoryData, onSuccess, onError);
  };

  // Variant styles
  const getButtonStyles = () => {
    const baseStyles = "flex items-center space-x-2 rounded transition-colors";
    
    switch (variant) {
      case 'minimal':
        return `${baseStyles} px-3 py-2 text-sm ${
          isGeneratingPDF 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-500 hover:bg-green-600'
        } text-white`;
      
      case 'large':
        return `${baseStyles} px-6 py-3 text-lg ${
          isGeneratingPDF 
            ? 'bg-gray-500 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700'
        } text-white`;
      
      default:
        return `${baseStyles} px-4 py-2 ${
          isGeneratingPDF 
            ? 'bg-gray-500 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700'
        } text-white`;
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isGeneratingPDF}
      className={`${getButtonStyles()} ${className}`}
      title="Download detailed inventory report as PDF"
    >
      <Download className={`${variant === 'large' ? 'w-5 h-5' : 'w-4 h-4'}`} />
      <span>
        {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
      </span>
    </button>
  );
};

export default PDFExportButton;
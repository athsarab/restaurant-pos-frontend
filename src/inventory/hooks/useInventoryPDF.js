import { useState } from 'react';
import { generateInventoryPDF } from '../utils/InventoryPDFGenerator';

/**
 * Custom hook for managing inventory PDF generation
 * Provides state management and error handling for PDF export functionality
 */
export const useInventoryPDF = () => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  /**
   * Generate PDF report with comprehensive inventory data
   * @param {Object} inventoryData - Complete inventory data object
   * @param {Function} onSuccess - Optional success callback
   * @param {Function} onError - Optional error callback
   */
  const generatePDF = async (inventoryData, onSuccess, onError) => {
    if (isGeneratingPDF) {
      console.warn('PDF generation already in progress');
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // Validate required data
      if (!inventoryData) {
        throw new Error('Inventory data is required');
      }

      // Ensure all required arrays exist
      const safeInventoryData = {
        items: inventoryData.items || [],
        packingItems: inventoryData.packingItems || [],
        kitchenItems: inventoryData.kitchenItems || [],
        lowStockItems: inventoryData.lowStockItems || [],
        lowStockInventoryItems: inventoryData.lowStockInventoryItems || [],
        lowStockPackingItems: inventoryData.lowStockPackingItems || [],
        lowStockKitchenItems: inventoryData.lowStockKitchenItems || [],
        expiredBatches: inventoryData.expiredBatches || [],
        nearExpiryBatches: inventoryData.nearExpiryBatches || [],
        inventoryValue: inventoryData.inventoryValue || { totalValue: 0, totalItems: 0 },
        summary: inventoryData.summary || null
      };

      const result = await generateInventoryPDF(safeInventoryData);

      if (result.success) {
        if (onSuccess) {
          onSuccess(result);
        } else {
          // Default success notification
          alert(result.message);
        }
      } else {
        throw new Error(result.message || 'Failed to generate PDF');
      }

    } catch (error) {
      console.error('PDF generation error:', error);
      
      if (onError) {
        onError(error);
      } else {
        // Default error notification
        alert(`Error generating PDF: ${error.message}`);
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return {
    isGeneratingPDF,
    generatePDF
  };
};
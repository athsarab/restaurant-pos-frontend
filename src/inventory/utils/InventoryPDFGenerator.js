import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatQuantity, formatPrice } from './numberUtils';

/**
 * Working Inventory PDF Report Generator
 * Generates detailed, user-friendly PDF reports for restaurant inventory management
 */
export class InventoryPDFGenerator {
  constructor() {
    this.doc = null;
    this.pageWidth = 0;
    this.pageHeight = 0;
    this.yPosition = 20;
  }

  /**
   * Initialize PDF document
   */
  initializePDF() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.yPosition = 20;
  }

  /**
   * Check if new page is needed and add it
   */
  checkAndAddPage(requiredSpace = 20) {
    if (this.yPosition + requiredSpace > this.pageHeight - 20) {
      this.doc.addPage();
      this.yPosition = 20;
      return true;
    }
    return false;
  }

  /**
   * Add report header with title and generation info
   */
  addReportHeader() {
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Inventory Report', this.pageWidth / 2, this.yPosition, { align: 'center' });
    this.yPosition += 15;

    // Date and Time
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('en-GB');
    const currentTime = new Date().toLocaleTimeString('en-GB');
    this.doc.text(`Generated on: ${currentDate} at ${currentTime}`, this.pageWidth / 2, this.yPosition, { align: 'center' });
    this.yPosition += 20;
  }

  /**
   * Add executive summary section
   */
  addExecutiveSummary(data) {
    const {
      items,
      packingItems,
      kitchenItems = [],
      inventoryValue,
      lowStockItems,
      lowStockInventoryItems = [],
      lowStockPackingItems = [],
      lowStockKitchenItems = [],
      expiredBatches,
      nearExpiryBatches,
      summary
    } = data;

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Executive Summary', 15, this.yPosition);
    this.yPosition += 10;

    const totalItems = items.length + packingItems.length + kitchenItems.length;

    const computedInventoryValue = summary?.inventoryTotalValue ?? items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const computedPackingValue = summary?.packingTotalValue ?? packingItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const computedKitchenValue = summary?.kitchenTotalValue ?? kitchenItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const totalValue = summary?.overallTotalValue ?? (computedInventoryValue + computedPackingValue + computedKitchenValue);

    const lowStockCount = lowStockItems.length;
    const expiredCount = expiredBatches.length;
    const nearExpiryCount = nearExpiryBatches.length;

    const summaryData = [
      ['Total Items', `${totalItems} (${items.length} inventory + ${packingItems.length} packing + ${kitchenItems.length} kitchen)`],
      ['Inventory Value', `LKR ${computedInventoryValue.toLocaleString()}`],
      ['Packing Value', `LKR ${computedPackingValue.toLocaleString()}`],
      ['Kitchen Value', `LKR ${computedKitchenValue.toLocaleString()}`],
      ['Overall Total Value', `LKR ${totalValue.toLocaleString()}`],
      ['Low Stock (Inventory)', `${lowStockInventoryItems.length} items`],
      ['Low Stock (Packing)', `${lowStockPackingItems.length} items`],
      ['Low Stock (Kitchen)', `${lowStockKitchenItems.length} items`],
      ['Low Stock (All)', `${lowStockCount} items need reordering`],
      ['Near Expiry Batches', `${nearExpiryCount} batches expiring soon`],
      ['Expired Batches', `${expiredCount} batches expired`],
      ['Last Updated', new Date().toLocaleString('en-GB')]
    ];

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      margin: { left: 15, right: 15 },
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' }
      },
      didDrawPage: (data) => {
        // Update position after table is drawn
        this.yPosition = data.cursor.y + 15;
      }
    });
  }

  /**
   * Add inventory items section organized by categories
   */
  addInventoryItemsSection(items) {
    if (items.length === 0) return;

    this.checkAndAddPage(30);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Inventory Items Detailed List', 15, this.yPosition);
    this.yPosition += 10;

    // Group items by category for better organization
    const itemsByCategory = items.reduce((acc, item) => {
      const categoryName = item.categoryId?.name || 'Uncategorized';
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(item);
      return acc;
    }, {});

    for (const [categoryName, categoryItems] of Object.entries(itemsByCategory)) {
      this.checkAndAddPage(40);
      
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`Category: ${categoryName}`, 15, this.yPosition);
      this.yPosition += 8;

      const tableData = categoryItems.map(item => {
        const stockStatus = item.quantity <= item.reorderLevel ? 'LOW STOCK' : 
                          item.quantity <= (item.reorderLevel * 2) ? 'MODERATE' : 'GOOD';
        
        return [
          item.name,
          item.description || 'N/A',
          `${formatQuantity(item.quantity)} ${item.unit}`,
          `LKR ${formatPrice(item.price)}`,
          `${formatQuantity(item.reorderLevel)} ${item.unit}`,
          stockStatus,
          item.supplierId?.name || 'N/A',
          `LKR ${formatPrice(item.quantity * item.price)}`
        ];
      });

      autoTable(this.doc, {
        startY: this.yPosition,
        head: [['Item Name', 'Description', 'Current Stock', 'Unit Price', 'Reorder Level', 'Status', 'Supplier', 'Total Value']],
        body: tableData,
        margin: { left: 15, right: 15 },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 25, fontStyle: 'bold' },
          1: { cellWidth: 30 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 18, halign: 'right' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 18, halign: 'center' },
          6: { cellWidth: 22 },
          7: { cellWidth: 20, halign: 'right' }
        },
        didParseCell: (data) => {
          if (data.column.index === 5) { // Status column
            if (data.cell.text[0] === 'LOW STOCK') {
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fillColor = [231, 76, 60];
            } else if (data.cell.text[0] === 'MODERATE') {
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fillColor = [243, 156, 18];
            } else {
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fillColor = [39, 174, 96];
            }
          }
        },
        didDrawPage: (data) => {
          this.yPosition = data.cursor.y + 10;
        }
      });
    }
  }

  /**
   * Add packing items section
   */
  addPackingItemsSection(packingItems) {
    if (packingItems.length === 0) return;

    this.checkAndAddPage(30);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Packing Items Detailed List', 15, this.yPosition);
    this.yPosition += 10;

    const packingTableData = packingItems.map(item => {
      const stockStatus = item.quantity <= item.reorderLevel ? 'LOW STOCK' : 
                        item.quantity <= (item.reorderLevel * 2) ? 'MODERATE' : 'GOOD';
      
      return [
        item.name,
        item.description || 'N/A',
        `${formatQuantity(item.quantity)} ${item.unit}`,
        `LKR ${formatPrice(item.price)}`,
        `${formatQuantity(item.reorderLevel)} ${item.unit}`,
        stockStatus,
        `LKR ${formatPrice(item.quantity * item.price)}`
      ];
    });

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [['Item Name', 'Description', 'Current Stock', 'Unit Price', 'Reorder Level', 'Status', 'Total Value']],
      body: packingTableData,
      margin: { left: 15, right: 15 },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [155, 89, 182], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { cellWidth: 35 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 25, halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.column.index === 5) { // Status column
          if (data.cell.text[0] === 'LOW STOCK') {
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fillColor = [231, 76, 60];
          } else if (data.cell.text[0] === 'MODERATE') {
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fillColor = [243, 156, 18];
          } else {
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fillColor = [39, 174, 96];
          }
        }
      },
      didDrawPage: (data) => {
        this.yPosition = data.cursor.y + 15;
      }
    });
  }

  /**
   * Add kitchen items section
   */
  addKitchenItemsSection(kitchenItems) {
    if (!kitchenItems || kitchenItems.length === 0) return;

    this.checkAndAddPage(30);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Kitchen Items Detailed List', 15, this.yPosition);
    this.yPosition += 10;

    const kitchenTableData = kitchenItems.map(item => {
      const displayVariant = item.variant || item.description || 'N/A';
      const displayColor = item.handleColor || item.color || 'N/A';
      const unit = item.unit || 'pcs';

      return [
        item.name,
        displayVariant,
        item.size || 'N/A',
        displayColor,
        item.location || 'N/A',
        `${formatQuantity(item.quantity)} ${unit}`,
        `LKR ${formatPrice(item.price)}`,
        `LKR ${formatPrice(item.quantity * item.price)}`
      ];
    });

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [['Item Name', 'Variant', 'Size', 'Color', 'Location', 'Count', 'Unit Price', 'Total Value']],
      body: kitchenTableData,
      margin: { left: 15, right: 15 },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: 'bold' },
        1: { cellWidth: 30 },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 22 },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 22, halign: 'right' },
        7: { cellWidth: 23, halign: 'right' }
      },
      didDrawPage: (data) => {
        this.yPosition = data.cursor.y + 15;
      }
    });
  }

  /**
   * Add low stock alerts section
   */
  addLowStockAlertsSection(lowStockItems) {
    if (lowStockItems.length === 0) return;

    this.checkAndAddPage(30);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(231, 76, 60); // Red color
    this.doc.text('[ALERT] LOW STOCK ALERTS - Immediate Action Required', 15, this.yPosition);
    this.doc.setTextColor(0, 0, 0); // Reset to black
    this.yPosition += 10;

    const lowStockTableData = lowStockItems.map(item => [
      item.name,
      `${formatQuantity(item.quantity)} ${item.unit}`,
      `${formatQuantity(item.reorderLevel)} ${item.unit}`,
      `${formatQuantity(item.maxOrderLevel || item.reorderLevel * 3)} ${item.unit}`,
      item.supplierId?.name || 'N/A',
      `${Math.max(0, Math.round(((item.reorderLevel - item.quantity) / item.reorderLevel) * 100))}%`
    ]);

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [['Item Name', 'Current Stock', 'Reorder Level', 'Suggested Order', 'Supplier', 'Shortage %']],
      body: lowStockTableData,
      margin: { left: 15, right: 15 },
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { fillColor: [254, 245, 245] },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        5: { halign: 'center', fontStyle: 'bold' }
      },
      didDrawPage: (data) => {
        this.yPosition = data.cursor.y + 15;
      }
    });
  }

  /**
   * Add batch expiry information section
   */
  addBatchExpirySection({ expiredBatches, nearExpiryBatches }) {
    if (nearExpiryBatches.length === 0 && expiredBatches.length === 0) return;

    this.checkAndAddPage(30);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Batch Expiry Information', 15, this.yPosition);
    this.yPosition += 10;

    // Expired Batches
    if (expiredBatches.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(231, 76, 60);
      this.doc.text('[URGENT] Expired Batches (Immediate Action Required)', 15, this.yPosition);
      this.doc.setTextColor(0, 0, 0);
      this.yPosition += 8;

      const expiredTableData = expiredBatches.slice(0, 10).map(batch => [
        batch.itemId?.name || 'Unknown',
        batch.batchNumber || 'N/A',
        `${formatQuantity(batch.quantity)} ${batch.itemId?.unit}`,
        new Date(batch.expiryDate).toLocaleDateString('en-GB'),
        `${Math.ceil((new Date() - new Date(batch.expiryDate)) / (1000 * 60 * 60 * 24))} days`,
        `LKR ${formatPrice(batch.quantity * (batch.unitPrice || 0))}`
      ]);

      autoTable(this.doc, {
        startY: this.yPosition,
        head: [['Item', 'Batch #', 'Quantity', 'Expired On', 'Days Overdue', 'Loss Value']],
        body: expiredTableData,
        margin: { left: 15, right: 15 },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [231, 76, 60], textColor: 255 },
        bodyStyles: { fillColor: [254, 245, 245] },
        columnStyles: {
          3: { halign: 'center' },
          4: { halign: 'center', fontStyle: 'bold' },
          5: { halign: 'right' }
        },
        didDrawPage: (data) => {
          this.yPosition = data.cursor.y + 10;
        }
      });
    }

    // Near Expiry Batches
    if (nearExpiryBatches.length > 0) {
      this.checkAndAddPage(20);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(243, 156, 18);
      this.doc.text('[WARNING] Near Expiry Batches (Use Soon)', 15, this.yPosition);
      this.doc.setTextColor(0, 0, 0);
      this.yPosition += 8;

      const nearExpiryTableData = nearExpiryBatches.slice(0, 10).map(batch => [
        batch.itemId?.name || 'Unknown',
        batch.batchNumber || 'N/A',
        `${formatQuantity(batch.quantity)} ${batch.itemId?.unit}`,
        new Date(batch.expiryDate).toLocaleDateString('en-GB'),
        `${Math.ceil((new Date(batch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} days`
      ]);

      autoTable(this.doc, {
        startY: this.yPosition,
        head: [['Item', 'Batch #', 'Quantity', 'Expires On', 'Days Left']],
        body: nearExpiryTableData,
        margin: { left: 15, right: 15 },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [243, 156, 18], textColor: 255 },
        bodyStyles: { fillColor: [254, 251, 245] },
        columnStyles: {
          3: { halign: 'center' },
          4: { halign: 'center', fontStyle: 'bold' }
        },
        didDrawPage: (data) => {
          this.yPosition = data.cursor.y + 15;
        }
      });
    }
  }

  /**
   * Add page footers to all pages
   */
  addPageFooters() {
    const totalPages = this.doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(128, 128, 128);
      this.doc.text(`Page ${i} of ${totalPages}`, this.pageWidth - 25, this.pageHeight - 10, { align: 'right' });
      this.doc.text('Generated by Restaurant Management System', 15, this.pageHeight - 10);
    }
  }

  /**
   * Generate and download the complete PDF report
   */
  async generateReport(inventoryData) {
    try {
      this.initializePDF();

      // Add all sections
      this.addReportHeader();
      this.addExecutiveSummary(inventoryData);
      this.addInventoryItemsSection(inventoryData.items);
      this.addPackingItemsSection(inventoryData.packingItems);
      this.addKitchenItemsSection(inventoryData.kitchenItems);
      this.addLowStockAlertsSection(inventoryData.lowStockItems);
      this.addBatchExpirySection({
        expiredBatches: inventoryData.expiredBatches,
        nearExpiryBatches: inventoryData.nearExpiryBatches
      });

      // Add page footers
      this.addPageFooters();

      // Generate filename and save
      const fileName = `Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      this.doc.save(fileName);
      
      return {
        success: true,
        fileName: fileName,
        message: `Inventory report downloaded successfully as ${fileName}`
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return {
        success: false,
        error: error.message,
        message: 'Error generating PDF report. Please try again.'
      };
    }
  }
}

/**
 * Convenience function to generate inventory PDF report
 * @param {Object} inventoryData - Complete inventory data object
 * @returns {Promise<Object>} Result object with success status and message
 */
export const generateInventoryPDF = async (inventoryData) => {
  const generator = new InventoryPDFGenerator();
  return await generator.generateReport(inventoryData);
};
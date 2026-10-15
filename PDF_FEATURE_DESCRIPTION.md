# Inventory PDF Report Feature

## Overview
A comprehensive PDF export functionality has been added to the Inventory Management page that generates detailed, user-friendly reports of your restaurant's inventory status.

## What's Included in the PDF Report:

### 📊 **Executive Summary Section**
- Total inventory items (both inventory and packing items)
- Complete inventory value in LKR
- Number of low stock items requiring attention
- Batch expiry alerts (near expiry and expired)
- Report generation timestamp

### 📋 **Detailed Inventory Lists**

#### **Inventory Items by Category**
- Items organized by categories (e.g., Vegetables, Meat, Spices, etc.)
- Comprehensive details for each item:
  - Item name and description
  - Current stock quantity with units
  - Unit price and total value
  - Reorder level settings
  - Stock status (Good/Moderate/Low Stock) with color coding
  - Supplier information

#### **Packing Items Section**
- Complete list of packing materials (cups, containers, cutlery, etc.)
- Stock levels, pricing, and reorder information
- Color-coded status indicators

### 🚨 **Critical Alerts Section**

#### **Low Stock Alerts**
- Dedicated section highlighting items needing immediate reordering
- Shows current stock vs. reorder level
- Suggested order quantities
- Supplier contact information
- Shortage percentage calculations

#### **Batch Expiry Management**
- **Expired Batches**: Items that have already expired with loss values
- **Near Expiry Batches**: Items expiring within the next few days
- Batch numbers and expiry dates
- Financial impact of expired items

## Features:

### 🎨 **User-Friendly Design**
- Professional formatting with clear headers and sections
- Color-coded status indicators (Red for critical, Yellow for warning, Green for good)
- Organized tables with proper spacing and alignment
- Page numbers and generation timestamps

### 📱 **Smart Layout**
- Automatic page breaks for readability
- Consistent formatting across all sections
- Proper margins and spacing
- Professional header and footer on each page

### 📈 **Business Intelligence**
- Summary metrics for quick overview
- Category-wise organization for better inventory management
- Financial impact analysis of expired items
- Actionable insights for purchasing decisions

## How to Use:

1. **Navigate** to the Inventory Management page
2. **Click** the green "Download PDF" button in the top-right corner
3. **Wait** for the report generation (button shows "Generating..." status)
4. **Download** automatically starts with filename format: `Inventory_Report_YYYY-MM-DD.pdf`

## Technical Features:

- **Real-time Data**: Report reflects current inventory status
- **Comprehensive Coverage**: Includes all inventory and packing items
- **Error Handling**: Graceful handling of missing data
- **Performance Optimized**: Efficient PDF generation with progress indication
- **Mobile Responsive**: Works on all devices

## File Naming Convention:
Reports are automatically named with the current date: `Inventory_Report_2024-11-19.pdf`

This feature provides restaurant managers with a complete overview of their inventory status, helping them make informed purchasing decisions and maintain optimal stock levels.
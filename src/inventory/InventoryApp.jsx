import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import StockRequests from './pages/StockRequests';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Layout from './components/Layout';
import './index.css';
import { DomainProvider } from './context/DomainContext';
import { Toaster } from 'react-hot-toast';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import SupplierPayments from './pages/SupplierPayments';
import Transactions from './pages/Transactions';
import Staff from './pages/Staff';
import Usage from './pages/Usage';
import MenuManagement from './pages/MenuManagement';
import OldKitchenDashboard from './pages/KitchenDashboard';
import MenuAnalytics from './pages/MenuAnalytics';
import MenuPackingManagement from './pages/MenuPackingManagement';
import CashierDashboard from './components/CashierDashboard';
import NewKitchenDashboard from './components/KitchenDashboard';
import WaiterDashboard from './components/WaiterDashboard';
import OrderAnalytics from './components/OrderAnalytics';
import WastageManagement from './components/WastageManagement';
import OutOfStockManagement from './components/OutOfStockManagement';
import SMSCampaigns from './pages/SMSCampaigns';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import { withRoleProtection } from './utils/roleProtection.jsx';
import { withPermissionProtection } from './utils/permissionProtection.jsx';
import PurchaseOrder from './pages/PurchaseOrder';
import GRNReport from './pages/GRNReport';
import DeliveryManagementPage from './pages/DeliveryManagementPage';
import DeliveryAnalyticsPage from './pages/DeliveryAnalyticsPage';
import DeliveryHistoryPage from './pages/DeliveryHistoryPage';
import PermissionsManagement from './pages/PermissionsManagement';
import { PermissionsProvider } from './context/PermissionsContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import StockIssue from './pages/StockIssue';
import ProductionPlanning from './pages/ProductionPlanning';
import BakeryProductionEntry from './pages/BakeryProductionEntry';
import StockIssueHistory from './pages/StockIssueHistory';
import KitchenInventory from './pages/KitchenInventory';

function InventoryToaster() {
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? '#1e293b' : '#ffffff',
          color: isDark ? '#f1f5f9' : '#0f172a',
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: isDark ? '#f1f5f9' : '#0f172a',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: isDark ? '#f1f5f9' : '#0f172a',
          },
        },
      }}
    />
  );
}

// Protected components with role restrictions
const ProtectedDashboard = withPermissionProtection(Dashboard, { featureKey: 'dashboard', featureLabel: 'Dashboard' });
const ProtectedInventory = withPermissionProtection(Inventory, { featureKey: 'inventory', featureLabel: 'Inventory' });
const ProtectedReports = withPermissionProtection(Reports, { featureKey: 'reportsAnalytics', featureLabel: 'Reports & Analytics' });
const ProtectedCategories = withPermissionProtection(Categories, { featureKey: 'categories', featureLabel: 'Categories' });
const ProtectedSuppliers = withPermissionProtection(Suppliers, { featureKey: 'suppliers', featureLabel: 'Suppliers' });
const ProtectedSupplierPayments = withPermissionProtection(SupplierPayments, { featureKey: 'supplierPayments', featureLabel: 'Supplier Payments' });
const ProtectedTransactions = withPermissionProtection(Transactions, { featureKey: 'transactions', featureLabel: 'All Transactions' });
const ProtectedStaff = withPermissionProtection(Staff, { featureKey: 'staffManagement', featureLabel: 'Staff Management' });
const ProtectedMenuManagement = withPermissionProtection(MenuManagement, { featureKey: 'menuRecipes', featureLabel: 'Menu & Recipes' });
const ProtectedMenuPackingManagement = withPermissionProtection(MenuPackingManagement, { featureKey: 'menuPacking', featureLabel: 'Menu Packing' });
const ProtectedOldKitchenDashboard = withPermissionProtection(OldKitchenDashboard, { featureKey: 'kitchenDashboard', featureLabel: 'Kitchen Dashboard' });
const ProtectedMenuAnalytics = withPermissionProtection(MenuAnalytics, { featureKey: 'menuAnalytics', featureLabel: 'Menu Analytics' });

// GRN Management
const ProtectedPurchaseOrder = withPermissionProtection(PurchaseOrder, { featureKey: 'purchaseOrderGrn', featureLabel: 'Purchase Order / GRN' });
const ProtectedGRNReport = withPermissionProtection(GRNReport, { featureKey: 'grnReport', featureLabel: 'GRN Report' });

// New Order Management Dashboards
const ProtectedCashierDashboard = withPermissionProtection(CashierDashboard, { featureKey: 'cashierDashboard', featureLabel: 'Cashier Dashboard' });
const ProtectedKitchenOrderDashboard = withPermissionProtection(NewKitchenDashboard, { featureKey: 'kitchenOrders', featureLabel: 'Kitchen Orders' });
// Waiter role exists in the system; keep a role-based gate plus permissions (admin still sees it).
const ProtectedWaiterDashboard = withRoleProtection(
  withPermissionProtection(WaiterDashboard, { featureKey: 'waiterDashboard', featureLabel: 'Waiter Dashboard' }),
  ['admin', 'waiter']
);
const ProtectedOrderAnalytics = withPermissionProtection(OrderAnalytics, { featureKey: 'orderAnalytics', featureLabel: 'Order Analytics' });

// New Wastage and Stock Management
const ProtectedWastageManagement = withPermissionProtection(WastageManagement, { featureKey: 'wastageManagement', featureLabel: 'Wastage Management' });
const ProtectedOutOfStockManagement = withPermissionProtection(OutOfStockManagement, { featureKey: 'outOfStock', featureLabel: 'Out of Stock' });

// SMS Campaign Management
const ProtectedSMSCampaigns = withPermissionProtection(SMSCampaigns, { featureKey: 'smsCampaigns', featureLabel: 'SMS Campaigns' });

// Delivery
const ProtectedDeliveryManagement = withPermissionProtection(DeliveryManagementPage, { featureKey: 'deliveryManagement', featureLabel: 'Delivery Management' });
const ProtectedDeliveryAnalytics = withPermissionProtection(DeliveryAnalyticsPage, { featureKey: 'deliveryAnalytics', featureLabel: 'Delivery Analytics' });
const ProtectedDeliveryHistory = withPermissionProtection(DeliveryHistoryPage, { featureKey: 'deliveryHistory', featureLabel: 'Delivery History' });

// Admin: Access Control
const ProtectedPermissionsManagement = withPermissionProtection(PermissionsManagement, { featureKey: 'accessControl', featureLabel: 'Access Control' });

// New: multi-location stock flows
const ProtectedStockIssue = withPermissionProtection(StockIssue, { featureKey: 'stockIssue', featureLabel: 'Stock Issue' });
const ProtectedProductionPlanning = withPermissionProtection(ProductionPlanning, { featureKey: 'productionPlanning', featureLabel: 'Production Planning' });
const ProtectedBakeryProductionEntry = withPermissionProtection(BakeryProductionEntry, { featureKey: 'bakeryProductionEntry', featureLabel: 'Bakery Production Entry' });
const ProtectedStockIssueHistory = withPermissionProtection(StockIssueHistory, { featureKey: 'stockIssueHistory', featureLabel: 'Stock Issue History' });
const ProtectedKitchenInventory = withPermissionProtection(KitchenInventory, { featureKey: 'kitchenInventory', featureLabel: 'Kitchen Inventory' });

// Stock Requests + Usage
const ProtectedStockRequests = withPermissionProtection(StockRequests, { featureKey: 'stockRequests', featureLabel: 'Stock Requests' });
const ProtectedUsage = withPermissionProtection(Usage, { featureKey: 'kitchenUsage', featureLabel: 'Kitchen Usage' });

function InventoryApp() {
  const isAuthed = Boolean(localStorage.getItem('token'));
  
  return (
    <ThemeProvider>
      <DomainProvider>
        <PermissionsProvider>
          <InventoryToaster />
          <Routes>
            <Route path="login" element={<Login />} />
            <Route
              element={
                isAuthed ? (
                  <Layout />
                ) : (
                  <Navigate to="login" replace />
                )
              }
            >
              <Route index element={<RoleBasedRedirect />} />
              <Route path="dashboard" element={<ProtectedDashboard />} />
              <Route path="inventory" element={<ProtectedInventory />} />
              <Route path="requests" element={<ProtectedStockRequests />} />
              <Route path="usage" element={<ProtectedUsage />} />
              <Route path="reports" element={<ProtectedReports />} />
              <Route path="categories" element={<ProtectedCategories />} />
              <Route path="suppliers" element={<ProtectedSuppliers />} />
              <Route path="supplier-payments" element={<ProtectedSupplierPayments />} />
              <Route path="transactions" element={<ProtectedTransactions />} />
              <Route path="staff" element={<ProtectedStaff />} />
              <Route path="menu-management" element={<ProtectedMenuManagement />} />
              <Route path="menu-packing" element={<ProtectedMenuPackingManagement />} />
              <Route path="kitchen-dashboard" element={<ProtectedOldKitchenDashboard />} />
              <Route path="menu-analytics" element={<ProtectedMenuAnalytics />} />
              <Route path="sms-campaigns" element={<ProtectedSMSCampaigns />} />

              {/* GRN Management */}
              <Route path="purchase-order" element={<ProtectedPurchaseOrder />} />
              <Route path="grn-report" element={<ProtectedGRNReport />} />
              
              {/* New Order Management Dashboards */}
              <Route path="cashier-dashboard" element={<ProtectedCashierDashboard />} />
              <Route path="kitchen-orders" element={<ProtectedKitchenOrderDashboard />} />
              <Route path="waiter-dashboard" element={<ProtectedWaiterDashboard />} />
              <Route path="order-analytics" element={<ProtectedOrderAnalytics />} />

              {/* Delivery */}
              <Route path="delivery-management" element={<ProtectedDeliveryManagement />} />
              <Route path="delivery-analytics" element={<ProtectedDeliveryAnalytics />} />
              <Route path="delivery-history" element={<ProtectedDeliveryHistory />} />
              
              {/* New Wastage and Stock Management */}
              <Route path="wastage-management" element={<ProtectedWastageManagement />} />
              <Route path="out-of-stock" element={<ProtectedOutOfStockManagement />} />

              {/* Stock Issue & Production */}
              <Route path="stock-issue" element={<ProtectedStockIssue />} />
              <Route path="stock-issue-history" element={<ProtectedStockIssueHistory />} />
              <Route path="kitchen-inventory" element={<ProtectedKitchenInventory />} />
              <Route path="production-planning" element={<ProtectedProductionPlanning />} />
              <Route path="bakery-production" element={<ProtectedBakeryProductionEntry />} />

              {/* Admin */}
              <Route path="permissions" element={<ProtectedPermissionsManagement />} />
            </Route>
            <Route path="*" element={<div className="p-6">Not Found</div>} />
          </Routes>
        </PermissionsProvider>
      </DomainProvider>
    </ThemeProvider>
  );
}

export default InventoryApp;
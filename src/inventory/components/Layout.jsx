import { NavLink, Outlet } from 'react-router-dom';
import { useDomain } from '../context/DomainContext';
import { useAuth } from '../hooks/useAuth';
import { useMemo, useState, useEffect } from 'react';
import menuConfig from '../rbac/menuConfig.json';
import { usePermissions } from '../context/PermissionsContext';
import { canViewFeature } from '../rbac/permissionUtils';
import { useTheme } from '../context/ThemeContext';
import {
  HomeModernIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  TagIcon,
  TruckIcon,
  BanknotesIcon,
  CurrencyRupeeIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  WrenchScrewdriverIcon,
  BookOpenIcon,
  BeakerIcon,
  PresentationChartLineIcon,
  ComputerDesktopIcon,
  ClipboardDocumentCheckIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftEllipsisIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

const SidebarItem = ({ to, label, icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-red-600 text-white shadow-lg' 
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`
    }
  >
    {icon && <span className="mr-3 flex-shrink-0">{icon}</span>}
    <span className="truncate">{label}</span>
  </NavLink>
);

export default function Layout({ children }) {
  const { domain, setDomain } = useDomain();
  const { user } = useAuth();
  const { permissionsByRole, loading: permissionsLoading } = usePermissions();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Prevent the document from scrolling; only the content pane should scroll.
    document.body.classList.add('inventory-lock');
    return () => {
      document.body.classList.remove('inventory-lock');
    };
  }, []);

  const iconMap = useMemo(
    () => ({
      HomeModernIcon,
      CubeIcon,
      ClipboardDocumentListIcon,
      ChartBarIcon,
      TagIcon,
      TruckIcon,
      BanknotesIcon,
      CurrencyRupeeIcon,
      UsersIcon,
      WrenchScrewdriverIcon,
      BookOpenIcon,
      BeakerIcon,
      PresentationChartLineIcon,
      ComputerDesktopIcon,
      ClipboardDocumentCheckIcon,
      TrashIcon,
      ExclamationTriangleIcon,
      ChatBubbleLeftEllipsisIcon
    }),
    []
  );

  const storageKey = 'inventory_active_tab_v1';
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) return saved;
    if (user?.role === 'kitchen' || user?.role === 'cashier') return 'operations';
    return 'overview';
  });

  useEffect(() => {
    // Re-evaluate default tab when user changes (first load).
    if (!user?.role) return;
    const saved = localStorage.getItem(storageKey);
    if (saved) return;
    setActiveTab(user.role === 'kitchen' || user.role === 'cashier' ? 'operations' : 'overview');
  }, [user?.role]);

  useEffect(() => {
    localStorage.setItem(storageKey, activeTab);
  }, [activeTab]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Close the sidebar when switching to desktop.
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };
  
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'accountant': return 'text-blue-400';
      case 'kitchen': return 'text-green-400';
      case 'cashier': return 'text-purple-400';
      case 'waiter': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  const visibleItems = useMemo(() => {
    if (!user?.role || permissionsLoading) return [];

    const role = user.role;

    return (menuConfig.items || []).filter((item) => {
      // Domain gating (delivery is restaurant-only).
      if (
        domain !== 'restaurant' &&
        (item.key === 'deliveryManagement' || item.key === 'deliveryAnalytics' || item.key === 'deliveryHistory')
      ) {
        return false;
      }

      return canViewFeature(permissionsByRole, role, item.key);
    });
  }, [user?.role, permissionsByRole, permissionsLoading, domain]);

  const availableTabs = useMemo(() => {
    const itemsByTab = new Set(visibleItems.map((i) => i.tab));
    return (menuConfig.tabs || []).filter((t) => itemsByTab.has(t.key));
  }, [visibleItems]);

  const sidebarGroups = useMemo(() => {
    const itemsForTab = visibleItems.filter((i) => i.tab === activeTab);
    const groups = new Map();
    for (const item of itemsForTab) {
      const groupName = item.group || 'General';
      if (!groups.has(groupName)) groups.set(groupName, []);
      groups.get(groupName).push(item);
    }
    return Array.from(groups.entries());
  }, [visibleItems, activeTab]);

  useEffect(() => {
    // If tab becomes unavailable (due to role/domain changes), pick the first available.
    if (!availableTabs.length) return;
    if (!availableTabs.some((t) => t.key === activeTab)) {
      setActiveTab(availableTabs[0].key);
    }
  }, [availableTabs, activeTab]);
  
  return (
    <div
      className={`inventory-app flex min-h-[100dvh] ${theme === 'dark' ? 'dark' : ''}`}
      data-theme={theme}
    >
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`inventory-sidebar fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-red-400">RIMS</h1>
            <div className="text-xs text-muted-foreground">v10.0</div>
          </div>
          <div className="mt-2">
            <select
              className="form-select text-sm"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            >
              <option value="office">Office Inventory</option>
              <option value="restaurant">Restaurant Inventory</option>
            </select>
          </div>
        </div>

        {/* Navigation - Now Scrollable */}
        <nav className="inventory-sidebar-nav p-4 space-y-4">
          {permissionsLoading ? (
            <div className="text-sm text-muted-foreground">Loading navigation…</div>
          ) : sidebarGroups.length ? (
            sidebarGroups.map(([groupName, groupItems]) => (
              <div key={groupName}>
                <div className="pt-1 pb-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {groupName}
                  </div>
                </div>
                <div className="space-y-2">
                  {groupItems.map((item) => {
                    const Icon = iconMap[item.icon];
                    return (
                      <SidebarItem
                        key={item.key}
                        to={item.path}
                        label={item.label}
                        icon={Icon ? <Icon className="w-5 h-5" /> : null}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No features available.</div>
          )}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="text-xs text-muted-foreground">
            <div>Sri Lanka • LKR</div>
            <div className="mt-1">
              Logged in as{' '}
              <span className={`font-medium ${getRoleColor(user?.role)}`}>
                {user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Guest'}
              </span>
            </div>
            <div className="mt-1 text-muted-foreground/80">{user?.name || 'Anonymous'}</div>
            <button 
              onClick={handleLogout}
              className="mt-2 inline-flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="inventory-main">
        {/* Top Bar */}
        <header className="inventory-header">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="lg:hidden inline-flex items-center justify-center rounded-lg border border-border bg-card p-2 text-foreground hover:bg-accent"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-foreground capitalize">
                {domain} Inventory Management
              </h2>
            </div>
            {/* Header Tabs */}
            <div className="flex flex-wrap gap-2">
              {availableTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    activeTab === tab.key
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-2 sm:gap-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-accent"
                  aria-label="Toggle light/dark theme"
                >
                  {theme === 'dark' ? (
                    <>
                      <SunIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Light</span>
                    </>
                  ) : (
                    <>
                      <MoonIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Dark</span>
                    </>
                  )}
                </button>

                {sidebarOpen && (
                  <button
                    type="button"
                    className="lg:hidden inline-flex items-center justify-center rounded-lg border border-border bg-card p-2 text-foreground hover:bg-accent"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close navigation"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-LK', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">{user?.name || 'User'}</div>
                  <div className={`text-xs ${getRoleColor(user?.role)}`}>
                    {user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Guest'}
                  </div>
                </div>
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {(user?.name && user.name.charAt(0).toUpperCase()) || 'U'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="inventory-content">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}

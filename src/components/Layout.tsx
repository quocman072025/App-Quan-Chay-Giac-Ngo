import { ReactNode, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  LogOut,
  History as HistoryIcon,
  Settings,
  Menu,
  X,
} from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const { userRole, activeTab, setActiveTab, setUserRole } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'pos', label: 'Bán hàng (POS)', icon: ShoppingCart, roles: ['admin', 'staff'] },
    { id: 'kitchen', label: 'Bếp', icon: ChefHat, roles: ['admin', 'staff', 'kitchen'] },
    { id: 'history', label: 'Lịch sử bán hàng', icon: HistoryIcon, roles: ['admin', 'staff'] },
    { id: 'dashboard', label: 'Báo cáo', icon: LayoutDashboard, roles: ['admin'] },
    { id: 'menu-options', label: '⚙️ Tùy chọn menu', icon: Settings, roles: ['admin'] },
  ];

  const roleNames = {
    admin: 'Quản lý',
    staff: 'Nhân viên',
    kitchen: 'Bếp',
  };

  const handleChangeTab = (tab: 'pos' | 'kitchen' | 'history' | 'dashboard' | 'menu-options') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setUserRole(null);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden min-h-0">
      {/* Overlay mobile */}
      {mobileMenuOpen && (
        <button
          aria-label="Đóng menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:w-64 xl:w-72 bg-white border-r border-gray-200 flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <div className="bg-lime-100 p-2 rounded-lg w-12 h-12 flex items-center justify-center overflow-hidden shrink-0">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-gray-800 leading-tight text-xl">Giác Ngộ</h1>
            <p className="text-sm text-lime-600 font-medium">Tiệm Chay</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems
            .filter((item) => item.roles.includes(userRole || ''))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => handleChangeTab(item.id as 'pos' | 'kitchen' | 'history' | 'dashboard' | 'menu-options')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-lime-50 text-lime-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${
                    activeTab === item.id ? 'text-lime-600' : 'text-gray-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="mb-4 px-4">
            <p className="text-sm text-gray-500">Đang đăng nhập:</p>
            <p className="font-medium text-gray-800 capitalize">
              {userRole ? roleNames[userRole] : ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất / Chốt ca
          </button>
        </div>
      </aside>

      {/* Sidebar mobile / tablet */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[84vw] max-w-[320px] bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-lime-100 p-2 rounded-lg w-11 h-11 flex items-center justify-center overflow-hidden shrink-0">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-gray-800 leading-tight text-lg">Giác Ngộ</h1>
              <p className="text-sm text-lime-600 font-medium">Tiệm Chay</p>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems
            .filter((item) => item.roles.includes(userRole || ''))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => handleChangeTab(item.id as 'pos' | 'kitchen' | 'history' | 'dashboard' | 'menu-options')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-lime-50 text-lime-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${
                    activeTab === item.id ? 'text-lime-600' : 'text-gray-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="mb-4 px-4">
            <p className="text-sm text-gray-500">Đang đăng nhập:</p>
            <p className="font-medium text-gray-800 capitalize">
              {userRole ? roleNames[userRole] : ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất / Chốt ca
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {/* Topbar mobile / tablet */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 shrink-0"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>

            <div className="min-w-0">
              <h2 className="font-bold text-gray-800 text-lg truncate">Giác Ngộ</h2>
              <p className="text-xs text-lime-600 font-medium truncate">Tiệm Chay</p>
            </div>
          </div>

          <div className="text-sm text-gray-500 font-medium shrink-0">
            {activeTab === 'pos'
              ? 'POS'
              : activeTab === 'kitchen'
              ? 'Bếp'
              : activeTab === 'history'
              ? 'Lịch sử'
              : activeTab === 'menu-options'
               ? 'Tùy chọn menu'
               : 'Báo cáo'}
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col min-w-0 min-h-0">{children}</main>
      </div>
    </div>
  );
}
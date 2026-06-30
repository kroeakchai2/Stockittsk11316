import React from 'react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: 'dashboard' | 'inventory' | 'members' | 'reports';
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'members' | 'reports') => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenNotifications
}: HeaderProps) {
  return (
    <header className="bg-surface border-b border-outline-variant sticky top-0 z-10">
      <div className="flex justify-between items-center w-full px-6 h-16 max-w-7xl mx-auto">
        
        {/* Brand & Desktop Horizontal Links */}
        <div className="flex items-center gap-8">
          {/* Brand Logo (Visible on mobile instead of desktop sidebar) */}
          <div className="flex items-center gap-2 md:hidden">
            <img 
              alt="Hospital Logo" 
              className="w-8 h-8 object-contain" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKO0gT9UDmykzCTefngVQsJT8OSK16Z3J8WcnpSSyoLgE87wPbi7k_HgIrp3MF9T-4fwSRFUSfQPZF0hl6Yz2wY_W5tNC48RTC_IswscIMhnbU-l5UDe4_JlzYuARvBlJdLS5ooIHeFmCh-uLJpQITP2Bob43HyMsHhCJcyD2_kNxxn0RMzlKF3EmYqnfSkCJeTz7zvsO_c_w-9dQyWQasd5VBdH2XcKKc0QJeOWxTC1SbKvvY3U0v9OIZ6ycqg3erW58YqE6L6V0"
            />
            <span className="font-bold text-primary text-lg">StockIT</span>
          </div>

          {/* Top Horizontal Links for quick navigation */}
          <nav className="hidden md:flex gap-6">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'dashboard' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              ภาพรวม
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'inventory' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              สินค้า
            </button>
            <button 
              onClick={() => setActiveTab('members')}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'members' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              สมาชิก
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'reports' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              ประวัติเบิกจ่าย
            </button>
          </nav>
        </div>

        {/* Search & Actions Area */}
        <div className="flex items-center gap-4">
          {/* Dynamic Search Box */}
          <div className="relative hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาข้อมูลในระบบ..."
              className="pl-10 pr-4 py-2 bg-surface-container rounded-full border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs w-60 transition-all focus:w-72"
            />
          </div>

          {/* Notification Button */}
          <button 
            onClick={onOpenNotifications}
            className="text-primary p-1 hover:bg-surface-container-low rounded-full transition-colors relative cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
          </button>

          {/* Settings Button */}
          <button 
            onClick={onOpenSettings}
            className="text-primary p-1 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>

          {/* Admin Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-outline-variant">
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden border border-outline-variant">
              <img 
                alt="Admin Profile" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGZC-66Mu6Hank3xjuVvIYylZntq0yrRasd1Ea9pwzjc7oN-QsYStCMOExwHdXekXwAH5Lirp7Hu5QAb6hwCfLc6wsbbplX5phWmYzkaDC_wdzKJbj2h8T5ZSwtADqOXuQAJ1uY7PNtsB89dsKsu6DOT9GHInw2NFnWRZnJ9_SPWtQO1X9r99gNgIGY63iVqukRzuOaTcGc-wl2uh6sSXij8DBYP3g_waII7DYDs_lPu_kncVIcCsLKPjRtKYEmI26-MBXQ9julTs"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-[11px] font-bold text-on-surface leading-none">Admin Room</p>
              <p className="text-[9px] text-on-surface-variant font-mono">kroeakchai@gmail.com</p>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}

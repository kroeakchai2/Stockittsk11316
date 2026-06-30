import React from 'react';

interface SidebarProps {
  activeTab: 'dashboard' | 'inventory' | 'members' | 'reports';
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'members' | 'reports') => void;
  onAddNewItem: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onAddNewItem }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col h-screen p-6 sticky top-0 w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 text-slate-300">
      {/* Brand Logo and Title */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight leading-none">StockIT</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">IT Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-grow space-y-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 rounded-md px-4 py-2.5 transition-colors cursor-pointer text-left text-sm ${
            activeTab === 'dashboard'
              ? 'bg-slate-800 text-white font-medium shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <span className="material-symbols-outlined text-xl opacity-80">dashboard</span>
          <span className="font-medium">แดชบอร์ด</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`w-full flex items-center gap-3 rounded-md px-4 py-2.5 transition-colors cursor-pointer text-left text-sm ${
            activeTab === 'inventory'
              ? 'bg-slate-800 text-white font-medium shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <span className="material-symbols-outlined text-xl opacity-80">inventory_2</span>
          <span className="font-medium">คลังสินค้า</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`w-full flex items-center gap-3 rounded-md px-4 py-2.5 transition-colors cursor-pointer text-left text-sm ${
            activeTab === 'members'
              ? 'bg-slate-800 text-white font-medium shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <span className="material-symbols-outlined text-xl opacity-80">group</span>
          <span className="font-medium">จัดการสมาชิก</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`w-full flex items-center gap-3 rounded-md px-4 py-2.5 transition-colors cursor-pointer text-left text-sm ${
            activeTab === 'reports'
              ? 'bg-slate-800 text-white font-medium shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <span className="material-symbols-outlined text-xl opacity-80">analytics</span>
          <span className="font-medium">รายงาน</span>
        </button>
      </nav>

      {/* Sidebar Footer Action */}
      <div className="mt-auto border-t border-slate-800 pt-5">
        <button 
          onClick={onAddNewItem}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 text-sm font-semibold mb-5 cursor-pointer transition-colors shadow-xs"
        >
          เพิ่มสินค้าใหม่
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            AD
          </div>
          <div className="text-left overflow-hidden">
            <div className="text-sm font-semibold text-white truncate">Administrator</div>
            <div className="text-xs text-slate-500 truncate">kroeakchai@gmail.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Toast from './Toast'

const adminNav = [
  { to: '/dashboard',   label: 'Dashboard',        icon: 'dashboard' },
  { to: '/staff',       label: 'Staff Directory',  icon: 'grid_view' },
  { to: '/privileges',  label: 'Staff Privileges', icon: 'admin_panel_settings' },
  { to: '/clients',     label: 'Client Directory', icon: 'people' },
  { to: '/obligations', label: 'Deadlines',        icon: 'timer' },
  { to: '/closings',    label: 'System Logs',      icon: 'terminal' },
  { to: '/settings',    label: 'Settings',         icon: 'settings' },
]

// HAPA: Tumeongeza "My Privileges" kwa ajili ya Staff
const staffNav = [
  { to: '/my-closings',   label: 'My Tasks',      icon: 'checklist' },
  { to: '/my-privileges', label: 'My Privileges', icon: 'admin_panel_settings' },
  { to: '/settings',      label: 'My Settings',   icon: 'settings' },
]

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const nav = useNavigate()
  
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const links = isAdmin() ? adminNav : staffNav

  function handleLogout() {
    setLoggingOut(true)
    setTimeout(() => {
      logout()
      nav('/login')
    }, 1000)
  }

  return (
    <div className="h-screen flex flex-col bg-[#faf8ff] font-sans">
      
      <Toast show={loggingOut} message="DISCONNECTING SESSION..." type="loading" />

      {/* HEADER (TOPBAR) */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-gray-200 bg-white shadow-[0_1px_12px_rgba(6,182,212,0.05)] z-40 sticky top-0">
        <div className="flex items-center gap-4">
          
          <button 
            className="md:hidden flex items-center justify-center w-8 h-8 text-slate-600 hover:bg-slate-100 transition-colors rounded"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          <button 
            className="hidden md:flex items-center justify-center w-8 h-8 bg-slate-50 text-slate-600 hover:bg-slate-200 transition-colors rounded"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title="Toggle Sidebar"
          >
            <span className="material-symbols-outlined text-[18px]">menu_open</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-500 shadow-[0_0_8px_#06b6d4] inline-block"></span>
            <h1 className="font-bold text-sm tracking-tight text-slate-800 uppercase">Deadline Tracker</h1>
            <span className="hidden sm:inline text-[10px] text-gray-400 uppercase tracking-widest font-mono">// {isAdmin() ? 'ADMIN' : 'STAFF'}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-gray-100 text-cyan-700 text-[10px] font-mono uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
            <span>System Online</span>
          </div>

          <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">{user?.name}</p>
              <p className="text-[9px] text-gray-400 font-mono uppercase">{user?.role}</p>
            </div>
            <div className="w-8 h-8 rounded bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <button 
              onClick={handleLogout} 
              disabled={loggingOut}
              className={`ml-2 p-1.5 rounded transition-colors ${
                loggingOut ? 'text-cyan-500 animate-pulse bg-cyan-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              title="Logout"
            >
              <span className="material-symbols-outlined text-[20px]">
                {loggingOut ? 'autorenew' : 'logout'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR YA DESKTOP */}
        <aside 
          className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-[72px]' : 'w-64'
          }`}
        >
          <div className={`h-10 flex items-center justify-between bg-slate-50/50 border-b border-gray-100 ${isCollapsed ? 'px-2 justify-center' : 'px-4'}`}>
            {!isCollapsed && <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Navigation</span>}
            {!isCollapsed && <span className="text-[10px] font-bold text-cyan-600 font-mono">v1.0</span>}
            {isCollapsed && <span className="w-2 h-2 bg-cyan-500"></span>}
          </div>

          <nav className="flex-1 py-3 px-2 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
            {links.map((l) => (
              <NavLink 
                key={l.to} 
                to={l.to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 transition-all rounded-sm ${
                    isActive 
                      ? 'bg-cyan-500 text-white font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
                title={isCollapsed ? l.label : undefined}
              >
                <span className={`material-symbols-outlined text-[20px] ${isCollapsed ? '' : 'opacity-80 group-hover:opacity-100'}`}>
                  {l.icon}
                </span>
                {!isCollapsed && (
                  <span className="text-xs uppercase tracking-wider font-mono whitespace-nowrap">
                    {l.label}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* SIDEBAR YA SIMU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex md:hidden">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <aside className="relative w-64 max-w-[80%] bg-white h-full shadow-2xl flex flex-col animate-slide-right">
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></span>
                <span className="font-bold text-sm tracking-tight text-slate-800 uppercase">Menu</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
              {links.map((l) => (
                <NavLink 
                  key={l.to} 
                  to={l.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-3 transition-all rounded-md ${
                      isActive 
                        ? 'bg-cyan-500 text-white font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {l.icon}
                  </span>
                  <span className="text-sm uppercase tracking-wider font-mono">
                    {l.label}
                  </span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.05)] border-t border-gray-200 flex items-center justify-around px-2 pb-safe">
        
        {/* 1. Home (Dashboard au My Closings) */}
        <NavLink to={isAdmin() ? '/dashboard' : '/my-closings'} className={({isActive}) => `flex flex-col items-center justify-center gap-1 w-14 h-full ${isActive ? 'text-cyan-600' : 'text-gray-400 hover:text-slate-800'}`}>
          <span className="material-symbols-outlined text-[22px]">dashboard</span>
          <span className="text-[9px] font-bold uppercase font-mono">Home</span>
        </NavLink>
        
        {/* 2. SBCs (Clients au My Privileges kwa Staff) */}
        <NavLink to={isAdmin() ? '/clients' : '/my-privileges'} className={({isActive}) => `flex flex-col items-center justify-center gap-1 w-14 h-full ${isActive ? 'text-cyan-600' : 'text-gray-400 hover:text-slate-800'}`}>
          <span className="material-symbols-outlined text-[22px]">grid_view</span>
          <span className="text-[9px] font-bold uppercase font-mono">{isAdmin() ? 'Clients' : 'Privileges'}</span>
        </NavLink>

        {/* 3. CENTER FLOATING BUTTON - INAONEKANA KWA ADMIN PEKEE */}
        {isAdmin() && (
          <div className="relative -top-4">
            <button 
              onClick={() => nav('/obligations?new=true')}
              className="w-14 h-14 bg-cyan-500 hover:bg-cyan-400 text-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(6,182,212,0.4)] transition-transform active:scale-95 border-4 border-white"
            >
              <span className="material-symbols-outlined text-[28px]">add</span>
            </button>
          </div>
        )}

        {/* 4. Alerts (Obligations kwa Admin, My Closings kwa Staff) */}
        <NavLink to={isAdmin() ? '/obligations' : '/my-closings'} className={({isActive}) => `flex flex-col items-center justify-center gap-1 w-14 h-full ${isActive ? 'text-cyan-600' : 'text-gray-400 hover:text-slate-800'}`}>
          <span className="material-symbols-outlined text-[22px]">notifications_active</span>
          <span className="text-[9px] font-bold uppercase font-mono">Alerts</span>
        </NavLink>

        {/* 5. Profile */}
        <NavLink 
          to="/settings" 
          className={({isActive}) => `flex flex-col items-center justify-center gap-1 w-14 h-full ${isActive ? 'text-cyan-600' : 'text-gray-400 hover:text-slate-800'}`}
        >
          <span className="material-symbols-outlined text-[22px]">account_circle</span>
          <span className="text-[9px] font-bold uppercase font-mono">Profile</span>
        </NavLink>
      </nav>

    </div>
  )
}
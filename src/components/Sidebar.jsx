import { NavLink } from 'react-router-dom'
import {
  Home,
  BarChart2,
  PlusCircle,
  Handshake,
  Bot,
  Settings
} from 'lucide-react'

const tabs = [
  { to: '/',          icon: Home,       label: 'Dashboard' },
  { to: '/analytics', icon: BarChart2,   label: 'Analytics' },
  { to: '/add',       icon: PlusCircle,  label: 'Add Record' },
  { to: '/borrow',    icon: Handshake,   label: 'Borrow & Lend' },
  { to: '/ai',        icon: Bot,         label: 'AI Assistant' },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-white/5 h-screen sticky top-0 shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-white/5 mb-6">
         <span className="text-2xl drop-shadow-md">💰</span>
         <h1 className="text-xl font-bold tracking-tight">BudgetBuddy</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {tabs.map(({ to, icon: Icon, label, primary }) =>
           <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                 `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 ${
                    primary 
                      ? isActive ? 'bg-accent text-white shadow-lg shadow-accent/20 font-bold' : 'bg-accent/80 hover:bg-accent text-white shadow-md font-bold'
                      : isActive ? 'bg-white/10 text-accent font-semibold' : 'text-white/40 hover:bg-white/5 hover:text-white/80 font-medium'
                 }`
              }
           >
              {({ isActive }) => (
                 <>
                    <Icon size={20} strokeWidth={isActive || primary ? 2.5 : 2} />
                    <span className="text-sm">{label}</span>
                 </>
              )}
           </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-white/5">
         <NavLink
            to="/settings"
            className={({ isActive }) =>
               `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 ${
                  isActive ? 'bg-white/10 text-white font-semibold' : 'text-white/40 hover:bg-white/5 hover:text-white/80 font-medium'
               }`
            }
         >
            <Settings size={20} strokeWidth={2} />
            <span className="text-sm">Settings</span>
         </NavLink>
      </div>
    </aside>
  )
}

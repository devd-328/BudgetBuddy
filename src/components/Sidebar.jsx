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
  { to: '/',          icon: Home,       label: 'Dashboard',   navId: 'nav-home'      },
  { to: '/analytics', icon: BarChart2,   label: 'Analytics',   navId: 'nav-analytics' },
  { to: '/add',       icon: PlusCircle,  label: 'Add Record',  navId: 'nav-add'       },
  { to: '/borrow',    icon: Handshake,   label: 'Borrow & Lend', navId: 'nav-borrow' },
  { to: '/ai',        icon: Bot,         label: 'AI Assistant', navId: 'nav-ai'       },
]

export default function Sidebar({ highlightTarget }) {
  return (
    <aside className="hidden md:flex flex-col w-60 bg-surface border-r border-border-subtle h-screen sticky top-0 shrink-0">
      {/* Brand */}
       <div className="px-6 py-5 flex items-center gap-3 border-b border-border-subtle">
          <img 
            src="/google_consent_logo.png" 
            alt="BudgetBuddy Logo" 
            className="w-8 h-8 rounded-lg object-contain"
          />
          <h1 className="text-base font-bold tracking-tight text-txt-bright">BudgetBuddy</h1>
       </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {tabs.map(({ to, icon: Icon, label, navId }) =>
           <NavLink
              key={to}
              to={to}
              end={to === '/'}
              id={navId}
              className={({ isActive }) =>
                 `flex items-center gap-3 px-3 py-2.5 rounded-xl 
                  transition-[background,color] duration-fast ease-out-expo text-sm ${
                    isActive 
                      ? 'bg-interactive text-txt-primary font-medium' 
                      : 'text-txt-muted hover:bg-interactive/50 hover:text-txt-secondary'
                 } ${highlightTarget === navId ? 'onboarding-highlight' : ''}`
              }
           >
              {({ isActive }) => (
                 <>
                    <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                    <span>{label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                    )}
                 </>
              )}
           </NavLink>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-border-subtle">
         <NavLink
            to="/settings"
            id="nav-settings"
            className={({ isActive }) =>
               `flex items-center gap-3 px-3 py-2.5 rounded-xl 
                transition-[background,color] duration-fast ease-out-expo text-sm ${
                  isActive 
                    ? 'bg-interactive text-txt-primary font-medium' 
                    : 'text-txt-muted hover:bg-interactive/50 hover:text-txt-secondary'
               } ${highlightTarget === 'nav-settings' ? 'onboarding-highlight' : ''}`
            }
         >
            <Settings size={18} strokeWidth={1.5} />
            <span>Settings</span>
         </NavLink>
      </div>
    </aside>
  )
}


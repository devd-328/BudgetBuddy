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
  { to: '/',          icon: Home,       label: 'Home',      navId: 'nav-home'      },
  { to: '/analytics', icon: BarChart2,   label: 'Analytics', navId: 'nav-analytics' },
  { to: '/add',       icon: PlusCircle,  label: 'Add',       navId: 'nav-add'       },
  { to: '/borrow',    icon: Handshake,   label: 'Borrow',    navId: 'nav-borrow'    },
  { to: '/settings',  icon: Settings,    label: 'Settings',  navId: 'nav-settings'  },
]

export default function BottomNav({ highlightTarget }) {
  return (
    <>
      {/* Floating AI Button */}
      <NavLink
        to="/ai"
        id="nav-ai"
        className={`fixed bottom-20 right-4 w-11 h-11 bg-accent rounded-full flex items-center justify-center 
                   text-txt-inverted shadow-glow-accent z-50 md:hidden 
                   hover:scale-105 active:scale-95 transition-transform duration-fast ease-out-back
                   ${highlightTarget === 'nav-ai' ? 'onboarding-spotlight' : ''}`}
      >
        <Bot size={20} strokeWidth={2} />
      </NavLink>

      <nav className="fixed bottom-0 left-0 w-full md:hidden
                      bg-surface/95 backdrop-blur-xl border-t border-border-subtle pb-safe z-50">
        <div className="flex items-stretch h-16">
        {tabs.map(({ to, icon: Icon, label, navId }) =>
          label === 'Add' ? (
            /* Centre FAB */
            <NavLink
              key={to}
              to={to}
              id={navId}
              className="flex flex-col items-center justify-center flex-1 -mt-5"
            >
              {({ isActive }) => (
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-2xl
                    transition-[transform,box-shadow] duration-fast ease-out-expo
                    ${isActive
                      ? 'bg-accent shadow-glow-accent scale-110'
                      : 'bg-accent shadow-md'
                    }
                    ${highlightTarget === navId ? 'onboarding-spotlight' : ''}`}
                >
                  <Icon size={22} strokeWidth={2} className="text-txt-inverted" />
                </div>
              )}
            </NavLink>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              id={navId}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 gap-1 relative
                 transition-colors duration-fast
                 ${isActive ? 'text-accent' : 'text-txt-muted'}
                 ${highlightTarget === navId ? 'onboarding-spotlight' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                  <span className="text-2xs font-medium">{label}</span>
                  {isActive && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />
                  )}
                </>
              )}
            </NavLink>
          )
        )}
      </div>
      </nav>
    </>
  )
}


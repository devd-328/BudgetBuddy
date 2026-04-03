import { NavLink } from 'react-router-dom'
import {
  Home,
  BarChart2,
  PlusCircle,
  Handshake,
  Bot,
} from 'lucide-react'

const tabs = [
  { to: '/',          icon: Home,       label: 'Home'      },
  { to: '/analytics', icon: BarChart2,   label: 'Analytics' },
  { to: '/add',       icon: PlusCircle,  label: 'Add'       },
  { to: '/borrow',    icon: Handshake,   label: 'Borrow'    },
  { to: '/ai',        icon: Bot,         label: 'AI'        },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile
                    bg-surface border-t border-white/10 pb-safe z-50">
      <div className="flex items-stretch h-16">
        {tabs.map(({ to, icon: Icon, label }) =>
          label === 'Add' ? (
            /* Centre FAB-style Add button */
            <NavLink
              key={to}
              to={to}
              id="nav-add"
              className="flex flex-col items-center justify-center flex-1 -mt-5"
            >
              {({ isActive }) => (
                <div
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-full
                    transition-all duration-200
                    ${isActive
                      ? 'bg-accent shadow-lg shadow-accent/40 glow-pulse'
                      : 'bg-accent/80 shadow-md shadow-accent/20'
                    }`}
                >
                  <Icon size={26} strokeWidth={2.5} className="text-white" />
                </div>
              )}
            </NavLink>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              id={`nav-${label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors duration-200
                ${isActive ? 'text-accent' : 'text-white/40'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          )
        )}
      </div>
    </nav>
  )
}

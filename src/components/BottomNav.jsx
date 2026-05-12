import { NavLink } from 'react-router-dom'

const tabs = [
  {
    to: '/dashboard',
    label: 'Home',
    icon: () => (
      <i className="ri-home-4-line w-5 h-5"></i>
    ),
  },
  {
    to: '/services',
    label: 'Services',
    icon: () => (
<i className="ri-send-ins-line w-5 h-5"></i>    ),
  },
  {
    to: '/bookings',
    label: 'History',
    icon: () => (
     <i className='ri-history-line w-5 h-5'></i>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: () => (
      <i className='ri-user-line w-5 h-5'></i>
    ),
  },
]

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-1">
      <div className="bg-white/95 backdrop-blur-xl rounded-[1.5rem] shadow-xl shadow-gray-200/80 border border-gray-100/80 flex items-center justify-around px-1.5 py-1.5">
        {tabs.map(({ to, label, icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-2 rounded-full transition-all ${
                isActive
                  ? 'bg-gradient-to-tr from-red-600 to-amber-500 text-white shadow-md shadow-red-200/60'
                  : 'text-gray-400'
              }`
            }>
            {({ isActive }) => (
              <>
                {icon(isActive)}
                <span className="text-[9px] font-bold tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

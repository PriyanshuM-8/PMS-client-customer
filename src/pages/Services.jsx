import { Link } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { FaGasPump, FaWrench, FaChevronRight, FaTag } from 'react-icons/fa'
import { MdLocalOffer } from 'react-icons/md'
import { HiLightningBolt } from 'react-icons/hi'

const services = [
  {
    to: '/book/fuel',
    Icon: FaGasPump,
    iconBg: 'bg-gradient-to-br from-red-600 to-amber-500',
    iconColor: 'text-white',
    title: 'Fuel Delivery',
    subtitle: 'Petrol & Diesel at your doorstep',
    tag: '~30 min',
    tagCls: 'bg-red-50 text-red-500 border-red-100',
    badge: 'Popular',
    badgeCls: 'bg-red-500 text-white',
  },
  {
    to: '/book/mechanic',
    Icon: FaWrench,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    title: 'Mechanic Service',
    subtitle: 'On-site repair & roadside help',
    tag: 'On demand',
    tagCls: 'bg-amber-50 text-amber-600 border-amber-100',
    badge: 'Fast',
    badgeCls: 'bg-amber-500 text-white',
  },
]

export default function Services() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-28">

      {/* Header */}
      <div className="px-5 pt-12 pb-8 bg-gradient-to-br from-red-600 via-red-500 to-amber-500 rounded-b-[2.5rem] shadow-xl shadow-red-300/40">
        <p className="text-white/60 text-[11px] uppercase tracking-widest font-semibold">What do you need?</p>
        <h1 className="text-2xl font-black text-white mt-1 tracking-tight">Our Services</h1>
        <p className="text-white/50 text-xs mt-1">Fast, reliable & at your location</p>
      </div>

      <div className="px-5 mt-5 space-y-3">

        {/* Service Cards */}
        {services.map((s) => (
          <Link key={s.title} to={s.to}
            className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 border border-gray-100 shadow-sm active:scale-[0.98] transition-all hover:shadow-md">
            <div className={`w-12 h-12 rounded-2xl ${s.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <s.Icon className={`${s.iconColor} text-xl`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-gray-900 font-black text-sm">{s.title}</p>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${s.badgeCls}`}>
                  {s.badge}
                </span>
              </div>
              <p className="text-gray-400 text-[10px] truncate">{s.subtitle}</p>
              <span className={`inline-flex items-center gap-1 mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full border ${s.tagCls}`}>
                <HiLightningBolt className="text-[9px]" /> {s.tag}
              </span>
            </div>
            <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 flex-shrink-0">
              <FaChevronRight className="text-gray-400 text-[10px]" />
            </div>
          </Link>
        ))}

        {/* Promo Banner */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 shadow-lg shadow-red-300/40 mt-2">
          <div className="flex justify-between items-start">
            <div className="text-white flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <MdLocalOffer className="text-white/80 text-sm" />
                <p className="text-white/70 text-[9px] uppercase tracking-widest font-semibold">Limited Offer</p>
              </div>
              <h3 className="text-lg font-black leading-tight">Free Delivery</h3>
              <p className="text-white/60 text-[10px] mt-0.5">On your first fuel order</p>
              <Link to="/book/fuel"
                className="inline-flex items-center gap-1.5 mt-3 bg-white text-red-600 text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm">
                <FaGasPump className="text-xs" /> Book Now
              </Link>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="bg-white/25 px-2.5 py-1 rounded-full text-[9px] text-white font-black flex items-center gap-1">
                <FaTag className="text-[8px]" /> NEW
              </span>
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mt-1">
                <FaGasPump className="text-white/40 text-3xl" />
              </div>
            </div>
          </div>
          <div className="mt-4 h-1 w-full bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white w-1/2 shadow-[0_0_8px_white] rounded-full" />
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          {[
            { icon: <FaGasPump className="text-red-500 text-lg" />, title: 'Petrol', price: '₹96.12/L', bg: 'bg-red-50' },
            { icon: <FaWrench className="text-amber-500 text-lg" />, title: 'Mechanic', price: 'From ₹199', bg: 'bg-amber-50' },
          ].map(({ icon, title, price, bg }) => (
            <div key={title} className={`${bg} rounded-2xl p-3.5 border border-gray-100`}>
              <div className="mb-2">{icon}</div>
              <p className="text-gray-700 font-bold text-xs">{title}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">{price}</p>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

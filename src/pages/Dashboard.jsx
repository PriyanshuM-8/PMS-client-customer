import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import logo from '/Image/Logo1.png'
import {
  FaGasPump, FaWrench, FaWallet, FaCar, FaClipboardList,
  FaMapMarkerAlt, FaChevronRight, FaFire
} from 'react-icons/fa'
import { MdLocalGasStation, MdSpeed, MdAccessTime } from 'react-icons/md'
import { HiOutlineSparkles } from 'react-icons/hi'

const statusConfig = {
  pending:     { label: 'Pending',     cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  accepted:    { label: 'Accepted',    cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  assigned:    { label: 'Assigned',    cls: 'bg-purple-50 text-purple-600 border-purple-200' },
  in_progress: { label: 'In Progress', cls: 'bg-orange-50 text-orange-600 border-orange-200' },
  completed:   { label: 'Completed',   cls: 'bg-green-50 text-green-600 border-green-200' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-50 text-red-500 border-red-200' },
}

export default function Dashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [bookings, setBookings] = useState([])
  const [fuelPrices, setFuelPrices] = useState(null)

  useEffect(() => {
    api.get('/customers/me').then(({ data }) => setProfile(data.data.profile)).catch(() => {})
    api.get('/bookings/my').then(({ data }) => {
      const list = Array.isArray(data.data) ? data.data : []
      setBookings(list.slice(0, 3))
      // latest booking ka pump use karo fuel prices ke liye
      const latestPumpId = list[0]?.pump?._id || list[0]?.pump
      if (latestPumpId) {
        api.get(`/customers/fuel-prices/${latestPumpId}`)
          .then(({ data: fp }) => { if (fp.data) setFuelPrices(fp.data) })
          .catch(() => {})
      }
    }).catch(() => {})
  }, [])

  const name = profile?.name || user?.name || 'User'

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-28">

      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-20 bg-gradient-to-br from-red-600 via-red-500 to-amber-500 rounded-b-[2.5rem] shadow-xl shadow-red-300/40">
        <div className="flex justify-between items-center">
          <img src={logo} alt="FuelX" className="h-8 w-auto object-contain drop-shadow" />
          <Link to="/profile"
            className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-sm font-black border border-white/30 shadow-inner">
            {name[0].toUpperCase()}
          </Link>
        </div>

        <div className="mt-4">
          <p className="text-white/60 text-xs">Good day,</p>
          <h2 className="text-white font-black text-xl leading-tight">{name} </h2>
          <div className="flex items-center gap-1.5 mt-1">
            <FaMapMarkerAlt className="text-white/50 text-xs flex-shrink-0" />
            <p className="text-white/50 text-[10px] truncate">{profile?.address?.full || 'Location not set'}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 mt-5">
          {[
            { label: 'Orders', value: profile?.totalOrders ?? 0, icon: <FaClipboardList className="text-white/70 text-xs" /> },
            { label: 'Wallet', value: `₹${profile?.walletBalance ?? 0}`, icon: <FaWallet className="text-white/70 text-xs" /> },
            { label: 'Vehicles', value: profile?.vehicles?.length ?? 0, icon: <FaCar className="text-white/70 text-xs" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl py-3 px-2 text-center border border-white/20">
              <div className="flex justify-center mb-1">{icon}</div>
              <p className="text-white font-black text-base leading-tight">{value}</p>
              <p className="text-white/50 text-[9px] uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fuel Price Cards ── */}
      <div className="px-5 -mt-10 grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 shadow-lg shadow-red-300/40">
          <div className="flex justify-between items-start mb-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <FaGasPump className="text-white text-sm" />
            </div>
            <span className="bg-white/25 px-2 py-0.5 rounded-full text-[8px] text-white font-black tracking-wide flex items-center gap-1">
              <FaFire className="text-xs" /> LIVE
            </span>
          </div>
          <p className="text-white/70 text-[9px] uppercase tracking-widest font-semibold">Petrol</p>
          <h3 className="text-2xl font-black text-white mt-0.5 leading-tight">
            {fuelPrices?.petrol ? `₹${fuelPrices.petrol}` : '—'}
          </h3>
          <p className="text-white/50 text-[9px] mt-0.5">per litre</p>
           {fuelPrices?.lastUpdated && (
            <div className="flex items-center gap-1 mt-2">
              <MdAccessTime className="text-gray-300 text-[9px]" />
              <p className="text-gray-300 text-[8px]">
                {new Date(fuelPrices.lastUpdated).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
          <div className="mt-3 h-1 w-full bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white w-2/3 shadow-[0_0_8px_white] rounded-full" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-md">
          <div className="flex justify-between items-start mb-3">
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
              <MdLocalGasStation className="text-amber-500 text-base" />
            </div>
            <span className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[8px] text-amber-600 font-black tracking-wide flex items-center gap-1">
              <MdSpeed className="text-xs" /> LIVE
            </span>
          </div>
          <p className="text-gray-400 text-[9px] uppercase tracking-widest font-semibold">Diesel</p>
          <h3 className="text-2xl font-black text-gray-900 mt-0.5 leading-tight">
            {fuelPrices?.diesel ? `₹${fuelPrices.diesel}` : '—'}
          </h3>
          <p className="text-gray-400 text-[9px] mt-0.5">per litre</p>
          {fuelPrices?.lastUpdated && (
            <div className="flex items-center gap-1 mt-2">
              <MdAccessTime className="text-gray-300 text-[9px]" />
              <p className="text-gray-300 text-[8px]">
                {new Date(fuelPrices.lastUpdated).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
          <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 w-1/2 rounded-full" />
          </div>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-5">

        {/* ── Quick Actions ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-800 font-black text-sm">Quick Actions</p>
            <HiOutlineSparkles className="text-amber-400 text-base" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/book/fuel"
              className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 shadow-lg shadow-red-300/40 active:scale-[0.97] transition-all">
              <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
                <FaGasPump className="text-white text-xl" />
              </div>
              <p className="text-white font-black text-sm">Book Fuel</p>
              <p className="text-white/60 text-[10px] mt-0.5">Delivered in 30 min</p>
              <div className="absolute top-3 right-3 w-6 h-6 bg-white/15 rounded-full flex items-center justify-center">
                <FaChevronRight className="text-white text-[8px]" />
              </div>
            </Link>

            <Link to="/book/mechanic"
              className="relative overflow-hidden p-4 rounded-2xl bg-white border border-gray-100 shadow-md active:scale-[0.97] transition-all">
              <div className="w-11 h-11 bg-amber-50 rounded-2xl flex items-center justify-center mb-3">
                <FaWrench className="text-amber-500 text-lg" />
              </div>
              <p className="text-gray-900 font-black text-sm">Mechanic</p>
              <p className="text-gray-400 text-[10px] mt-0.5">On-site repair</p>
              <div className="absolute top-3 right-3 w-6 h-6 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                <FaChevronRight className="text-gray-400 text-[8px]" />
              </div>
            </Link>
          </div>
        </div>

        {/* ── Recent Bookings ── */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-gray-800 font-black text-sm">Recent Bookings</p>
            <Link to="/bookings" className="text-[11px] font-bold text-red-500 flex items-center gap-0.5">
              View All <FaChevronRight className="text-[8px]" />
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FaClipboardList className="text-red-400 text-2xl" />
              </div>
              <p className="text-gray-700 font-bold text-sm">No bookings yet</p>
              <p className="text-gray-400 text-xs mt-1">Book your first fuel delivery or mechanic service</p>
              <Link to="/book/fuel"
                className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold text-white bg-gradient-to-r from-red-600 to-amber-500 px-4 py-2 rounded-full shadow-sm shadow-red-200">
                <FaGasPump className="text-xs" /> Book Now
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => {
                const s = statusConfig[b.status] || statusConfig.pending
                return (
                  <Link to={`/bookings/${b._id}`} key={b._id}
                    className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm active:scale-[0.98] transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-amber-500 rounded-xl flex items-center justify-center shadow-sm shadow-red-200 flex-shrink-0">
                      {b.serviceType === 'fuel'
                        ? <FaGasPump className="text-white text-base" />
                        : <FaWrench className="text-white text-base" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-xs font-bold capitalize">{b.serviceType} Service</p>
                      <p className="text-gray-400 text-[10px] mt-0.5">{new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${s.cls}`}>
                        {s.label}
                      </span>
                      <FaChevronRight className="text-gray-300 text-[9px]" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

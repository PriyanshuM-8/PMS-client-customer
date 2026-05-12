import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api from '../utils/api'
import { getSocket } from '../utils/socket'
import BottomNav from '../components/BottomNav'
import {
  FaGasPump, FaWrench, FaChevronLeft, FaMapMarkerAlt,
  FaReceipt, FaTruck, FaMobileAlt, FaSatelliteDish
} from 'react-icons/fa'
import { MdMyLocation, MdGpsFixed, MdGpsNotFixed } from 'react-icons/md'
import { IoMdSync } from 'react-icons/io'

const inputCls = 'w-full bg-gray-50 border border-gray-100 text-gray-900 placeholder-gray-400 rounded-xl px-3.5 py-3 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition text-xs'

export default function CreateBooking() {
  const { type } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    addressFull: '', lat: '', lng: '', fuelType: 'petrol', quantity: '', description: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [locLoading, setLocLoading] = useState(false)
  const [locTracking, setLocTracking] = useState(false)
  const [pumpId, setPumpId] = useState(null)
  const [breakdown, setBreakdown] = useState(null)
  const [priceLoading, setPriceLoading] = useState(false)

  // Refs — re-render pe stable rahenge
  const watchIdRef = useRef(null)
  const geocodeTimerRef = useRef(null)
  const breakdownTimerRef = useRef(null)

  // ── Nearest pump fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/bookings/my')
      .then(({ data }) => {
        const list = Array.isArray(data.data) ? data.data : []
        const id = list[0]?.pump?._id || list[0]?.pump
        if (id) setPumpId(id)
      })
      .catch(() => {})
  }, [])

  // ── Price breakdown — debounced ─────────────────────────────────────────────
  useEffect(() => {
    if (type !== 'fuel') return
    if (breakdownTimerRef.current) clearTimeout(breakdownTimerRef.current)
    breakdownTimerRef.current = setTimeout(async () => {
      const qty = parseFloat(form.quantity)
      if (!qty || qty <= 0) { setBreakdown(null); return }
      setPriceLoading(true)
      try {
        const params = new URLSearchParams({ fuelType: form.fuelType, quantity: qty })
        if (pumpId) params.append('pumpId', pumpId)
        const { data } = await api.get(`/bookings/price-preview?${params}`)
        setBreakdown(data.data)
      } catch { setBreakdown(null) }
      finally { setPriceLoading(false) }
    }, 400)
    return () => clearTimeout(breakdownTimerRef.current)
  }, [form.fuelType, form.quantity, pumpId, type])

  // ── Reverse geocode — debounced 600ms ───────────────────────────────────────
  const reverseGeocode = (lat, lng) => {
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
    geocodeTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        const a = data.address || {}
        const parts = [
          a.house_number,
          a.road || a.pedestrian || a.footway || a.path,
          a.neighbourhood || a.suburb || a.quarter,
          a.village || a.town || a.city_district,
          a.city || a.county,
          a.state,
          a.postcode,
        ].filter(Boolean)
        const addr = parts.join(', ') || data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        // Functional update — lat/lng ko touch nahi karta
        setForm((prev) => ({ ...prev, addressFull: addr }))
      } catch {
        setForm((prev) => ({ ...prev, addressFull: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }))
      }
    }, 600)
  }

  // ── watchPosition success callback ─────────────────────────────────────────
  // NOTE: Plain function — watchPosition ke andar ref se call hoga
 const handlePosition = (position) => {
  const lat = position.coords.latitude
  const lng = position.coords.longitude

  console.log('LOCATION:', lat, lng)

  setForm((prev) => ({
    ...prev,
    lat,
    lng,
  }))

  setLocLoading(false)
  setLocTracking(true)
  setError('')

  const socket = getSocket()

  if (!socket.connected) {
    socket.connect()
  }

  socket.emit('send-location', {
    latitude: lat,
    longitude: lng,
  })

  reverseGeocode(lat, lng)
}

  // ── watchPosition error callback ────────────────────────────────────────────
  const handlePositionError = (err) => {
    const msg =
      err.code === 1 ? 'Location permission denied. Allow it from browser/site settings.' :
      err.code === 2 ? 'GPS signal unavailable. Check device location settings.' :
      err.code === 3 ? 'Location request timed out. Try again.' :
      'Could not get location.'
    setError(msg)
    setLocLoading(false)
    setLocTracking(false)
  }

  // ── Start tracking ──────────────────────────────────────────────────────────
 const startTracking = () => {
  if (!navigator.geolocation) {
    setError('Geolocation not supported')
    return
  }

  setLocLoading(true)
  setError('')

  navigator.geolocation.getCurrentPosition(
    (position) => {
      handlePosition(position)

      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        handlePositionError,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      )
    },
    handlePositionError,
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  )
}

  // ── Stop tracking ───────────────────────────────────────────────────────────
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setLocTracking(false)
  }

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
      if (breakdownTimerRef.current) clearTimeout(breakdownTimerRef.current)
    }
  }, [])

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.lat || !form.lng) {
      setError('Please tap "Use My Live Location" to set your location.')
      return
    }
    setError('')
    setLoading(true)
    stopTracking()
    try {
      const payload = {
        serviceType: type,
        addressFull: form.addressFull,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        ...(type === 'fuel' && { fuelType: form.fuelType, quantity: parseFloat(form.quantity) }),
        ...(type === 'mechanic' && { workDetails: { description: form.description } }),
      }
      const { data } = await api.post('/bookings', payload)
      navigate(`/bookings/${data.data._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed')
    } finally { setLoading(false) }
  }

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const isFuel = type === 'fuel'
  const hasLocation = !!form.lat && !!form.lng

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-28">

      {/* Header */}
      <div className="px-5 pt-12 pb-12 rounded-b-[2.5rem] bg-gradient-to-br from-red-600 via-red-500 to-amber-500 shadow-xl shadow-red-300/40">
        <div className="flex justify-between items-center">
          <Link to="/services" className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white">
            <FaChevronLeft className="text-xs" />
          </Link>
          <div className="flex items-center gap-2 text-white font-black text-sm">
            {isFuel ? <FaGasPump className="text-base" /> : <FaWrench className="text-base" />}
            {isFuel ? 'Book Fuel' : 'Book Mechanic'}
          </div>
          <div className="w-8" />
        </div>

        {isFuel && (
          <div className="mt-5">
            <div className="flex justify-between items-start">
              <div className="text-white">
                <p className="opacity-60 text-[9px] uppercase tracking-widest">Live Rate</p>
                <h2 className="text-2xl font-black mt-0.5">
                  {breakdown?.pricePerLitre ? `₹${breakdown.pricePerLitre}/L` : '—'}
                </h2>
              </div>
              <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] text-white font-bold capitalize">
                {form.fuelType}
              </span>
            </div>
            <div className="mt-3 h-1 w-full bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white w-2/3 shadow-[0_0_8px_white] rounded-full" />
            </div>
          </div>
        )}

        {!isFuel && (
          <div className="mt-5 flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <FaWrench className="text-white text-xl" />
            </div>
            <div className="text-white">
              <p className="font-black text-base">Mechanic Service</p>
              <p className="text-white/60 text-xs mt-0.5">On-site repair & assistance</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 -mt-4 space-y-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-gray-800 font-bold text-xs uppercase tracking-wider mb-3">
            {isFuel ? 'Delivery Details' : 'Describe Issue'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-2.5">

            {/* Location Button */}
            <button type="button" onClick={startTracking} disabled={locLoading}
              className={`w-full border py-3 rounded-xl text-xs transition disabled:opacity-60 flex items-center justify-center gap-2 ${
                locTracking
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : hasLocation
                    ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                    : 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
              }`}>
              {locLoading ? (
                <><IoMdSync className="animate-spin text-base" /><span>Getting GPS signal...</span></>
              ) : locTracking ? (
                <>
                  <MdGpsFixed className="text-green-500 text-base animate-pulse flex-shrink-0" />
                  <span className="font-semibold truncate max-w-[200px]">
                    {form.addressFull || `${Number(form.lat).toFixed(5)}, ${Number(form.lng).toFixed(5)}`}
                  </span>
                  <span className="ml-auto text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-black flex-shrink-0">LIVE</span>
                </>
              ) : hasLocation ? (
                <>
                  <FaMapMarkerAlt className="text-blue-500 text-sm flex-shrink-0" />
                  <span className="font-semibold truncate max-w-[240px]">
                    {form.addressFull || `${Number(form.lat).toFixed(4)}, ${Number(form.lng).toFixed(4)}`}
                  </span>
                </>
              ) : (
                <><MdMyLocation className="text-red-500 text-base" /><span className="font-semibold">Use My Live Location</span></>
              )}
            </button>

            {/* Tracking indicator */}
            {locTracking && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-xl">
                <FaSatelliteDish className="text-green-400 text-xs flex-shrink-0" />
                <p className="text-green-600 text-[10px] flex-1">Live tracking active — updates automatically</p>
                <button type="button" onClick={stopTracking}
                  className="text-[9px] font-bold text-red-400 hover:text-red-500 flex-shrink-0 px-2 py-0.5 rounded bg-red-50">
                  Stop
                </button>
              </div>
            )}

            {/* Address field */}
            <input name="addressFull" placeholder="Or type delivery address manually"
              value={form.addressFull} onChange={handleChange} required className={inputCls} />

            {isFuel && (
              <>
                <select name="fuelType" value={form.fuelType} onChange={handleChange} className={inputCls}>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                </select>
                <input name="quantity" type="number" placeholder="Quantity (Litres)"
                  value={form.quantity} onChange={handleChange} required min="1" className={inputCls} />
              </>
            )}

            {!isFuel && (
              <textarea name="description" placeholder="Describe the issue (e.g. flat tyre, engine problem...)"
                value={form.description} onChange={handleChange} required rows={4}
                className={`${inputCls} resize-none`} />
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <MdGpsNotFixed className="text-red-400 text-sm mt-0.5 flex-shrink-0" />
                <p className="text-red-500 text-xs">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold text-xs shadow-md shadow-red-200/60 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><IoMdSync className="animate-spin text-base" /> Booking...</>
                : <>{isFuel ? <FaGasPump className="text-sm" /> : <FaWrench className="text-sm" />} Confirm Booking</>}
            </button>
          </form>
        </div>

        {/* Price Breakdown */}
        {isFuel && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
              <FaReceipt className="text-orange-400 text-sm" />
              <p className="text-gray-700 font-bold text-xs">Price Breakdown</p>
              {priceLoading && <IoMdSync className="animate-spin text-gray-300 text-xs ml-auto" />}
            </div>

            {!breakdown && !priceLoading && (
              <div className="px-4 py-5 text-center">
                <p className="text-gray-300 text-xs">Enter quantity to see price breakdown</p>
              </div>
            )}

            {breakdown && (
              <div className="px-4 py-3">
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FaGasPump className="text-orange-400 text-[10px]" />
                    </div>
                    <div>
                      <p className="text-gray-700 text-xs font-semibold">Fuel Cost</p>
                      <p className="text-gray-400 text-[10px]">{form.quantity}L × ₹{breakdown.pricePerLitre}/L</p>
                    </div>
                  </div>
                  <p className="text-gray-800 font-bold text-sm">₹{breakdown.fuelCost}</p>
                </div>

                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FaTruck className="text-blue-400 text-[10px]" />
                    </div>
                    <div>
                      <p className="text-gray-700 text-xs font-semibold">Delivery Fee</p>
                      <p className="text-gray-400 text-[10px]">
                        {parseFloat(form.quantity) <= 3 ? 'Small order (1–3 L)'
                          : parseFloat(form.quantity) <= 7 ? 'Medium order (4–7 L)'
                          : 'Large order (8+ L)'}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-800 font-bold text-sm">₹{breakdown.deliveryFee}</p>
                </div>

                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FaMobileAlt className="text-purple-400 text-[10px]" />
                    </div>
                    <div>
                      <p className="text-gray-700 text-xs font-semibold">Platform Fee</p>
                      <p className="text-gray-400 text-[10px]">Service & maintenance</p>
                    </div>
                  </div>
                  <p className="text-gray-800 font-bold text-sm">₹{breakdown.platformFee}</p>
                </div>

                <div className="flex items-center justify-between pt-3 pb-1">
                  <p className="text-gray-900 font-black text-sm">Total Payable</p>
                  <div className="text-right">
                    <p className="text-red-500 font-black text-xl leading-tight">₹{breakdown.total}</p>
                    <p className="text-gray-400 text-[9px]">incl. all charges</p>
                  </div>
                </div>

                {parseFloat(form.quantity) < 8 && (
                  <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-start gap-2">
                    <FaTruck className="text-amber-400 text-xs mt-0.5 flex-shrink-0" />
                    <p className="text-amber-600 text-[10px]">Order 8+ litres for minimum delivery fee of ₹10</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

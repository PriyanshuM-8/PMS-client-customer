import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import { FaMapMarkerAlt, FaRocket } from 'react-icons/fa'
import { MdMyLocation } from 'react-icons/md'
import { IoMdSync } from 'react-icons/io'

const inputCls = 'w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition text-sm'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', addressFull: '', lng: '', lat: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [locLoading, setLocLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const getLocation = () => {
    if (!navigator.geolocation) return setError('Geolocation not supported')
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setForm((f) => ({ ...f, lat, lng }))
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const a = data.address || {}
          const parts = [a.road || a.pedestrian, a.neighbourhood || a.suburb, a.city || a.town || a.village, a.state, a.postcode].filter(Boolean)
          setForm((f) => ({ ...f, lat, lng, addressFull: parts.join(', ') || data.display_name }))
        } catch { } finally { setLocLoading(false) }
      },
      () => { setError('Location access denied'); setLocLoading(false) },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await api.post('/auth/register/customer', form)
      navigate('/login')
    } catch (err) { setError(err.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-6 pb-16 rounded-b-[3rem] bg-gradient-to-tr from-red-600 to-amber-500 shadow-2xl shadow-red-200">
        <div className="mt-8 text-center">
          <img src="/Image/Logo.png" alt="FuelX" className="w-20 h-20 object-contain mx-auto drop-shadow-xl" />
          <p className="text-white/70 text-sm mt-2">Create your account</p>
        </div>
      </div>

      <div className="flex-1 px-6 -mt-8 pb-8">
        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100 p-7 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <FaRocket className="text-red-500 text-lg" />
            <h2 className="text-xl font-bold text-gray-900">Get started</h2>
          </div>
          <p className="text-gray-400 text-sm mb-6">Fill in your details below</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { name: 'name', placeholder: 'Full Name' },
              { name: 'email', placeholder: 'Email Address', type: 'email' },
              { name: 'phone', placeholder: 'Phone Number' },
              { name: 'addressFull', placeholder: 'Full Address' },
            ].map(({ name, placeholder, type = 'text' }) => (
              <input key={name} name={name} type={type} placeholder={placeholder}
                value={form[name]} onChange={handleChange} required className={inputCls} />
            ))}
            <input name="password" type="password" placeholder="Password"
              value={form.password} onChange={handleChange} required className={inputCls} />

            <button type="button" onClick={getLocation} disabled={locLoading}
              className="w-full bg-gray-50 border border-gray-200 text-gray-500 py-3.5 rounded-2xl text-sm hover:border-red-300 hover:text-red-500 transition disabled:opacity-60 flex items-center justify-center gap-2">
              {locLoading
                ? <><IoMdSync className="animate-spin text-base" /><span>Fetching location...</span></>
                : form.lat
                  ? <><FaMapMarkerAlt className="text-red-500 text-sm" /><span className="truncate text-xs">{form.addressFull || `${Number(form.lat).toFixed(3)}, ${Number(form.lng).toFixed(3)}`}</span></>
                  : <><MdMyLocation className="text-red-500 text-base" /><span>Use My Location</span></>}
            </button>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold text-sm shadow-lg shadow-red-200 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><IoMdSync className="animate-spin text-base" /> Creating Account...</>
                : <><FaRocket className="text-sm" /> Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm mt-5 text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-red-500 hover:text-red-600">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

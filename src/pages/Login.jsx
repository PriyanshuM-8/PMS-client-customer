import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { FaEnvelope, FaMobileAlt, FaChevronLeft } from 'react-icons/fa'
import { MdWarning } from 'react-icons/md'
import { IoMdSync } from 'react-icons/io'
import Swal from 'sweetalert2'

const inputCls = 'w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition text-sm'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [loginMethod, setLoginMethod] = useState('email')
  const [step, setStep] = useState('input')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [otpMethod, setOtpMethod] = useState('')
  const [otpHint, setOtpHint] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async () => {
    if (!email || !password) return setError('Please fill all fields')
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/login/email', { email, password })
      if (data.otpMethod === 'none') { login(data.token, data.user); navigate('/dashboard'); return }
      setIdentifier(email); setOtpMethod('email'); setOtpHint(email); setStep('otp')
    } catch (err) { setError(err.response?.data?.message || 'Login failed') }
    finally { setLoading(false) }
  }

  const handlePhoneLogin = async () => {
    if (phone.length !== 10) return setError('Enter valid 10-digit number')
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/login/phone', { phone })
      setIdentifier(data.identifier || phone)
      setOtpMethod('sms')
      setOtpHint(`+91${phone}`)
      setDevOtp(data.devOtp || '')
      setStep('otp')
    } catch (err) { setError(err.response?.data?.message || 'Failed to send OTP') }
    finally { setLoading(false) }
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return setError('Enter 6-digit OTP')
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { identifier, otp, method: otpMethod })
      login(data.token, data.user); navigate('/dashboard')
    } catch (err) { setError(err.response?.data?.message || 'Invalid OTP') }
    finally { setLoading(false) }
  }

  const handleForgotPassword = async () => {
    if (loginMethod === 'email' && !email) return setError('Enter your email first')
    if (loginMethod === 'phone' && phone.length !== 10) return setError('Enter valid 10-digit number first')
    setError(''); setLoading(true)
    try {
      const payload = loginMethod === 'email' ? { email } : { phone }
      const { data } = await api.post('/auth/forgot-password', payload)
      if (loginMethod === 'phone') {
        setDevOtp(data.devOtp || '')
      }
      setStep('reset_password')
    } catch (err) { setError(err.response?.data?.message || 'Failed to send reset link') }
    finally { setLoading(false) }
  }

  const handleResetPassword = async () => {
    if (otp.length !== 6 || newPassword.length < 6) return setError('Enter 6-digit OTP and min 6 char password')
    setError(''); setLoading(true)
    try {
      const payload = { otp, newPassword }
      if (loginMethod === 'email') payload.email = email
      else payload.phone = phone
      await api.post('/auth/reset-password', payload)
      Swal.fire('Success', 'Password reset successfully', 'success')
      setStep('input')
      setPassword('')
      setOtp('')
      setNewPassword('')
      setDevOtp('')
    } catch (err) { setError(err.response?.data?.message || 'Failed to reset password') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-6 pb-16 rounded-b-[3rem] bg-gradient-to-tr from-red-600 to-amber-500 shadow-2xl shadow-red-200">
        <div className="mt-8 text-center">
          <img src="/Image/Logo1.png" alt="FuelX" className="w-20 h-20 object-contain mx-auto drop-shadow-xl" />
          <p className="text-white/70 text-sm mt-2">Save Time, Skip the Station: Fuel Delivered to Your Location</p>
        </div>
      </div>

      <div className="flex-1 px-6 -mt-8 pb-8">
        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100 p-6 border border-gray-100">

          {step === 'input' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h2>
              <p className="text-gray-400 text-sm mb-5">Sign in to continue</p>

              <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
                {[
                  { key: 'email', Icon: FaEnvelope, label: 'Email' },
                  { key: 'phone', Icon: FaMobileAlt, label: 'Mobile' },
                ].map(({ key, Icon, label }) => (
                  <button key={key} type="button"
                    onClick={() => { setLoginMethod(key); setError('') }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${loginMethod === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
                    <Icon className="text-xs" /> {label}
                  </button>
                ))}
              </div>

              {loginMethod === 'email' && (
                <div className="space-y-3">
                  <input type="email" placeholder="Email address" value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                    className={inputCls} />
                  <input type="password" placeholder="Password" value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                    className={inputCls} />
                  <div className="flex justify-end">
                    <button type="button" onClick={() => { setError(''); setStep('forgot_password') }} className="text-xs font-semibold text-red-500">
                      Forgot Password?
                    </button>
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <button type="button" onClick={handleEmailLogin} disabled={loading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold text-sm shadow-lg shadow-red-200 disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? <><IoMdSync className="animate-spin" /> Sending...</> : 'Send OTP to Email'}
                  </button>
                </div>
              )}

              {loginMethod === 'phone' && (
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">+91</span>
                    <input type="tel" placeholder="10-digit mobile number" value={phone}
                      onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
                      onKeyDown={(e) => e.key === 'Enter' && handlePhoneLogin()}
                      maxLength={10} className={`${inputCls} pl-12`} />
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => { setError(''); setStep('forgot_password') }} className="text-xs font-semibold text-red-500">
                      Forgot Password?
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs px-1">OTP will be sent via SMS to your registered number</p>

                  {error && error.toLowerCase().includes('not registered') ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <MdWarning className="text-amber-500 text-base" />
                        <p className="text-amber-700 text-sm font-semibold">Number not registered</p>
                      </div>
                      <p className="text-amber-600 text-xs">This mobile number has no PetrocareX account.</p>
                      <Link to="/register"
                        className="inline-block mt-2.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-amber-500 px-4 py-1.5 rounded-full shadow-sm">
                        Register Now
                      </Link>
                    </div>
                  ) : error ? <p className="text-red-500 text-sm">{error}</p> : null}

                  <button type="button" onClick={handlePhoneLogin} disabled={loading || phone.length !== 10}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold text-sm shadow-lg shadow-red-200 disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? <><IoMdSync className="animate-spin" /> Sending...</> : 'Send OTP via SMS'}
                  </button>
                </div>
              )}
            </>
          )}

          {step === 'forgot_password' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Reset Password</h2>
              <p className="text-gray-400 text-sm mb-5">Enter your {loginMethod === 'email' ? 'email' : 'mobile number'} to receive OTP</p>
              <div className="space-y-3">
                {loginMethod === 'email' ? (
                  <input type="email" placeholder="Email address" value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    className={inputCls} />
                ) : (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">+91</span>
                    <input type="tel" placeholder="10-digit mobile number" value={phone}
                      onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
                      maxLength={10} className={`${inputCls} pl-12`} />
                  </div>
                )}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="button" onClick={handleForgotPassword} disabled={loading || (loginMethod === 'email' ? !email : phone.length !== 10)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold text-sm shadow-lg shadow-red-200 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><IoMdSync className="animate-spin" /> Sending...</> : 'Send Reset OTP'}
                </button>
                <button type="button" onClick={() => { setStep('input'); setError('') }}
                  className="w-full text-sm text-gray-400 py-2 flex items-center justify-center gap-1">
                  <FaChevronLeft className="text-xs" /> Back to Login
                </button>
              </div>
            </>
          )}

          {step === 'reset_password' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Set New Password</h2>
              
              {devOtp ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MdWarning className="text-yellow-500 text-base" />
                    <p className="text-yellow-700 text-xs font-bold">Test OTP</p>
                  </div>
                  <p className="text-yellow-900 text-lg font-black mt-2 tracking-[0.3em]">{devOtp}</p>
                </div>
              ) : null}

              <p className="text-gray-400 text-sm mb-5">Enter the OTP sent to {loginMethod === 'email' ? email : `+91${phone}`}</p>
              <div className="space-y-3">
                <input type="text" placeholder="Enter 6-digit OTP" value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                  maxLength={6} className={`${inputCls} text-center tracking-[0.5em] text-xl font-bold`} />
                <input type="password" placeholder="New Password" value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError('') }}
                  className={inputCls} />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="button" onClick={handleResetPassword} disabled={loading || otp.length !== 6 || newPassword.length < 6}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold text-sm shadow-lg shadow-red-200 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><IoMdSync className="animate-spin" /> Resetting...</> : 'Confirm Reset'}
                </button>
                <button type="button" onClick={() => { setStep('forgot_password'); setOtp('') }}
                  className="w-full text-sm text-gray-400 py-2 flex items-center justify-center gap-1">
                  <FaChevronLeft className="text-xs" /> Back
                </button>
              </div>
            </>
          )}

          {step === 'otp' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Verify OTP</h2>

              {devOtp ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MdWarning className="text-yellow-500 text-base" />
                    <p className="text-yellow-700 text-xs font-bold">Test OTP</p>
                  </div>
                  <p className="text-yellow-900 text-lg font-black mt-2 tracking-[0.3em]">{devOtp}</p>
                </div>
              ) : (
                <div className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 mb-5 ${otpMethod === 'sms' ? 'bg-green-50 border border-green-100' : 'bg-blue-50 border border-blue-100'}`}>
                  {otpMethod === 'sms'
                    ? <FaMobileAlt className="text-green-500 text-base mt-0.5 flex-shrink-0" />
                    : <FaEnvelope className="text-blue-500 text-base mt-0.5 flex-shrink-0" />}
                  <div>
                    <p className={`text-xs font-bold ${otpMethod === 'sms' ? 'text-green-700' : 'text-blue-700'}`}>
                      OTP sent via {otpMethod === 'sms' ? 'SMS' : 'Email'}
                    </p>
                    <p className={`text-[11px] mt-0.5 ${otpMethod === 'sms' ? 'text-green-600' : 'text-blue-600'}`}>
                      {otpHint} · Valid for 10 minutes
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <input type="text" placeholder="Enter 6-digit OTP" value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                  maxLength={6} className={`${inputCls} text-center tracking-[0.5em] text-xl font-bold`} />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="button" onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold text-sm shadow-lg shadow-red-200 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><IoMdSync className="animate-spin" /> Verifying...</> : 'Verify & Login'}
                </button>
                <button type="button" onClick={() => { setStep('input'); setOtp(''); setDevOtp(''); setError('') }}
                  className="w-full text-sm text-gray-400 py-2 flex items-center justify-center gap-1">
                  <FaChevronLeft className="text-xs" /> Back
                </button>
              </div>
            </>
          )}

          {step === 'input' && (
            <p className="text-center text-sm mt-5 text-gray-400">
              No account?{' '}
              <Link to="/register" className="font-semibold text-red-500">Register</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

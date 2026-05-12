import { createContext, useContext, useState, useEffect } from 'react'
import { connectSocket, disconnectSocket } from '../utils/socket'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  useEffect(() => {
    if (user?.id) connectSocket(user.id)
    return () => disconnectSocket()
  }, [user])

  const login = (tok, usr) => {
    localStorage.setItem('token', tok)
    localStorage.setItem('user', JSON.stringify(usr))
    setToken(tok)
    setUser(usr)
  }

  const logout = () => {
    localStorage.clear()
    setToken(null)
    setUser(null)
    disconnectSocket()
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

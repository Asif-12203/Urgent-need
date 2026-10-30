import { createContext, useContext, useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import api from './api';
import { Home, Login, Register, Donors, Requests, Profile, AdminPage } from './pages.jsx';

const Ctx = createContext();
export const useAuth = () => useContext(Ctx);

export default function App() {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false), nav = useNavigate();
  useEffect(() => { localStorage.getItem('token') ? api.get('/auth/me').then(r => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setReady(true)) : setReady(true); }, []);
  const login = ({ token, user }) => { localStorage.setItem('token', token); setUser(user); nav('/'); };
  const logout = () => { localStorage.removeItem('token'); setUser(null); nav('/'); };
  if (!ready) return null;
  const guard = (el, role) => !user ? <Navigate to="/login" /> : role && user.role !== role ? <Navigate to="/" /> : el;
  return (
    <Ctx.Provider value={{ user, setUser, login, logout }}>
      <header className="top">
        <NavLink to="/" className="logo"><span className="drop" />LifeDrop</NavLink>
        <nav>
          <NavLink to="/donors">Find donors</NavLink>
          <NavLink to="/requests">Blood requests</NavLink>
          {user?.role === 'donor' && <NavLink to="/profile">My donations</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          {user ? <button className="link" onClick={logout}>Log out ({user.name.split(' ')[0]})</button>
            : <><NavLink to="/login">Log in</NavLink><NavLink to="/register" className="btn sm">Join</NavLink></>}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/donors" element={<Donors />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/profile" element={guard(<Profile />, 'donor')} />
          <Route path="/admin" element={guard(<AdminPage />, 'admin')} />
        </Routes>
      </main>
    </Ctx.Provider>
  );
}

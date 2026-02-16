import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <nav className="app-nav">
        <div className="app-nav-brand">Inventory</div>
        <span className="app-nav-section">Menu</span>
        <ul>
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/categories"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Categories
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/items"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Items
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/reorder"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Reorder
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/movements"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Movements
            </NavLink>
          </li>
          {user?.role === 'admin' && (
            <li>
              <NavLink
                to="/users"
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                Users
              </NavLink>
            </li>
          )}
        </ul>
        <div className="app-nav-account">
          <span className="app-nav-section">Account</span>
          <ul>
            <li>
              <NavLink
                to="/change-password"
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                Change password
              </NavLink>
            </li>
          </ul>
          <p className="app-nav-user">{user?.name ?? user?.email}</p>
          <button type="button" className="btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

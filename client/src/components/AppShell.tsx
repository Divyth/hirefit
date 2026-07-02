import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/resume', label: 'Resume' },
  { to: '/jobs', label: 'Job Descriptions' },
  { to: '/match', label: 'Resume Match' },
  { to: '/questions', label: 'Interview Questions' },
  { to: '/enhancer', label: 'Bullet Enhancer' },
  { to: '/profile', label: 'Profile' }
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="text-lg font-black tracking-tight text-slate-950">
            HireFit
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-sm text-slate-600 sm:block">Signed in as {user?.name}</div>
            <Button
              variant="secondary"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
          <nav className="grid gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

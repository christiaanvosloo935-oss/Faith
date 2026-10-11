import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { IconCircle, IconPrayer, IconSermon, IconSettings, IconToday, IconWalk } from './Icons';
import { Leaf } from './Decor';
import { startSync } from '../sync/engine';
import { syncAllReminders } from '../lib/reminders';

const NAV = [
  { to: '/', label: 'Today', Icon: IconToday, end: true },
  { to: '/prayer', label: 'Answered', Icon: IconPrayer },
  { to: '/circle', label: 'Circle', Icon: IconCircle },
  { to: '/walk', label: 'Walk', Icon: IconWalk },
  { to: '/sermons', label: 'Sermons', Icon: IconSermon },
];

export default function Layout() {
  const { pathname } = useLocation();
  const theme = useLiveQuery(async () => ((await db.settings.get('theme'))?.value as string) || 'auto', [], 'auto');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => window.scrollTo(0, 0), [pathname]);

  useEffect(() => {
    void startSync();
    void syncAllReminders().catch(() => {});
  }, []);

  return (
    <div className="shell">
      <aside className="rail">
        <Link to="/" className="brand">
          <Leaf size={26} color="var(--leaf)" />
          <span>Faith</span>
        </Link>
        <nav>
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="rail-link">
              <Icon /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <NavLink to="/settings" className="rail-link settings-link">
          <IconSettings /> <span>Settings</span>
        </NavLink>
      </aside>

      <div className="topbar">
        <Link to="/" className="brand">
          <Leaf size={22} color="var(--leaf)" />
          <span>Faith</span>
        </Link>
        <NavLink to="/settings" className="icon-btn" aria-label="Settings">
          <IconSettings />
        </NavLink>
      </div>

      <main className="main">
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="Sections">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="tab">
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

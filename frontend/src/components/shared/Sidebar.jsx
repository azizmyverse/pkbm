import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  School,
  BookOpen,
  Megaphone,
  ChartLine,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pengguna', label: 'Manajemen Pengguna', icon: Users },
  { to: '/admin/kelas', label: 'Manajemen Kelas', icon: School },
  { to: '/admin/mata-pelajaran', label: 'Mata Pelajaran', icon: BookOpen },
  { to: '/admin/pengumuman', label: 'Pengumuman', icon: Megaphone },
  { to: '/admin/laporan', label: 'Laporan', icon: ChartLine },
  { to: '/admin/pengaturan', label: 'Pengaturan', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, onNavigate, mobile = false }) {
  return (
    <aside
      className={cn(
        'admin-sidebar flex h-full flex-col text-white',
        mobile ? 'w-full' : 'transition-[width] duration-200',
        !mobile && (collapsed ? 'w-[72px]' : 'w-[260px]'),
      )}
    >
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 font-heading text-lg font-bold backdrop-blur">
          M
        </div>
        {!collapsed || mobile ? (
          <div className="leading-tight">
            <p className="font-heading text-sm font-semibold tracking-wide">
              PKBM MUGI SAE
            </p>
            <p className="text-[11px] text-white/70">Portal Admin</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 px-2 pb-4">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  collapsed && !mobile && 'justify-center px-2',
                  isActive
                    ? 'bg-white/15 text-white shadow-inner'
                    : 'text-white/80 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed || mobile ? <span className="truncate">{item.label}</span> : null}
            </NavLink>
          );
        })}
      </nav>

      {!mobile ? (
        <div className="border-t border-white/10 p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full justify-center text-white/80 hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft
              className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
            />
            {!collapsed ? <span className="ml-1">Ciutkan</span> : null}
          </Button>
        </div>
      ) : null}
    </aside>
  );
}

import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Moon, Sun, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useNotifStore } from '@/store/notifStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn, getInitials, formatRelatif } from '@/lib/utils';
import Sidebar from './Sidebar';

const ROUTE_LABEL = {
  '/admin': 'Dashboard',
  '/admin/pengguna': 'Manajemen Pengguna',
  '/admin/kelas': 'Manajemen Kelas',
  '/admin/mata-pelajaran': 'Mata Pelajaran',
  '/admin/pengumuman': 'Pengumuman',
  '/admin/laporan': 'Laporan',
  '/admin/pengaturan': 'Pengaturan',
};

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('pkbm-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('pkbm-theme', dark ? 'dark' : 'light');
  }, [dark]);
  return [dark, setDark];
}

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const { unreadCount, notifikasi, fetchAll, markRead, markAllRead } = useNotifStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleLogout = async () => {
    await logout();
    toast.success('Berhasil keluar');
    navigate('/login', { replace: true });
  };

  const breadcrumb = ROUTE_LABEL[location.pathname] || 'Admin';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      </div>

      {/* Mobile sidebar (sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <Sidebar
            collapsed={false}
            mobile
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/70 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Admin / {breadcrumb}</span>
              <span className="font-heading text-base font-semibold">{breadcrumb}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark((v) => !v)}
              aria-label="Ubah tema"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifikasi">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 ? (
                    <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <DropdownMenuLabel className="px-0 py-0 text-sm font-semibold">
                    Notifikasi
                  </DropdownMenuLabel>
                  {unreadCount > 0 ? (
                    <button
                      onClick={() => markAllRead()}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Tandai semua
                    </button>
                  ) : null}
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-auto">
                  {notifikasi.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                      Belum ada notifikasi
                    </p>
                  ) : (
                    notifikasi.slice(0, 8).map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        onSelect={() => !n.isRead && markRead(n.id)}
                        className={cn(
                          'flex flex-col items-start gap-0.5 whitespace-normal py-2',
                          !n.isRead && 'bg-accent/40',
                        )}
                      >
                        <span className="text-sm font-medium">{n.judul}</span>
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {n.pesan}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelatif(n.createdAt)}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="ml-1 h-9 gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs uppercase">{user?.role}</DropdownMenuLabel>
                <DropdownMenuLabel className="-mt-2 pb-2 text-sm font-semibold">
                  {user?.name}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin/pengaturan" className="cursor-pointer">
                    <User className="h-4 w-4" /> Profil & Pengaturan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

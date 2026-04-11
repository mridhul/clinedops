import React from 'react';
import { 
  LayoutDashboard, 
  History, 
  BarChart3, 
  Users, 
  HelpCircle, 
  LogOut,
  Plus,
  Shield,
  Bell,
  Megaphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/useAuth';
import { useNavigate, Link } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const profile = useAuth((s) => s.profile);
  const clear = useAuth((s) => s.clear);
  const navigate = useNavigate();

  const handleSignOut = () => {
    clear();
    navigate('/login');
  };

  const isTutor = profile?.role === 'tutor';
  const isStudent = profile?.role === 'student';
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'programme_admin';
  const isSuperAdmin = profile?.role === 'super_admin';
  const isSupervisor = profile?.role === 'supervisor';
  const canSeeSessions = isTutor || isSupervisor || isAdmin;
  const canSeeReports = isSupervisor || isAdmin;

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/dashboard', show: true },
    { icon: Bell, label: 'Notifications', href: '/dashboard/notifications', show: true },
    { 
      icon: History, 
      label: isStudent ? 'My Sessions' : 'Teaching Sessions', 
      href: isStudent ? '/dashboard/my-sessions' : '/dashboard/teaching-sessions',
      show: isStudent || canSeeSessions
    },
    {
      icon: BarChart3,
      label: 'Billing Hours',
      href: '/dashboard/billing-hours',
      show: canSeeSessions,
    },
    { 
      icon: BarChart3, 
      label: isStudent ? 'Pending Surveys' : 'Survey Analytics', 
      href: isStudent ? '/dashboard/surveys/pending' : '/dashboard/surveys/analytics', 
      show: true 
    },
    { icon: LayoutDashboard, label: 'Templates', href: '/dashboard/surveys/templates', show: isAdmin },
    { icon: Users, label: 'User Management', href: '/dashboard/students', show: isAdmin },
    { icon: BarChart3, label: 'Reports', href: '/dashboard/reports', show: canSeeReports },
    { icon: Shield, label: 'Admin Console', href: '/dashboard/admin', show: isSuperAdmin },
    {
      icon: Megaphone,
      label: 'Broadcasts',
      href: '/dashboard/admin/broadcast',
      show: isSuperAdmin,
    },
  ];

  return (
    <>
      <aside className="h-screen w-64 fixed left-0 top-0 pt-20 bg-surface-low z-40 hidden lg:flex flex-col shadow-[4px_0_32px_rgba(43,52,56,0.04)]">
        <div className="px-8 py-4 mb-6">
          <h2 className="font-manrope font-bold text-primary text-lg">Medical Affairs</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold opacity-70">Clinical Curator</p>
        </div>

        <div className="flex-1 flex flex-col pt-2">
          {navItems.filter(item => item.show).map((item) => {
            const isActive = window.location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "px-8 py-3 flex items-center gap-3 font-inter text-sm font-medium transition-all duration-200 hover:translate-x-0.5 group rounded-l-full ml-3",
                  isActive 
                    ? "bg-surface-lowest text-primary shadow-[0_4px_20px_rgba(43,52,56,0.06)] pl-5" 
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-lowest/60 pl-4"
                )}
              >
                <item.icon size={18} className={cn(isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-6 mb-4">
          {(isTutor || isStudent) && (
            <Button className="w-full primary-gradient text-white py-6 rounded-md font-bold text-sm shadow-[0_4px_14px_rgba(0,93,182,0.2)] hover:shadow-[0_6px_20px_rgba(0,93,182,0.25)] transition-all flex items-center gap-2 group">
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
              {isStudent ? 'Request Session' : 'Log Teaching Hours'}
            </Button>
          )}
        </div>

        <div className="pt-6 pb-12 mt-2 shadow-[0_-12px_32px_-28px_rgba(43,52,56,0.12)]">
          <a href="#" className="text-muted-foreground hover:text-foreground px-8 py-2.5 flex items-center gap-3 font-inter text-sm font-medium transition-colors">
            <HelpCircle size={18} />
            <span>Help Center</span>
          </a>
          <button 
            onClick={handleSignOut}
            className="w-full text-muted-foreground hover:text-destructive px-8 py-2.5 flex items-center gap-3 font-inter text-sm font-medium transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 cd-glass shadow-[0_-4px_24px_rgba(43,52,56,0.06)] z-50 flex lg:hidden items-center justify-around h-16 px-2 safe-area-pb">
        {navItems.filter(item => item.show).slice(0, 5).map((item) => {
          const isActive = window.location.pathname === item.href;
          return (
            <Link 
              key={item.label}
              to={item.href} 
              className={cn(
                "flex flex-col items-center gap-1 py-1 flex-1 min-w-0 transition-all",
                isActive ? "text-primary scale-110" : "text-muted-foreground opacity-60"
              )}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold truncate max-w-full px-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default Sidebar;

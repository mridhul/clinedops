import React from 'react';
import { 
  LayoutDashboard, 
  History, 
  BarChart3, 
  Users, 
  HelpCircle, 
  LogOut,
  Plus,
  Shield
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
  const isSupervisor = profile?.role === 'supervisor';
  const canSeeSessions = isTutor || isSupervisor || isAdmin;

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/dashboard', show: true },
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
    { icon: BarChart3, label: 'Reports', href: '/dashboard/reports', show: isAdmin },
    { icon: Shield, label: 'Admin Console', href: '/dashboard/admin', show: isAdmin },
  ];

  return (
    <>
      <aside className="h-screen w-64 fixed left-0 top-0 pt-20 bg-surface-low border-r border-border/20 z-40 hidden lg:flex flex-col">
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
                  "px-8 py-3 flex items-center gap-3 font-inter text-sm font-medium transition-all duration-200 hover:translate-x-1 group",
                  isActive 
                    ? "bg-surface-lowest text-primary shadow-sm rounded-l-full ml-4 pl-4 border-y border-l border-border/30" 
                    : "text-muted-foreground hover:text-foreground"
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
            <Button className="w-full primary-gradient text-white py-6 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 group">
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
              {isStudent ? 'Request Session' : 'Log Teaching Hours'}
            </Button>
          )}
        </div>

        <div className="border-t border-border/20 pt-4 pb-12">
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
      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border/40 z-50 flex lg:hidden items-center justify-around h-16 px-2 safe-area-pb">
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

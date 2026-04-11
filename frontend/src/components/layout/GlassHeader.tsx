import React from 'react';
import { Bell, Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/auth/useAuth';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNotifications, useUnreadCount, useMarkAsRead, type Notification } from '@/api/notifications';

const GlassHeader: React.FC = () => {
  const profile = useAuth((s) => s.profile);
  const accessToken = useAuth((s) => s.accessToken);
  const clear = useAuth((s) => s.clear);
  const navigate = useNavigate();

  const { data: unreadCountData } = useUnreadCount(accessToken);
  const { data: notifications } = useNotifications(accessToken, true, 5); // Fetch top 5 unread
  const markAsReadMutation = useMarkAsRead();
  const unreadCount = unreadCountData?.count || 0;

  const handleSignOut = () => {
    clear();
    navigate('/login');
  };

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getNotificationIconColor = (type: string) => {
    switch(type) {
        case 'LOW_SCORE_ALERT': return 'text-destructive';
        case 'HOURS_APPROVED': return 'text-[#0a4a56]';
        case 'HOURS_REJECTED': return 'text-destructive';
        case 'DEADLINE_APPROACHING': return 'text-secondary';
        default: return 'text-primary';
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 cd-glass shadow-[0_1px_0_rgba(43,52,56,0.06)] flex justify-between items-center px-4 md:px-8 h-16 transition-[background,box-shadow] duration-300">
      <div className="flex items-center gap-8">
        <span className="text-lg md:text-xl font-manrope font-extrabold text-primary tracking-tighter cursor-default whitespace-nowrap">
          ClinEdOps
        </span>
        <div className="hidden lg:flex items-center gap-1">
          {(
            [
              ['/dashboard', 'Dashboard'],
              ['/dashboard/teaching-sessions', 'Teaching Hours'],
              ['/dashboard/billing-hours', 'Billing'],
              ['/dashboard/surveys/pending', 'Surveys'],
              ['/dashboard/reports', 'Reports'],
            ] as const
          ).map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 font-manrope text-sm font-bold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
                  isActive
                    ? 'bg-secondary/10 text-secondary'
                    : 'text-muted-foreground hover:bg-surface-low hover:text-foreground'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="relative p-2 hover:bg-secondary/10 rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2">
              <Bell size={20} />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full animate-in zoom-in"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 glass-card border-0 shadow-premium p-0">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">{unreadCount} unread</Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {notifications && notifications.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notif: Notification) => (
                  <DropdownMenuItem 
                    key={notif.id} 
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                    onClick={() => {
                      if (!notif.is_read) handleMarkAsRead(notif.id);
                    }}
                  >
                    <div className="flex justify-between w-full items-start">
                        <span className={`font-semibold text-sm ${getNotificationIconColor(notif.type)}`}>
                            {notif.title}
                        </span>
                        {!notif.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-2">{notif.message}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">
                        {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No unread notifications
              </div>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem 
                className="w-full text-center text-primary font-medium cursor-pointer justify-center"
                onClick={() => navigate('/dashboard/notifications')}
            >
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div 
          className="p-2 hover:bg-accent rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-primary"
          onClick={() => navigate('/dashboard/settings/notifications')}
        >
          <Settings size={20} />
        </div>
        
        <div className="flex items-center gap-3 pl-3 ml-1 shadow-[-12px_0_24px_-20px_rgba(43,52,56,0.15)]">
          <div 
            className="text-right hidden sm:block cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/dashboard/settings/profile')}
          >
            <p className="text-sm font-bold text-foreground leading-tight">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {profile?.title || profile?.role?.replace('_', ' ') || 'Guest'}
            </p>
          </div>
          <Avatar 
            className="h-10 w-10 shadow-[0_4px_12px_rgba(43,52,56,0.08)] hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer overflow-hidden bg-surface-highest"
            onClick={() => navigate('/dashboard/settings/profile')}
            title="View Profile Settings"
          >
            <AvatarImage 
              src={profile?.profile_photo_url ? `http://localhost:8000${profile.profile_photo_url}` : undefined} 
              alt={profile?.full_name || 'User'} 
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {getInitials(profile?.full_name || null)}
            </AvatarFallback>
          </Avatar>
          
          <button
            type="button"
            className="ml-1 p-2 hover:bg-destructive/10 rounded-md transition-colors cursor-pointer text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
            onClick={handleSignOut}
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default GlassHeader;

import React from 'react';
import { Bell, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/auth/useAuth';
import { useNavigate, Link } from 'react-router-dom';
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
        case 'HOURS_APPROVED': return 'text-green-500';
        case 'HOURS_REJECTED': return 'text-destructive';
        case 'DEADLINE_APPROACHING': return 'text-amber-500';
        default: return 'text-primary';
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-border/50 flex justify-between items-center px-4 md:px-8 h-16 transition-all duration-300">
      <div className="flex items-center gap-8">
        <span className="text-lg md:text-xl font-extrabold text-primary tracking-tighter cursor-default whitespace-nowrap">
          ClinEdOps
        </span>
        <div className="hidden lg:flex items-center gap-6">
          <Link to="/dashboard" className="text-secondary border-b-2 border-secondary pb-1 font-manrope font-bold text-lg tracking-tight">
            Dashboard
          </Link>
          <Link to="/dashboard/teaching-sessions" className="text-muted-foreground hover:text-primary font-manrope font-bold text-lg tracking-tight transition-colors">
            Teaching Hours
          </Link>
          <Link to="/dashboard/billing-hours" className="text-muted-foreground hover:text-primary font-manrope font-bold text-lg tracking-tight transition-colors">
            Billing
          </Link>
          <Link to="/dashboard/surveys/pending" className="text-muted-foreground hover:text-primary font-manrope font-bold text-lg tracking-tight transition-colors">
            Surveys
          </Link>
          <Link to="/dashboard/reports" className="text-muted-foreground hover:text-primary font-manrope font-bold text-lg tracking-tight transition-colors">
            Reports
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="relative p-2 hover:bg-accent rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
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
          <DropdownMenuContent align="end" className="w-80">
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
        
        <div className="flex items-center gap-3 pl-2 border-l border-border/50">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-foreground">
              {profile?.full_name || profile?.email || 'User'}
            </p>
            <p className="text-[10px] text-muted-foreground capitalize">
              {profile?.role || 'Guest'}
            </p>
          </div>
          <Avatar 
            className="h-8 w-8 border border-border/50 shadow-sm hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer"
            onClick={handleSignOut}
            title="Click to Sign Out"
          >
            <AvatarImage src="" alt={profile?.full_name || 'User'} />
            <AvatarFallback>{getInitials(profile?.full_name || null)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  );
};

export default GlassHeader;

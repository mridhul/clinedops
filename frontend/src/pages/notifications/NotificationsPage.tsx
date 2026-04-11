import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Mail, Clock } from 'lucide-react';
import { useNotifications, useMarkAsRead, useMarkAllRead, type Notification } from '@/api/notifications';
import { useAuth } from '@/auth/useAuth';

const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const accessToken = useAuth((s) => s.accessToken);
  const { data: notifications, isLoading } = useNotifications(accessToken, filter === 'unread', 100);
  const markAsRead = useMarkAsRead();
  const markAllRead = useMarkAllRead();

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
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
    <div className="container mx-auto p-6 max-w-4xl space-y-8">
      <div className="flex justify-between items-end cd-section">
        <div>
          <h1 className="text-4xl font-manrope font-extrabold tracking-tight text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-2 text-sm font-medium">Clinical operations alerts and announcements.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => markAllRead.mutate()} 
          disabled={markAllRead.isPending || !notifications?.some((n: Notification) => !n.is_read)}
          className="gap-2 rounded-md border-border/60"
        >
          <Check className="h-4 w-4" /> Mark all read
        </Button>
      </div>

      <Card className="border-0 shadow-premium glass-card overflow-hidden">
        <CardHeader className="bg-surface-low/60 pb-4 pt-6">
          <div className="flex bg-surface-highest/40 p-1 rounded-md w-full max-w-[400px]">
            <button 
              className={`flex-1 flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 ${filter === 'all' ? 'bg-surface-lowest text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setFilter('all')}
            >
              All Notifications
            </button>
            <button 
              className={`flex-1 flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 ${filter === 'unread' ? 'bg-surface-lowest text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setFilter('unread')}
            >
              Unread Only
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Loading notifications...</div>
          ) : notifications && notifications.length > 0 ? (
            <div className="flex flex-col gap-1 p-2">
              {notifications.map((notif: Notification) => (
                <div 
                  key={notif.id} 
                  className={`group rounded-md px-4 py-5 transition-colors hover:bg-surface-low flex gap-4 ${!notif.is_read ? 'bg-primary/[0.04]' : ''}`}
                >
                  <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-primary' : 'bg-transparent'}`} />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className={`text-base font-semibold ${getNotificationIconColor(notif.type)}`}>
                        {notif.title}
                      </h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                  </div>
                  {!notif.is_read && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
              <Mail className="w-12 h-12 text-muted-foreground/30" />
              <p>You're all caught up!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;

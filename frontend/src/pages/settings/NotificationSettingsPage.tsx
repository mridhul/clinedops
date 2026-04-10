import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNotificationSettings, useUpdateNotificationSettings } from '@/api/notifications';
import { BellRing, Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";

const TYPES = [
  { id: "SURVEY_PENDING", label: "Pending Surveys", desc: "When you have new feedback or surveys to complete." },
  { id: "HOURS_PENDING_APPROVAL", label: "Hours Pending Approval", desc: "When a tutor submits hours requiring your review." },
  { id: "HOURS_APPROVED", label: "Hours Approved", desc: "When your submitted teaching hours are approved." },
  { id: "HOURS_REJECTED", label: "Hours Rejected", desc: "When your submitted teaching hours are rejected." },
  { id: "LOW_SCORE_ALERT", label: "Low Score Alerts", desc: "When a student submits feedback below the threshold." },
  { id: "DEADLINE_APPROACHING", label: "Approaching Deadlines", desc: "When a task or survey deadline is near." },
  { id: "BROADCAST", label: "Admin Broadcasts", desc: "Important announcements from the clinical team." },
  { id: "ESCALATION", label: "Escalations", desc: "When overdue tasks are escalated to your attention." }
];

const NotificationSettingsPage: React.FC = () => {
  const { data: preferences, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  const handleToggle = (typeId: string, currentEnabled: boolean) => {
    if (!preferences) return;
    
    // Find existing or default to opposite of what we're setting
    const newPreferences = TYPES.map(t => {
      const p = preferences.find((x: any) => x.notification_type === t.id);
      if (t.id === typeId) {
        return { type: t.id, enabled: !currentEnabled };
      }
      return { type: t.id, enabled: p ? p.email_enabled : true };
    });

    updateSettings.mutate(newPreferences);
  };

  const getIsEnabled = (typeId: string) => {
    if (!preferences) return true; // Default true
    const p = preferences.find((x: any) => x.notification_type === typeId);
    return p ? p.email_enabled : true;
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
          <BellRing className="w-8 h-8 opacity-80" /> Notification Preferences
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">Configure how you receive alerts and summaries.</p>
      </div>

      <Card className="border-none shadow-premium glass">
        <CardHeader className="border-b border-border/50 bg-muted/10">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="w-5 h-5" /> Email Notifications
          </CardTitle>
          <CardDescription>
            Choose which events trigger an email to your primary address. You will always receive in-app alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="animate-pulse space-y-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex justify-between h-10 bg-muted/50 rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {TYPES.map((type) => {
                const isEnabled = getIsEnabled(type.id);
                return (
                  <div key={type.id} className="flex items-start justify-between space-x-4">
                    <div className="space-y-1">
                      <Label htmlFor={type.id} className="text-base font-semibold text-foreground">
                        {type.label}
                      </Label>
                      <p className="text-sm text-muted-foreground leading-snug">
                        {type.desc}
                      </p>
                    </div>
                    {/* Simplified switch logic for layout sake without exact shadcn Switch import */}
                    <div className="pt-1">
                      <button 
                        onClick={() => handleToggle(type.id, isEnabled)}
                        className={`w-11 h-6 rounded-full transition-colors ${isEnabled ? 'bg-primary' : 'bg-muted'} relative inline-flex items-center justify-center`}
                      >
                         <span className={`w-4 h-4 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-[10px]' : '-translate-x-[10px]'}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
         <Button onClick={() => window.history.back()} variant="outline">Done</Button>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;

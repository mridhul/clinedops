import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSendBroadcast } from '@/api/notifications';
import { Megaphone, Send, Users } from 'lucide-react';
import { message } from 'antd'; // Using antd for quick toasts to match existing aesthetic

const BroadcastForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [role, setRole] = useState('');
  
  const broadcastMutation = useSendBroadcast();

  const handleSend = () => {
    if (!title || !msg) {
        message.warning("Title and message are required.");
        return;
    }
    
    broadcastMutation.mutate(
      { title, message: msg, discipline: discipline || undefined, role: role || undefined },
      {
        onSuccess: (res: any) => {
          message.success(`Broadcast sent to ${res.sent_count} user(s).`);
          setTitle('');
          setMsg('');
          setDiscipline('');
          setRole('');
        },
        onError: () => {
          message.error("Failed to send broadcast.");
        }
      }
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
          <Megaphone className="w-8 h-8 opacity-80" /> Admin Broadcasts
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">Send urgent announcements to specific cohorts or all users.</p>
      </div>

      <Card className="border-none shadow-premium glass">
        <CardHeader className="border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg">Compose Announcement</CardTitle>
          <CardDescription>Broadcasts appear as high-priority in-app alerts.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground">Title <span className="text-destructive">*</span></Label>
            <Input 
              id="title" 
              placeholder="e.g., Mandatory App Update" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              maxLength={100}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message" className="text-foreground">Message <span className="text-destructive">*</span></Label>
            <Textarea 
              id="message" 
              placeholder="Type your announcement here..." 
              value={msg} 
              onChange={e => setMsg(e.target.value)} 
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
            <div className="space-y-2">
              <Label htmlFor="discipline" className="text-foreground flex items-center gap-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                Target Discipline
              </Label>
              <Input 
                id="discipline" 
                placeholder="e.g., Medicine (Optional)" 
                value={discipline} 
                onChange={e => setDiscipline(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-foreground">Target Role</Label>
              <select 
                id="role"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Roles</option>
                <option value="Student">Students Only</option>
                <option value="Tutor">Tutors Only</option>
                <option value="HOD">HODs Only</option>
              </select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/10 border-t border-border/50 p-6 flex justify-between">
           <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
           <Button 
            onClick={handleSend} 
            disabled={broadcastMutation.isPending || !title || !msg}
            className="gap-2 shadow-sm font-semibold"
           >
             {broadcastMutation.isPending ? 'Sending...' : <><Send className="w-4 h-4" /> Send Broadcast</>}
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BroadcastForm;

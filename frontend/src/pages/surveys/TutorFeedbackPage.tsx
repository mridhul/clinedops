import React from 'react';
import { 
  LineChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Line, 
  CartesianGrid
} from 'recharts';
import { 
  TrendingUp, 
  Star, 
  AlertTriangle,
  MessageSquare,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/auth/useAuth';
import { useTutorFeedback } from '@/api/surveys';

const TutorFeedbackPage: React.FC = () => {
  const token = useAuth((s) => s.accessToken);
  const profile = useAuth((s) => s.profile);
  
  // In a real app, this would use the authenticated tutor's ID
  const { data: envelope, isLoading } = useTutorFeedback(token, profile?.id);
  const data = envelope?.data;

  if (isLoading) return <div className="p-20 text-center animate-pulse">Analyzing feedback metrics...</div>;
  if (!data) return <div className="p-20 text-center font-bold">No feedback data available yet.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-manrope font-extrabold text-foreground tracking-tight">Feedback Excellence</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Monitoring your clinical teaching impact and student satisfaction.</p>
        </div>
        <div className="bg-surface-low p-1 rounded-xl flex items-center">
          <Button variant="outline" size="sm" className="bg-white shadow-sm rounded-lg font-bold">Last 30 Days</Button>
          <Button variant="ghost" size="sm" className="font-bold text-muted-foreground">This Quarter</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="glass-card border-none shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 group-hover:scale-[2] transition-transform">
            <Star size={64} className="text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-widest">Average Score</CardDescription>
            <CardTitle className="text-4xl font-manrope font-extrabold flex items-baseline gap-2">
              {data.average_score.toFixed(1)}
              <span className="text-sm font-bold text-muted-foreground">/ 5.0</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs font-bold text-emerald-500 gap-1 bg-emerald-50 w-fit px-2 py-1 rounded-md">
              <ArrowUpRight size={14} /> +0.4 vs Last Period
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-sm h-full group">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-widest">Total Responses</CardDescription>
            <CardTitle className="text-4xl font-manrope font-extrabold text-foreground">{data.total_responses}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-medium">85% Completion Rate from Students</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-sm h-full border-l-4 border-l-amber-400">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-widest">Low Score Alerts</CardDescription>
            <CardTitle className="text-4xl font-manrope font-extrabold text-amber-600">{data.low_score_count}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <AlertTriangle size={14} /> Requires Review
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-sm h-full relative overflow-hidden bg-primary/5 border border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg font-manrope font-bold text-primary">Clinical Impact</CardTitle>
            <CardDescription className="text-xs font-medium">Your teaching contributes to 12% of department satisfaction.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="glass-card border-none shadow-md lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="text-xl font-manrope font-bold">Score Sentiment Trend</CardTitle>
              <CardDescription>Aggregate student satisfaction over time</CardDescription>
            </div>
            <TrendingUp className="text-primary" />
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }} domain={[0, 5]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-md h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-manrope font-bold flex items-center gap-2">
              <MessageSquare className="text-primary" size={20} />
              Recent Comments
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.recent_comments.length > 0 ? (
              data.recent_comments.map((comment, i) => (
                <div key={i} className="p-4 bg-surface-lowest/50 rounded-xl border border-border/10 hover:border-primary/20 transition-all group">
                  <p className="text-sm font-medium text-foreground italic leading-relaxed">"{comment}"</p>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] p-0 border-transparent text-muted-foreground group-hover:text-primary transition-colors">Posting #12</Badge>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">2 Days Ago</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-muted-foreground font-medium">No written comments yet.</p>
            )}
            <Button variant="outline" className="w-full mt-2 rounded-xl font-bold text-primary border-primary/20 hover:bg-primary/5 transition-all">
              View All Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TutorFeedbackPage;

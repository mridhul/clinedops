import React from 'react';
import { Calendar, TrendingUp, Clock, AlertCircle, CheckCircle2, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/auth/useAuth';

const TutorDashboard: React.FC = () => {
  const profile = useAuth((s) => s.profile);
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-tertiary font-bold text-[10px] tracking-[0.2em] uppercase mb-2 block">Clinician Portal</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground font-manrope">
            {profile?.full_name ? `Welcome back, ${profile.full_name}` : 'Welcome back, Dr. Aisha'}
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Review your teaching impact and log new clinical hours.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-surface-low px-4 py-2.5 rounded-xl flex items-center gap-2 border border-border/10 shadow-sm">
            <Calendar size={14} className="text-primary" />
            <span className="text-xs font-bold">October 2023</span>
          </div>
        </div>
      </header>

      {/* Asymmetric Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Side: Progress & Sessions (60%) */}
        <div className="lg:col-span-3 space-y-8">
          {/* Monthly Progress Card */}
          <Card className="border-none shadow-sm shadow-slate-200/50 bg-surface-lowest overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold">Monthly Teaching Progress</CardTitle>
                  <p className="text-sm text-muted-foreground">Target: 40 Hours per Cycle</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-extrabold text-primary">32.5</span>
                  <span className="text-sm font-bold text-muted-foreground ml-1">/ 40 hrs</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-4 mb-4">
                <div className="w-full bg-surface-highest h-3 rounded-full overflow-hidden">
                  <div className="primary-gradient h-full rounded-full w-[81%] shadow-[0_0_15px_rgba(0,93,182,0.3)]"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-tertiary bg-tertiary/5 w-fit px-3 py-1 rounded-full">
                <TrendingUp size={12} />
                <span>You're on track to hit your goal this week!</span>
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-lg font-bold">Pending Approvals</h3>
              <Button variant="ghost" className="text-xs font-bold text-primary hover:bg-primary/5">View All</Button>
            </div>
            {[1, 2].map((i) => (
              <div key={i} className="group bg-surface-lowest p-5 rounded-xl shadow-sm shadow-slate-200/40 border border-border/5 hover:translate-x-1 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-low flex items-center justify-center text-primary">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Gastroenterology Seminar</h4>
                      <p className="text-xs text-muted-foreground">Oct 12, 2023 • 2.5 Hours</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 font-bold px-3">Reviewing</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Insights (40%) */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm shadow-slate-200/50 bg-surface-low/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Quick Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-tertiary/10 text-tertiary rounded-lg">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h5 className="font-bold text-sm">Attendance Verified</h5>
                  <p className="text-xs text-muted-foreground mt-1">92% of your students confirmed their attendance this month.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h5 className="font-bold text-sm">Action Required</h5>
                  <p className="text-xs text-muted-foreground mt-1">3 sessions from last cycle are still in draft state.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mini Chart Placeholder */}
          <div className="bg-primary-dim p-8 rounded-xl text-white relative overflow-hidden group cursor-pointer">
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-2">Teaching Feedback</h4>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-3xl font-extrabold">4.9</span>
                <span className="text-sm opacity-80 pb-1">/ 5.0</span>
              </div>
              <p className="text-xs opacity-70 leading-relaxed">Your satisfaction rate is in the top 5% of the Medicine Department.</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <BarChart3 size={120} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;

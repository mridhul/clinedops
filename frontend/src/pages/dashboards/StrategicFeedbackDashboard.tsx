import React from 'react';
import { 
  LineChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Line, 
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  AlertTriangle,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStrategicAnalytics } from '@/api/analytics';
import type { RecognitionHighlight, ImprovementOpportunity } from '@/api/analytics';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

const StrategicFeedbackDashboard: React.FC = () => {
  const { data, isLoading } = useStrategicAnalytics();

  if (isLoading) return <div className="p-20 text-center animate-pulse">Synthesizing strategic insights...</div>;
  if (!data) return <div className="p-20 text-center font-bold">No strategic data available yet.</div>;

  const disciplineData = Object.entries(data.discipline_breakdown).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-manrope font-extrabold text-foreground tracking-tight">Strategic Oversight</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Programme quality and educator excellence across all disciplines.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold gap-2">
            <Download size={18} /> Export Governance Report
          </Button>
          <Button className="rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            Generate Q1 Summary
          </Button>
        </div>
      </div>

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="glass-card border-none shadow-sm relative overflow-hidden group bg-emerald-50/30">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-emerald-600">Aggregate Sentiment</CardDescription>
            <CardTitle className="text-5xl font-manrope font-extrabold flex items-baseline gap-2 text-emerald-700">
              {data.sentiment_score.toFixed(1)}
              <span className="text-sm font-bold text-muted-foreground">/ 5.0</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex items-center text-xs font-bold text-emerald-600 gap-1 mt-1">
              <TrendingUp size={14} /> Consistently above benchmark (4.0)
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-sm relative overflow-hidden group bg-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-primary">Award Nominations</CardDescription>
            <CardTitle className="text-5xl font-manrope font-extrabold text-primary">{data.excellence_highlights.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-medium">Tutors exceeding excellence thresholds this period</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-sm relative overflow-hidden group bg-amber-50/30 border-l-4 border-l-amber-400">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-amber-600">Intervention Areas</CardDescription>
            <CardTitle className="text-5xl font-manrope font-extrabold text-amber-700">{data.improvement_opportunities.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-medium">Identified clusters of negative feedback trends</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Trend Chart */}
        <Card className="glass-card border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-manrope font-bold">Network Sentiment Trend</CardTitle>
            <CardDescription>Smoothing the student experience curve across 30 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.sentiment_trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }} domain={[0, 5]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Discipline Breakdown */}
        <Card className="glass-card border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-manrope font-bold">Performance by Discipline</CardTitle>
            <CardDescription>Benchmarking quality across Medical, Nursing, and Allied Health</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={disciplineData} layout="vertical">
                <XAxis type="number" hide domain={[0, 5]} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 12, fontWeight: 700, fill: '#334155' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                  {disciplineData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Excellence Recognition */}
        <Card className="glass-card border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-manrope font-bold flex items-center gap-2">
                <Award className="text-amber-500" /> Excellence Recognition
              </CardTitle>
              <CardDescription>Top-performing educators based on qualitative analysis</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="font-bold text-primary">View All Nominations</Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.excellence_highlights.map((highlight: RecognitionHighlight, index: number) => (
              <div key={index} className="p-5 bg-white/50 border border-border/10 rounded-2xl flex gap-4 group hover:shadow-lg hover:shadow-primary/5 transition-all">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                  {highlight.tutor_name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground text-base underline decoration-primary/30 underline-offset-4">{highlight.tutor_name}</h3>
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-tighter">{highlight.discipline}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed group-hover:text-foreground transition-colors">"{highlight.highlight_quote}"</p>
                  <div className="mt-2 text-[11px] font-extrabold uppercase text-amber-600 flex items-center gap-1">
                    <Award size={12} /> Nominated for: {highlight.award_category}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quality Intervention */}
        <Card className="glass-card border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-manrope font-bold flex items-center gap-2 text-amber-700">
              <AlertTriangle className="text-amber-600" /> Quality Interventions
            </CardTitle>
            <CardDescription>Critical areas requiring governance review</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.improvement_opportunities.map((opp: ImprovementOpportunity, index: number) => (
              <div key={index} className="p-5 border-l-4 border-l-amber-500 bg-amber-50/20 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-amber-900">{opp.theme}</h3>
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none px-2 py-0.5 text-[10px]">{opp.impact_level} Impact</Badge>
                </div>
                <p className="text-sm text-amber-800/80 leading-relaxed font-bold">{opp.tutor_feedback_summary}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="bg-white text-[11px] font-bold h-7 rounded-lg border-amber-200 text-amber-700">Schedule Review</Button>
                  <Button size="sm" variant="ghost" className="text-[11px] font-bold h-7 rounded-lg text-amber-600">Ignore</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StrategicFeedbackDashboard;

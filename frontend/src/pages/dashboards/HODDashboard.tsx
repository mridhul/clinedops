import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  Search, 
  Award, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/useAuth';

const HODDashboard: React.FC = () => {
  const navigate = useNavigate();
  const profile = useAuth((s) => s.profile);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-primary font-bold text-[10px] uppercase mb-2 block tracking-widest">Departmental Oversight</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground font-manrope">
            {profile?.full_name ? `Welcome, ${profile.full_name}` : 'Welcome, Department Head'}
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Strategic highlights for your educational programme.</p>
        </div>
      </header>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl shadow-primary/5 bg-surface-lowest group hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <CardTitle className="text-xl font-bold">Shadowing Applications</CardTitle>
            <CardDescription>Review student requests for clinical job shadowing and assign mentors.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
                onClick={() => navigate('/dashboard/shadowing')} 
                className="w-full primary-gradient font-bold py-6 rounded-xl flex items-center justify-center gap-2"
            >
              Manage Applications <ArrowRight size={18} />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-tertiary/5 bg-surface-lowest group hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <div className="bg-tertiary/10 w-12 h-12 rounded-2xl flex items-center justify-center text-tertiary mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
            <CardTitle className="text-xl font-bold">Strategic Insights</CardTitle>
            <CardDescription>Analyze feedback trends, recognition highlights, and improvement themes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
                onClick={() => navigate('/dashboard/strategic-insights')} 
                className="w-full bg-tertiary text-white font-bold py-6 rounded-xl hover:bg-tertiary/90 flex items-center justify-center gap-2"
            >
              View Analytics <ArrowRight size={18} />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Oversight Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-6 bg-slate-50 rounded-2xl border border-slate-200/50 flex flex-col justify-between">
              <div>
                  <Award className="text-amber-500 mb-4" size={32} />
                  <h3 className="font-bold text-lg">Recognition Tracks</h3>
                  <p className="text-sm text-slate-500 mt-2">Identify top-performing tutors for annual education awards.</p>
              </div>
              <Button variant="link" className="p-0 text-amber-600 font-bold justify-start mt-6 hover:translate-x-1 transition-transform">
                  See nominations <ArrowRight size={16} className="ml-1" />
              </Button>
          </div>
          <div className="lg:col-span-1 p-6 bg-indigo-50 rounded-2xl border border-indigo-200/50 flex flex-col justify-between">
              <div>
                  <ShieldCheck className="text-indigo-500 mb-4" size={32} />
                  <h3 className="font-bold text-lg">Governance Review</h3>
                  <p className="text-sm text-slate-500 mt-2">Audit clinical teaching compliance across your discipline.</p>
              </div>
              <Button variant="link" className="p-0 text-indigo-600 font-bold justify-start mt-6 hover:translate-x-1 transition-transform">
                  View reports <ArrowRight size={16} className="ml-1" />
              </Button>
          </div>
          <div className="lg:col-span-1 p-6 bg-rose-50 rounded-2xl border border-rose-200/50 flex flex-col justify-between">
              <div>
                  <Search className="text-rose-500 mb-4" size={32} />
                  <h3 className="font-bold text-lg">Audit Opportunities</h3>
                  <p className="text-sm text-slate-500 mt-2">Surface negative trends for targeted educational intervention.</p>
              </div>
              <Button variant="link" className="p-0 text-rose-600 font-bold justify-start mt-6 hover:translate-x-1 transition-transform">
                  Run specific audit <ArrowRight size={16} className="ml-1" />
              </Button>
          </div>
      </div>
    </div>
  );
};

export default HODDashboard;

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
        <Card className="glass-card shadow-premium bg-surface-lowest group hover:shadow-[0_20px_50px_rgba(43,52,56,0.1)] transition-shadow duration-300">
          <CardHeader>
            <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:scale-105 transition-transform">
              <Users size={24} />
            </div>
            <CardTitle className="text-xl font-bold">Shadowing Applications</CardTitle>
            <CardDescription>Review student requests for clinical job shadowing and assign mentors.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
                onClick={() => navigate('/dashboard/shadowing')} 
                className="w-full font-bold py-6 rounded-md flex items-center justify-center gap-2"
            >
              Manage Applications <ArrowRight size={18} />
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-premium bg-surface-lowest group hover:shadow-[0_20px_50px_rgba(43,52,56,0.1)] transition-shadow duration-300">
          <CardHeader>
            <div className="bg-[rgba(0,104,123,0.12)] w-12 h-12 rounded-lg flex items-center justify-center text-[#0a4a56] mb-4 group-hover:scale-105 transition-transform">
              <TrendingUp size={24} />
            </div>
            <CardTitle className="text-xl font-bold">Strategic Insights</CardTitle>
            <CardDescription>Analyze feedback trends, recognition highlights, and improvement themes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
                onClick={() => navigate('/dashboard/strategic-insights')} 
                className="w-full bg-secondary text-secondary-foreground font-bold py-6 rounded-md hover:bg-secondary/90 flex items-center justify-center gap-2"
            >
              View Analytics <ArrowRight size={18} />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Oversight Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-6 rounded-lg glass-card flex flex-col justify-between bg-surface-low/80">
              <div>
                  <Award className="text-secondary mb-4" size={32} />
                  <h3 className="font-manrope font-bold text-lg">Recognition tracks</h3>
                  <p className="text-sm text-muted-foreground mt-2">Identify top-performing tutors for annual education awards.</p>
              </div>
              <Button variant="link" className="p-0 text-secondary font-bold justify-start mt-6">
                  See nominations <ArrowRight size={16} className="ml-1" />
              </Button>
          </div>
          <div className="lg:col-span-1 p-6 rounded-lg glass-card flex flex-col justify-between" style={{ background: 'var(--cd-tertiary-container)' }}>
              <div>
                  <ShieldCheck className="text-[#0a4a56] mb-4" size={32} />
                  <h3 className="font-manrope font-bold text-lg" style={{ color: 'var(--cd-on-tertiary-container)' }}>Governance review</h3>
                  <p className="text-sm mt-2 opacity-90" style={{ color: 'var(--cd-on-tertiary-container)' }}>Audit clinical teaching compliance across your discipline.</p>
              </div>
              <Button variant="link" className="p-0 font-bold justify-start mt-6" style={{ color: 'var(--cd-on-tertiary-container)' }}>
                  View reports <ArrowRight size={16} className="ml-1" />
              </Button>
          </div>
          <div className="lg:col-span-1 p-6 rounded-lg glass-card flex flex-col justify-between bg-destructive/5">
              <div>
                  <Search className="text-destructive mb-4" size={32} />
                  <h3 className="font-manrope font-bold text-lg">Audit opportunities</h3>
                  <p className="text-sm text-muted-foreground mt-2">Surface trends that need targeted educational intervention.</p>
              </div>
              <Button variant="link" className="p-0 text-destructive font-bold justify-start mt-6">
                  Run specific audit <ArrowRight size={16} className="ml-1" />
              </Button>
          </div>
      </div>
    </div>
  );
};

export default HODDashboard;

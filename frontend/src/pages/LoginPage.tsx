import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, ArrowRight, Landmark } from 'lucide-react';
import { useLogin } from '../api/auth';
import { useAuth } from '../auth/useAuth';
import type { MeResponse } from '../types/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAccessToken = useAuth((s) => s.setAccessToken);
  const setProfile = useAuth((s) => s.setProfile);
  const loginMutation = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      const res = await loginMutation.mutateAsync({ email, password });
      setAccessToken(res.access_token);

      const profile: MeResponse = {
        id: 'unknown',
        email: email,
        full_name: email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        role: res.role,
        discipline: res.discipline,
      };
      setProfile(profile);

      navigate('/dashboard', { replace: true });
    } catch {
      setSubmitError('Invalid professional email or password');
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-background font-inter animate-in fade-in duration-500">
      {/* Left Side: Branding & Imagery (40%) */}
      <section className="hidden md:flex md:w-[40%] primary-gradient relative overflow-hidden flex-col justify-between p-12 lg:p-16">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          <img 
            alt="Clinical abstract" 
            className="w-full h-full object-cover grayscale brightness-50" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-MIyekvaGQKoo9OMbWpcPToY5tQAaNqeHd4LwwS7BfbrpGPVA0cbZiIkXvRBTKt5aMvtC4Dyq2ekHCvcFUc7bDRLXdyONmCXuOyDj6EFxqYoDAZsp51IRG7KM8K_accCBHm0ugGiVtyF2LQQly4rv8q_YgaBjUvW6O2UTODUdl5_-NxNtdaAd3Jz8x5P0ePKEGq7nmQ6edrRSxRwCTeql0l0mz-S6L9Prf8n-U-JRcYjhSoJAqM-NYsByk51HKmoCKMbU6yACCug" 
          />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md group-hover:scale-110 transition-transform duration-300">
              <Stethoscope className="text-white h-8 w-8" />
            </div>
            <h1 className="font-manrope text-2xl font-extrabold tracking-tighter text-white">The Clinical Editorial</h1>
          </div>
        </div>

        <div className="relative z-10 max-w-sm">
          <h2 className="font-manrope text-4xl font-extrabold text-white leading-tight mb-6">
            Advancing Medical Excellence through Curated Evidence.
          </h2>
          <p className="text-white/70 text-base leading-relaxed font-medium">
            Access the world's most rigorous clinical curriculum and peer-reviewed case studies designed for modern practitioners.
          </p>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/10">
          <p className="text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase">
            Institutional Partner Program
          </p>
        </div>
      </section>

      {/* Right Side: Login Form (60%) */}
      <section className="flex-1 bg-surface-lowest flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md space-y-12">
          {/* Header */}
          <div className="space-y-3">
            <h2 className="font-manrope text-4xl font-extrabold text-foreground tracking-tight">Sign In</h2>
            <p className="text-muted-foreground text-base font-medium">
              Welcome back to The Clinical Editorial dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                  Professional Email
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="dr.smith@hospital.org" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-surface-low border-none focus:bg-white transition-all shadow-sm"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label htmlFor="password" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Password
                  </Label>
                  <a href="#" className="text-xs text-primary font-bold hover:underline transition-all">Forgot?</a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-surface-low border-none focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>

            {submitError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold p-4 rounded-xl animate-in slide-in-from-top-2 duration-300">
                {submitError}
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center space-x-3 px-1">
              <Checkbox id="remember" className="rounded-md h-5 w-5" />
              <Label htmlFor="remember" className="text-sm text-muted-foreground font-medium cursor-pointer">
                Keep me signed in for 30 days
              </Label>
            </div>

            {/* Primary Action */}
            <Button 
              type="submit" 
              disabled={loginMutation.isPending}
              className="w-full primary-gradient text-white font-bold py-7 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <span className="text-lg">Sign In</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-surface-lowest px-4 text-muted-foreground">or continue with</span>
            </div>
          </div>

          {/* Secondary Action: SSO */}
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-3 py-7 bg-white border-border/50 rounded-2xl hover:bg-surface-low hover:text-primary transition-all duration-300 font-bold group shadow-sm text-base"
          >
            <Landmark className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>Login with Institution SSO</span>
          </Button>

          {/* Footer Links */}
          <div className="pt-8 flex flex-col items-center gap-6">
            <p className="text-sm text-muted-foreground font-medium">
              Don't have an account? 
              <a href="#" className="text-primary font-bold hover:underline ml-1">Request institutional access</a>
            </p>
            <div className="flex gap-8 text-[10px] uppercase tracking-widest text-muted-foreground font-bold opacity-60">
              <a href="#" className="hover:text-primary transition-colors">Help Center</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Metadata (Hidden on small mobile) */}
      <footer className="fixed bottom-0 right-0 p-8 hidden lg:block opacity-40 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
          System Status: Operational • v2.4.1
        </p>
      </footer>
    </main>
  );
};

export default LoginPage;

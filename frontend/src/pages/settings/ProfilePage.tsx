import React, { useState, useRef } from 'react';
import { useAuth } from '@/auth/useAuth';
import { updateProfile, uploadProfilePhoto } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, User, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { message } from 'antd';

const ProfilePage: React.FC = () => {
  const profile = useAuth((s) => s.profile);
  const accessToken = useAuth((s) => s.accessToken);
  const setProfile = useAuth((s) => s.setProfile);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [title, setTitle] = useState(profile?.title || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setIsUpdating(true);
    try {
      const updatedProfile = await updateProfile(accessToken, {
        full_name: fullName,
        title: title,
      });
      setProfile(updatedProfile);
      message.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      message.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      message.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      message.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const updatedProfile = await uploadProfilePhoto(accessToken, file);
      setProfile(updatedProfile);
      message.success('Profile photo uploaded successfully');
    } catch (error) {
      console.error('Failed to upload photo:', error);
      message.error('Failed to upload profile photo');
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Profile Settings
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage your public identity and professional title.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar Upload */}
        <Card className="md:col-span-1 glass border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="relative group">
              <Avatar className="h-40 w-40 border-4 border-background shadow-2xl transition-transform group-hover:scale-[1.02] duration-300">
                <AvatarImage 
                  src={profile?.profile_photo_url ? `http://localhost:8000${profile.profile_photo_url}` : undefined} 
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl font-black bg-primary/5 text-primary">
                  {getInitials(profile?.full_name || null)}
                </AvatarFallback>
              </Avatar>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-2 right-2 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">{profile?.email}</p>
              <p className="text-xs text-muted-foreground capitalize bg-accent/50 px-2 py-0.5 rounded-full inline-block">
                {profile?.role.replace('_', ' ')}
              </p>
            </div>
          </CardContent>
          <CardFooter className="bg-accent/30 py-4 flex justify-center border-t border-border/50">
            <p className="text-[10px] text-muted-foreground text-center px-4">
              Upload a professional photo (JPG, PNG). Max size 5MB.
            </p>
          </CardFooter>
        </Card>

        {/* Right Column: Profile Form */}
        <Card className="md:col-span-2 glass border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your name and professional title shown across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-bold">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="fullName" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="e.g. Dr. Sarah Chen"
                    className="pl-10 h-11 focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-bold">Professional Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Senior Registrar, ICU"
                  className="h-11 focus-visible:ring-primary/20"
                />
                <p className="text-[11px] text-muted-foreground italic">
                  This title appears next to your name in the header and communications.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isUpdating || (fullName === profile?.full_name && title === profile?.title)}
                  className="px-8 h-11 font-bold shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px] active:translate-y-[1px]"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Save Changes</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Security Tip */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex gap-4 items-start">
        <div className="p-2 bg-primary/10 rounded-lg">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-foreground">Identity Verification</h3>
          <p className="text-sm text-muted-foreground">
            Your profile details and professional title are used for session approvals and clinical feedback attribution. Please ensure they reflect your current institutional role.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

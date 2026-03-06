import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, KeyRound, User, Camera, Info, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserAuth } from '@/lib/UserAuthContext';
import {
  apiUserSendOtp, apiUserLogin, apiUpdateUserProfile,
  apiUpdateProfilePhoto, apiSkipProfileSetup
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';

type Step = 'email' | 'otp' | 'profile' | 'done';

export default function UserLogin() {
  const navigate = useNavigate();
  const { login, updateUser } = useUserAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNameInfo, setShowNameInfo] = useState(false);

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast({ title: 'Enter a valid email', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await apiUserSendOtp(email.trim().toLowerCase());
      if (res.status === 'not_subscribed') {
        toast({
          title: 'Email not subscribed',
          description: 'Please subscribe to Tech Simplified first to create a profile.',
          variant: 'destructive',
        });
        return;
      }
      setStep('otp');
      toast({ title: 'OTP sent!', description: `Check ${email} for your 6-digit code.` });
    } catch (e) {
      toast({ title: 'Failed to send OTP', description: String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({ title: 'Enter the 6-digit OTP', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const data = await apiUserLogin(email.trim().toLowerCase(), otp.trim());
      login(data, data.token);
      if (data.profileSetupComplete) {
        toast({ title: `Welcome back, ${data.displayName}! 👋` });
        navigate('/');
      } else {
        setStep('profile');
      }
    } catch {
      toast({ title: 'Invalid or expired OTP', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3a: Handle photo upload ────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Invalid format', description: 'Allowed: JPEG, PNG, WebP', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Max size before compression: 2 MB', variant: 'destructive' });
      return;
    }

    // Compress to ≤ 200 KB
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const maxDim = 400;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else { width = Math.round(width * maxDim / height); height = maxDim; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      setPhotoBase64(base64);
      setPhotoPreview(base64);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // ── Step 3b: Save profile ───────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      let profile;
      if (displayName.trim()) {
        profile = await apiUpdateUserProfile(displayName.trim());
      } else {
        profile = await apiSkipProfileSetup();
      }
      if (photoBase64) {
        profile = await apiUpdateProfilePhoto(photoBase64);
      }
      updateUser(profile);
      setStep('done');
      setTimeout(() => navigate('/'), 1500);
    } catch (e) {
      toast({ title: 'Failed to save profile', description: String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const profile = await apiSkipProfileSetup();
      updateUser(profile);
      toast({ title: 'Profile created!', description: `Welcome, ${profile.displayName}!` });
      navigate('/');
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-gradient">Tech Simplified</Link>
          <p className="text-muted-foreground mt-2 text-sm">
            {step === 'email' && 'Sign in to your subscriber account'}
            {step === 'otp' && 'Check your email for the code'}
            {step === 'profile' && 'Set up your profile'}
            {step === 'done' && 'All set!'}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['email', 'otp', 'profile'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                step === 'done' || ['email', 'otp', 'profile'].indexOf(s) < ['email', 'otp', 'profile'].indexOf(step)
                  ? 'bg-primary' : step === s ? 'bg-primary scale-125' : 'bg-muted-foreground/30'
              }`} />
              {i < 2 && <div className="w-8 h-0.5 bg-muted-foreground/20" />}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-xl shadow-black/20">

          {/* ── Step: Email ── */}
          {step === 'email' && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    placeholder="your@email.com"
                    className="pl-9 bg-secondary border-border"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Must be an email you've subscribed with.{' '}
                  <Link to="/" className="text-primary hover:underline">Subscribe here</Link>
                </p>
              </div>
              <Button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Send OTP
              </Button>
            </div>
          )}

          {/* ── Step: OTP ── */}
          {step === 'otp' && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>
              </p>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Enter OTP</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                    placeholder="000000"
                    className="pl-9 bg-secondary border-border font-mono tracking-widest text-lg text-center"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Code expires in 10 minutes.</p>
              </div>
              <Button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Verify & Login
              </Button>
              <button
                onClick={() => setStep('email')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to email
              </button>
            </div>
          )}

          {/* ── Step: Profile Setup ── */}
          {step === 'profile' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="relative inline-block">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary/50" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold border-2 border-primary/30">
                      {displayName ? getInitials(displayName) : email[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <label htmlFor="photo-upload" className="absolute -bottom-1 -right-1 cursor-pointer
                    w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg
                    hover:bg-primary/90 transition-colors">
                    <Camera className="h-3.5 w-3.5 text-white" />
                  </label>
                  <input id="photo-upload" type="file" accept="image/jpeg,image/png,image/webp"
                    className="sr-only" onChange={handlePhotoChange} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Max 200 KB · JPEG, PNG, WebP
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-sm font-medium text-foreground">
                    ✨ What may we call you?
                  </label>
                  <div className="relative">
                    <button
                      onMouseEnter={() => setShowNameInfo(true)}
                      onMouseLeave={() => setShowNameInfo(false)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                    {showNameInfo && (
                      <div className="absolute left-5 top-0 z-50 w-64 bg-card border border-border rounded-lg p-3 shadow-xl text-xs text-muted-foreground leading-relaxed">
                        This name will be visible on your profile page. If you write a blog and Tech Simplified approves it, your blog will be credited under this name. You can update it anytime in Settings.
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder={`e.g. ${email.split('@')[0]}`}
                    className="pl-9 bg-secondary border-border"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Profile'}
                </Button>
                <Button variant="ghost" onClick={handleSkip} disabled={loading}
                  className="text-muted-foreground hover:text-foreground border border-border/50">
                  Skip
                </Button>
              </div>
            </div>
          )}

          {/* ── Step: Done ── */}
          {step === 'done' && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Profile set up!</h3>
              <p className="text-muted-foreground text-sm">Redirecting you to the homepage…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

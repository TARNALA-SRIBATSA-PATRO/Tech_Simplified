import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, Loader2, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { apiRequestAdminOtp, apiVerifyAdminOtp } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /** Step 1 — Request OTP */
  const handleRequestOtp = async () => {
    setLoading(true);
    try {
      await apiRequestAdminOtp();
      setStep('verify');
      toast({ title: 'OTP Sent!', description: 'Check your email for the 6-digit code.' });
    } catch {
      toast({ title: 'Failed to send OTP', description: 'Check backend is running.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  /** Step 2 — Verify OTP */
  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const token = await apiVerifyAdminOtp(otp);
      sessionStorage.setItem('admin_jwt', token);
      navigate('/admin/dashboard');
      toast({ title: 'Welcome back, Sribatsa!' });
    } catch {
      toast({ title: 'Invalid or expired OTP', variant: 'destructive' });
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-sm bg-card border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              {step === 'request' ? (
                <Lock className="h-6 w-6 text-primary" />
              ) : (
                <ShieldCheck className="h-6 w-6 text-primary" />
              )}
            </div>
            <CardTitle className="text-xl text-gradient">Sribatsa</CardTitle>
            <CardDescription>
              {step === 'request'
                ? 'Click below to receive a one-time login code.'
                : 'Enter the 6-digit OTP sent to your email.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {step === 'request' ? (
                <motion.div
                  key="request"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={handleRequestOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" /> Send OTP to My Email
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col items-center gap-4"
                >
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>

                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length < 6}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Login'}
                  </Button>

                  <button
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => { setStep('request'); setOtp(''); }}
                  >
                    Resend OTP
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

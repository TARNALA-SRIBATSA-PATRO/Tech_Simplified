import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiSubscribe, apiVerifySubscriberOtp } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const result = await apiSubscribe(email);
      if (result.status === 'already_verified') {
        toast({ title: 'Already subscribed', description: 'This email is already subscribed.' });
        setVerified(true);
      } else {
        setOtpSent(true);
        toast({ title: 'OTP Sent!', description: 'Check your email for the 6-digit verification code.' });
      }
    } catch {
      toast({ title: 'Failed to send OTP', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const result = await apiVerifySubscriberOtp(email, otp);
      if (result.verified) {
        setVerified(true);
        toast({ title: 'Subscribed!', description: 'You will receive new post notifications by email.' });
      } else {
        toast({ title: 'Invalid OTP', description: 'The code you entered is incorrect.', variant: 'destructive' });
        setOtp('');
      }
    } catch {
      toast({ title: 'Verification failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-t border-border/50 bg-card/50 backdrop-blur">
      <div className="container max-w-2xl mx-auto py-16 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
          <p className="text-muted-foreground mb-8">Subscribe to get notified whenever a new post is published.</p>

          <AnimatePresence mode="wait">
            {verified ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <CheckCircle className="h-12 w-12 text-primary" />
                <p className="text-lg font-medium">Successfully subscribed!</p>
                <p className="text-sm text-muted-foreground">You'll get an email for every new post.</p>
              </motion.div>
            ) : otpSent ? (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to <strong>{email}</strong></p>
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
                  onClick={handleVerify}
                  disabled={loading || otp.length < 6}
                  className="bg-primary hover:bg-primary/90"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Subscribe'}
                </Button>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => { setOtpSent(false); setOtp(''); }}
                >
                  Wrong email? Go back
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="email"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
              >
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  className="bg-secondary border-border"
                />
                <Button onClick={handleSendOtp} disabled={loading} className="bg-primary hover:bg-primary/90 shrink-0">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

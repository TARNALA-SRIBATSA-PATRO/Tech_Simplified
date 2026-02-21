import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { addSubscriber, getSubscribers, verifySubscriber } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleSendOtp = () => {
    if (!email || !email.includes('@')) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email.', variant: 'destructive' });
      return;
    }

    const existing = getSubscribers().find(s => s.email === email && s.is_verified);
    if (existing) {
      toast({ title: 'Already subscribed', description: 'This email is already subscribed.' });
      return;
    }

    setLoading(true);
    // Simulate OTP send
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(code);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      toast({ title: 'OTP Sent!', description: `Demo OTP: ${code} (In production, this would be emailed)` });
    }, 1000);
  };

  const handleVerify = () => {
    if (otp === generatedOtp) {
      const sub = {
        id: crypto.randomUUID(),
        email,
        is_verified: true,
        subscribed_at: new Date().toISOString(),
      };
      const existingUnverified = getSubscribers().find(s => s.email === email);
      if (existingUnverified) {
        verifySubscriber(email);
      } else {
        addSubscriber(sub);
      }
      setVerified(true);
      toast({ title: 'Subscribed!', description: 'You have been successfully subscribed.' });
    } else {
      toast({ title: 'Invalid OTP', description: 'The code you entered is incorrect.', variant: 'destructive' });
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
          <p className="text-muted-foreground mb-8">Subscribe to our newsletter for the latest posts.</p>

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
              </motion.div>
            ) : otpSent ? (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <p className="text-sm text-muted-foreground">Enter the 4-digit code sent to your email</p>
                <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                </InputOTP>
                <Button onClick={handleVerify} className="bg-primary hover:bg-primary/90">
                  Verify & Subscribe
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="email"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2 max-w-md mx-auto"
              >
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, ArrowRight, UserPlus, ChevronLeft, Eye, EyeOff, AlertCircle, ShieldCheck, RefreshCw, Phone } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { setToken } from "@/lib/session";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setIsError(false);

    try {
      const response = await fetch(apiUrl("/auth/signup"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, phone }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Unable to create account.");
      }

      setToken(payload.token);
      setMessage("Success! Initializing your workspace...");
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gray-50 dark:bg-brand-dark">
      {/* Premium Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Top Left Navigation */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-8 left-8 z-20"
      >
        <Link 
          href="/" 
          className="group flex items-center gap-2 text-gray-400 hover:text-brand-primary transition-colors font-medium text-sm"
        >
          <div className="p-2 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 group-hover:border-brand-primary/30 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </div>
          Back to homepage
        </Link>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-md w-full"
      >
        <div className="bg-white/70 dark:bg-brand-dark/50 backdrop-blur-2xl rounded-[3rem] p-10 shadow-2xl border border-white dark:border-white/10 overflow-hidden">
          {/* Accent line at the top */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-primary to-emerald-400" />

          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-20 h-20 bg-gradient-to-br from-brand-primary/20 to-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner"
            >
              <UserPlus className="w-10 h-10 text-brand-primary" />
            </motion.div>
            <h1 className="text-4xl font-extrabold mb-3 tracking-tight">Onboarding</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium lowercase tracking-tighter italic">Join <span className="font-black text-brand-primary uppercase not-italic">Turf Wars</span> as a Venue Partner</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">Institutional Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  required
                  placeholder="admin@venue.com"
                  className="w-full py-4 pl-12 pr-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-primary/30 outline-none focus:ring-4 ring-brand-primary/5 transition-all text-sm font-medium"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">Contact Number</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <input 
                  type="tel" 
                  required
                  placeholder="+233 24 123 4567"
                  className="w-full py-4 pl-12 pr-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-primary/30 outline-none focus:ring-4 ring-brand-primary/5 transition-all text-sm font-medium"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">Create Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  className="w-full py-4 pl-12 pr-12 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-primary/30 outline-none focus:ring-4 ring-brand-primary/5 transition-all text-sm font-medium font-mono"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 pb-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">Confirm Identity</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  className="w-full py-4 pl-12 pr-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-primary/30 outline-none focus:ring-4 ring-brand-primary/5 transition-all text-sm font-medium font-mono"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="relative group w-full py-5 rounded-2xl bg-brand-primary text-white font-bold text-lg overflow-hidden shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-70" 
              disabled={isSubmitting}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <div className="flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>Create Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </div>
              
              <div className="absolute flex h-2 w-2 top-2 right-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
            </button>
          </form>

          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: 10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: 10 }}
                className={`mt-6 p-4 rounded-2xl text-xs font-medium flex items-center gap-3 ${
                  isError 
                    ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500 border border-rose-100 dark:border-rose-500/20" 
                    : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-100 dark:border-emerald-500/20"
                }`}
              >
                {isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <ShieldCheck className="w-4 h-4 shrink-0" />}
                <p>{message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center mt-8 text-gray-500 font-medium text-xs">
            Already registered? <Link href="/login" className="text-brand-primary font-bold hover:underline">Sign in to portal</Link>
          </p>
        </div>
        <div className="mt-8 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
           <span>Terms</span>
           <span className="w-1 h-1 rounded-full bg-gray-300" />
           <span>Privacy</span>
           <span className="w-1 h-1 rounded-full bg-gray-300" />
           <span>Security</span>
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { Calendar, Users, Shield, Clock, ArrowRight, Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black italic tracking-tighter gradient-text uppercase">Turf Wars</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 font-medium">
              <a href="#" className="hover:text-brand-primary transition-colors">How it works</a>
              <a href="#" className="hover:text-brand-primary transition-colors">Find a Pitch</a>
              <Link href="/pitches" className="button-primary">Book Now</Link>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="md:hidden border-t border-white/10 bg-black/80 backdrop-blur-md px-4 py-4 flex flex-col gap-3"
          >
            <a href="#" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-white/10 font-medium transition-colors">How it works</a>
            <a href="#" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-white/10 font-medium transition-colors">Find a Pitch</a>
            <Link href="/pitches" onClick={() => setIsMenuOpen(false)} className="button-primary text-center">Book Now</Link>
            <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
              <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-xl border border-white/20 text-center font-semibold hover:bg-white/10 transition-colors">Pitch Owner Sign Up</Link>
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-center text-white/70 hover:text-white font-medium transition-colors">Sign In</Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero.png"
            alt="Football Pitch"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tighter italic"
          >
            Seize the <span className="text-brand-secondary">Turf.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-medium"
          >
            The ultimate battleground for Ghana's football enthusiasts. Secure your slot in seconds and dominate the field.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/pitches" className="button-secondary text-lg px-8 py-4 flex items-center justify-center gap-2 h-[60px]">
              Start Booking <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="flex flex-col items-center gap-3">
              <Link href="/signup" className="w-full sm:w-auto px-8 py-4 rounded-full border-2 border-white/30 text-white font-semibold hover:bg-white/10 backdrop-blur-sm transition-all whitespace-nowrap h-[60px] flex items-center">
                Are you a Pitch Owner?
              </Link>
              <p className="text-white/70 text-sm">
                Already an owner? <Link href="/login" className="text-white hover:text-brand-secondary font-bold underline underline-offset-4 transition-colors">Sign in here</Link>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-brand-dark overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Why KickOff?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">We're professionalizing pitch management for the modern game.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Shield className="text-emerald-500" />, 
                title: "No Double Bookings", 
                desc: "Our real-time system ensures that once a slot is gone, it's gone. No more phone-tag or mix-ups." 
              },
              { 
                icon: <Clock className="text-lime-500" />, 
                title: "Instant Confirmation", 
                desc: "Receive immediate booking confirmation via SMS or WhatsApp, ready for your game." 
              },
              { 
                icon: <Users className="text-amber-500" />, 
                title: "Owner Dashboard", 
                desc: "Pitch owners get a sleek dashboard to manage multiple fields, prices, and customer records effortlessly." 
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10"
              >
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center shadow-sm mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Booking CTA */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="p-12 rounded-[3rem] bg-gradient-to-br from-brand-primary to-emerald-900 text-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-secondary opacity-10 rounded-full -mr-32 -mt-32 blur-3xl" />
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Kick Off?</h2>
            <p className="text-emerald-100 text-lg mb-10 max-w-xl mx-auto">
              Find the best pitches in Accra, Kumasi, and beyond.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="relative w-full max-w-md">
                <input 
                  type="text" 
                  placeholder="Enter location or pitch name..." 
                  className="w-full px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-emerald-200 outline-none focus:ring-2 ring-brand-secondary/50"
                />
              </div>
              <Link href="/pitches" className="button-secondary px-10 py-4 whitespace-nowrap">
                Search Pitches
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="mb-8">
            <span className="text-2xl font-bold gradient-text">KickOff</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 KickOff Ghana. Built for the love of the game.
          </p>
        </div>
      </footer>
    </div>
  );
}

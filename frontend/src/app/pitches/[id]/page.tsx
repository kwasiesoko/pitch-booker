"use client";

import React, { useState, useEffect, use } from "react";
import { 
  ChevronLeft, Calendar as CalendarIcon, Clock, Phone, User, 
  CheckCircle2, MapPin, Info, ShieldCheck, Sun, Cloud, CloudRain, Star, AlertTriangle, Mail, CreditCard, Loader2
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { apiUrl } from "@/lib/api";
import type { PaystackCheckoutProps } from "@/components/PaystackCheckout";

// Map of common Ghanaian city names to lat/lon
const GH_CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  accra: { lat: 5.6037, lon: -0.187 },
  kumasi: { lat: 6.6885, lon: -1.6244 },
  tamale: { lat: 9.4008, lon: -0.8393 },
  takoradi: { lat: 4.8845, lon: -1.7554 },
  "cape coast": { lat: 5.1053, lon: -1.2466 },
  koforidua: { lat: 6.0866, lon: -0.2598 },
  sunyani: { lat: 7.3349, lon: -2.3241 },
  tema: { lat: 5.6698, lon: -0.0166 },
};

function getCoords(location: string): { lat: number; lon: number } {
  const lower = location.toLowerCase();
  for (const [city, coords] of Object.entries(GH_CITY_COORDS)) {
    if (lower.includes(city)) return coords;
  }
  return { lat: 5.6037, lon: -0.187 };
}

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Pitch {
  id: string;
  name: string;
  location: string;
  pricePerHour: number;
  facilities: string[];
  openingTime: string;
  closingTime: string;
  isVerified: boolean;
  reviews: Review[];
}

function WeatherWidget({ location }: { location: string }) {
  const [data, setData] = useState<{temp: number, condition: string, isRain: boolean} | null>(null);

  useEffect(() => {
    const { lat, lon } = getCoords(location);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
      .then(res => res.json())
      .then(json => {
        const cw = json.current_weather;
        const isRain = cw.weathercode >= 51; 
        setData({
          temp: Math.round(cw.temperature),
          condition: isRain ? "Likely Rain" : cw.weathercode === 0 ? "Clear Skies" : "Partly Cloudy",
          isRain
        });
      })
      .catch(() => {
        setData({ temp: 28, condition: "Sunny", isRain: false });
      });
  }, [location]);

  if (!data) return (
    <div className="h-20 animate-pulse bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10" />
  );

  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
      data.isRain 
        ? "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20" 
        : "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20"
    }`}>
      <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center shadow-sm">
        {data.isRain ? <CloudRain className="w-5 h-5 text-blue-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
      </div>
      <div>
        <p className={`text-[10px] uppercase font-bold tracking-wider ${data.isRain ? "text-blue-600" : "text-amber-600"}`}>
          Live Weather • {location.split(',')[0]}
        </p>
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          {data.temp}°C • {data.condition}
        </p>
      </div>
    </div>
  );
}

function isConsecutive(times: string[]): boolean {
  if (times.length <= 1) return true;
  const sorted = [...times].sort();
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseInt(sorted[i - 1].split(':')[0]);
    const curr = parseInt(sorted[i].split(':')[0]);
    if (curr - prev !== 1) return false;
  }
  return true;
}

/**
 * Sub-component to handle the Paystack checkout process.
 * This is rendered once the public key is fetched from the backend.
 */
const PaystackCheckout = dynamic<PaystackCheckoutProps>(
  () => import("@/components/PaystackCheckout"),
  {
    ssr: false,
    loading: () => (
      <button disabled className="button-primary flex-1 py-5 text-lg opacity-50 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading Gateway...
      </button>
    ),
  },
);

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [slots, setSlots] = useState<{time: string, status: string}[]>([]);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [isBooking, setIsBooking] = useState(false);
  const [isLoadingError, setIsLoadingError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [gapWarning, setGapWarning] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [paystackPubKey, setPaystackPubKey] = useState<string | null>(null);

  const totalPrice = pitch ? pitch.pricePerHour * selectedSlots.length : 0;

  useEffect(() => {
    // 1. Fetch Pitch Details
    fetch(apiUrl(`/pitches/${unwrappedParams.id}`))
      .then(res => res.json())
      .then(data => setPitch(data))
      .catch((err) => {
        setIsLoadingError(true);
        setErrorMessage(err.message);
      });

    // 2. Fetch Paystack Public Key via Config Endpoint
    fetch(apiUrl(`/configs/paystack-public-key`))
      .then(res => res.json())
      .then(data => setPaystackPubKey(data.publicKey))
      .catch(err => console.error("Could not fetch Paystack key from backend", err));
  }, [unwrappedParams.id]);

  useEffect(() => {
    if (!selectedDate) return;
    fetch(apiUrl(`/pitches/${unwrappedParams.id}/availability?date=${selectedDate}`))
      .then(res => res.json())
      .then(data => setSlots(data.slots || []));
  }, [selectedDate, unwrappedParams.id]);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const toggleSlot = (time: string) => {
    setSelectedSlots(prev => {
      const next = prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time];
      setGapWarning(next.length > 1 && !isConsecutive(next));
      return next;
    });
  };

  const confirmBooking = async (paymentRef: string) => {
    setIsBooking(true);
    setErrorMessage("");
    try {
      const sortedSlots = [...selectedSlots].sort();
      
      // 1. Initiate payment record in backend
      const initRes = await fetch(apiUrl('/payments/initiate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: paymentRef,
          amount: totalPrice,
          email: formData.email,
          phone: formData.phone,
          name: formData.name,
          pitchId: unwrappedParams.id,
          date: selectedDate,
          slots: sortedSlots.map(startTime => ({ startTime, duration: 1 })),
        }),
      });

      if (!initRes.ok) {
        throw new Error('Could not initiate payment record on server.');
      }

      // 2. Poll for verification status
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds
      
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await fetch(apiUrl(`/payments/${paymentRef}/status`));
          const payment = await statusRes.json();

          if (payment.status === 'SUCCESS') {
            clearInterval(pollInterval);
            const firstId = payment.bookings?.[0]?.id || "";
            setBookingRef(`TW-${firstId.slice(0, 6).toUpperCase()}`);
            setStep(3);
            setIsBooking(false);
          } else if (payment.status === 'FAILED') {
            clearInterval(pollInterval);
            setErrorMessage("Payment verification failed. Please check your Paystack dashboard or contact support.");
            setIsBooking(false);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setErrorMessage("Verification is taking longer than expected. Please check your email for confirmation shortly.");
            setIsBooking(false);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 1000);

    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during payment processing.');
      setIsBooking(false);
    }
  };

  if (isLoadingError) {
    return (
      <div className="text-center pt-24 min-h-screen text-red-500">
        <h2 className="text-2xl font-bold mb-2">{errorMessage || "Unable to load pitch details."}</h2>
        <Link href="/pitches" className="text-brand-primary underline mt-4 inline-block font-bold">Go Back to Pitches</Link>
      </div>
    );
  }

  if (!pitch) return <div className="text-center pt-24 min-h-screen">Loading...</div>;

  const sortedSelected = [...selectedSlots].sort();
  const firstSlot = sortedSelected[0];
  const lastSlot = sortedSelected[sortedSelected.length - 1];
  const timeRangeLabel = sortedSelected.length > 1
    ? `${firstSlot} – ${String(parseInt(lastSlot.split(':')[0]) + 1).padStart(2, '0')}:00`
    : firstSlot || '—';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-dark pt-10 pb-20">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-brand-primary/20 shrink-0">
               <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-black italic tracking-tighter gradient-text uppercase">Turf Wars</span>
          </div>
          <Link href="/pitches" className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-brand-primary transition-all">
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        </div>
        <div className="mb-8 p-6 bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
              {pitch.name}
              {pitch.isVerified && <ShieldCheck className="w-5 h-5 text-blue-500 fill-blue-500/10" />}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mt-0.5">
              <MapPin className="w-4 h-4 text-brand-primary" /> {pitch.location}
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="text-xl font-bold text-brand-primary">GHS {totalPrice.toLocaleString()}</span>
            <p className="text-xs text-gray-400">{selectedSlots.length} {selectedSlots.length === 1 ? 'hour' : 'hours'} selected</p>
          </div>
        </div>

        <div className="mb-8">
           <WeatherWidget location={pitch.location} />
        </div>

        <div className="flex items-center justify-between mb-10 px-2 text-[10px] uppercase tracking-widest font-bold text-gray-400">
          <span className={step >= 1 ? "text-brand-primary" : ""}>1. Schedule</span>
          <span className={step >= 2 ? "text-brand-primary" : ""}>2. Details</span>
          <span className={step >= 3 ? "text-brand-primary" : ""}>3. Done</span>
        </div>
        <div className="flex gap-2 mb-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? "bg-brand-primary" : "bg-gray-200 dark:bg-white/10"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm text-center">
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-3">Target Date</label>
                <input 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full max-w-sm mx-auto p-4 rounded-2xl bg-gray-50 dark:bg-brand-dark border-none focus:ring-2 ring-brand-primary outline-none transition-all font-bold text-center"
                  onChange={(e) => setSelectedDate(e.target.value)}
                  value={selectedDate}
                />
              </div>

              <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {slots.map((slot) => {
                    const isReserved = slot.status !== 'AVAILABLE';
                    const isSelected = selectedSlots.includes(slot.time);
                    return (
                      <button
                        key={slot.time}
                        disabled={isReserved}
                        onClick={() => toggleSlot(slot.time)}
                        className={`p-4 rounded-2xl font-medium transition-all relative overflow-hidden flex flex-col items-center justify-center border ${isSelected ? "bg-brand-primary border-brand-primary text-white scale-105 shadow-xl shadow-emerald-500/20 z-10" : isReserved ? "bg-rose-50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/10 text-rose-400 cursor-not-allowed" : "bg-gray-50 dark:bg-brand-dark border-transparent hover:border-brand-primary/40 text-gray-600 dark:text-gray-300"}`}
                      >
                        <span className="text-sm font-bold">{slot.time}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {gapWarning && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p>Your selected slots are not consecutive. This creates separate bookings.</p>
                </div>
              )}

              <button disabled={!selectedDate || selectedSlots.length === 0} onClick={handleNext} className="button-primary w-full py-5 text-lg disabled:opacity-50 shadow-xl shadow-emerald-500/30">
                Continue to Details
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm space-y-5">
                <h2 className="text-xl font-bold mb-1">Booking For</h2>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                  <input type="text" placeholder="Full Name" className="w-full p-4 pl-12 rounded-2xl bg-gray-50 dark:bg-brand-dark outline-none focus:ring-2 ring-brand-primary transition-all font-medium" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                  <input type="tel" placeholder="Phone Number" className="w-full p-4 pl-12 rounded-2xl bg-gray-50 dark:bg-brand-dark outline-none focus:ring-2 ring-brand-primary transition-all font-medium" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                  <input type="email" placeholder="Email Address" className="w-full p-4 pl-12 rounded-2xl bg-gray-50 dark:bg-brand-dark outline-none focus:ring-2 ring-brand-primary transition-all font-medium" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div className="bg-emerald-900 text-white p-6 rounded-[2.5rem] shadow-2xl space-y-3">
                <div className="flex justify-between items-center text-sm"><span className="opacity-60 italic">Date & Time</span><span className="font-bold">{selectedDate}, {timeRangeLabel}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="opacity-60 italic">Duration</span><span className="font-bold">{selectedSlots.length}h Total</span></div>
                <div className="pt-5 mt-5 border-t border-white/10 flex justify-between items-center"><span className="text-xl font-medium">Pay via Paystack</span><span className="text-3xl font-extrabold text-brand-secondary">GHS {totalPrice.toLocaleString()}</span></div>
              </div>

              <div className="flex gap-4">
                <button onClick={handleBack} className="p-5 rounded-3xl font-bold border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2"><ChevronLeft className="w-5 h-5" /> Back</button>
                {paystackPubKey ? (
                  <PaystackCheckout 
                    amount={totalPrice}
                    email={formData.email}
                    publicKey={paystackPubKey}
                    isLoading={isBooking}
                    isDisabled={!formData.name || !formData.phone || !formData.email}
                    onPaymentSuccess={confirmBooking}
                    onPaymentClose={() => setIsBooking(false)}
                  />
                ) : (
                  <button disabled className="button-primary flex-1 py-5 opacity-50 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Loading Gateways...
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-white dark:bg-white/5 p-12 rounded-[3.5rem] border border-brand-primary/20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-primary to-emerald-400" />
              <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><CheckCircle2 className="w-12 h-12 text-brand-primary" /></div>
              <h2 className="text-4xl font-extrabold mb-3 tracking-tight">Payment Verified</h2>
              {bookingRef && <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-brand-primary/10 text-brand-primary font-mono font-bold text-sm mb-6 border border-brand-primary/20">REF ID: {bookingRef}</div>}
              <p className="text-gray-500 dark:text-gray-400 mb-2 max-w-sm mx-auto leading-relaxed font-medium">Your reservation at <span className="font-bold text-gray-900 dark:text-white capitalize">{pitch.name}</span> is now fully confirmed.</p>
              <div className="flex flex-col gap-4 mt-6">
                <a href={`https://wa.me/?text=${encodeURIComponent(`⚽ *GAME ON!* I've secured our session at *${pitch.name}*!\n\n📅 *Date:* ${selectedDate}\n⏰ *Time:* ${timeRangeLabel}\n\nPayment verified. See you there! 🏃‍♂️`)}`} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] hover:bg-[#128C7E] text-white py-5 rounded-[2rem] font-bold shadow-xl shadow-green-500/20 flex items-center justify-center gap-2"><Phone className="w-5 h-5 fill-white/20" /> Broadcast to Team</a>
                <Link href="/" className="px-6 py-4 rounded-2xl border border-gray-100 dark:border-white/10 text-sm font-bold text-gray-500 hover:text-brand-primary transition-all">Return to Dashboard</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

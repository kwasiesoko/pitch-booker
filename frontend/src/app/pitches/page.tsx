"use client";

import { motion } from "framer-motion";
import { MapPin, Star, Clock, ArrowRight, ShieldCheck, Map, LayoutGrid, ChevronLeft, Search, X } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

import { useState, useEffect, useMemo } from "react";
import { apiUrl } from "@/lib/api";

const PitchMap = dynamic(() => import("@/components/PitchMap"), { 
  ssr: false,
  loading: () => <div className="h-[400px] rounded-3xl bg-gray-100 dark:bg-white/5 animate-pulse flex items-center justify-center text-gray-400">Loading map...</div>
});

interface Pitch {
  id: string;
  name: string;
  location: string;
  pricePerHour: number;
  facilities: string[];
  openingTime: string;
  closingTime: string;
  isVerified: boolean;
  imageUrl?: string | null;
  _count?: { reviews: number };
}

export default function PitchesPage() {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(apiUrl("/pitches"))
      .then(res => {
        if (!res.ok) throw new Error("API not ready");
        return res.json();
      })
      .then(data => {
        setPitches(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch pitches:", err);
        setIsLoading(false);
      });
  }, []);

  // Client-side filter by name or location
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pitches;
    return pitches.filter(
      p => p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)
    );
  }, [pitches, search]);

  const resultLabel = search.trim()
    ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search.trim()}"`
    : `${pitches.length} pitch${pitches.length !== 1 ? 'es' : ''} available`;

  return (
    <div className="min-h-screen pt-12 pb-20 bg-gray-50 dark:bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-10 overflow-hidden">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-brand-primary/20 shrink-0">
               <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-black italic tracking-tighter gradient-text uppercase">Turf Wars</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-brand-primary transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-1">Available Pitches</h1>
            <p className="text-gray-500 text-sm">{isLoading ? "Loading..." : resultLabel}</p>
          </div>
          <div className="flex bg-white dark:bg-white/5 rounded-xl p-1 border border-gray-200 dark:border-white/10 shadow-sm self-start sm:self-auto">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                view === 'list' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> List
            </button>
            <button
              onClick={() => setView('map')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                view === 'map' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Map className="w-4 h-4" /> Map
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-10 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or location…"
            className="w-full pl-12 pr-10 py-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-brand-primary outline-none transition-all shadow-sm text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {view === 'map' && !isLoading && filtered.length > 0 && (
          <div className="mb-12">
            <PitchMap pitches={filtered} />
          </div>
        )}

        {view === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              // Loading skeletons
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-white/5 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-white/10 animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-white/10" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
                    <div className="h-10 bg-gray-200 dark:bg-white/10 rounded-xl mt-4" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="col-span-3 text-center py-20">
                <p className="text-gray-400 text-lg mb-2">No pitches match your search.</p>
                <button onClick={() => setSearch("")} className="text-brand-primary font-bold hover:underline text-sm">Clear search</button>
              </div>
            ) : filtered.map((pitch) => (
              <motion.div
                key={pitch.id}
                whileHover={{ y: -8 }}
                className="bg-white dark:bg-white/5 rounded-[2rem] overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/10"
              >
                <div className="relative h-48">
                  <img 
                    src={pitch.imageUrl || "/images/hero.png"} 
                    alt={pitch.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-brand-dark/90 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    {pitch._count?.reviews ? `${pitch._count.reviews} review${pitch._count.reviews !== 1 ? 's' : ''}` : "New"}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">{pitch.name}</h3>
                        {pitch.isVerified && <ShieldCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <MapPin className="w-4 h-4" />
                        {pitch.location}
                      </div>
                    </div>
                    <span className="text-brand-primary font-bold">GHS {pitch.pricePerHour}/hr</span>
                  </div>

                  {pitch.facilities && pitch.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {pitch.facilities.map((fac, idx) => (
                        <span key={idx} className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-2 py-1 rounded-md mb-1">
                          {fac}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-4 h-4" />
                      Open {pitch.openingTime} – {pitch.closingTime}
                    </div>
                  </div>

                  <Link 
                    href={`/pitches/${pitch.id}`}
                    className="button-primary w-full flex items-center justify-center gap-2"
                  >
                    Book This Pitch <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

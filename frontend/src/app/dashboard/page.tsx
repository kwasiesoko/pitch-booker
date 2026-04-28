"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, Plus, RefreshCw, ShieldCheck, AlertCircle, LayoutDashboard, 
  MapPin, Clock, DollarSign, Settings as SettingsIcon, LogOut,
  ChevronRight, Save, X, Trash2, Eye, Star, Calendar, Phone, User, Key, Mail
} from "lucide-react";
import { apiUrl } from "@/lib/api";
import { authHeaders, getToken, clearToken } from "@/lib/session";
import { FACILITY_LABELS, type FacilityLabel } from "@/lib/facilities";
import { timeToMinutes } from "@/lib/time";

interface Insights {
  totalRevenue: number;
  totalBookings: number;
  popularDay: string;
  pitchCount: number;
}

interface Pitch {
  id: string;
  name: string;
  location: string;
  pricePerHour: number;
  openingTime: string;
  closingTime: string;
  facilities: string[];
  imageUrl?: string | null;
  isVerified: boolean;
  owner?: {
    email: string;
    phone?: string;
  };
}

interface Me {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  phone?: string | null;
}

interface Booking {
  id: string;
  pitchId: string;
  name: string;
  phone: string;
  email?: string;
  paymentReference?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  pitch: Pitch;
}

interface Payment {
  id: string;
  reference: string;
  amount: number;
  email: string;
  phone?: string;
  name?: string;
  pitchId: string;
  date: string;
  slots: any;
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: string;
  pitch: { name: string; location: string };
  bookings: { startTime: string; endTime: string; date: string }[];
}

type PitchDraft = {
  name: string;
  location: string;
  pricePerHour: string;
  openingTime: string;
  closingTime: string;
  facilities: FacilityLabel[];
  imageUrl: string;
};

const emptyDraft = (): PitchDraft => ({
  name: "",
  location: "",
  pricePerHour: "",
  openingTime: "06:00",
  closingTime: "22:00",
  facilities: [],
  imageUrl: "",
});

const toggleFacility = (list: FacilityLabel[], facility: FacilityLabel) =>
  list.includes(facility) ? list.filter((item) => item !== facility) : [...list, facility];

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 ${
        active 
          ? "bg-brand-primary text-white shadow-lg shadow-emerald-500/20 scale-[1.02]" 
          : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatsCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

interface PitchFormProps {
  data: PitchDraft;
  onChange: (data: PitchDraft) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
  onCancel: () => void;
  submitLabel?: string;
}

function ImagePreview({ url, onRemove }: { url: string; onRemove: () => void }) {
  return (
    <div className="relative group rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 aspect-video">
      <img src={url} alt="Pitch photo" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold shadow-lg"
        >
          <Trash2 className="w-4 h-4" /> Remove Photo
        </button>
      </div>
    </div>
  );
}

function PitchForm({ data, onChange, onSubmit, isSaving, onCancel, submitLabel = "Create Pitch" }: PitchFormProps) {
  return (
    <form className="grid gap-6" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Pitch Name</label>
          <input
            required
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="e.g. Wembley North Astroturf"
            className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-brand-dark border border-transparent focus:border-brand-primary outline-none transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Location</label>
          <input
            required
            value={data.location}
            onChange={(e) => onChange({ ...data, location: e.target.value })}
            placeholder="e.g. Accra, Ghana"
            className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-brand-dark border border-transparent focus:border-brand-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Pitch Photo URL <span className="normal-case font-normal">(optional)</span></label>
        {data.imageUrl && (
          <ImagePreview url={data.imageUrl} onRemove={() => onChange({ ...data, imageUrl: "" })} />
        )}
        {!data.imageUrl && (
          <input
            type="url"
            value={data.imageUrl}
            onChange={(e) => onChange({ ...data, imageUrl: e.target.value })}
            placeholder="https://example.com/pitch-photo.jpg"
            className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-brand-dark border border-transparent focus:border-brand-primary outline-none transition-all"
          />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Price (GHS / Hr)</label>
            <input
              required
              type="number"
              min="1"
              value={data.pricePerHour}
              onChange={(e) => onChange({ ...data, pricePerHour: e.target.value })}
              className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-brand-dark border border-transparent focus:border-brand-primary outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Opens</label>
              <input
                required
                type="time"
                value={data.openingTime}
                onChange={(e) => onChange({ ...data, openingTime: e.target.value })}
                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-brand-dark border border-transparent focus:border-brand-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Closes</label>
              <input
                required
                type="time"
                value={data.closingTime}
                onChange={(e) => onChange({ ...data, closingTime: e.target.value })}
                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-brand-dark border border-transparent focus:border-brand-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Facilities Provided</label>
          <div className="grid grid-cols-2 gap-2">
            {FACILITY_LABELS.map((fac) => {
              const active = data.facilities.includes(fac);
              return (
                <button
                  key={fac}
                  type="button"
                  onClick={() => onChange({ ...data, facilities: toggleFacility(data.facilities, fac) })}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-[11px] font-bold transition-all ${
                    active 
                      ? "bg-brand-primary border-brand-primary text-white shadow-md shadow-brand-primary/20" 
                      : "bg-gray-50 dark:bg-brand-dark border-gray-200 dark:border-white/10 text-gray-500 hover:border-brand-primary/40"
                  }`}
                >
                  {active ? <Check className="w-3 h-3 shrink-0" /> : <div className="w-3 h-3 shrink-0" />}
                  <span className="truncate">{fac}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-white/10">
        <button type="button" onClick={onCancel} className="flex-1 p-4 rounded-2xl font-bold border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          className="button-primary flex-[2] py-4 text-lg disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : <><Save className="w-5 h-5" /> {submitLabel}</>}
        </button>
      </div>
    </form>
  );
}

function PitchPreviewModal({ pitch, onClose, onEdit }: { pitch: Pitch; onClose: () => void; onEdit: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-52 bg-gradient-to-br from-brand-primary/30 to-emerald-900/40 overflow-hidden group">
          <img 
            src={pitch.imageUrl || "/images/pitch-placeholder.png"} 
            alt={pitch.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
          {!pitch.imageUrl && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
               <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/30">
                  <MapPin className="w-6 h-6 text-white" />
               </div>
            </div>
          )}
          <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            4.8
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="absolute bottom-0 inset-x-0 bg-brand-primary/90 backdrop-blur-sm px-4 py-1.5 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-white/80" />
            <span className="text-xs font-semibold text-white/90 tracking-wide">Owner Preview — This is how customers see your listing</span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold leading-tight mb-1">{pitch.name}</h2>
              <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                <MapPin className="w-4 h-4 shrink-0" />
                {pitch.location}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-extrabold text-brand-primary">GHS {pitch.pricePerHour}</p>
              <p className="text-xs text-gray-400 font-medium">per hour</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
            <Clock className="w-4 h-4 text-brand-primary shrink-0" />
            <span className="text-sm font-semibold">Open</span>
            <span className="text-sm text-gray-500">{pitch.openingTime} – {pitch.closingTime}</span>
          </div>

          {pitch.facilities.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Facilities</p>
              <div className="flex flex-wrap gap-2">
                {pitch.facilities.map((f) => (
                  <span key={f} className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onEdit}
              className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <SettingsIcon className="w-4 h-4" /> Edit Pitch
            </button>
            <button
              onClick={onClose}
              className="flex-1 button-primary py-3.5 text-sm font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "pitches" | "settings" | "schedule" | "payments" | "insights">("overview");
  const [user, setUser] = useState<Me | null>(null);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [draft, setDraft] = useState<PitchDraft>(emptyDraft());
  const [editingPitchId, setEditingPitchId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PitchDraft>(emptyDraft());
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [phoneUpdate, setPhoneUpdate] = useState("");
  const [insights, setInsights] = useState<Insights | null>(null);
  const [previewPitch, setPreviewPitch] = useState<Pitch | null>(null);
  const [filterVerification, setFilterVerification] = useState<"all" | "verified" | "pending">("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);

  const loadDashboard = async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    setIsLoading(true);
    try {
      const [meResponse, pitchesResponse, bookingsResponse, paymentsResponse, insightsResponse] = await Promise.all([
        fetch(apiUrl("/auth/me"), { headers: authHeaders() }),
        fetch(apiUrl("/pitches/mine"), { headers: authHeaders() }),
        fetch(apiUrl("/bookings/mine"), { headers: authHeaders() }),
        fetch(apiUrl("/payments/mine"), { headers: authHeaders() }),
        fetch(apiUrl("/pitches/insights"), { headers: authHeaders() }),
      ]);

      if (!meResponse.ok || !pitchesResponse.ok || !bookingsResponse.ok || !paymentsResponse.ok || !insightsResponse.ok) {
        throw new Error("Please sign in again.");
      }

      const mePayload = await meResponse.json();
      const pitchesPayload = await pitchesResponse.json();
      const bookingsPayload = await bookingsResponse.json();
      const paymentsPayload = await paymentsResponse.json();
      const insightsPayload = await insightsResponse.json();

      setUser(mePayload);
      setPhoneUpdate(mePayload.phone || "");
      setPitches(pitchesPayload);
      setBookings(bookingsPayload);
      setPayments(paymentsPayload);
      setInsights(insightsPayload);
    } catch (error) {
      setStatusIsError(true);
      setStatus(error instanceof Error ? error.message : "Failed to load dashboard.");
      if (error instanceof Error && error.message.includes("sign in")) {
        router.replace("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const handleLogout = () => {
    clearToken();
    router.replace("/login");
  };

  const createPitch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus("");
    setStatusIsError(false);

    try {
      const response = await fetch(apiUrl("/pitches"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          ...draft,
          pricePerHour: Number(draft.pricePerHour),
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Unable to create pitch.");

      setStatus("Pitch created successfully.");
      setDraft(emptyDraft());
      setShowAddForm(false);
      await loadDashboard();
    } catch (error) {
      setStatusIsError(true);
      setStatus(error instanceof Error ? error.message : "Unable to create pitch.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: "CONFIRMED" | "PENDING" | "CANCELLED") => {
    setIsSaving(true);
    try {
      const response = await fetch(apiUrl(`/bookings/${bookingId}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update status");
      
      // Update local state immediately (optimistic)
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
      setStatus(
        status === "CONFIRMED" ? "Booking confirmed successfully."
        : status === "CANCELLED" ? "Booking cancelled."
        : "Booking marked as pending."
      );
    } catch (error) {
      setStatusIsError(true);
      setStatus(error instanceof Error ? error.message : "Error updating status.");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (pitch: Pitch) => {
    setEditingPitchId(pitch.id);
    setEditForm({
      name: pitch.name,
      location: pitch.location,
      pricePerHour: String(pitch.pricePerHour),
      openingTime: pitch.openingTime,
      closingTime: pitch.closingTime,
      facilities: pitch.facilities as FacilityLabel[],
      imageUrl: pitch.imageUrl ?? "",
    });
  };

  const removeImage = async (pitchId: string) => {
    if (!confirm("Remove the photo from this pitch?")) return;
    setIsSaving(true);
    setStatus("");
    setStatusIsError(false);
    try {
      const response = await fetch(apiUrl(`/pitches/${pitchId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ imageUrl: null }),
      });
      if (!response.ok) {
        const p = await response.json().catch(() => ({}));
        throw new Error(p.message || "Unable to remove photo.");
      }
      setStatus("Photo removed.");
      await loadDashboard();
    } catch (error) {
      setStatusIsError(true);
      setStatus(error instanceof Error ? error.message : "Unable to remove photo.");
    } finally {
      setIsSaving(false);
    }
  };

  const updatePitch = async (event: FormEvent<HTMLFormElement>, pitchId: string) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus("");
    setStatusIsError(false);

    try {
      const response = await fetch(apiUrl(`/pitches/${pitchId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          ...editForm,
          pricePerHour: Number(editForm.pricePerHour),
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Unable to update pitch.");

      setStatus("Pitch updated successfully.");
      setEditingPitchId(null);
      await loadDashboard();
    } catch (error) {
      setStatusIsError(true);
      setStatus(error instanceof Error ? error.message : "Unable to update pitch.");
    } finally {
      setIsSaving(false);
    }
  };

  const deletePitch = async (pitchId: string) => {
    if (!confirm("Are you sure you want to delete this pitch? This action cannot be undone and will delete all associated bookings.")) {
      return;
    }

    setIsSaving(true);
    setStatus("");
    setStatusIsError(false);

    try {
      const response = await fetch(apiUrl(`/pitches/${pitchId}`), {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Unable to delete pitch.");
      }

      setStatus("Pitch deleted successfully.");
      await loadDashboard();
    } catch (error) {
      setStatusIsError(true);
      setStatus(error instanceof Error ? error.message : "Unable to delete pitch.");
    } finally {
      setIsSaving(false);
    }
  };
  const verifyPitch = async (pitchId: string) => {
    setIsSaving(true);
    setStatus("");
    setStatusIsError(false);
    try {
      const response = await fetch(apiUrl(`/pitches/${pitchId}/verify`), {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Failed to verify pitch.");
      }
      setStatus("Pitch verified successfully.");
      await loadDashboard();
    } catch (error) {
      setStatusIsError(true);
      setStatus(error instanceof Error ? error.message : "Failed to verify pitch.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateAccount = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus("");
    setStatusIsError(false);
    try {
      const response = await fetch(apiUrl("/auth/me"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ phone: phoneUpdate }),
      });
      if (!response.ok) {
        throw new Error("Unable to update account.");
      }
      setStatus("Account updated successfully.");
      await loadDashboard();
    } catch (error) {
      setStatusIsError(true);
      setStatus(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-brand-dark">
        <motion.div animate={{ rotate: 360 }} transition={{ ease: "linear", repeat: Infinity, duration: 1 }}>
          <RefreshCw className="w-8 h-8 text-brand-primary opacity-50" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-dark flex flex-col lg:flex-row">
      <AnimatePresence>
        {previewPitch && <PitchPreviewModal pitch={previewPitch} onClose={() => setPreviewPitch(null)} onEdit={() => { setPreviewPitch(null); setActiveTab("pitches"); startEditing(previewPitch); }} />}
      </AnimatePresence>
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-white dark:bg-brand-dark border-r border-gray-100 dark:border-white/10 p-6 flex flex-col z-10 shadow-sm relative">
        <div className="flex items-center gap-3 mb-10 px-2 pt-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-2xl italic tracking-tighter uppercase gradient-text hidden lg:block">Turf Wars</span>
        </div>

        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-2 lg:pb-0 hide-scrollbar flex-1">
          <TabButton 
            active={activeTab === "overview"} 
            onClick={() => setActiveTab("overview")} 
            icon={<LayoutDashboard className="w-5 h-5 shrink-0" />} 
            label="Overview" 
          />
          <TabButton 
            active={activeTab === "pitches"} 
            onClick={() => setActiveTab("pitches")} 
            icon={<MapPin className="w-5 h-5" />} 
            label="My Pitches" 
          />
          {user?.role !== "ADMIN" && (
            <TabButton 
              active={activeTab === "schedule"} 
              onClick={() => setActiveTab("schedule")} 
              icon={<Calendar className="w-5 h-5 font-bold" />} 
              label="Schedule" 
            />
          )}
          <TabButton 
            active={activeTab === "payments"} 
            onClick={() => setActiveTab("payments")} 
            icon={<DollarSign className="w-5 h-5" />} 
            label="Payments" 
          />
          <TabButton 
            active={activeTab === "settings"} 
            onClick={() => setActiveTab("settings")} 
            icon={<SettingsIcon className="w-5 h-5" />} 
            label="Settings" 
          />
        </nav>

        <button 
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all font-medium"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-1 uppercase tracking-tight">
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "pitches" && "Manage Pitches"}
              {activeTab === "schedule" && "Booking Schedule"}
              {activeTab === "settings" && "Account Settings"}
            </h1>
            <p className="text-gray-500 text-sm">
              Logged in as <span className="font-bold text-gray-900 dark:text-white">{user?.email}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {activeTab === "pitches" && (
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="button-primary flex items-center gap-2 px-6 py-3"
              >
                <Plus className="w-5 h-5" />
                Add New Pitch
              </button>
            )}
            <button 
              onClick={() => void loadDashboard()}
              className="p-3 rounded-2xl border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </header>

        {status && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-4 rounded-2xl flex items-center justify-between ${
              statusIsError ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            <span className="text-sm font-medium">{status}</span>
            <button onClick={() => setStatus("")} className="p-1 hover:bg-black/5 rounded-full"><X className="w-4 h-4"/></button>
          </motion.div>
        )}

        <div className="max-w-6xl">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Only count non-cancelled bookings in stats */}
                {(() => {
                  const activeBookings = bookings.filter(b => b.status !== "CANCELLED");
                  const revenue = activeBookings.reduce((acc, b) => {
                    const hours = (timeToMinutes(b.endTime) - timeToMinutes(b.startTime)) / 60;
                    return acc + (b.pitch?.pricePerHour || 0) * hours;
                  }, 0);
                  return (
                    <>
                      <StatsCard icon={<MapPin className="text-blue-500"/>} label="Total Pitches" value={pitches.length} />
                      <StatsCard 
                        icon={<RefreshCw className="text-emerald-500"/>} 
                        label="Active Bookings" 
                        value={activeBookings.length} 
                      />
                      <StatsCard 
                        icon={<DollarSign className="text-amber-500"/>} 
                        label="Estimated Revenue" 
                        value={`GHS ${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
                      />
                    </>
                  );
                })()}
                


                {/* Recent Bookings Table */}
                <div className="md:col-span-2 lg:col-span-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="p-8 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">Recent Bookings</h3>
                      <p className="text-sm text-gray-500 mt-1">Manage and track your latest player reservations.</p>
                    </div>
                    <Link href="#" className="text-brand-primary text-sm font-bold hover:underline">View All</Link>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-white/10">
                          <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                          <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Pitch</th>
                          <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Date & Time</th>
                          <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Revenue</th>
                          <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                          <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {bookings.length > 0 ? bookings.slice(0, 10).map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                                  <User className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{booking.name}</p>
                                  <div className="flex flex-col gap-0.5 mt-1">
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-brand-primary" /> {booking.phone}
                                    </p>
                                    {booking.email && (
                                      <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {booking.email}
                                      </p>
                                    )}
                                    {booking.paymentReference && (
                                      <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 mt-0.5 bg-emerald-50 dark:bg-emerald-500/5 px-1.5 py-0.5 rounded-md w-fit">
                                        <ShieldCheck className="w-2.5 h-2.5" /> REF: {booking.paymentReference.slice(0, 12)}...
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <p className="font-semibold text-gray-700 dark:text-gray-300">{booking.pitch?.name || "Deleted Pitch"}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[150px]">{booking.pitch?.location}</p>
                            </td>
                            <td className="px-8 py-5">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {new Date(booking.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" /> {booking.startTime} – {booking.endTime}
                              </p>
                            </td>
                            <td className="px-8 py-5">
                              {(() => {
                                const hours = (timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime)) / 60;
                                const earned = (booking.pitch?.pricePerHour || 0) * hours;
                                return (
                                  <div>
                                    <p className="font-bold text-brand-primary">GHS {earned.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                    <p className="text-[10px] text-gray-400">{hours}h × GHS {booking.pitch?.pricePerHour || 0}/hr</p>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                booking.status === "CONFIRMED" 
                                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
                                  : booking.status === "CANCELLED"
                                  ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20"
                                  : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20"
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                               <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {booking.status === "PENDING" && (
                                    <button 
                                      onClick={() => void updateBookingStatus(booking.id, "CONFIRMED")}
                                      className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                                      title="Confirm Booking"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  )}
                                  {booking.status === "CONFIRMED" && (
                                    <button 
                                      onClick={() => void updateBookingStatus(booking.id, "PENDING")}
                                      className="p-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                                      title="Mark as Pending"
                                    >
                                      <RefreshCw className="w-4 h-4" />
                                    </button>
                                  )}
                                  {booking.status !== "CANCELLED" && (
                                    <button 
                                      onClick={() => void updateBookingStatus(booking.id, "CANCELLED")}
                                      disabled={isSaving}
                                      className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                                      title="Cancel Booking"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                               </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-8 py-12 text-center text-gray-400 italic">
                               No recent bookings yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </motion.div>
            )}

            {activeTab === "pitches" && (
              <motion.div key="pitches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {showAddForm && (
                  <motion.section 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: "auto", opacity: 1 }}
                    className="bg-white dark:bg-white/5 border border-brand-primary/30 rounded-[2.5rem] p-8 shadow-2xl shadow-emerald-500/10"
                  >
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                       <Plus className="w-5 h-5 text-brand-primary" /> Create New Pitch
                    </h2>
                    <PitchForm 
                      data={draft} 
                      onChange={setDraft} 
                      onSubmit={createPitch} 
                      isSaving={isSaving} 
                      onCancel={() => setShowAddForm(false)} 
                    />
                  </motion.section>
                )}

                {/* Verification Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 pb-2 overflow-x-auto hide-scrollbar">
                  {[
                    { id: "all", label: "All Venues", count: pitches.length },
                    { id: "pending", label: "Under Review", count: pitches.filter(p => !p.isVerified).length },
                    { id: "verified", label: "Verified", count: pitches.filter(p => p.isVerified).length },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterVerification(f.id as any)}
                      className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
                        filterVerification === f.id
                          ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20"
                          : "bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      }`}
                    >
                      {f.label}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] ${filterVerification === f.id ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-white/10 text-gray-500"}`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="grid gap-6">
                  {pitches
                    .filter(p => {
                      if (filterVerification === "verified") return p.isVerified;
                      if (filterVerification === "pending") return !p.isVerified;
                      return true;
                    }).length === 0 && (
                      <div className="text-center py-20 bg-white dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-white/10 text-brand-dark dark:text-white">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                           <RefreshCw className="w-8 h-8" />
                        </div>
                        <p className="text-gray-400 font-medium">No venues match the current filter.</p>
                      </div>
                    )}

                  {pitches
                    .filter(p => {
                      if (filterVerification === "verified") return p.isVerified;
                      if (filterVerification === "pending") return !p.isVerified;
                      return true;
                    })
                    .map((pitch) => (
                      <div 
                        key={pitch.id} 
                        className={`relative bg-white dark:bg-white/5 border rounded-[3rem] p-8 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden text-brand-dark dark:text-white ${
                          !pitch.isVerified && user?.role === "ADMIN" 
                            ? "border-amber-300 dark:border-amber-500/30 bg-gradient-to-br from-white to-amber-50/20 dark:from-white/5 dark:to-amber-500/5 shadow-amber-500/5" 
                            : "border-gray-100 dark:border-white/10"
                        }`}
                      >
                        {editingPitchId === pitch.id ? (
                          <div className="space-y-6">
                            <h3 className="text-xl font-bold">Edit {pitch.name}</h3>
                            <PitchForm 
                              data={editForm} 
                              onChange={setEditForm} 
                              onSubmit={(e) => void updatePitch(e, pitch.id)}
                              isSaving={isSaving} 
                              onCancel={() => setEditingPitchId(null)}
                              submitLabel="Save Changes"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="flex gap-6 flex-1 min-w-0">
                                <div className="relative w-24 h-24 rounded-3xl overflow-hidden shrink-0 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 group shadow-inner">
                                  <img 
                                    src={pitch.imageUrl || "/images/pitch-placeholder.png"} 
                                    alt={pitch.name} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                  />
                                  {!pitch.isVerified && (
                                    <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-amber-500 text-white shadow-lg">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <h3 className="text-2xl font-bold truncate tracking-tight">{pitch.name}</h3>
                                    {!pitch.isVerified ? (
                                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-500/20 animate-pulse">
                                        <RefreshCw className="w-3.5 h-3.5" /> Pending Review
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Fully Verified
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-gray-500">
                                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-brand-primary" />{pitch.location}</span>
                                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{pitch.openingTime} – {pitch.closingTime}</span>
                                    <span className="text-brand-primary font-black uppercase tracking-tighter">GHS {pitch.pricePerHour}/hr</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-4">
                                    {pitch.facilities.length > 0 ? pitch.facilities.map((f) => (
                                      <span key={f} className="px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-tight bg-gray-50 dark:bg-white/5 text-gray-400 border border-gray-100 dark:border-white/10">{f}</span>
                                    )) : <span className="text-xs text-gray-400 italic">No facilities set</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                                <button disabled={isSaving} onClick={() => void deletePitch(pitch.id)} className="p-3.5 rounded-2xl border border-red-100 dark:border-red-900/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all" title="Delete">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                                <button onClick={() => startEditing(pitch)} className="p-3.5 rounded-2xl border border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all" title="Settings">
                                  <SettingsIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => setPreviewPitch(pitch)} className="button-primary p-3.5 px-6 font-bold text-sm">
                                  Preview
                                </button>
                              </div>
                            </div>

                            {user?.role === "ADMIN" && !pitch.isVerified && (
                              <div className="mt-8 -mx-8 -mb-8 p-10 bg-amber-500 dark:bg-amber-600 text-white flex flex-col md:flex-row items-center justify-between gap-8 border-t border-white/10">
                                <div className="flex gap-5">
                                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl shadow-black/10">
                                    <Phone className="w-8 h-8 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">Administrative Action Required</p>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                                      <a href={`tel:${pitch.owner?.phone}`} className="text-2xl font-black hover:scale-105 transition-transform flex items-center gap-2">
                                        {pitch.owner?.phone || "NO PHONE"}
                                      </a>
                                      <span className="text-sm font-bold text-white/80 flex items-center gap-2 uppercase tracking-tight">
                                        <Mail className="w-4 h-4" /> {pitch.owner?.email}
                                      </span>
                                    </div>
                                    <p className="text-xs text-white/60 mt-2 italic font-medium">Please call the partner to verify authenticity before unlocking public access.</p>
                                  </div>
                                </div>
                                <button 
                                  disabled={isSaving}
                                  onClick={() => void verifyPitch(pitch.id)} 
                                  className="w-full md:w-auto p-5 px-12 rounded-[2rem] bg-white text-amber-600 font-black text-xs uppercase tracking-[0.15em] hover:bg-amber-50 transition-all shadow-2xl shadow-black/20 active:scale-95"
                                >
                                  Approve Battleground
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}

                  {pitches.length === 0 && !showAddForm && (
                      <div className="text-center py-24 bg-white dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-white/10">
                        <p className="text-gray-400 mb-6">No pitches found. Start by adding one!</p>
                        <button onClick={() => setShowAddForm(true)} className="button-primary px-8">Create First Pitch</button>
                      </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "payments" && (
              <motion.div key="payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 <div className="flex items-center justify-between px-2">
                    <h2 className="text-2xl font-bold">Transaction History</h2>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                       <RefreshCw className="w-3 h-3" /> Auto-synced with Paystack
                    </div>
                 </div>

                 <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr className="border-b border-gray-50 dark:border-white/5 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                                <th className="px-8 py-5">Reference</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Customer</th>
                                <th className="px-8 py-5">Pitch</th>
                                <th className="px-8 py-5 text-right">Amount</th>
                                <th className="px-8 py-5">Date</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                             {payments.map((p) => (
                                <tr key={p.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                   <td className="px-8 py-6">
                                      <span className="font-mono text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tighter">{p.reference}</span>
                                   </td>
                                   <td className="px-8 py-6">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit ${
                                         p.status === "SUCCESS" 
                                           ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                           : p.status === "FAILED"
                                             ? "bg-red-50 dark:bg-red-500/10 text-red-500"
                                             : "bg-gray-100 dark:bg-white/10 text-gray-500"
                                      }`}>
                                         {p.status === "SUCCESS" ? <Check className="w-2.5 h-2.5" /> : null}
                                         {p.status}
                                      </span>
                                   </td>
                                   <td className="px-8 py-6">
                                      <div className="flex flex-col">
                                         <span className="font-bold text-sm text-gray-900 dark:text-white">{p.name || "Guest"}</span>
                                         <span className="text-xs text-gray-400 font-medium">{p.email}</span>
                                      </div>
                                   </td>
                                   <td className="px-8 py-6">
                                      <div className="flex flex-col">
                                         <span className="font-bold text-sm text-gray-900 dark:text-white">{p.pitch?.name}</span>
                                         <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{p.pitch?.location}</span>
                                      </div>
                                   </td>
                                   <td className="px-8 py-6 text-right">
                                      <span className="font-extrabold text-brand-primary">GHS {p.amount.toLocaleString()}</span>
                                   </td>
                                   <td className="px-8 py-6">
                                      <div className="flex flex-col text-xs font-medium text-gray-500">
                                         <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                                         <span className="text-[10px] opacity-60">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                   </td>
                                </tr>
                             ))}

                             {payments.length === 0 && (
                                <tr>
                                   <td colSpan={6} className="text-center py-20">
                                      <div className="flex flex-col items-center gap-2">
                                         <DollarSign className="w-10 h-10 text-gray-200 dark:text-white/10" />
                                         <p className="text-gray-400 font-medium">No transactions found.</p>
                                      </div>
                                   </td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === "schedule" && (
              <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                 <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                       <div>
                          <h3 className="text-xl font-bold">Daily Timeline</h3>
                          <p className="text-sm text-gray-500 mt-1">Select a date to view all reserved slots across your pitches.</p>
                       </div>
                       <div className="bg-gray-50 dark:bg-brand-dark p-2 rounded-2xl border border-gray-100 dark:border-white/10">
                          <input 
                            type="date" 
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="bg-transparent outline-none font-bold px-4 py-2"
                          />
                       </div>
                    </div>

                    <div className="space-y-2 relative">
                        <div className="absolute left-[100px] top-0 bottom-0 w-px bg-gray-100 dark:bg-white/10 hidden md:block" />
                        
                        {["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"].map((time) => {
                           // Show bookings that COVER this time slot (not just start at it)
                           const slotMinutes = timeToMinutes(time);
                           const timeBookings = bookings.filter(b => {
                             if (!b.date.startsWith(scheduleDate)) return false;
                             const bStart = timeToMinutes(b.startTime);
                             const bEnd = timeToMinutes(b.endTime);
                             return slotMinutes >= bStart && slotMinutes < bEnd;
                           });
                           return (
                             <div key={time} className="flex flex-col md:flex-row gap-4 md:gap-10 py-4 group">
                                <span className="w-20 text-sm font-bold text-gray-400 group-hover:text-brand-primary transition-colors">{time}</span>
                                <div className="flex-1 flex flex-wrap gap-3">
                                   {timeBookings.length === 0 ? (
                                      <div className="h-10 flex items-center px-4 rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-[10px] uppercase tracking-widest font-bold text-gray-300">
                                         No Bookings
                                      </div>
                                   ) : (
                                      timeBookings.map(b => (
                                         <div key={b.id} className={`p-3 px-5 rounded-2xl border flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-left-2 duration-300 ${
                                            b.status === "CONFIRMED" 
                                              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400" 
                                              : b.status === "CANCELLED"
                                               ? "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-400 opacity-60"
                                               : "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-400"
                                         }`}>
                                            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                            <div>
                                               <p className="text-xs font-bold leading-none">{b.pitch?.name}</p>
                                               <p className="text-[10px] opacity-70 mt-1 font-medium">{b.name} • {b.phone}</p>
                                            </div>
                                         </div>
                                      ))
                                   )}
                                </div>
                             </div>
                           )
                        })}
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-8">
                <h2 className="text-2xl font-bold mb-8">Account Details</h2>
                <form className="space-y-6" onSubmit={updateAccount}>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Email Address</label>
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-brand-dark text-lg font-medium opacity-60 flex items-center gap-2">
                       <Mail className="w-4 h-4" /> {user?.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Phone Number</label>
                    <div className="relative group">
                       <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <Phone className="w-4 h-4 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                       </div>
                       <input 
                         type="tel"
                         placeholder="+233 24 000 0000"
                         value={phoneUpdate}
                         onChange={(e) => setPhoneUpdate(e.target.value)}
                         className="w-full p-4 pl-12 rounded-2xl bg-gray-50 dark:bg-brand-dark border border-transparent focus:border-brand-primary outline-none transition-all font-bold"
                       />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 px-1 lowercase italic">Required for pitch verification by the administrator.</p>
                  </div>
                  
                  <div className="pt-4">
                     <button 
                       type="submit" 
                       disabled={isSaving}
                       className="button-primary w-full py-4 text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                     >
                       {isSaving ? "Saving Changes..." : "Save Account Settings"}
                     </button>
                  </div>

                  <div className="pt-8 border-t border-gray-100 dark:border-white/10 space-y-3">
                    <button 
                      type="button"
                      className="button-secondary w-full py-4 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5"
                      onClick={() => {
                        if (confirm("Are you sure you want to reset your password? You will be signed out.")) {
                          clearToken();
                          router.replace("/login?reset=1");
                        }
                      }}
                    >
                      <Key className="w-4 h-4" />
                      Reset Password
                    </button>
                    <p className="text-xs text-center text-gray-400">You'll be signed out and can use the reset flow from the login page.</p>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

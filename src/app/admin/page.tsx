"use client";

import React, { useState } from "react";
import { motion } from "motion/react";

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [priceOverrides, setPriceOverrides] = useState<any[]>([]);

  const [form, setForm] = useState({ guestName: "", source: "WhatsApp", checkIn: "", checkOut: "" });
  const [overrideForm, setOverrideForm] = useState({ start: "", end: "", price: "", reason: "" });

  const fetchDashboard = async () => {
    if (!pin) return;
    try {
      const bRes = await fetch("/api/admin/bookings", { headers: { Authorization: `Bearer ${pin}` } });
      const pRes = await fetch("/api/admin/pricing", { headers: { Authorization: `Bearer ${pin}` } });
      if (bRes.ok && pRes.ok) {
        setIsAuthenticated(true);
        setBookings(await bRes.json());
        setPriceOverrides(await pRes.json());
      } else {
        alert("Invalid PIN or server error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/book", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${pin}` },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      alert("Booking saved!");
      setForm({ guestName: "", source: "WhatsApp", checkIn: "", checkOut: "" });
      fetchDashboard();
    } else {
      alert("Failed to save booking");
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    const res = await fetch(`/api/admin/bookings?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${pin}` }
    });
    if (res.ok) fetchDashboard();
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${pin}` },
      body: JSON.stringify(overrideForm)
    });
    if (res.ok) {
      alert("Pricing updated!");
      setOverrideForm({ start: "", end: "", price: "", reason: "" });
      fetchDashboard();
    } else {
      alert("Failed to update pricing");
    }
  };

  const handleDeleteOverride = async (id: string) => {
    if (!confirm("Delete this price override?")) return;
    const res = await fetch(`/api/admin/pricing?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${pin}` }
    });
    if (res.ok) fetchDashboard();
  };

  if (!isAuthenticated) {
    return (
      <main className="bg-[#1A202C] text-white min-h-screen p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Admin PIN</label>
          <div className="flex gap-3">
            <input 
              type="password" 
              placeholder="••••••" 
              value={pin} 
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3.5 focus:border-[#E27D60] outline-none transition-colors" 
            />
            <button 
              onClick={fetchDashboard} 
              className="bg-white/10 hover:bg-white/20 text-white px-5 rounded-2xl transition-colors font-semibold"
            >
              Access
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#1A202C] text-white min-h-screen p-6 flex flex-col items-center pt-16 pb-24 font-['Montserrat']">
      
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Forms */}
        <div className="w-full md:w-1/2 flex flex-col gap-8">
          
          {/* Manual Booking Form */}
          <motion.div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-6 text-[#C5A880] tracking-wider uppercase">Log New Booking</h2>
            <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4">
              <input required type="text" placeholder="Guest Name" value={form.guestName} onChange={e => setForm({...form, guestName: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#C5A880] outline-none" />
              <select value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#C5A880] outline-none text-white">
                <option value="WhatsApp">WhatsApp</option>
                <option value="Manual">Manual</option>
                <option value="Other">Other</option>
              </select>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-xs text-white/50 mb-1 block">Check-in</label>
                  <input required type="date" value={form.checkIn} onChange={e => setForm({...form, checkIn: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#C5A880] outline-none" style={{ colorScheme: 'dark' }} />
                </div>
                <div className="w-1/2">
                  <label className="text-xs text-white/50 mb-1 block">Check-out</label>
                  <input required type="date" value={form.checkOut} onChange={e => setForm({...form, checkOut: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#C5A880] outline-none" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <button type="submit" className="mt-2 bg-[#C5A880] hover:bg-[#b0946e] text-white py-3 rounded-xl font-bold tracking-widest uppercase transition-colors text-xs">Save Booking</button>
            </form>
          </motion.div>

          {/* Pricing Override Form */}
          <motion.div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-6 text-[#C5A880] tracking-wider uppercase">Set Pricing Override</h2>
            <form onSubmit={handleOverrideSubmit} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-xs text-white/50 mb-1 block">Start Date</label>
                  <input required type="date" value={overrideForm.start} onChange={e => setOverrideForm({...overrideForm, start: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#C5A880] outline-none" style={{ colorScheme: 'dark' }} />
                </div>
                <div className="w-1/2">
                  <label className="text-xs text-white/50 mb-1 block">End Date</label>
                  <input required type="date" value={overrideForm.end} onChange={e => setOverrideForm({...overrideForm, end: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#C5A880] outline-none" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <input required type="number" placeholder="Price per night (₹)" value={overrideForm.price} onChange={e => setOverrideForm({...overrideForm, price: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#C5A880] outline-none" />
              <input type="text" placeholder="Reason (e.g., Diwali Peak)" value={overrideForm.reason} onChange={e => setOverrideForm({...overrideForm, reason: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#C5A880] outline-none" />
              <button type="submit" className="mt-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold tracking-widest uppercase transition-colors text-xs">Apply Override</button>
            </form>
          </motion.div>

        </div>

        {/* Right Column: Data Lists */}
        <div className="w-full md:w-1/2 flex flex-col gap-8">
          
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-sm font-bold mb-4 text-white/50 tracking-wider uppercase">Active Bookings</h2>
            <div data-lenis-prevent="true" className="overscroll-contain max-h-[300px] overflow-y-auto flex flex-col gap-3 pr-2 pb-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30">
              {bookings.length === 0 ? (
                <p className="text-white/30 text-sm italic">No bookings found.</p>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="bg-black/20 border border-white/5 p-4 rounded-xl flex justify-between items-center group">
                    <div>
                      <p className="font-bold text-sm">{b.guestName} <span className="text-white/30 text-xs ml-2">({b.source})</span></p>
                      <p className="text-xs text-white/50 mt-1">
                        {new Date(b.checkIn).toLocaleDateString()} &rarr; {new Date(b.checkOut).toLocaleDateString()}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteBooking(b.id)} className="text-red-400 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:text-red-300">
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-sm font-bold mb-4 text-white/50 tracking-wider uppercase">Active Price Overrides</h2>
            <div data-lenis-prevent="true" className="overscroll-contain max-h-[220px] overflow-y-auto flex flex-col gap-3 pr-2 pb-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30">
              {priceOverrides.length === 0 ? (
                <p className="text-white/30 text-sm italic">No overrides found.</p>
              ) : (
                priceOverrides.map((p) => (
                  <div key={p.id} className="bg-black/20 border border-white/5 p-4 rounded-xl flex justify-between items-center group">
                    <div>
                      <p className="font-bold text-sm">₹{p.price} <span className="text-white/30 text-xs ml-2 font-normal">{p.reason}</span></p>
                      <p className="text-xs text-[#C5A880] mt-1">
                        {new Date(p.date).toLocaleDateString()}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteOverride(p.id)} className="text-red-400 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:text-red-300">
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}

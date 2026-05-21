import React from "react";

export const metadata = {
  title: "Villa Policies | Rosella Retreat",
  description: "Review the comprehensive policies, house rules, and guidelines for your stay at Rosella Retreat.",
};

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-[#1A251D] text-white/80 font-['Montserrat'] font-light">
      <div className="max-w-4xl mx-auto px-6 py-32 md:py-40">
        
        <header className="mb-24 text-center md:text-left">
          <p className="uppercase tracking-[0.3em] text-xs text-[#C5A880] mb-4 font-semibold">Rosella Retreat</p>
          <h1 className="font-['Playfair_Display'] text-5xl md:text-6xl lg:text-7xl text-[#D4C3A3] mb-8 leading-tight">
            Villa Policies
          </h1>
          <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl">
            To ensure a seamless experience for all guests and maintain the serenity of our estate, we kindly request you to review our guidelines.
          </p>
        </header>

        <div className="space-y-24 md:space-y-32">
          
          {/* 01. Arrival & Departure */}
          <section>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#D4C3A3] mb-12 flex items-baseline gap-4">
              <span className="text-sm text-[#C5A880] tracking-widest font-sans">01</span>
              Arrival & Departure
            </h2>
            
            <div className="flex flex-col space-y-8">
              <div className="flex flex-col md:flex-row md:gap-12 pt-6 border-t border-white/10">
                <div className="md:w-1/3 mb-2 md:mb-0">
                  <h3 className="text-sm uppercase tracking-widest text-[#C5A880] font-semibold">Check-In</h3>
                </div>
                <div className="md:w-2/3">
                  <p className="leading-relaxed">
                    Check-in begins at <strong>2:30 PM</strong>. Early check-in may be available upon request, subject to availability, and may incur an additional charge.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:gap-12 pt-6 border-t border-white/10">
                <div className="md:w-1/3 mb-2 md:mb-0">
                  <h3 className="text-sm uppercase tracking-widest text-[#C5A880] font-semibold">Check-Out</h3>
                </div>
                <div className="md:w-2/3">
                  <p className="leading-relaxed">
                    Check-out is strictly by <strong>11:00 AM</strong>. This allows our housekeeping team sufficient time to prepare the property to our exacting standards for incoming guests.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:gap-12 pt-6 border-t border-white/10">
                <div className="md:w-1/3 mb-2 md:mb-0">
                  <h3 className="text-sm uppercase tracking-widest text-[#C5A880] font-semibold">Late Departures</h3>
                </div>
                <div className="md:w-2/3">
                  <p className="leading-relaxed mb-4">
                    Late check-out without prior approval will result in additional charges as follows:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C5A880]/50" />
                      <p>₹1,000 per extra hour</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C5A880]/50" />
                      <p>Beyond 2 hours delay: Full day charge may apply</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 02. House Rules */}
          <section>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#D4C3A3] mb-12 flex items-baseline gap-4">
              <span className="text-sm text-[#C5A880] tracking-widest font-sans">02</span>
              House Rules
            </h2>
            
            <p className="mb-10 text-white/60 leading-relaxed italic">
              As the villa is located in a posh and peaceful gated community, we kindly request all guests to be mindful of the surroundings.
            </p>

            <div className="flex flex-col space-y-8">
              <div className="flex flex-col md:flex-row md:gap-12 pt-6 border-t border-white/10">
                <div className="md:w-1/3 mb-2 md:mb-0">
                  <h3 className="text-sm uppercase tracking-widest text-[#C5A880] font-semibold">Music & Noise</h3>
                </div>
                <div className="md:w-2/3">
                  <p className="leading-relaxed">
                    Only soft music is allowed in the lawn area until <strong>8:00 PM</strong>. After that, soft music may be played inside the villa until <strong>10:00 PM</strong>. Post 10:00 PM, no music or loud noise is permitted.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:gap-12 pt-6 border-t border-white/10">
                <div className="md:w-1/3 mb-2 md:mb-0">
                  <h3 className="text-sm uppercase tracking-widest text-[#C5A880] font-semibold">Gatherings</h3>
                </div>
                <div className="md:w-2/3">
                  <p className="leading-relaxed">
                    We welcome small and respectful gatherings. However, loud parties, high-energy events, and firecrackers are strictly prohibited to maintain a calm and safe environment.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:gap-12 pt-6 border-t border-white/10">
                <div className="md:w-1/3 mb-2 md:mb-0">
                  <h3 className="text-sm uppercase tracking-widest text-[#C5A880] font-semibold">Beverages & Smoking</h3>
                </div>
                <div className="md:w-2/3">
                  <p className="leading-relaxed mb-4">
                    The villa follows a BYOB (Bring Your Own Beverages) policy. Responsible drinking is expected, and underage drinking is strictly prohibited.
                  </p>
                  <p className="leading-relaxed text-white/60">
                    Smoking is permitted only in designated open areas.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 03. Security Deposit */}
          <section>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#D4C3A3] mb-12 flex items-baseline gap-4">
              <span className="text-sm text-[#C5A880] tracking-widest font-sans">03</span>
              Security Deposit
            </h2>
            
            <div className="flex flex-col space-y-8">
              <div className="flex flex-col md:flex-row md:gap-12 pt-6 border-t border-white/10">
                <div className="md:w-1/3 mb-2 md:mb-0">
                  <h3 className="text-sm uppercase tracking-widest text-[#C5A880] font-semibold">Requirement</h3>
                </div>
                <div className="md:w-2/3">
                  <p className="leading-relaxed">
                    A refundable security deposit of <strong>₹20,000</strong> is required at the time of check-in. The deposit will be refunded at check-out once the property inspection is completed.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:gap-12 pt-6 border-t border-white/10">
                <div className="md:w-1/3 mb-2 md:mb-0">
                  <h3 className="text-sm uppercase tracking-widest text-[#C5A880] font-semibold">Refund Conditions</h3>
                </div>
                <div className="md:w-2/3">
                  <p className="leading-relaxed mb-6">
                    In case of any damages or violation of house rules, the applicable amount may be deducted from the security deposit. Full refunds are subject to:
                  </p>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex items-start gap-4">
                      <span className="text-[#C5A880] font-serif text-xl italic leading-none mt-1">I.</span>
                      <p className="leading-relaxed">No damages to the property, furniture, appliances, or linen.</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="text-[#C5A880] font-serif text-xl italic leading-none mt-1">II.</span>
                      <p className="leading-relaxed">Guests adhering to all house rules throughout the duration of their stay.</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="text-[#C5A880] font-serif text-xl italic leading-none mt-1">III.</span>
                      <p className="leading-relaxed">No excessive cleaning required or misuse of the property.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 04. Pet Policy */}
          <section>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#D4C3A3] mb-12 flex items-baseline gap-4">
              <span className="text-sm text-[#C5A880] tracking-widest font-sans">04</span>
              Pet Policy
            </h2>
            
            <div className="flex flex-col space-y-8">
              <div className="flex flex-col md:flex-row md:gap-12 pt-6 border-t border-white/10">
                <div className="md:w-1/3 mb-2 md:mb-0">
                  <h3 className="text-sm uppercase tracking-widest text-[#C5A880] font-semibold">Approval & Comfort</h3>
                </div>
                <div className="md:w-2/3">
                  <p className="leading-relaxed">
                    Pets are warmly welcomed with prior approval at the time of booking. A special pet bed is available to ensure your pet’s comfort during the stay.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:gap-12 pt-6 border-t border-white/10">
                <div className="md:w-1/3 mb-2 md:mb-0">
                  <h3 className="text-sm uppercase tracking-widest text-[#C5A880] font-semibold">Pet Etiquette</h3>
                </div>
                <div className="md:w-2/3">
                  <p className="leading-relaxed mb-4">
                    Guests are requested to ensure pets are well-trained and supervised at all times. Pets are strictly not allowed on beds or upholstered furniture.
                  </p>
                  <p className="leading-relaxed text-white/60">
                    Owners must clean up after their pets, both indoors and in outdoor areas. Scoopers and garbage bags are provided at the property. Any damage caused by pets will be chargeable.
                  </p>
                </div>
              </div>
            </div>
          </section>

        </div>
        
        <div className="mt-32 pt-12 border-t border-white/10 text-center">
          <p className="font-['Playfair_Display'] italic text-xl md:text-2xl text-[#D4C3A3] mb-4">
            Thank you for helping us maintain a clean, comfortable, and peaceful space.
          </p>
          <a href="/" className="inline-block mt-8 px-8 py-4 bg-white/5 hover:bg-white/10 text-[#C5A880] text-xs uppercase tracking-widest transition-colors border border-white/10">
            Return to Home
          </a>
        </div>

      </div>
    </div>
  );
}

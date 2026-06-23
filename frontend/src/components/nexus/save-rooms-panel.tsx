"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import type { SaveRoom } from "@/lib/types";
import { Loader2, ExternalLink } from "lucide-react";
import { isDemoMode } from "@/lib/toggles";

// ============================================================
// CANVAS-BASED QR CODE (simple visual representation)
// ============================================================
function SimpleQRDisplay({ value }: { value: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = 140;
    canvas.width = size;
    canvas.height = size;
    const pixelSize = 10;
    const gridSize = Math.floor(size / pixelSize);
    ctx.fillStyle = "oklch(0.13 0.005 260)";
    ctx.fillRect(0, 0, size, size);

    // Generate a deterministic pattern from the value
    const seed = value.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    // Simple pseudo-random
    const rand = (i: number) => ((seed * 31 + i * 17) % 100) / 100;

    ctx.fillStyle = "oklch(0.78 0.2 145)";
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (rand(y * gridSize + x) > 0.55) {
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize - 1, pixelSize - 1);
        }
      }
    }
    // Corner markers
    ctx.fillStyle = "oklch(0.78 0.2 145)";
    const markerSize = 5 * pixelSize;
    // Top-left
    ctx.fillRect(0, 0, markerSize, pixelSize);
    ctx.fillRect(0, 0, pixelSize, markerSize);
    ctx.fillRect(markerSize - pixelSize, 0, pixelSize, markerSize);
    ctx.fillRect(0, markerSize - pixelSize, markerSize, pixelSize);
    // Top-right
    const tx = size - markerSize;
    ctx.fillRect(tx, 0, markerSize, pixelSize);
    ctx.fillRect(tx + markerSize - pixelSize, 0, pixelSize, markerSize);
    ctx.fillRect(tx, markerSize - pixelSize, markerSize, pixelSize);
    // Bottom-left
    const by = size - markerSize;
    ctx.fillRect(0, by, markerSize, pixelSize);
    ctx.fillRect(0, by, pixelSize, markerSize);
    ctx.fillRect(markerSize - pixelSize, by, pixelSize, markerSize);
  }, [value]);

  return <canvas ref={canvasRef} className="mx-auto" />;
}

// ============================================================
// SAVE ROOMS TAB
// ============================================================
export default function SaveRoomsPanel() {
  const saveRooms = useGuildStore((s) => s.saveRooms);
  const bookRoom = useGuildStore((s) => s.bookRoom);
  const releaseRoom = useGuildStore((s) => s.releaseRoom);
  const setSaveRooms = useGuildStore((s) => s.setSaveRooms);
  const [amenityFilter, setAmenityFilter] = useState<string[]>([]);
  const [bookingRoom, setBookingRoom] = useState<SaveRoom | null>(null);
  const [qrRoom, setQrRoom] = useState<string | null>(null);
  const [subscribedRoom, setSubscribedRoom] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  // Get all unique amenities
  const allAmenities = useMemo(() => {
    const am = new Set<string>();
    saveRooms.forEach((r) => r.amenities.forEach((a) => am.add(a)));
    return Array.from(am).sort();
  }, [saveRooms]);

  const toggleAmenity = (amenity: string) => {
    setAmenityFilter((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const filteredRooms = useMemo(() => {
    if (amenityFilter.length === 0) return saveRooms;
    return saveRooms.filter((r) => amenityFilter.every((a) => r.amenities.includes(a)));
  }, [saveRooms, amenityFilter]);

  // Handle Stripe redirect back (checkout=success or checkout=cancelled)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    const roomId = params.get('room');

    if (checkoutStatus === 'success' && roomId) {
      // Confirm the booking via API
      const confirmBooking = async () => {
        const demo = isDemoMode();
        const res = await fetch(`/api/nexus/rooms/confirm${demo ? '?demo=true' : ''}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room_id: roomId }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.room || data.success) {
            // Update local store
            const qrHash = data.room?.qr_code_hash || `qr-${Date.now()}-${roomId}`;
            bookRoom(roomId, "usr-001", qrHash);
            setQrRoom(qrHash);
            setTimeout(() => setQrRoom(null), 8000);
          }
        }

        // Clean URL params
        const url = new URL(window.location.href);
        url.searchParams.delete('checkout');
        url.searchParams.delete('room');
        window.history.replaceState({}, '', url.toString());
      };

      confirmBooking();
    }

    if (checkoutStatus === 'cancelled' && roomId) {
      setBookingError('Payment was cancelled. You can try again.');
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    }
  }, [bookRoom]);

  const handleBook = async (room: SaveRoom) => {
    setBookingLoading(true);
    setBookingError(null);

    try {
      const demo = isDemoMode();

      if (demo) {
        // Demo mode: simulate booking
        await new Promise((r) => setTimeout(r, 800));
        const qrHash = `qr-${Date.now()}-${room.id}`;
        bookRoom(room.id, "usr-001", qrHash);
        setQrRoom(qrHash);
        setBookingRoom(null);
        setTimeout(() => setQrRoom(null), 5000);
        return;
      }

      // Production: create Stripe Checkout session
      const res = await fetch('/api/nexus/rooms/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: room.id,
          monthly_rate: room.monthly_rate,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Booking failed');
      }

      const data = await res.json();

      if (data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        // Fallback (shouldn't happen)
        throw new Error('No checkout URL returned');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Booking failed';
      setBookingError(message);
    } finally {
      setBookingLoading(false);
      setBookingRoom(null);
    }
  };

  const handleUpgrade = async (roomId: string) => {
    setSubscribedRoom(roomId);
    try {
      // Fetch the room to get stripe_customer_id
      const room = saveRooms.find((r) => r.id === roomId);
      if (!room?.subscriber_id) {
        // In demo, just show the toast
        setTimeout(() => setSubscribedRoom(null), 2000);
        return;
      }

      // Call Stripe Billing Portal
      if (!isDemoMode()) {
        const res = await fetch('/api/stripe/portal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customer_id: room.subscriber_id }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            window.open(data.url, '_blank');
          }
        }
      }
    } catch {
      // Fall through — show toast at minimum
    }
    setTimeout(() => setSubscribedRoom(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {saveRooms.filter((r) => r.status === "AVAILABLE").length} available · {saveRooms.filter((r) => r.status === "OCCUPIED").length} occupied
        </p>
      </div>

      {/* Amenities Filter */}
      {allAmenities.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] text-muted-foreground self-center mr-1">Amenities:</span>
          {allAmenities.map((amenity) => (
            <button
              key={amenity}
              onClick={() => toggleAmenity(amenity)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                amenityFilter.includes(amenity)
                  ? "bg-primary/20 border-primary/40 text-primary font-bold"
                  : "bg-card border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {amenity.replace(/_/g, " ").toLowerCase()}
            </button>
          ))}
        </div>
      )}

      {/* QR Code Display */}
      {qrRoom && (
        <div className="bg-card border border-primary/30 rounded-xl p-6 text-center animate-in zoom-in-95 duration-200">
          <h3 className="text-sm font-bold text-primary mb-3">🔑 Your QR Access Code</h3>
          <SimpleQRDisplay value={qrRoom} />
          <p className="text-[10px] text-muted-foreground mt-2">Show this at the door to access your Save Room</p>
          <button onClick={() => setQrRoom(null)} className="mt-3 px-4 py-1.5 text-xs rounded border border-border text-muted-foreground hover:text-primary transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {/* Subscription upgrade toast */}
      {subscribedRoom && (
        <div className="bg-xp/10 border border-xp/30 rounded-lg px-4 py-3 animate-in slide-in-from-top duration-200">
          <p className="text-xs text-xp font-bold">✅ Subscription upgraded!</p>
          <p className="text-[10px] text-muted-foreground">Your plan has been updated.</p>
        </div>
      )}

      {/* Empty State */}
      {filteredRooms.length === 0 && (
        <div className="guild-card bg-card rounded-lg p-12 text-center border-border/20">
          <span className="text-5xl block mb-4">🔑</span>
          <h2 className="text-lg font-bold text-primary mb-2">No Rooms Available</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {amenityFilter.length > 0
              ? "No rooms match your amenity filters. Try removing some filters."
              : "There are no save rooms configured yet."}
          </p>
        </div>
      )}

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRooms.map((room) => {
          const isAvailable = room.status === "AVAILABLE";
          const isOccupied = room.status === "OCCUPIED";
          const isReserved = room.status === "RESERVED";
          const isOccupiedPct = Math.min(100, Math.round((room.subscriber_id ? 1 : 0) / room.capacity * 100));

          return (
            <div key={room.id} className={`guild-card bg-card rounded-lg overflow-hidden ${
              isAvailable ? "border-primary/20" : isOccupied ? "border-destructive/20" : "border-gold/20"
            }`}>
              {/* Status Banner */}
              <div className={`px-4 py-2 text-xs font-bold tracking-wider flex items-center justify-between ${
                isAvailable ? "bg-primary/10 text-primary" :
                isOccupied ? "bg-destructive/10 text-destructive" :
                "bg-gold/10 text-gold"
              }`}>
                <span>{isAvailable ? "🟢 AVAILABLE" : isOccupied ? "🔴 OCCUPIED" : "🟡 RESERVED"}</span>
                {room.monthly_rate && <span className="text-gold font-mono">${room.monthly_rate}/mo</span>}
              </div>

              <div className="p-4 space-y-3">
                <h3 className="text-base font-bold text-foreground">{room.room_name}</h3>
                {room.description && <p className="text-xs text-muted-foreground">{room.description}</p>}

                {/* Capacity */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">👥 Capacity: {room.capacity}</span>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1">
                  {room.amenities.map((a) => (
                    <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {a.replace(/_/g, " ").toLowerCase()}
                    </span>
                  ))}
                </div>

                {/* Occupancy bar (for occupied rooms) */}
                {isOccupied && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Occupancy</span>
                      <span className="text-destructive font-bold">{room.subscriber_id ? "1" : "0"}/{room.capacity}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-destructive" style={{ width: `${isOccupiedPct}%` }} />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {isAvailable && (
                    <button onClick={() => setBookingRoom(room)} className="flex-1 py-2 text-xs rounded bg-primary/10 border border-primary/30 text-primary font-bold hover:bg-primary/20 transition-colors">
                      📅 BOOK NOW
                    </button>
                  )}
                  {isReserved && !isOccupied && (
                    <button onClick={() => handleUpgrade(room.id)} className="flex-1 py-2 text-xs rounded bg-gold/10 border border-gold/30 text-gold font-bold hover:bg-gold/20 transition-colors">
                      ⬆ UPGRADE
                    </button>
                  )}
                  {isReserved && !isOccupied && (
                    <button onClick={() => window.open('/settings', '_blank')} className="px-3 py-2 text-[11px] rounded border border-primary/20 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      Manage
                    </button>
                  )}
                  {(isOccupied || isReserved) && room.subscriber_id && (
                    <button onClick={() => { setQrRoom(room.qr_code_hash || `qr-${room.id}`); }} className="flex-1 py-2 text-xs rounded border border-border text-muted-foreground hover:text-primary transition-colors">
                      🔑 Show QR
                    </button>
                  )}
                  {isReserved && (
                    <button onClick={() => releaseRoom(room.id)} className="px-3 py-2 text-[11px] rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Confirmation Modal */}
      {bookingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setBookingRoom(null)} />
          <div className="relative bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
            <h2 className="text-sm font-bold text-primary mb-1">Confirm Booking</h2>
            <p className="text-xs text-muted-foreground mb-4">{bookingRoom.room_name}</p>

            <div className="bg-background/50 rounded-lg p-4 space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Room</span>
                <span className="text-foreground font-bold">{bookingRoom.room_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Rate</span>
                <span className="text-gold font-mono font-bold">${bookingRoom.monthly_rate}/mo</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Amenities</span>
                <span className="text-foreground">{bookingRoom.amenities.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">QR Access</span>
                <span className="text-primary">✅ Included</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setBookingRoom(null);
                  setBookingError(null);
                }}
                disabled={bookingLoading}
                className="flex-1 py-2.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBook(bookingRoom)}
                disabled={bookingLoading}
                className="flex-1 py-2.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  '✅ CONFIRM BOOKING'
                )}
              </button>
            </div>

            {bookingError && (
              <div className="mt-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-destructive font-medium">{bookingError}</p>
                <button
                  onClick={() => setBookingError(null)}
                  className="mt-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

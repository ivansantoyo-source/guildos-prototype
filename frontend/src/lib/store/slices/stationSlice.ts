import type { StateCreator } from 'zustand';
import type { Station, StationBooking } from '@/lib/types';
import type { GuildState } from '../storeTypes';

export interface StationSlice {
  stations: Station[];
  stationBookings: StationBooking[];
  setStations: (stations: Station[]) => void;
  addStation: (station: Station) => void;
  updateStation: (id: string, updates: Partial<Station>) => void;
  removeStation: (id: string) => void;
  setStationBookings: (bookings: StationBooking[]) => void;
  addStationBooking: (booking: StationBooking) => void;
  updateStationBooking: (id: string, updates: Partial<StationBooking>) => void;
}

export const createStationSlice: StateCreator<GuildState, [], [], StationSlice> = (set) => ({
  stations: [],
  stationBookings: [],

  setStations: (stations) => set({ stations }),
  addStation: (station) =>
    set((state) => ({ stations: [...state.stations, station] })),
  updateStation: (id, updates) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),
  removeStation: (id) =>
    set((state) => ({
      stations: state.stations.filter((s) => s.id !== id),
    })),
  setStationBookings: (bookings) => set({ stationBookings: bookings }),
  addStationBooking: (booking) =>
    set((state) => ({
      stationBookings: [...state.stationBookings, booking],
    })),
  updateStationBooking: (id, updates) =>
    set((state) => ({
      stationBookings: state.stationBookings.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),
});

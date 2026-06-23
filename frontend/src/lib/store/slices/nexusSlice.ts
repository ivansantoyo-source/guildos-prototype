import type { StateCreator } from 'zustand';
import type { NexusLfg, NexusLfgParticipant, ScoreboardEntry, SaveRoom, FactionStanding } from '@/lib/types';
import type { GuildState } from '../storeTypes';

export interface NexusSlice {
  lfgLobbies: NexusLfg[];
  scoreboards: ScoreboardEntry[];
  saveRooms: SaveRoom[];
  factionStandings: FactionStanding[];
  lfgParticipants: Record<string, NexusLfgParticipant[]>;
  setLfgLobbies: (lobbies: NexusLfg[]) => void;
  addLfgLobby: (lobby: NexusLfg) => void;
  updateLfgLobby: (id: string, updates: Partial<NexusLfg>) => void;
  joinLobby: (id: string) => void;
  leaveLobby: (id: string) => void;
  setScoreboards: (scores: ScoreboardEntry[]) => void;
  addScoreEntry: (entry: ScoreboardEntry) => void;
  updateScoreEntry: (id: string, updates: Partial<ScoreboardEntry>) => void;
  setSaveRooms: (rooms: SaveRoom[]) => void;
  bookRoom: (id: string, subscriber_id: string, qr_hash: string) => void;
  releaseRoom: (id: string) => void;
  addSaveRoom: (room: SaveRoom) => void;
  setFactionStandings: (standings: FactionStanding[]) => void;
  setLfgParticipants: (lobbyId: string, participants: NexusLfgParticipant[]) => void;
  addLfgParticipant: (lobbyId: string, participant: NexusLfgParticipant) => void;
  removeLfgParticipant: (lobbyId: string, profileId: string) => void;
}

export const createNexusSlice: StateCreator<GuildState, [], [], NexusSlice> = (set) => ({
  lfgLobbies: [],
  scoreboards: [],
  saveRooms: [],
  factionStandings: [],
  lfgParticipants: {},

  setLfgLobbies: (lobbies) => set({ lfgLobbies: lobbies }),
  addLfgLobby: (lobby) =>
    set((state) => ({ lfgLobbies: [lobby, ...state.lfgLobbies] })),
  updateLfgLobby: (id, updates) =>
    set((state) => ({
      lfgLobbies: state.lfgLobbies.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    })),
  joinLobby: (id) =>
    set((state) => ({
      lfgLobbies: state.lfgLobbies.map((l) =>
        l.id === id
          ? { ...l, player_slots_filled: Math.min(l.player_slots_filled + 1, l.player_slots_total) }
          : l
      ),
    })),
  leaveLobby: (id) =>
    set((state) => ({
      lfgLobbies: state.lfgLobbies.map((l) =>
        l.id === id
          ? { ...l, player_slots_filled: Math.max(l.player_slots_filled - 1, 0) }
          : l
      ),
    })),
  setScoreboards: (scores) => set({ scoreboards: scores }),
  addScoreEntry: (entry) =>
    set((state) => ({ scoreboards: [...state.scoreboards, entry] })),
  updateScoreEntry: (id, updates) =>
    set((state) => ({
      scoreboards: state.scoreboards.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),
  setSaveRooms: (rooms) => set({ saveRooms: rooms }),
  bookRoom: (id, subscriber_id, qr_hash) =>
    set((state) => ({
      saveRooms: state.saveRooms.map((r) =>
        r.id === id
          ? { ...r, status: 'RESERVED' as const, subscriber_id, qr_code_hash: qr_hash }
          : r
      ),
    })),
  releaseRoom: (id) =>
    set((state) => ({
      saveRooms: state.saveRooms.map((r) =>
        r.id === id
          ? { ...r, status: 'AVAILABLE' as const, subscriber_id: undefined, qr_code_hash: undefined }
          : r
      ),
    })),
  addSaveRoom: (room) =>
    set((state) => ({ saveRooms: [...state.saveRooms, room] })),
  setFactionStandings: (standings) => set({ factionStandings: standings }),
  setLfgParticipants: (lobbyId, participants) =>
    set((state) => ({
      lfgParticipants: {
        ...state.lfgParticipants,
        [lobbyId]: participants,
      },
    })),
  addLfgParticipant: (lobbyId, participant) =>
    set((state) => ({
      lfgParticipants: {
        ...state.lfgParticipants,
        [lobbyId]: [
          ...(state.lfgParticipants[lobbyId] || []),
          participant,
        ],
      },
    })),
  removeLfgParticipant: (lobbyId, profileId) =>
    set((state) => ({
      lfgParticipants: {
        ...state.lfgParticipants,
        [lobbyId]: (
          state.lfgParticipants[lobbyId] || []
        ).filter((p) => p.profile_id !== profileId),
      },
    })),
});

// ============================================================================
// GUILDOS — Generated Supabase Database Types (guildos_core schema)
// Run `bash scripts/generate-types.sh` to regenerate from live DB
// ============================================================================

export interface Database {
  guildos_core: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          subdomain: string
          custom_domain: string | null
          tier: 'merchant' | 'wizard' | 'time_lord'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          iot_webhook_url: string | null
          config: Record<string, unknown>
          logo_url: string | null
          tagline: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subdomain: string
          custom_domain?: string | null
          tier?: 'merchant' | 'wizard' | 'time_lord'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          iot_webhook_url?: string | null
          config?: Record<string, unknown>
          logo_url?: string | null
          tagline?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<{
          name: string
          subdomain: string
          custom_domain: string | null
          tier: 'merchant' | 'wizard' | 'time_lord'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          iot_webhook_url: string | null
          config: Record<string, unknown>
          logo_url: string | null
          tagline: string | null
          updated_at: string
        }>
      }
      inventory: {
        Row: {
          id: string
          organization_id: string
          item_name: string
          platform: string | null
          condition: 'NEW' | 'CIB' | 'LOOSE' | 'SCRAP' | null
          market_value: number
          our_price: number | null
          scrap_value: number
          stock_count: number
          is_legendary: boolean
          price_spike_flag: boolean
          tags: string[]
          image_url: string | null
          scanned_image_url: string | null
          pricecharting_id: string | null
          last_price_sync: string | null
          status: 'ACTIVE' | 'SOLD' | 'RESERVED' | 'SCRAP' | 'ARCHIVED'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          item_name: string
          platform?: string | null
          condition?: 'NEW' | 'CIB' | 'LOOSE' | 'SCRAP' | null
          market_value?: number
          our_price?: number | null
          scrap_value?: number
          stock_count?: number
          tags?: string[]
          image_url?: string | null
          scanned_image_url?: string | null
          pricecharting_id?: string | null
          last_price_sync?: string | null
          status?: 'ACTIVE' | 'SOLD' | 'RESERVED' | 'SCRAP' | 'ARCHIVED'
          notes?: string | null
        }
        Update: Partial<{
          item_name: string
          platform: string | null
          condition: 'NEW' | 'CIB' | 'LOOSE' | 'SCRAP' | null
          market_value: number
          our_price: number | null
          scrap_value: number
          stock_count: number
          is_legendary: boolean
          price_spike_flag: boolean
          tags: string[]
          image_url: string | null
          status: 'ACTIVE' | 'SOLD' | 'RESERVED' | 'SCRAP' | 'ARCHIVED'
          notes: string | null
          updated_at: string
        }>
      }
      profiles: {
        Row: {
          id: string
          organization_id: string
          display_name: string
          role: 'owner' | 'admin' | 'staff' | 'customer'
          faction: 'SEGA_SYNDICATE' | 'NINTENDO_NOMADS' | 'SONY_SENTINELS' | null
          xp_points: number
          level_tier: 'PEASANT' | 'RETRO_MAGE' | 'TIME_LORD'
          phone: string | null
          email: string | null
          avatar_url: string | null
          purchase_tags: string[]
          geo_lat: number | null
          geo_lng: number | null
          total_spend: number
          last_active_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          display_name: string
          role?: 'owner' | 'admin' | 'staff' | 'customer'
          faction?: 'SEGA_SYNDICATE' | 'NINTENDO_NOMADS' | 'SONY_SENTINELS' | null
          xp_points?: number
          phone?: string | null
          email?: string | null
          avatar_url?: string | null
          purchase_tags?: string[]
          geo_lat?: number | null
          geo_lng?: number | null
          total_spend?: number
        }
        Update: Partial<{
          display_name: string
          role: 'owner' | 'admin' | 'staff' | 'customer'
          faction: 'SEGA_SYNDICATE' | 'NINTENDO_NOMADS' | 'SONY_SENTINELS' | null
          xp_points: number
          phone: string | null
          email: string | null
          avatar_url: string | null
          purchase_tags: string[]
          geo_lat: number | null
          geo_lng: number | null
          total_spend: number
          last_active_at: string | null
          updated_at: string
        }>
      }
      bounties: {
        Row: {
          id: string
          organization_id: string
          target_item_name: string
          platform: string | null
          base_market_price: number
          scarcity_mult: number
          store_credit_value: number
          status: 'ACTIVE' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED'
          fulfilled_by: string | null
          fulfilled_at: string | null
          expires_at: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          target_item_name: string
          platform?: string | null
          base_market_price?: number
          scarcity_mult?: number
          status?: 'ACTIVE' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED'
          fulfilled_by?: string | null
          fulfilled_at?: string | null
          expires_at?: string | null
          description?: string | null
        }
        Update: Partial<{
          target_item_name: string
          platform: string | null
          base_market_price: number
          scarcity_mult: number
          status: 'ACTIVE' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED'
          fulfilled_by: string | null
          fulfilled_at: string | null
          expires_at: string | null
          description: string | null
          updated_at: string
        }>
      }
      nexus_lfgs: {
        Row: {
          id: string
          organization_id: string
          creator_id: string | null
          game_title: string
          description: string | null
          console_type: string | null
          player_slots_total: number
          player_slots_filled: number
          max_spectators: number
          start_time: string | null
          end_time: string | null
          lobby_status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          creator_id?: string | null
          game_title: string
          description?: string | null
          console_type?: string | null
          player_slots_total?: number
          player_slots_filled?: number
          max_spectators?: number
          start_time?: string | null
          end_time?: string | null
          lobby_status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
        }
        Update: Partial<{
          game_title: string
          description: string | null
          player_slots_total: number
          player_slots_filled: number
          max_spectators: number
          start_time: string | null
          end_time: string | null
          lobby_status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
        }>
      }
      nexus_scoreboards: {
        Row: {
          id: string
          organization_id: string
          cabinet_name: string
          game_title: string
          player_tag: string
          player_id: string | null
          score: number
          rank: number | null
          status: string
          logged_at: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          cabinet_name: string
          game_title: string
          player_tag: string
          player_id?: string | null
          score: number
          rank?: number | null
          status?: string
          logged_at?: string
        }
        Update: Partial<{
          cabinet_name: string
          game_title: string
          player_tag: string
          score: number
          rank: number | null
          status: string
        }>
      }
      nexus_save_rooms: {
        Row: {
          id: string
          organization_id: string
          room_name: string
          description: string | null
          monthly_rate: number
          capacity: number
          amenities: string[]
          subscriber_id: string | null
          stripe_subscription_id: string | null
          qr_code_hash: string | null
          status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED'
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          room_name: string
          description?: string | null
          monthly_rate?: number
          capacity?: number
          amenities?: string[]
          subscriber_id?: string | null
          stripe_subscription_id?: string | null
          qr_code_hash?: string | null
          status?: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED'
        }
        Update: Partial<{
          room_name: string
          description: string | null
          monthly_rate: number
          capacity: number
          amenities: string[]
          subscriber_id: string | null
          stripe_subscription_id: string | null
          qr_code_hash: string | null
          status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED'
        }>
      }
      faction_standings: {
        Row: {
          id: string
          organization_id: string
          month: number
          year: number
          faction: 'SEGA_SYNDICATE' | 'NINTENDO_NOMADS' | 'SONY_SENTINELS'
          total_points: number
          is_winner: boolean
          discount_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          month: number
          year: number
          faction: 'SEGA_SYNDICATE' | 'NINTENDO_NOMADS' | 'SONY_SENTINELS'
          total_points?: number
          is_winner?: boolean
          discount_active?: boolean
        }
        Update: Partial<{
          total_points: number
          is_winner: boolean
          discount_active: boolean
        }>
      }
      notifications: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          type: 'PRICE_SPIKE' | 'BOUNTY_FULFILLED' | 'SCORE_DETHRONED' | 'ORACLE_MATCH' | 'GRAIL_DROP' | 'FACTION_WIN' | 'B2B_PROPOSAL' | 'BLACKLIST_ALERT' | 'SYSTEM' | 'KONAMI'
          title: string
          message: string | null
          metadata: Record<string, unknown>
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          type: 'PRICE_SPIKE' | 'BOUNTY_FULFILLED' | 'SCORE_DETHRONED' | 'ORACLE_MATCH' | 'GRAIL_DROP' | 'FACTION_WIN' | 'B2B_PROPOSAL' | 'BLACKLIST_ALERT' | 'SYSTEM' | 'KONAMI'
          title: string
          message?: string | null
          metadata?: Record<string, unknown>
        }
        Update: Partial<{
          read_at: string | null
        }>
      }
      discount_codes: {
        Row: {
          id: string
          organization_id: string
          code: string
          discount_percent: number
          source: 'KONAMI' | 'FACTION_WIN' | 'PROMOTION' | 'MANUAL'
          used_by: string | null
          used_at: string | null
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          code: string
          discount_percent?: number
          source?: 'KONAMI' | 'FACTION_WIN' | 'PROMOTION' | 'MANUAL'
          used_by?: string | null
          used_at?: string | null
          expires_at?: string | null
          is_active?: boolean
        }
        Update: Partial<{
          used_by: string | null
          used_at: string | null
          is_active: boolean
        }>
      }
      blacklist_entries: {
        Row: {
          id: string
          reported_by_org: string
          hashed_id: string
          geo_lat: number | null
          geo_lng: number | null
          reason: string
          description: string | null
          severity: 'WARNING' | 'CRITICAL' | 'BAN'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          reported_by_org: string
          hashed_id: string
          geo_lat?: number | null
          geo_lng?: number | null
          reason: string
          description?: string | null
          severity?: 'WARNING' | 'CRITICAL' | 'BAN'
          is_active?: boolean
        }
        Update: Partial<{
          is_active: boolean
        }>
      }
      price_history: {
        Row: {
          id: string
          inventory_id: string
          organization_id: string
          market_value: number
          source: string
          recorded_at: string
        }
        Insert: {
          id?: string
          inventory_id: string
          organization_id: string
          market_value: number
          source?: string
          recorded_at?: string
        }
        Update: Record<string, never>
      }
    }
  }
}

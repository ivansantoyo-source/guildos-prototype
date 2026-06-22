"""
GuildOS — Daily Price Sync Cron Task
Scheduled: 04:00 UTC daily
Purpose: Pull all inventory items, check PriceCharting for current market values,
         flag items with >= 15% price spikes, update price_history.
"""

import os
import httpx
from datetime import datetime, timezone


async def run_price_sync():
    """Main entry point for the price sync task."""
    supabase_url = os.getenv("SUPABASE_URL", "")
    cron_secret = os.getenv("CRON_SECRET", "")

    if not supabase_url:
        print("[price_sync] No Supabase URL configured — skipping")
        return

    # In production, this would:
    # 1. Query all ACTIVE inventory items from guildos_core.inventory
    # 2. For each item, check PriceCharting API for current market value
    # 3. Calculate variance from last recorded price
    # 4. If variance >= 15%, set price_spike_flag = TRUE
    # 5. Always update last_price_sync timestamp
    # 6. Insert new price_history record

    print(f"[price_sync] Task scheduled for 04:00 UTC — {datetime.now(timezone.utc)}")
    # TODO: Implement production logic with Supabase SDK


def calculate_variance(old_price: float, new_price: float) -> float:
    """Calculate percentage variance between two prices."""
    if old_price == 0:
        return 0
    return abs((new_price - old_price) / old_price) * 100


if __name__ == "__main__":
    import asyncio
    asyncio.run(run_price_sync())

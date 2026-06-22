"""
GuildOS — Monthly Faction War Resolution
Scheduled: Last day of month at 23:59:59
Purpose: Tally faction points, declare winner, activate 10% discount
         for winning faction's tagged inventory for 30 days.
"""

import os
from datetime import datetime, timezone


async def run_faction_war_resolution():
    """Main entry point for faction war resolution."""
    supabase_url = os.getenv("SUPABASE_URL", "")

    if not supabase_url:
        print("[faction_war] No Supabase URL configured — skipping")
        return

    now = datetime.now(timezone.utc)
    current_month = now.month
    current_year = now.year

    print(f"[faction_war] Resolving faction war for {current_month}/{current_year}")

    # In production, this would:
    # 1. Query all profiles and sum total_spend by faction for current month
    # 2. Determine winner (highest total_points)
    # 3. Update faction_standings with is_winner = TRUE for winner
    # 4. Set discount_active = TRUE for winner's row
    # 5. Generate discount codes for all winner faction members
    # 6. Create FACTION_WIN notifications
    # 7. Reset monthly counters for new month

    # Demo results (matches phantomData):
    demo_results = {
        "month": current_month,
        "year": current_year,
        "winner": "SONY_SENTINELS",
        "standings": [
            {"faction": "SONY_SENTINELS", "points": 5100.00},
            {"faction": "NINTENDO_NOMADS", "points": 4250.00},
            {"faction": "SEGA_SYNDICATE", "points": 3820.00},
        ],
        "discount_active_until": f"{current_year}-{current_month + 1:02d}-28",
    }

    print(f"[faction_war] Winner: {demo_results['winner']}")
    print(f"[faction_war] Discount active until: {demo_results['discount_active_until']}")

    return demo_results


if __name__ == "__main__":
    import asyncio
    asyncio.run(run_faction_war_resolution())

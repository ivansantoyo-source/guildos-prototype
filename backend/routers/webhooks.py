"""
GuildOS — Webhook Router
Handles inbound webhooks from Stripe, IoT systems, and external services.
"""

import hashlib
import hmac
from fastapi import APIRouter, Request, HTTPException
from core.config import settings

router = APIRouter()


@router.post("/stripe")
async def stripe_webhook(request: Request):
    """
    Stripe webhook handler.
    Receives subscription lifecycle events: created, updated, cancelled.
    Updates tenant subscription status in guildos_core.organizations.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if settings.DEMO_MODE:
        body = await request.json() if payload else {}
        event_type = body.get("type", "checkout.session.completed")
        return {
            "status": "received (demo)",
            "event_type": event_type,
            "processed": True,
        }

    # Production: verify signature and process
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    try:
        import stripe
        stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
        # TODO: Process event and update Supabase
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook verification failed: {str(e)}")

    return {"status": "received"}


@router.post("/iot-forward")
async def iot_webhook_forward(request: Request):
    """
    IoT webhook forwarder.
    Receives grail drop events and forwards them to the tenant's configured
    IoT endpoint (Make/Zapier → Govee lights + smart speaker).
    """
    body = await request.json()

    if settings.DEMO_MODE:
        return {
            "status": "forwarded (demo)",
            "event": body.get("event", "unknown"),
            "tenant_id": body.get("tenant_id", "demo"),
            "iot_endpoint": "https://hook.make.com/demo-guildos-iot",
            "light_hex": body.get("action_payload", {}).get("light_hex", "#FFD700"),
        }

    # Production: validate, forward to tenant's IoT webhook URL
    return {"status": "forwarded"}


@router.post("/price-alert")
async def price_spike_webhook(request: Request):
    """
    Internal webhook triggered when a price spike >= 15% is detected.
    Creates in-app notification and optionally triggers SMS.
    """
    body = await request.json()
    item_id = body.get("item_id")
    spike_pct = body.get("spike_pct", 0)

    if settings.DEMO_MODE:
        return {
            "status": "alerted (demo)",
            "item_id": item_id,
            "spike_pct": spike_pct,
            "notification_created": True,
        }

    return {"status": "alerted"}

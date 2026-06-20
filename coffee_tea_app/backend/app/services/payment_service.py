import stripe
from typing import Optional
from ..config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


def create_payment_intent(amount_cents: int, currency: str = "usd", metadata: dict = None) -> dict:
    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency=currency,
        automatic_payment_methods={"enabled": True},
        metadata=metadata or {},
    )
    return {"client_secret": intent.client_secret, "payment_intent_id": intent.id}


def verify_payment(payment_intent_id: str) -> bool:
    intent = stripe.PaymentIntent.retrieve(payment_intent_id)
    return intent.status == "succeeded"


def verify_webhook(payload: bytes, sig_header: str) -> Optional[dict]:
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
        return event
    except (ValueError, stripe.error.SignatureVerificationError):
        return None

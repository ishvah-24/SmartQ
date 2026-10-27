#this file will send notifications to students using the whatsApp API
#currently used by views.py when a ticket is created and when staff change a tickets status
# Credentials (WA_TOKEN, WA_PHONE_ID) are read from settings.py which loads them from .env.
import requests
from django.conf import settings
from .models import Notification


#Converts a phone number typed by a student into the format WhatsApp expects.
def normalise_phone(raw):
    # keep digits only (removes spaces, dashes, brackets and the "+")
    p = "".join(ch for ch in (raw or "") if ch.isdigit())
    if p.startswith("0"):
        #replace the 0 with the country code 27
        p = "27" + p[1:]
    return p


def send_ticket_notification(ticket, status=None):
    """Send the ticket number + status by WhatsApp and log it. Never raises."""
    if not settings.WA_TOKEN or not settings.WA_PHONE_ID:
        print("WhatsApp not configured, skipping")
        return False

    status = status or ticket.queue_status
    phone = normalise_phone(ticket.student.phone_number)
    ticket_no = f"A-{ticket.ticket_id:03d}"  

    # WhatsApp Cloud API endpoint for sending messages from our phone number
    url = f"https://graph.facebook.com/v21.0/{settings.WA_PHONE_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "template",
        "template": {
            "name": "ticket_update",
            "language": {"code": "en"},
            "components": [{
                "type": "body",
                "parameters": [
                    {"type": "text", "text": ticket_no},
                    {"type": "text", "text": status},
                ],
            }],
        },
    }
    try:
        r = requests.post(url, json=payload,
                          headers={"Authorization": f"Bearer {settings.WA_TOKEN}"},
                          timeout=10)
        r.raise_for_status()
    except requests.RequestException as e:
        print("WhatsApp error:", e, getattr(e.response, "text", ""))
        return False

    # Record that this notification was sent
    Notification.objects.create(student=ticket.student, ticket=ticket,
                                notification_type=status)
    return True
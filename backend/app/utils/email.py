from email.message import EmailMessage
import smtplib
from app.core.config import settings

def send_email(to_email: str, subject: str, html_body: str, text_body: str | None = None) -> bool:
    msg = EmailMessage()
    from_addr = settings.SMTP_USER or "noreply@greenloop.com"
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_email
    if text_body:
        msg.set_content(text_body)
        msg.add_alternative(html_body, subtype="html")
    else:
        msg.set_content(html_body, subtype="html")
    if not settings.SMTP_HOST or not settings.SMTP_PORT:
        return False
    try:
        with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT)) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception:
        return False
import os
import logging
import httpx
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

OTP_EMAIL_HTML = """
<div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
    <div style="text-align: center; margin-bottom: 32px;">
        <h2 style="color: #191C1E; margin-bottom: 8px;">Precision Analytics</h2>
        <p style="color: #45464D; font-size: 14px;">Password Reset Verification</p>
    </div>
    <div style="background: #F7F9FB; border: 1px solid #C6C6CD; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="color: #45464D; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Your Verification Code</p>
        <h1 style="color: #191C1E; font-size: 36px; letter-spacing: 8px; margin: 0;">{code}</h1>
    </div>
    <p style="color: #45464D; font-size: 13px; line-height: 1.5; text-align: center;">
        This code will expire in <strong>5 minutes</strong>.<br/>
        If you did not request this, please ignore this email.
    </p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;" />
    <p style="color: #76777D; font-size: 10px; text-align: center;">
        © 2026 PRECISION ANALYTICS SYSTEMS. ALL RIGHTS RESERVED.
    </p>
</div>
"""


def _send_smtp_sync(email: str, code: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Verification Code - Precision Analytics"
    msg["From"] = f"Precision Analytics <{smtp_from}>"
    msg["To"] = email
    msg.attach(MIMEText(OTP_EMAIL_HTML.format(code=code), "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_from, [email], msg.as_string())


async def send_otp_email(email: str, code: str) -> bool:
    smtp_user = os.getenv("SMTP_USER")
    resend_api_key = os.getenv("RESEND_API_KEY")

    if smtp_user:
        try:
            await asyncio.to_thread(_send_smtp_sync, email, code)
            logger.info(f"OTP email sent to {email} via SMTP")
            return True
        except Exception as e:
            logger.error(f"SMTP failed: {e}")
            return False

    if resend_api_key:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {resend_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "from": "Precision Analytics <onboarding@resend.dev>",
                        "to": [email],
                        "subject": "Your Verification Code - Precision Analytics",
                        "html": OTP_EMAIL_HTML.format(code=code)
                    }
                )
                if response.status_code == 200:
                    logger.info(f"OTP email sent to {email} via Resend")
                    return True
                else:
                    logger.error(f"Resend failed: {response.status_code} - {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Resend error: {e}")
            return False

    logger.info(f"[DEV MODE] OTP Email for {email}: {code}")
    print(f"\n{'='*50}")
    print(f"[OTP EMAIL] Code for {email}: {code}")
    print(f"{'='*50}\n")
    return True


async def send_otp_whatsapp(phone_number: str, code: str) -> bool:
    """
    Send OTP code via WhatsApp using Twilio Sandbox.
    FREE: Unlimited messages via sandbox (testing).
    Sign up: https://www.twilio.com/try-twilio (no credit card for trial)

    SETUP (one-time per phone number):
    1. Go to Twilio Console > Messaging > Try it out > Send a WhatsApp message
    2. Send the join code (e.g., "join xxx-yyy") to +1 415 523 8886 via WhatsApp
    3. You'll get a confirmation message
    4. Now you can receive messages from the sandbox
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    whatsapp_from = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")

    if not all([account_sid, auth_token]):
        logger.info(f"[DEV MODE] OTP WhatsApp for {phone_number}: {code}")
        print(f"\n{'='*50}")
        print(f"[OTP WHATSAPP] Code for {phone_number}: {code}")
        print(f"{'='*50}\n")
        return True

    to_number = f"whatsapp:{phone_number}" if not phone_number.startswith("whatsapp:") else phone_number

    message_body = f"Your Precision Analytics verification code is: {code}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, please ignore this message."

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json",
                auth=(account_sid, auth_token),
                data={
                    "From": whatsapp_from,
                    "To": to_number,
                    "Body": message_body
                }
            )

            if response.status_code in [200, 201]:
                logger.info(f"OTP WhatsApp sent to {phone_number}")
                return True
            else:
                logger.error(f"Failed to send WhatsApp: {response.status_code} - {response.text}")
                return False

    except Exception as e:
        logger.error(f"Error sending OTP WhatsApp: {str(e)}")
        return False


async def send_otp(email: str, code: str, delivery_method: str, phone_number: str = None) -> bool:
    """Send OTP via the specified delivery method ('email' or 'whatsapp')"""
    if delivery_method == "whatsapp":
        if not phone_number:
            logger.error("Phone number required for WhatsApp delivery")
            return False
        return await send_otp_whatsapp(phone_number, code)
    else:
        return await send_otp_email(email, code)

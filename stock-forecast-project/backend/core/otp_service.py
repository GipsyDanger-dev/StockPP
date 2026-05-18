"""
OTP Delivery Service
Handles sending OTP codes via Email and WhatsApp
"""

import os
import logging
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

# ============== Email OTP via Resend ==============

async def send_otp_email(email: str, code: str) -> bool:
    """
    Send OTP code via email using Resend API

    Args:
        email: Recipient email address
        code: The OTP code to send

    Returns:
        True if email sent successfully
    """
    resend_api_key = os.getenv("RESEND_API_KEY")

    if not resend_api_key:
        logger.warning("RESEND_API_KEY not configured, using fallback logging")
        logger.info(f"[OTP EMAIL] Code for {email}: {code}")
        return True  # Return True for development

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": "Precision Analytics <noreply@precision-analytics.com>",
                    "to": [email],
                    "subject": "Your Verification Code - Precision Analytics",
                    "html": f"""
                    <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
                        <h2 style="color: #191C1E; margin-bottom: 8px;">Precision Analytics</h2>
                        <p style="color: #45464D; font-size: 14px; margin-bottom: 32px;">Password Reset Verification</p>

                        <div style="background: #F7F9FB; border: 1px solid #C6C6CD; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                            <p style="color: #45464D; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Your Verification Code</p>
                            <h1 style="color: #191C1E; font-size: 36px; letter-spacing: 8px; margin: 0;">{code}</h1>
                        </div>

                        <p style="color: #45464D; font-size: 13px; line-height: 1.5;">
                            This code will expire in <strong>5 minutes</strong>. If you did not request this, please ignore this email.
                        </p>

                        <hr style="border: none; border-top: 1px solid #C6C6CD80; margin: 32px 0;" />

                        <p style="color: #76777D; font-size: 10px; text-align: center;">
                            © 2026 PRECISION ANALYTICS SYSTEMS. ALL RIGHTS RESERVED.
                        </p>
                    </div>
                    """
                }
            )

            if response.status_code == 200:
                logger.info(f"OTP email sent to {email}")
                return True
            else:
                logger.error(f"Failed to send email: {response.text}")
                return False

    except Exception as e:
        logger.error(f"Error sending OTP email: {str(e)}")
        return False


# ============== WhatsApp OTP via Twilio ==============

async def send_otp_whatsapp(phone_number: str, code: str) -> bool:
    """
    Send OTP code via WhatsApp using Twilio API

    Args:
        phone_number: Recipient phone number (with country code, e.g., +628123456789)
        code: The OTP code to send

    Returns:
        True if message sent successfully
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    whatsapp_from = os.getenv("TWILIO_WHATSAPP_NUMBER")  # e.g., whatsapp:+14155238886

    if not all([account_sid, auth_token, whatsapp_from]):
        logger.warning("Twilio credentials not configured, using fallback logging")
        logger.info(f"[OTP WHATSAPP] Code for {phone_number}: {code}")
        return True  # Return True for development

    try:
        # Format phone number for WhatsApp
        to_number = f"whatsapp:{phone_number}" if not phone_number.startswith("whatsapp:") else phone_number

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json",
                auth=(account_sid, auth_token),
                data={
                    "From": whatsapp_from,
                    "To": to_number,
                    "Body": f"Your Precision Analytics verification code is: {code}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, please ignore this message."
                }
            )

            if response.status_code in [200, 201]:
                logger.info(f"OTP WhatsApp sent to {phone_number}")
                return True
            else:
                logger.error(f"Failed to send WhatsApp: {response.text}")
                return False

    except Exception as e:
        logger.error(f"Error sending OTP WhatsApp: {str(e)}")
        return False


# ============== Unified Send Function ==============

async def send_otp(email: str, code: str, delivery_method: str, phone_number: str = None) -> bool:
    """
    Send OTP via the specified delivery method

    Args:
        email: User's email (always needed for records)
        code: The OTP code
        delivery_method: 'email' or 'whatsapp'
        phone_number: Required if delivery_method is 'whatsapp'

    Returns:
        True if sent successfully
    """
    if delivery_method == "whatsapp":
        if not phone_number:
            logger.error("Phone number required for WhatsApp delivery")
            return False
        return await send_otp_whatsapp(phone_number, code)
    else:
        return await send_otp_email(email, code)

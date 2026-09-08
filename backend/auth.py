import bcrypt
import random
import threading
import os
import resend

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_password_bytes)

# Store pending verifications in memory (for demo purposes)
# Format: {email: {"code": "123456", "user_data": {...}}}
pending_registrations = {}

def _send_email_task(to_email: str, code: str):
    """Internal function that runs in background thread to send email via Resend."""
    try:
        api_key = os.getenv("RESEND_API_KEY")
        if not api_key:
            print(f"[EMAIL] RESEND_API_KEY not set — skipping email send")
            print(f"*** VERIFICATION CODE for {to_email}: {code} ***")
            return

        resend.api_key = api_key

        params: resend.Emails.SendParams = {
            "from": "AI LMS <onboarding@resend.dev>",
            "to": [to_email],
            "subject": "AI LMS - Email Verification Code",
            "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4f46e5;">Welcome to AI LMS!</h2>
                    <p>Your email verification code is:</p>
                    <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f46e5;">{code}</span>
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">Enter this code to complete your registration. This code is valid for this session only.</p>
                    <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
                </div>
            """,
        }

        response = resend.Emails.send(params)
        print(f"[EMAIL] Sent verification code to {to_email} | ID: {response.get('id', 'unknown')}")

    except Exception as e:
        print(f"[EMAIL] Failed to send to {to_email}: {e}")
    finally:
        # Always print code to logs as backup
        print(f"*** VERIFICATION CODE for {to_email}: {code} ***")

def send_verification_email(to_email: str, code: str):
    """Send verification email in background thread — never blocks registration."""
    thread = threading.Thread(target=_send_email_task, args=(to_email, code), daemon=True)
    thread.start()
    return True

def generate_verification_code() -> str:
    """Generate a 6-digit random code."""
    return str(random.randint(100000, 999999))

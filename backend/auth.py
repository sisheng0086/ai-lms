import bcrypt
import smtplib
import random
import threading
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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
    """Internal function that runs in background thread to send email."""
    sender_email = os.getenv("SENDER_EMAIL", "danielwong9487@gmail.com")
    sender_password = os.getenv("SENDER_PASSWORD", "hjoltvtysubdgouz")

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = "AI LMS - Email Verification Code"

    body = f"Welcome to AI LMS! Your email verification code is: {code}\nPlease enter this code to complete your registration."
    msg.attach(MIMEText(body, 'plain'))

    try:
        # 10 second timeout so it never hangs forever
        server = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"[EMAIL] Sent verification code to {to_email}")
    except Exception as e:
        print(f"[EMAIL] Failed to send to {to_email}: {e}")
    finally:
        # Always print code to console so you can see it in Railway logs
        print(f"*** VERIFICATION CODE for {to_email}: {code} ***")

def send_verification_email(to_email: str, code: str):
    """Send verification email in background thread — never blocks registration."""
    thread = threading.Thread(target=_send_email_task, args=(to_email, code), daemon=True)
    thread.start()
    return True

def generate_verification_code() -> str:
    """Generate a 6-digit random code."""
    return str(random.randint(100000, 999999))

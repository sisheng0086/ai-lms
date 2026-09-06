import bcrypt
import smtplib
import random
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

def send_verification_email(to_email: str, code: str):
    """Send a verification email with a 6-digit code."""
    # Real credentials supplied by user
    sender_email = "danielwong9487@gmail.com"
    sender_password = "hjoltvtysubdgouz"

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = "AI LMS - Email Verification Code"

    body = f"Welcome to AI LMS! Your email verification code is: {code}\nPlease enter this code to complete your registration."
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        # Send actual email
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        
        # We print it to console so it's usable even if email fails to send due to fake credentials
        print(f"*** VERIFICATION EMAIL SIMULATION ***")
        print(f"To: {to_email}")
        print(f"Code: {code}")
        print(f"*************************************")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def generate_verification_code() -> str:
    """Generate a 6-digit random code."""
    return str(random.randint(100000, 999999))

import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent / '.env')

def send_email_otp(to_email: str, code: str, subject="Your Verification Code"):
    mail_key = os.getenv("MAIL_KEY", "")
    
    # In a real app, you would use an email service API like SendGrid, Resend, or SMTP
    # For now, we simulate the email sending and print the code to the console for testing
    print(f"==================================================")
    print(f"📧 EMAIL SENT TO: {to_email}")
    print(f"SUBJECT: {subject}")
    print(f"BODY: Your verification code is: {code}")
    print(f"==================================================")
    
    # If using SendGrid or similar, you would make the API request here using mail_key
    # Example SMTP usage (commented out):
    # if mail_key and mail_key != "your_mail_api_key_here":
    #     try:
    #         msg = MIMEText(f"Your verification code is: {code}")
    #         msg['Subject'] = subject
    #         msg['From'] = "noreply@internconnect.com"
    #         msg['To'] = to_email
    #         with smtplib.SMTP_SSL('smtp.example.com', 465) as server:
    #             server.login("your_smtp_user", mail_key)
    #             server.send_message(msg)
    #     except Exception as e:
    #         print(f"Failed to send email: {e}")
    
    return True

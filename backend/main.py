import os
import shutil
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional

# Import local modules
from database import get_connection
import auth

app = FastAPI(title="AI Lecturer Clone - API Backend")

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------
# Pydantic Models
# -----------------
class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    email: EmailStr
    role: str # student or lecturer

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str

class LoginRequest(BaseModel):
    username: str
    password: str

# -----------------
# General Endpoints
# -----------------
@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Lecturer Clone API Backend!"}

# -----------------
# Auth Endpoints
# -----------------
@app.post("/auth/register")
def register_user(request: RegisterRequest):
    # Validate role
    if request.role not in ["student", "lecturer"]:
        raise HTTPException(status_code=400, detail="Role must be student or lecturer")

    # Validate password requirements
    if len(request.password) < 8 or len(request.password) > 12:
        raise HTTPException(status_code=400, detail="Password must be between 8 and 12 characters")
    if not any(c.isupper() for c in request.password):
        raise HTTPException(status_code=400, detail="Password must include at least one uppercase letter (A-Z)")
    if not any(c.islower() for c in request.password):
        raise HTTPException(status_code=400, detail="Password must include at least one lowercase letter (a-z)")
    if not any(c.isdigit() for c in request.password):
        raise HTTPException(status_code=400, detail="Password must include at least one number (0-9)")
    if not any(not c.isalnum() for c in request.password):
        raise HTTPException(status_code=400, detail="Password must include at least one special character (!@#$%^&*)")

    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Check if username or email already exists
            cur.execute("SELECT id FROM users WHERE username = %s OR email = %s", (request.username, request.email))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Username or email already exists")

        # Hash the password
        hashed_pw = auth.hash_password(request.password)
        
        # Generate verification code
        code = auth.generate_verification_code()
        
        # Save to pending registrations
        auth.pending_registrations[request.email] = {
            "code": code,
            "user_data": {
                "username": request.username,
                "password_hash": hashed_pw,
                "full_name": request.full_name,
                "email": request.email,
                "role": request.role
            }
        }
        
        # Send email (In demo mode, this will print to console if credentials aren't set)
        auth.send_verification_email(request.email, code)
        
        return {"status": "success", "message": "Verification code sent to email"}
    finally:
        conn.close()

@app.post("/auth/verify-email")
def verify_email(request: VerifyEmailRequest):
    if request.email not in auth.pending_registrations:
        raise HTTPException(status_code=400, detail="No pending registration found for this email")
    
    pending_data = auth.pending_registrations[request.email]
    
    if pending_data["code"] != request.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Code is correct, insert user into DB
    user_data = pending_data["user_data"]
    
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (username, password_hash, full_name, role, email, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, username, full_name, role, email
                """,
                (
                    user_data["username"],
                    user_data["password_hash"],
                    user_data["full_name"],
                    user_data["role"],
                    user_data["email"],
                    datetime.now()
                )
            )
            new_user = cur.fetchone()
            conn.commit()
            
            # Remove from pending
            del auth.pending_registrations[request.email]
            
            return {"status": "success", "message": "User registered and verified successfully", "user": new_user}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()

@app.post("/auth/login")
def login_user(request: LoginRequest):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, password_hash, full_name, role, email FROM users WHERE username = %s", 
                (request.username,)
            )
            user = cur.fetchone()
            
            if not user or not auth.verify_password(request.password, user["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid username or password")
            
            # Remove password hash from response
            del user["password_hash"]
            
            return {"status": "success", "user": user}
    finally:
        conn.close()

@app.get("/users/{user_id}")
def get_user(user_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, full_name, role, email, created_at FROM users WHERE id = %s", 
                (user_id,)
            )
            user = cur.fetchone()
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            return {"status": "success", "user": user}
    finally:
        conn.close()

# -----------------
# Notes Endpoints
# -----------------
@app.post("/notes/upload")
async def upload_lecture_notes(
    user_id: int = Form(...),
    subject_code: str = Form("GEN101"), # Providing a default or requiring it in real usage
    title: str = Form("Lecture Notes"),
    file: UploadFile = File(...)
):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        with conn.cursor() as cur:
            # Check user role
            cur.execute("SELECT role, username FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            if user["role"] != "lecturer":
                raise HTTPException(status_code=403, detail="Only lecturers can upload notes")
            
            # Create upload directory if it doesn't exist
            upload_dir = f"uploads/notes/{user['username']}"
            os.makedirs(upload_dir, exist_ok=True)
            
            # Save file
            file_path = os.path.join(upload_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            # Get file size in KB
            file_size_kb = os.path.getsize(file_path) // 1024
            
            # Insert into database
            cur.execute(
                """
                INSERT INTO lecture_notes 
                (lecturer_id, subject_code, title, file_name, file_path, file_size_kb, is_indexed, uploaded_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    user_id, subject_code, title, file.filename, file_path, 
                    file_size_kb, False, datetime.now()
                )
            )
            note_id = cur.fetchone()["id"]
            conn.commit()
            
            return {
                "status": "success",
                "message": "File uploaded successfully",
                "note_id": note_id,
                "filename": file.filename
            }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")
    finally:
        conn.close()

@app.get("/notes/{lecturer_id}")
def list_lecturer_notes(lecturer_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        with conn.cursor() as cur:
            # Check if lecturer exists and is actually a lecturer
            cur.execute("SELECT role FROM users WHERE id = %s", (lecturer_id,))
            user = cur.fetchone()
            
            if not user or user["role"] != "lecturer":
                raise HTTPException(status_code=404, detail="Lecturer not found or user is not a lecturer")
                
            # Get notes
            cur.execute(
                """
                SELECT id, subject_code, title, file_name, file_size_kb, is_indexed, uploaded_at 
                FROM lecture_notes 
                WHERE lecturer_id = %s 
                ORDER BY uploaded_at DESC
                """, 
                (lecturer_id,)
            )
            notes = cur.fetchall()
            
            return {"status": "success", "notes": notes}
    finally:
        conn.close()

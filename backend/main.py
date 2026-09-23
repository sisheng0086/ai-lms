import os
import io
import shutil
import psycopg2
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse, Response
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
    staff_code: Optional[str] = None
    matrix_no: Optional[str] = None

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str

class LoginRequest(BaseModel):
    username: str
    password: str

class GradeSubmissionRequest(BaseModel):
    grade: str
    feedback: Optional[str] = None

class LecturerContactRequest(BaseModel):
    student_id: int
    lecturer_id: Optional[int] = None
    class_name: str
    subject_code: Optional[str] = "General"
    question: str

class LecturerReplyRequest(BaseModel):
    reply: str

class AdminSupportRequest(BaseModel):
    user_id: int
    user_role: str
    category: str
    priority: Optional[str] = "Normal"
    subject: str
    description: str

class AdminResolveRequest(BaseModel):
    status: str = "resolved"
    admin_response: str

# -----------------
# Database Auto-Migration
# -----------------
@app.on_event("startup")
def ensure_db_columns():
    conn = get_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS matrix_no VARCHAR(30);")
                cur.execute("ALTER TABLE lecture_notes ADD COLUMN IF NOT EXISTS file_data BYTEA;")
                cur.execute("ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS file_size_kb INT;")
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS assignments (
                        id SERIAL PRIMARY KEY,
                        lecturer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        subject_code VARCHAR(20) NOT NULL,
                        title VARCHAR(200) NOT NULL,
                        description TEXT,
                        due_date VARCHAR(50),
                        file_name VARCHAR(255),
                        file_path VARCHAR(500),
                        file_data BYTEA,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    """
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS assignment_submissions (
                        id SERIAL PRIMARY KEY,
                        assignment_id INT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
                        student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        file_name VARCHAR(255) NOT NULL,
                        file_path VARCHAR(500),
                        file_size_kb INT,
                        file_data BYTEA,
                        comment TEXT,
                        grade VARCHAR(30),
                        feedback TEXT,
                        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    """
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS lecturer_messages (
                        id SERIAL PRIMARY KEY,
                        student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        lecturer_id INT REFERENCES users(id) ON DELETE SET NULL,
                        class_name VARCHAR(80) NOT NULL,
                        subject_code VARCHAR(30),
                        question TEXT NOT NULL,
                        reply TEXT,
                        status VARCHAR(20) DEFAULT 'pending',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        replied_at TIMESTAMP
                    );
                    """
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS admin_support_tickets (
                        id SERIAL PRIMARY KEY,
                        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        user_role VARCHAR(20) NOT NULL,
                        category VARCHAR(80) NOT NULL,
                        priority VARCHAR(20) DEFAULT 'Normal',
                        subject VARCHAR(200) NOT NULL,
                        description TEXT NOT NULL,
                        status VARCHAR(20) DEFAULT 'open',
                        admin_response TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    """
                )
                conn.commit()
        except Exception as e:
            print(f"[DB] Auto-migration note: {e}")
        finally:
            conn.close()

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

    # Validate staff secret code for lecturers
    if request.role == "lecturer":
        expected_code = os.getenv("LECTURER_SECRET_KEY", "STAFF2026")
        if not request.staff_code or request.staff_code.strip() != expected_code:
            raise HTTPException(
                status_code=403,
                detail="Invalid Lecturer Secret Passcode. Contact faculty administration for the access key."
            )

    # Validate matrix_no for students
    clean_matrix_no = None
    if request.role == "student":
        if not request.matrix_no or not request.matrix_no.strip():
            raise HTTPException(
                status_code=400,
                detail="Matrix No is required for student registration."
            )
        clean_matrix_no = request.matrix_no.strip().upper()

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
            # Ensure matrix_no column exists
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS matrix_no VARCHAR(30);")
            conn.commit()

            # Check if username or email already exists
            cur.execute("SELECT id FROM users WHERE username = %s OR email = %s", (request.username, request.email))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Username or email already exists")

            # Check if matrix_no already exists for another student
            if clean_matrix_no:
                cur.execute("SELECT id FROM users WHERE matrix_no = %s", (clean_matrix_no,))
                if cur.fetchone():
                    raise HTTPException(status_code=400, detail="This Matrix No is already registered")

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
                "role": request.role,
                "matrix_no": clean_matrix_no
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
                INSERT INTO users (username, password_hash, full_name, role, email, matrix_no, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, username, full_name, role, email, matrix_no
                """,
                (
                    user_data["username"],
                    user_data["password_hash"],
                    user_data["full_name"],
                    user_data["role"],
                    user_data["email"],
                    user_data.get("matrix_no"),
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
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS matrix_no VARCHAR(30);")
            conn.commit()
            cur.execute(
                "SELECT id, username, password_hash, full_name, role, email, matrix_no FROM users WHERE username = %s", 
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
                "SELECT id, username, full_name, role, email, matrix_no, created_at FROM users WHERE id = %s", 
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
            
            # Read raw bytes for both disk and DB persistence
            raw_bytes = await file.read()
            file_path = os.path.join(upload_dir, file.filename)
            with open(file_path, "wb") as buffer:
                buffer.write(raw_bytes)
                
            # Get file size in KB
            file_size_kb = max(1, len(raw_bytes) // 1024)
            
            # Insert into database (including file_data for Railway persistence)
            cur.execute(
                """
                INSERT INTO lecture_notes 
                (lecturer_id, subject_code, title, file_name, file_path, file_size_kb, file_data, is_indexed, uploaded_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    user_id, subject_code, title, file.filename, file_path, 
                    file_size_kb, psycopg2.Binary(raw_bytes), False, datetime.now()
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

@app.get("/notes")
def list_all_notes():
    """Returns all uploaded lecture notes for students to browse and study."""
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT ln.id, ln.subject_code, ln.title, ln.file_name, ln.file_path, 
                       ln.file_size_kb, ln.uploaded_at, u.full_name as lecturer_name
                FROM lecture_notes ln
                LEFT JOIN users u ON ln.lecturer_id = u.id
                ORDER BY ln.uploaded_at DESC
                """
            )
            notes = cur.fetchall()
            return {"status": "success", "notes": notes}
    finally:
        conn.close()

@app.get("/notes/{note_id}/download")
def download_note(note_id: int):
    """Downloads a lecture note file for students or lecturers."""
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT file_path, file_name, file_data FROM lecture_notes WHERE id = %s",
                (note_id,)
            )
            note = cur.fetchone()
            if not note:
                raise HTTPException(status_code=404, detail="Note not found")
            
            file_name = note["file_name"] or f"note_{note_id}.pdf"
            if note["file_path"] and os.path.exists(note["file_path"]):
                return FileResponse(
                    path=note["file_path"],
                    filename=file_name,
                    media_type="application/octet-stream"
                )
            elif note.get("file_data"):
                return Response(
                    content=bytes(note["file_data"]),
                    media_type="application/octet-stream",
                    headers={"Content-Disposition": f'attachment; filename="{file_name}"'}
                )
            else:
                raise HTTPException(status_code=404, detail="File content not available on server. Please ask lecturer to re-upload.")
    finally:
        conn.close()

@app.get("/notes/{note_id}/content")
def get_note_content(note_id: int):
    """Extracts and returns text content from an uploaded note file (PDF or text)."""
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT file_path, file_name, title, file_data FROM lecture_notes WHERE id = %s", 
                (note_id,)
            )
            note = cur.fetchone()
            if not note:
                raise HTTPException(status_code=404, detail="Note not found")
            
            file_path = note["file_path"]
            raw_bytes = None
            if file_path and os.path.exists(file_path):
                with open(file_path, "rb") as f:
                    raw_bytes = f.read()
            elif note.get("file_data"):
                raw_bytes = bytes(note["file_data"])

            if not raw_bytes:
                return {"status": "success", "content": f"Title: {note['title']}\nFilename: {note['file_name']}"}
            
            # If PDF, extract text using PyPDF2
            if (note["file_name"] or "").lower().endswith('.pdf'):
                try:
                    import PyPDF2
                    text = ""
                    reader = PyPDF2.PdfReader(io.BytesIO(raw_bytes))
                    for page in reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
                    return {"status": "success", "content": text.strip()}
                except Exception:
                    return {"status": "success", "content": f"Title: {note['title']}\nFilename: {note['file_name']}"}
            else:
                try:
                    return {"status": "success", "content": raw_bytes.decode('utf-8', errors='ignore').strip()}
                except Exception:
                    return {"status": "success", "content": f"Title: {note['title']}\nFilename: {note['file_name']}"}
    finally:
        conn.close()

# -----------------
# Assignments & Homework Submission Endpoints
# -----------------
@app.post("/assignments/create")
async def create_assignment(
    user_id: int = Form(...),
    subject_code: str = Form("GEN101"),
    title: str = Form(...),
    description: str = Form(""),
    due_date: str = Form(""),
    file: Optional[UploadFile] = File(None)
):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            cur.execute("SELECT role, username FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if not user or user["role"] != "lecturer":
                raise HTTPException(status_code=403, detail="Only lecturers can create assignments")

            file_name = None
            file_path = None
            file_data = None

            if file and file.filename:
                raw_bytes = await file.read()
                upload_dir = f"uploads/assignments/{user['username']}"
                os.makedirs(upload_dir, exist_ok=True)
                file_name = file.filename
                file_path = os.path.join(upload_dir, file_name)
                with open(file_path, "wb") as buffer:
                    buffer.write(raw_bytes)
                file_data = psycopg2.Binary(raw_bytes)

            cur.execute(
                """
                INSERT INTO assignments
                (lecturer_id, subject_code, title, description, due_date, file_name, file_path, file_data, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (user_id, subject_code, title, description, due_date, file_name, file_path, file_data, datetime.now())
            )
            assignment_id = cur.fetchone()["id"]
            conn.commit()
            return {"status": "success", "message": "Assignment created successfully", "assignment_id": assignment_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create assignment: {str(e)}")
    finally:
        conn.close()

@app.get("/assignments/lecturer/{lecturer_id}")
def list_lecturer_assignments(lecturer_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT a.id, a.subject_code, a.title, a.description, a.due_date,
                       a.file_name, a.created_at,
                       COUNT(s.id) AS submission_count
                FROM assignments a
                LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
                WHERE a.lecturer_id = %s
                GROUP BY a.id
                ORDER BY a.created_at DESC
                """,
                (lecturer_id,)
            )
            assignments = cur.fetchall()
            return {"status": "success", "assignments": assignments}
    finally:
        conn.close()

@app.get("/assignments/student/{student_id}")
def list_student_assignments(student_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT a.id, a.subject_code, a.title, a.description, a.due_date,
                       a.file_name, a.created_at, u.full_name AS lecturer_name,
                       s.id AS submission_id, s.file_name AS submitted_file,
                       s.comment AS student_comment, s.grade, s.feedback, s.submitted_at
                FROM assignments a
                LEFT JOIN users u ON a.lecturer_id = u.id
                LEFT JOIN LATERAL (
                    SELECT id, file_name, comment, grade, feedback, submitted_at
                    FROM assignment_submissions
                    WHERE assignment_id = a.id AND student_id = %s
                    ORDER BY submitted_at DESC
                    LIMIT 1
                ) s ON true
                ORDER BY a.created_at DESC
                """,
                (student_id,)
            )
            assignments = cur.fetchall()
            return {"status": "success", "assignments": assignments}
    finally:
        conn.close()

@app.get("/assignments/{assignment_id}/download")
def download_assignment_file(assignment_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT file_name, file_path, file_data FROM assignments WHERE id = %s",
                (assignment_id,)
            )
            row = cur.fetchone()
            if not row or not row["file_name"]:
                raise HTTPException(status_code=404, detail="Assignment attachment not found")

            file_name = row["file_name"]
            if row["file_path"] and os.path.exists(row["file_path"]):
                return FileResponse(path=row["file_path"], filename=file_name, media_type="application/octet-stream")
            elif row.get("file_data"):
                return Response(
                    content=bytes(row["file_data"]),
                    media_type="application/octet-stream",
                    headers={"Content-Disposition": f'attachment; filename="{file_name}"'}
                )
            else:
                raise HTTPException(status_code=404, detail="Attachment file data not available")
    finally:
        conn.close()

@app.post("/assignments/{assignment_id}/submit")
async def submit_assignment_homework(
    assignment_id: int,
    student_id: int = Form(...),
    comment: str = Form(""),
    file: UploadFile = File(...)
):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, username FROM users WHERE id = %s", (student_id,))
            student = cur.fetchone()
            if not student:
                raise HTTPException(status_code=404, detail="Student not found")

            raw_bytes = await file.read()
            upload_dir = f"uploads/submissions/assignment_{assignment_id}/{student['username']}"
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, file.filename)
            with open(file_path, "wb") as buffer:
                buffer.write(raw_bytes)
            file_size_kb = max(1, len(raw_bytes) // 1024)

            # Check if student already submitted for this assignment
            cur.execute(
                "SELECT id FROM assignment_submissions WHERE assignment_id = %s AND student_id = %s",
                (assignment_id, student_id)
            )
            existing = cur.fetchone()

            if existing:
                cur.execute(
                    """
                    UPDATE assignment_submissions
                    SET file_name = %s, file_path = %s, file_size_kb = %s,
                        file_data = %s, comment = %s, submitted_at = %s
                    WHERE id = %s
                    RETURNING id
                    """,
                    (file.filename, file_path, file_size_kb, psycopg2.Binary(raw_bytes), comment, datetime.now(), existing["id"])
                )
                sub_id = existing["id"]
            else:
                cur.execute(
                    """
                    INSERT INTO assignment_submissions
                    (assignment_id, student_id, file_name, file_path, file_size_kb, file_data, comment, submitted_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (assignment_id, student_id, file.filename, file_path, file_size_kb, psycopg2.Binary(raw_bytes), comment, datetime.now())
                )
                sub_id = cur.fetchone()["id"]

            conn.commit()
            return {"status": "success", "message": "Homework submitted successfully!", "submission_id": sub_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error submitting homework: {str(e)}")
    finally:
        conn.close()

@app.get("/assignments/{assignment_id}/submissions")
def list_assignment_submissions(assignment_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT s.id, s.assignment_id, s.student_id, s.file_name, s.file_size_kb,
                       s.comment, s.grade, s.feedback, s.submitted_at,
                       u.full_name AS student_name, u.username, u.matrix_no
                FROM assignment_submissions s
                JOIN users u ON s.student_id = u.id
                WHERE s.assignment_id = %s
                ORDER BY s.submitted_at DESC
                """,
                (assignment_id,)
            )
            submissions = cur.fetchall()
            return {"status": "success", "submissions": submissions}
    finally:
        conn.close()

@app.get("/submissions/{submission_id}/download")
def download_submission_file(submission_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT file_name, file_path, file_data FROM assignment_submissions WHERE id = %s",
                (submission_id,)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Submission not found")

            file_name = row["file_name"] or f"submission_{submission_id}"
            if row["file_path"] and os.path.exists(row["file_path"]):
                return FileResponse(path=row["file_path"], filename=file_name, media_type="application/octet-stream")
            elif row.get("file_data"):
                return Response(
                    content=bytes(row["file_data"]),
                    media_type="application/octet-stream",
                    headers={"Content-Disposition": f'attachment; filename="{file_name}"'}
                )
            else:
                raise HTTPException(status_code=404, detail="Submitted file data not available")
    finally:
        conn.close()

@app.post("/submissions/{submission_id}/grade")
def grade_submission(submission_id: int, req: GradeSubmissionRequest):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE assignment_submissions
                SET grade = %s, feedback = %s
                WHERE id = %s
                RETURNING id
                """,
                (req.grade, req.feedback, submission_id)
            )
            updated = cur.fetchone()
            if not updated:
                raise HTTPException(status_code=404, detail="Submission not found")
            conn.commit()
            return {"status": "success", "message": "Grade and feedback saved"}
    finally:
        conn.close()

# -----------------
# Contact & Support Endpoints (Lecturer Q&A + Admin Tech Support)
# -----------------
@app.get("/lecturers")
def list_all_lecturers():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, full_name, username, email FROM users WHERE role = 'lecturer' ORDER BY full_name ASC"
            )
            lecturers = cur.fetchall()
            return {"status": "success", "lecturers": lecturers}
    finally:
        conn.close()

@app.post("/contact/lecturer")
def send_lecturer_question(req: LecturerContactRequest):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO lecturer_messages
                (student_id, lecturer_id, class_name, subject_code, question, status, created_at)
                VALUES (%s, %s, %s, %s, %s, 'pending', %s)
                RETURNING id
                """,
                (req.student_id, req.lecturer_id, req.class_name, req.subject_code or "General", req.question, datetime.now())
            )
            msg_id = cur.fetchone()["id"]
            conn.commit()
            return {"status": "success", "message": "Question sent to lecturer!", "message_id": msg_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to send question: {str(e)}")
    finally:
        conn.close()

@app.get("/contact/lecturer/student/{student_id}")
def get_student_lecturer_messages(student_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT m.id, m.class_name, m.subject_code, m.question, m.reply, m.status,
                       m.created_at, m.replied_at,
                       l.full_name AS lecturer_name, l.email AS lecturer_email
                FROM lecturer_messages m
                LEFT JOIN users l ON m.lecturer_id = l.id
                WHERE m.student_id = %s
                ORDER BY m.created_at DESC
                """,
                (student_id,)
            )
            messages = cur.fetchall()
            return {"status": "success", "messages": messages}
    finally:
        conn.close()

@app.get("/contact/lecturer/inbox/{lecturer_id}")
def get_lecturer_inbox(lecturer_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT m.id, m.student_id, m.lecturer_id, m.class_name, m.subject_code,
                       m.question, m.reply, m.status, m.created_at, m.replied_at,
                       s.full_name AS student_name, s.matrix_no, s.email AS student_email
                FROM lecturer_messages m
                JOIN users s ON m.student_id = s.id
                WHERE m.lecturer_id = %s OR m.lecturer_id IS NULL
                ORDER BY CASE WHEN m.status = 'pending' THEN 0 ELSE 1 END, m.created_at DESC
                """,
                (lecturer_id,)
            )
            messages = cur.fetchall()
            return {"status": "success", "messages": messages}
    finally:
        conn.close()

@app.post("/contact/lecturer/{message_id}/reply")
def reply_lecturer_message(message_id: int, req: LecturerReplyRequest):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE lecturer_messages
                SET reply = %s, status = 'answered', replied_at = %s
                WHERE id = %s
                RETURNING id
                """,
                (req.reply, datetime.now(), message_id)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Message not found")
            conn.commit()
            return {"status": "success", "message": "Reply sent to student"}
    finally:
        conn.close()

@app.post("/contact/admin")
def create_admin_support_ticket(req: AdminSupportRequest):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO admin_support_tickets
                (user_id, user_role, category, priority, subject, description, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, 'open', %s)
                RETURNING id
                """,
                (req.user_id, req.user_role, req.category, req.priority or "Normal", req.subject, req.description, datetime.now())
            )
            ticket_id = cur.fetchone()["id"]
            conn.commit()
            return {"status": "success", "message": "Technical support ticket submitted to Admin!", "ticket_id": ticket_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit support ticket: {str(e)}")
    finally:
        conn.close()

@app.get("/contact/admin/user/{user_id}")
def get_user_support_tickets(user_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, category, priority, subject, description, status, admin_response, created_at
                FROM admin_support_tickets
                WHERE user_id = %s
                ORDER BY created_at DESC
                """,
                (user_id,)
            )
            tickets = cur.fetchall()
            return {"status": "success", "tickets": tickets}
    finally:
        conn.close()

@app.get("/contact/admin/all")
def get_all_admin_support_tickets():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT t.id, t.user_role, t.category, t.priority, t.subject, t.description,
                       t.status, t.admin_response, t.created_at,
                       u.full_name AS reporter_name, u.matrix_no, u.email AS reporter_email
                FROM admin_support_tickets t
                JOIN users u ON t.user_id = u.id
                ORDER BY CASE WHEN t.status = 'open' THEN 0 ELSE 1 END, t.created_at DESC
                """
            )
            tickets = cur.fetchall()
            return {"status": "success", "tickets": tickets}
    finally:
        conn.close()

@app.post("/contact/admin/{ticket_id}/resolve")
def resolve_admin_ticket(ticket_id: int, req: AdminResolveRequest):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE admin_support_tickets
                SET status = %s, admin_response = %s
                WHERE id = %s
                RETURNING id
                """,
                (req.status, req.admin_response, ticket_id)
            )
            conn.commit()
            return {"status": "success", "message": "Support ticket updated"}
    finally:
        conn.close()



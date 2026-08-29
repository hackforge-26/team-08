from fastapi import FastAPI, Request, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os

app = FastAPI(title="ResQAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

HELPER_PHONE_NUMBER = os.environ.get("HELPER_PHONE_NUMBER", "9035351841")
ALERT_EMAIL_TO = os.environ.get("ALERT_EMAIL_TO", "helper@resqai.org")

class Location(BaseModel):
    lat: float
    lng: float

class Incident(BaseModel):
    id: str
    type: str
    severity: str
    status: str
    location: Location
    estimated_victims: int
    reports_count: int
    description: str
    reporter_email: Optional[str] = None
    photo_url: Optional[str] = None
    audio_url: Optional[str] = None
    created_at: Optional[str] = None
    time: Optional[str] = None
    notified: bool = False
    notified_at: Optional[str] = None
    email_sent: bool = False
    email_sent_at: Optional[str] = None

class Resource(BaseModel):
    id: str
    type: str
    name: str
    status: str
    location: Location

incidents_db: List[Incident] = []
resources_db: List[Resource] = [
    Resource(id="r1", type="Ambulance", name="Ambulance A", status="AVAILABLE", location=Location(lat=40.7128, lng=-74.0060)),
    Resource(id="r2", type="Fire", name="Fire Engine B", status="AVAILABLE", location=Location(lat=40.7138, lng=-74.0050)),
    Resource(id="r3", type="Police", name="Police Unit C", status="AVAILABLE", location=Location(lat=40.7118, lng=-74.0070)),
]

@app.get("/")
def read_root():
    return {"message": "ResQAI Backend is running."}

@app.get("/incidents")
def get_incidents():
    return incidents_db

@app.get("/incidents/user/{email}")
def get_user_incidents(email: str):
    return [inc for inc in incidents_db if inc.reporter_email == email]

@app.post("/incidents")
async def create_incident(
    request: Request,
    photo: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    type: Optional[str] = Form(None),
    severity: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    reporter_email: Optional[str] = Form(None),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    estimated_victims: Optional[int] = Form(1),
    reports_count: Optional[int] = Form(1),
    created_at: Optional[str] = Form(None),
):
    now_iso = datetime.now(timezone.utc).isoformat()
    content_type = request.headers.get("content-type", "")
    
    if "application/json" in content_type:
        data = await request.json()
        if "created_at" not in data or not data["created_at"]:
            data["created_at"] = now_iso
        if "time" not in data or not data["time"]:
            data["time"] = data["created_at"]
        incident = Incident(**data)
    else:
        photo_url = None
        if photo and photo.filename:
            ext = os.path.splitext(photo.filename)[1]
            if not ext:
                ext = ".jpg"
            unique_filename = f"photo_{uuid.uuid4().hex}{ext}"
            file_path = os.path.join("uploads", unique_filename)
            with open(file_path, "wb") as f:
                content = await photo.read()
                f.write(content)
            photo_url = f"http://localhost:8000/uploads/{unique_filename}"
        
        audio_url = None
        if audio and audio.filename:
            ext = os.path.splitext(audio.filename)[1]
            if not ext:
                ext = ".webm"
            unique_filename = f"audio_{uuid.uuid4().hex}{ext}"
            file_path = os.path.join("uploads", unique_filename)
            with open(file_path, "wb") as f:
                content = await audio.read()
                f.write(content)
            audio_url = f"http://localhost:8000/uploads/{unique_filename}"

        incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
        timestamp = created_at or now_iso
        incident = Incident(
            id=incident_id,
            type=type or "Other",
            severity=severity or "MEDIUM",
            status=status or "REPORTED",
            location=Location(lat=lat if lat is not None else 40.7128, lng=lng if lng is not None else -74.0060),
            estimated_victims=estimated_victims if estimated_victims is not None else 1,
            reports_count=reports_count if reports_count is not None else 1,
            description=description or "",
            reporter_email=reporter_email,
            photo_url=photo_url,
            audio_url=audio_url,
            created_at=timestamp,
            time=timestamp,
            notified=False,
            notified_at=None,
            email_sent=False,
            email_sent_at=None
        )
        
    incidents_db.insert(0, incident) # Add to top
    return {"message": "Incident reported successfully", "incident": incident}

@app.post("/incidents/{incident_id}/notify-helper")
async def notify_helper(incident_id: str):
    incident = next((inc for inc in incidents_db if inc.id == incident_id), None)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    now_iso = datetime.now(timezone.utc).isoformat()
    incident_time = incident.created_at or incident.time or now_iso

    alert_message = (
        f"🚨 RESQAI EMERGENCY ALERT\n"
        f"Incident: {incident.type}\n"
        f"Time: {incident_time}\n"
        f"Location: {incident.location.lat:.4f}, {incident.location.lng:.4f}\n"
        f"Map: https://www.google.com/maps?q={incident.location.lat},{incident.location.lng}\n"
        f"Description: {incident.description}\n"
        f"Photo: {incident.photo_url or 'None'}\n"
        f"Audio: {incident.audio_url or 'None'}\n"
        f"Please respond immediately."
    )
    
    twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    twilio_auth = os.environ.get("TWILIO_AUTH_TOKEN")
    twilio_from = os.environ.get("TWILIO_FROM_NUMBER")
    
    sms_sent = False
    if twilio_sid and twilio_auth and twilio_from:
        try:
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_auth)
            client.messages.create(
                body=alert_message,
                from_=twilio_from,
                to=HELPER_PHONE_NUMBER
            )
            sms_sent = True
        except Exception as e:
            print(f"[NOTIFICATION ERROR] Twilio SMS failed: {e}")
    
    print(f"\n================ EMERGENCY ALERT NOTIFICATION ================\nTo: {HELPER_PHONE_NUMBER}\n{alert_message}\n============================================================\n")
    
    incident.notified = True
    incident.notified_at = now_iso
    
    return {
        "success": True,
        "message": f"Helper notified at {HELPER_PHONE_NUMBER}",
        "helper_phone": HELPER_PHONE_NUMBER,
        "notified_at": now_iso,
        "alert_message": alert_message,
        "sms_sent": sms_sent,
        "incident": incident
    }

@app.post("/incidents/{incident_id}/send-email")
async def send_email_alert(incident_id: str):
    incident = next((inc for inc in incidents_db if inc.id == incident_id), None)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    now_iso = datetime.now(timezone.utc).isoformat()
    incident_time = incident.created_at or incident.time or now_iso
    
    subject = f"🚨 ResQAI Emergency Alert — {incident.type}"
    body = (
        f"🚨 RESQAI EMERGENCY ALERT\n\n"
        f"Incident Type: {incident.type}\n"
        f"Incident ID: {incident.id}\n"
        f"Reported Time: {incident_time}\n"
        f"Severity: {incident.severity}\n"
        f"Status: {incident.status}\n\n"
        f"Location Coordinates: {incident.location.lat:.4f}, {incident.location.lng:.4f}\n"
        f"Google Maps Link: https://www.google.com/maps?q={incident.location.lat},{incident.location.lng}\n\n"
        f"Description:\n{incident.description}\n\n"
        f"Attached Photo: {incident.photo_url or 'None'}\n"
        f"Attached Audio: {incident.audio_url or 'None'}\n\n"
        f"Please respond immediately."
    )
    
    smtp_server = os.environ.get("SMTP_SERVER")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USERNAME")
    smtp_pass = os.environ.get("SMTP_PASSWORD")
    
    email_delivered = False
    if smtp_server and smtp_user and smtp_pass:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            msg = MIMEMultipart()
            msg["From"] = smtp_user
            msg["To"] = ALERT_EMAIL_TO
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))
            
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            email_delivered = True
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send SMTP email: {e}")
    
    print(f"\n================ EMAIL ALERT NOTIFICATION ================\nTo: {ALERT_EMAIL_TO}\nSubject: {subject}\n\n{body}\n=========================================================\n")
    
    incident.email_sent = True
    incident.email_sent_at = now_iso
    
    return {
        "success": True,
        "message": f"Email alert sent to {ALERT_EMAIL_TO}",
        "recipient": ALERT_EMAIL_TO,
        "email_sent_at": now_iso,
        "subject": subject,
        "body": body,
        "email_delivered": email_delivered,
        "incident": incident
    }

@app.get("/resources")
def get_resources():
    return resources_db

@app.post("/demo/trigger")
def trigger_demo():
    now_iso = datetime.now(timezone.utc).isoformat()
    new_incident = Incident(
        id=f"INC-{uuid.uuid4().hex[:6].upper()}",
        type="ROAD ACCIDENT",
        severity="CRITICAL",
        status="REPORTED",
        location=Location(lat=40.7128, lng=-74.0060),
        estimated_victims=3,
        reports_count=1,
        description="Major collision involving a truck and multiple cars.",
        created_at=now_iso,
        time=now_iso
    )
    incidents_db.insert(0, new_incident)
    return {"message": "Demo triggered", "incident": new_incident}




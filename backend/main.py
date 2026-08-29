from fastapi import FastAPI, Request, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
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
    time: str = "Just now"

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
    type: Optional[str] = Form(None),
    severity: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    reporter_email: Optional[str] = Form(None),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    estimated_victims: Optional[int] = Form(1),
    reports_count: Optional[int] = Form(1),
):
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        data = await request.json()
        incident = Incident(**data)
    else:
        photo_url = None
        if photo and photo.filename:
            ext = os.path.splitext(photo.filename)[1]
            unique_filename = f"{uuid.uuid4().hex}{ext}"
            file_path = os.path.join("uploads", unique_filename)
            with open(file_path, "wb") as f:
                content = await photo.read()
                f.write(content)
            photo_url = f"http://localhost:8000/uploads/{unique_filename}"
        
        incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
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
            time="Just now"
        )
        
    incidents_db.insert(0, incident) # Add to top
    return {"message": "Incident reported successfully", "incident": incident}

@app.get("/resources")
def get_resources():
    return resources_db

@app.post("/demo/trigger")
def trigger_demo():
    # Create a major road accident scenario
    new_incident = Incident(
        id=str(uuid.uuid4())[:8],
        type="ROAD ACCIDENT",
        severity="CRITICAL",
        status="REPORTED",
        location=Location(lat=40.7128, lng=-74.0060),
        estimated_victims=3,
        reports_count=1,
        description="Major collision involving a truck and multiple cars."
    )
    incidents_db.append(new_incident)
    return {"message": "Demo triggered", "incident": new_incident}


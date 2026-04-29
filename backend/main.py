from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr
import google.generativeai as genai
import resend

load_dotenv()

# Configure API Keys
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
resend.api_key = os.getenv("RESEND_API_KEY")

app = FastAPI(
    title="SalesAgent AI API",
    description="Backend for AI-powered cold outreach",
    version="0.1.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LeadInfo(BaseModel):
    name: str
    company: str
    email: EmailStr

class EmailRequest(BaseModel):
    lead: LeadInfo
    prompt: str = "Write a hyper-personalized cold email for this lead."

class SendEmailRequest(BaseModel):
    to_email: EmailStr
    subject: str
    content: str

@app.post("/generate-email")
async def generate_email(request: EmailRequest):
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        prompt = f"""
        {request.prompt}
        Lead Name: {request.lead.name}
        Company: {request.lead.company}
        
        Rules:
        - Be professional but friendly.
        - Keep it under 100 words.
        - Mention their company specifically.
        - End with a clear call to action.
        """
        response = model.generate_content(prompt)
        return {"content": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/send-email")
async def send_email(request: SendEmailRequest):
    try:
        params = {
            "from": "SalesAgent AI <onboarding@resend.dev>", # Update with verified domain
            "to": [request.to_email],
            "subject": request.subject,
            "text": request.content,
        }
        email = resend.Emails.send(params)
        return {"id": email["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"status": "online", "message": "SalesAgent AI API is active"}

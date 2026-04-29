from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr
import google.generativeai as genai
import resend

load_dotenv()

# Configure API Keys
gemini_key = os.getenv("GEMINI_API_KEY")
resend_key = os.getenv("RESEND_API_KEY")

if not gemini_key:
    print("⚠️ WARNING: GEMINI_API_KEY not found in environment variables")
if not resend_key:
    print("⚠️ WARNING: RESEND_API_KEY not found in environment variables")

genai.configure(api_key=gemini_key)
resend.api_key = resend_key

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
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="Gemini API Key is missing. Please add it to backend/.env")
    
    try:
        # Use gemini-1.5-flash as a fallback if 2.0-flash is not accessible yet for the user
        model_name = 'gemini-2.0-flash'
        try:
            model = genai.GenerativeModel(model_name)
        except:
            model = genai.GenerativeModel('gemini-1.5-flash')
            
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
        print(f"Error generating email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gemini Error: {str(e)}")

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

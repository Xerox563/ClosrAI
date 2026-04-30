from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr
import google.generativeai as genai
import resend
from openai import OpenAI
from supabase import create_client, Client
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional

load_dotenv()

# Configure API Keys
gemini_key = os.getenv("GEMINI_API_KEY")
resend_key = os.getenv("RESEND_API_KEY")
openrouter_key = os.getenv("OPENROUTER_API_KEY")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

# Initialize Clients
genai.configure(api_key=gemini_key)
resend.api_key = resend_key
supabase: Client = create_client(supabase_url, supabase_key)

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

# OpenRouter Client
client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=openrouter_key,
)

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

# Database Models for API
class LeadDB(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None
    role: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = "New"

@app.get("/leads")
async def get_leads(user=Depends(get_current_user)):
    try:
        # We use the user_id from the token to filter leads
        response = supabase.table("leads").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/leads")
async def add_lead(lead: LeadDB, user=Depends(get_current_user)):
    try:
        data = lead.dict()
        data["user_id"] = user.id
        response = supabase.table("leads").insert(data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-email")
async def generate_email(request: EmailRequest):
    if not os.getenv("GEMINI_API_KEY") and not os.getenv("OPENROUTER_API_KEY"):
        raise HTTPException(status_code=500, detail="AI API Key is missing. Please add GEMINI_API_KEY or OPENROUTER_API_KEY to backend/.env")
    
    prompt = f"""
    {request.prompt}
    Lead Name: {request.lead.name}
    Company: {request.lead.company}
    
    Rules:
    - DO NOT include a subject line.
    - DO NOT use placeholders like [Your Name] or [Your Company].
    - Use "SalesAgent AI" as the company name.
    - Be professional but friendly.
    - Keep it under 100 words.
    - Mention their company specifically.
    - End with a clear call to action.
    """

    # Try OpenRouter first if key is available
    if os.getenv("OPENROUTER_API_KEY"):
        try:
            completion = client.chat.completions.create(
                model="google/gemini-2.0-flash-001", # You can change this to any OpenRouter model
                messages=[
                    {"role": "system", "content": "You are a senior sales representative."},
                    {"role": "user", "content": prompt}
                ],
                extra_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "SalesAgent AI",
                }
            )
            return {"content": completion.choices[0].message.content}
        except Exception as e:
            print(f"OpenRouter Error: {str(e)}")
            # Fallback to Gemini if OpenRouter fails and Gemini key exists
            if not os.getenv("GEMINI_API_KEY"):
                raise HTTPException(status_code=500, detail=f"OpenRouter Error: {str(e)}")

    # Try Google Gemini directly
    try:
        model_name = 'gemini-2.0-flash'
        try:
            model = genai.GenerativeModel(model_name)
        except:
            model = genai.GenerativeModel('gemini-1.5-flash')
            
        response = model.generate_content(prompt)
        return {"content": response.text}
    except Exception as e:
        print(f"Gemini Error: {str(e)}")
        error_msg = str(e)
        if "429" in error_msg:
            error_msg = "Gemini Rate Limit Exceeded. Please try again later or switch to OpenRouter in settings."
        raise HTTPException(status_code=500, detail=f"AI Error: {error_msg}")

@app.post("/send-email")
async def send_email(request: SendEmailRequest):
    if not os.getenv("RESEND_API_KEY"):
        raise HTTPException(status_code=500, detail="Resend API Key is missing. Please add it to backend/.env")
        
    try:
        # Use a more descriptive sender
        from_email = "SalesAgent AI <onboarding@resend.dev>"
        
        params = {
            "from": from_email,
            "to": [request.to_email],
            "subject": request.subject,
            "text": request.content,
        }
        
        try:
            email = resend.Emails.send(params)
            return {"id": email.get("id")}
        except Exception as resend_err:
            error_detail = str(resend_err)
            print(f"Resend SDK Error: {error_detail}")
            
            if "unauthorized" in error_detail.lower():
                error_detail = "Invalid Resend API Key."
            elif "restriction" in error_detail.lower() or "verify" in error_detail.lower():
                # Extract the authorized email from the error message if it exists
                import re
                match = re.search(r'\((.*?)\)', error_detail)
                authorized_email = match.group(1) if match else "your registered email"
                error_detail = f"Resend is in Testing Mode. You can only send emails to {authorized_email} until you verify a domain at resend.com/domains."
            
            raise Exception(error_detail)
            
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Send Error: {str(e)}")

@app.get("/")
async def root():
    return {"status": "online", "message": "SalesAgent AI API is active"}

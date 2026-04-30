from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import google.generativeai as genai
import resend
from openai import OpenAI
from supabase import create_client, Client
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta
import asyncio

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

# OpenRouter Client
client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=openrouter_key,
)

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

# Unified AI Engine for background processing
async def generate_email_content(lead_name, lead_company, prompt):
    full_prompt = f"""
    {prompt}
    Lead Name: {lead_name}
    Company: {lead_company}
    
    Rules:
    - DO NOT include a subject line.
    - DO NOT use placeholders like [Your Name] or [Your Company].
    - Use \"SalesAgent AI\" as the company name.
    - Be professional but friendly.
    - Keep it under 100 words.
    - Mention their company specifically.
    - End with a clear call to action.
    """
    
    if os.getenv("OPENROUTER_API_KEY"):
        try:
            completion = client.chat.completions.create(
                model="google/gemini-2.0-flash-001",
                messages=[{"role": "system", "content": "You are a senior sales representative."}, {"role": "user", "content": full_prompt}]
            )
            return completion.choices[0].message.content
        except Exception as e:
            print(f"Background OpenRouter Error: {str(e)}")

    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        print(f"Background Gemini Error: {str(e)}")
        return None

async def process_campaigns():
    print(f"🚀 Autopilot: Processing sequences at {datetime.now()}")
    try:
        # 1. Get all active campaigns
        campaigns = supabase.table("campaigns").select("*").eq("status", "active").execute().data
        
        for campaign in campaigns:
            sequence = campaign.get("sequence", [])
            if not sequence: continue
            
            # 2. Get leads in this campaign that haven't replied
            leads = supabase.table("leads").select("*").eq("campaign_id", campaign["id"]).neq("status", "Replied").execute().data
            
            for lead in leads:
                current_step_idx = lead.get("current_step", 0)
                
                # Check if there's a next step
                if current_step_idx >= len(sequence): continue
                
                next_step = sequence[current_step_idx]
                delay_days = next_step.get("delay", 0)
                
                # Check if enough time has passed since last outreach
                last_outreach = lead.get("last_outreach_at")
                if last_outreach:
                    last_date = datetime.fromisoformat(last_outreach.replace('Z', '+00:00'))
                    if datetime.now(last_date.tzinfo) < last_date + timedelta(days=delay_days):
                        continue
                
                # 3. Process the step (Send Email)
                print(f"📬 Sending step {current_step_idx + 1} to {lead['email']}")
                
                content = await generate_email_content(
                    lead['name'], 
                    lead['company'], 
                    next_step.get("template", "Write a professional follow-up.")
                )
                
                if content:
                    # Send via Resend
                    try:
                        resend.Emails.send({
                            "from": "SalesAgent AI <onboarding@resend.dev>",
                            "to": [lead['email']],
                            "subject": f"Follow up: {campaign['name']}",
                            "text": content
                        })
                        
                        # 4. Update Lead and History
                        supabase.table("leads").update({
                            "current_step": current_step_idx + 1,
                            "last_outreach_at": datetime.now().isoformat(),
                            "status": "Emailed"
                        }).eq("id", lead["id"]).execute()
                        
                        supabase.table("outreach_history").insert({
                            "lead_id": lead["id"],
                            "user_id": campaign["user_id"],
                            "subject": f"Follow up: {campaign['name']}",
                            "body": content,
                            "status": "sent"
                        }).execute()
                        
                    except Exception as e:
                        print(f"❌ Autopilot send failed: {str(e)}")
                        
    except Exception as e:
        print(f"❌ Autopilot error: {str(e)}")

# Initialize Scheduler
scheduler = AsyncIOScheduler()
scheduler.add_job(process_campaigns, 'interval', minutes=60) # Run every hour

@app.on_event("startup")
async def start_scheduler():
    scheduler.start()
    print("🤖 Autopilot worker started")

@app.on_event("shutdown")
async def stop_scheduler():
    scheduler.shutdown()

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
    campaign_id: Optional[str] = None
    current_step: Optional[int] = 0

class CampaignDB(BaseModel):
    name: str
    daily_limit: Optional[int] = 50
    sequence: List[dict] = []

@app.get("/campaigns")
async def get_campaigns(user=Depends(get_current_user)):
    try:
        response = supabase.table("campaigns").select("*").eq("user_id", user.id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/campaigns")
async def create_campaign(campaign: CampaignDB, user=Depends(get_current_user)):
    try:
        data = campaign.dict()
        data["user_id"] = user.id
        response = supabase.table("campaigns").insert(data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/leads")
async def get_leads(user=Depends(get_current_user)):
    try:
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

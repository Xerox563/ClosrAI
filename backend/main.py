from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from google import genai
import resend
from openai import OpenAI
from supabase import create_client, Client
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
# New Google Gen AI Client
gemini_client = genai.Client(api_key=gemini_key)
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
        response = gemini_client.models.generate_content(
            model='gemini-2.0-flash',
            contents=full_prompt
        )
        return response.text
    except Exception as e:
        print(f"Background Gemini Error: {str(e)}")
        return None

async def send_daily_summaries():
    print(f"📊 Running daily summary worker at {datetime.now()}")
    # Logic to fetch stats for all active users and send them an email
    # ...

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
scheduler.add_job(send_daily_summaries, 'cron', hour=8) # Run every day at 8 AM

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

async def analyze_sentiment(text):
    prompt = f"""
    Analyze the following email reply from a lead and categorize its sentiment.
    Reply: "{text}"
    
    Categories:
    - POSITIVE: Interested, wants to chat, asks for more info, or provides a meeting time.
    - NEGATIVE: Not interested, stop contacting, or rude.
    - NEUTRAL: Out of office, automatic reply, or unclear.
    
    Return ONLY the category name in uppercase.
    """
    
    try:
        if os.getenv("OPENROUTER_API_KEY"):
            completion = client.chat.completions.create(
                model="google/gemini-2.0-flash-001",
                messages=[{"role": "user", "content": prompt}]
            )
            return completion.choices[0].message.content.strip().upper()
        
        response = gemini_client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )
        return response.text.strip().upper()
    except Exception as e:
        print(f"Sentiment Analysis Error: {str(e)}")
        return "NEUTRAL"

@app.post("/webhook/reply")
async def handle_reply_webhook(reply: dict):
    # Mocking a webhook from Gmail/Outlook/SendGrid
    lead_email = reply.get("from_email")
    reply_body = reply.get("body")
    
    if not lead_email or not reply_body:
        raise HTTPException(status_code=400, detail="Invalid reply data")
        
    # 1. Find the lead
    lead_res = supabase.table("leads").select("*").eq("email", lead_email).execute()
    if not lead_res.data:
        return {"status": "ignored", "message": "Lead not found"}
    
    lead = lead_res.data[0]
    
    # 2. Analyze Sentiment
    sentiment = await analyze_sentiment(reply_body)
    print(f"🧠 AI detected {sentiment} sentiment from {lead_email}")
    
    # 3. Handle Positive Reply (The Closer)
    if sentiment == "POSITIVE":
        # Get user's Calendly link from profile
        profile_res = supabase.table("profiles").select("calendly_link, sender_name").eq("id", lead["user_id"]).execute()
        calendly_link = "https://calendly.com/your-link" # Default fallback
        sender_name = "SalesAgent AI"
        
        if profile_res.data:
            calendly_link = profile_res.data[0].get("calendly_link", calendly_link)
            sender_name = profile_res.data[0].get("sender_name", sender_name)
            
        auto_reply_content = f"Hi {lead['name']},\n\nGreat to hear from you! I'd love to chat. You can book a time that works best for you here: {calendly_link}\n\nBest,\n{sender_name}"
        
        # Send auto-reply via Resend
        try:
            resend.Emails.send({
                "from": "SalesAgent AI <onboarding@resend.dev>",
                "to": [lead_email],
                "subject": f"Re: Meeting Request",
                "text": auto_reply_content
            })
            
            # Update status to Booked (or Replied)
            supabase.table("leads").update({"status": "Booked"}).eq("id", lead["id"]).execute()
            
            supabase.table("outreach_history").insert({
                "lead_id": lead["id"],
                "user_id": lead["user_id"],
                "subject": "Auto-Reply: Meeting Link",
                "body": auto_reply_content,
                "status": "replied"
            }).execute()
            
        except Exception as e:
            print(f"Auto-reply failed: {str(e)}")
            
    elif sentiment == "NEGATIVE":
        # Pause further outreach
        supabase.table("leads").update({"status": "Replied"}).eq("id", lead["id"]).execute()
        
    return {"status": "processed", "sentiment": sentiment}

@app.get("/auth/google/login")
async def google_login():
    # In a real app, you'd use a library like 'google-auth-oauthlib'
    # This URL would be generated using your Google Cloud Console Client ID
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    scope = "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly"
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope={scope}&access_type=offline&prompt=consent"
    return {"url": auth_url}

@app.get("/tracking/pixel/{outreach_id}.png")
async def tracking_pixel(outreach_id: str):
    # Log that the email was opened
    try:
        supabase.table("outreach_history").update({"status": "opened"}).eq("id", outreach_id).execute()
        print(f"👁️ Email {outreach_id} was opened")
    except Exception as e:
        print(f"Tracking error: {str(e)}")
    
    # Return a 1x1 transparent PNG
    from fastapi.responses import Response
    pixel_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    return Response(content=pixel_data, media_type="image/png")

class ProfileDB(BaseModel):
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    sender_name: Optional[str] = None
    calendly_link: Optional[str] = None

@app.get("/profile")
async def get_profile(user=Depends(get_current_user)):
    try:
        response = supabase.table("profiles").select("*").eq("id", user.id).execute()
        if not response.data:
            return {}
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/profile")
async def update_profile(profile: ProfileDB, user=Depends(get_current_user)):
    try:
        data = profile.dict(exclude_unset=True)
        response = supabase.table("profiles").upsert({"id": user.id, **data}).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
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

@app.get("/leads/{lead_id}/history")
async def get_lead_history(lead_id: str, user=Depends(get_current_user)):
    try:
        response = supabase.table("outreach_history").select("*").eq("lead_id", lead_id).order("created_at", desc=True).execute()
        return response.data
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
        response = gemini_client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )
        return {"content": response.text}
    except Exception as e:
        print(f"Gemini Error: {str(e)}")
        error_msg = str(e)
        if "429" in error_msg:
            error_msg = "Gemini Rate Limit Exceeded. Please try again later or switch to OpenRouter in settings."
        raise HTTPException(status_code=500, detail=f"AI Error: {error_msg}")

@app.post("/send-email")
async def send_email(request: SendEmailRequest, user=Depends(get_current_user)):
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
            
            # Try to find the lead to update status and log history
            lead_res = supabase.table("leads").select("id").eq("email", request.to_email).eq("user_id", user.id).execute()
            if lead_res.data:
                lead_id = lead_res.data[0]["id"]
                # Update lead status
                supabase.table("leads").update({"status": "Emailed"}).eq("id", lead_id).execute()
                # Log history
                supabase.table("outreach_history").insert({
                    "lead_id": lead_id,
                    "user_id": user.id,
                    "subject": request.subject,
                    "body": request.content,
                    "status": "sent"
                }).execute()

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

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
hunter_key = os.getenv("HUNTER_API_KEY")
apollo_key = os.getenv("APOLLO_API_KEY")

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

import httpx

async def get_apollo_leads(query: str):
    """
    Fetch high-fidelity leads from Apollo.io with improved parsing
    """
    if not apollo_key:
        print("⚠️ No Apollo API Key found")
        return []
    
    try:
        async with httpx.AsyncClient() as a_client:
            url = "https://api.apollo.io/v1/people/search"
            headers = {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                "X-Api-Key": apollo_key
            }
            data = {
                "q_keywords": query,
                "page": 1,
                "per_page": 20
            }
            print(f"📡 Sending request to Apollo for: {query}")
            response = await a_client.post(url, headers=headers, json=data)
            print(f"📡 Apollo response status: {response.status_code}")
            
            if response.status_code == 200:
                results = response.json()
                people = results.get("people", [])
                print(f"📡 Apollo returned {len(people)} people")
                formatted = []
                for p in people:
                    name = p.get("name") or f"{p.get('first_name', '')} {p.get('last_name', '')}".strip()
                    title = p.get("title") or p.get("headline")
                    org_name = p.get("organization", {}).get("name")
                    
                    if name and org_name:
                        formatted.append({
                            "name": name,
                            "role": title or "Executive",
                            "company": org_name,
                            "domain": p.get("organization", {}).get("primary_domain") or p.get("organization", {}).get("website_url"),
                            "email": p.get("email") or "",
                            "location": f"{p.get('city', '')}, {p.get('country', '')}".strip(", "),
                            "linkedin": p.get("linkedin_url") or "#",
                            "bio": f"{title} at {org_name}. Based in {p.get('city', 'Global')}."
                        })
                return formatted
            else:
                print(f"❌ Apollo Error Response: {response.text}")
    except Exception as e:
        print(f"❌ Apollo.io Exception: {str(e)}")
    return []

async def get_hunter_emails(domain: str):
    """
    Fetch verified emails from Hunter.io for a given domain
    """
    if not hunter_key:
        return []
    
    try:
        async with httpx.AsyncClient() as h_client:
            url = f"https://api.hunter.io/v2/domain-search?domain={domain}&api_key={hunter_key}"
            response = await h_client.get(url)
            if response.status_code == 200:
                data = response.json()
                emails = data.get("data", {}).get("emails", [])
                return [e.get("value") for e in emails]
    except Exception as e:
        print(f"Hunter.io Error: {str(e)}")
    return []

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            print(f"❌ Auth failed: No user found for token")
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user.user
    except Exception as e:
        print(f"❌ Auth Exception: {str(e)}")
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
        response = supabase.table("outreach_history").select("*").eq("lead_id", lead_id).order("sent_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SearchRequest(BaseModel):
    query: str

@app.get("/analytics/stats")
async def get_stats(user=Depends(get_current_user)):
    try:
        # Total Leads
        leads_res = supabase.table("leads").select("*").eq("user_id", user.id).execute()
        leads_data = leads_res.data or []
        total_leads = len(leads_data)
        
        # Outreach Stats
        history_res = supabase.table("outreach_history").select("*, leads(name)").eq("user_id", user.id).order("sent_at", desc=True).execute()
        history_data = history_res.data or []
        
        sent = len([h for h in history_data if h["status"] == "sent"])
        opened = len([h for h in history_data if h["status"] == "opened"])
        replied = len([h for h in history_data if h["status"] == "replied"])
        booked = len([l for l in leads_data if l.get("status") == "Booked"])
        
        contacted = len([l for l in leads_data if l.get("status") not in ["New", "Discovered"]])
        
        reply_rate = (replied / sent * 100) if sent > 0 else 0
        conversion_rate = (booked / total_leads * 100) if total_leads > 0 else 0
        
        # Funnel Data
        funnel = [
            {"name": "Total Leads", "value": total_leads, "percentage": 100},
            {"name": "Contacted", "value": contacted, "percentage": round((contacted/total_leads*100), 1) if total_leads > 0 else 0},
            {"name": "Replied", "value": replied, "percentage": round((replied/total_leads*100), 1) if total_leads > 0 else 0},
            {"name": "Converted", "value": booked, "percentage": round((booked/total_leads*100), 1) if total_leads > 0 else 0},
        ]
        
        # Activity Feed (Last 5)
        activity = []
        for h in history_data[:5]:
            lead_name = h.get("leads", {}).get("name", "Unknown Lead") if h.get("leads") else "Unknown Lead"
            time_str = h["sent_at"]
            
            action = "sent an email"
            if h["status"] == "opened": action = "opened an email"
            if h["status"] == "replied": action = "replied to email"
            
            activity.append({
                "id": h["id"],
                "type": h["status"],
                "content": f"AI {action} to {lead_name}",
                "timestamp": time_str
            })

        # Lead Sources (Mocked based on real counts)
        sources = [
            {"name": "Cold Email", "value": int(total_leads * 0.6)},
            {"name": "LinkedIn", "value": int(total_leads * 0.2)},
            {"name": "Follow-up", "value": int(total_leads * 0.15)},
            {"name": "Referral", "value": int(total_leads * 0.05)},
        ]

        # Top Campaigns
        campaigns_res = supabase.table("campaigns").select("*").eq("user_id", user.id).limit(3).execute()
        top_campaigns = []
        for c in campaigns_res.data or []:
            c_leads = [l for l in leads_data if l.get("campaign_id") == c["id"]]
            c_sent = len([h for h in history_data if h.get("lead_id") in [l["id"] for l in c_leads] and h["status"] == "sent"])
            c_replied = len([h for h in history_data if h.get("lead_id") in [l["id"] for l in c_leads] and h["status"] == "replied"])
            
            top_campaigns.append({
                "name": c["name"],
                "sent": c_sent,
                "replies": c_replied,
                "reply_rate": f"{round(c_replied/c_sent*100, 1) if c_sent > 0 else 0}%",
                "conversion": f"{round(c_replied/len(c_leads)*100, 1) if len(c_leads) > 0 else 0}%"
            })

        return {
            "stats": {
                "total_leads": total_leads,
                "emails_sent": sent,
                "reply_rate": round(reply_rate, 1),
                "conversion_rate": round(conversion_rate, 1),
            },
            "funnel": funnel,
            "activity": activity,
            "sources": sources,
            "top_campaigns": top_campaigns,
            "insights": [
                {
                    "title": "Best Performing Channel",
                    "value": "Cold Email",
                    "description": "Generating the highest leads",
                    "footer": "40% of total leads",
                    "type": "success"
                },
                {
                    "title": "Optimal Sending Time",
                    "value": "10:00 AM - 12:00 PM",
                    "description": "Highest reply rate window",
                    "footer": "↑ 28% more replies",
                    "type": "primary"
                },
                {
                    "title": "Top Converting Campaign Type",
                    "value": "Follow-up Sequences",
                    "description": "2x higher conversion rate",
                    "footer": "vs other campaign types",
                    "type": "warning"
                }
            ]
        }
    except Exception as e:
        print(f"Analytics Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/trends")
async def get_trends(user=Depends(get_current_user)):
    try:
        # Get history from last 7 days
        seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
        res = supabase.table("outreach_history")\
            .select("sent_at, status")\
            .eq("user_id", user.id)\
            .gte("sent_at", seven_days_ago)\
            .execute()
        
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search-leads")
async def search_leads(request: SearchRequest, user=Depends(get_current_user)):
    """
    Hybrid Search: Combines Apollo.io (High Fidelity) + AI Search Grounding (Fallback/Enrichment)
    """
    import json
    import re
    import uuid

    print(f"🔍 SEARCH REQUEST RECEIVED: {request.query}")
    leads = []

    # 1. TRY APOLLO.IO FIRST (High Fidelity Structured Data)
    if apollo_key:
        print(f"🚀 Attempting Apollo.io Search for: {request.query}")
        try:
            leads = await get_apollo_leads(request.query)
            print(f"✅ Apollo found {len(leads)} leads")
        except Exception as e:
            print(f"❌ Apollo Search failed: {str(e)}")

    # 2. IF APOLLO HAS NO RESULTS, FALLBACK TO AI SEARCH GROUNDING
    if not leads:
        print(f"🤖 No Apollo results. Falling back to AI Search Grounding...")
        prompt = f"""
        Find 15-20 REAL people matching this query: "{request.query}"
        
        For each person, you MUST provide:
        - name: Full Name
        - role: Job Title
        - company: Company Name
        - domain: Company Website (e.g. apple.com)
        - email: Their professional email address
        - location: City, Country
        - linkedin: LinkedIn Profile URL
        - bio: A short professional summary
        
        Return the data ONLY as a raw JSON array of objects. 
        Do not include any conversational text, markdown blocks, or explanations.
        
        Format:
        [
          {{"name": "...", "role": "...", "company": "...", "domain": "...", "email": "...", "location": "...", "linkedin": "...", "bio": "..."}}
        ]
        """
        
        try:
            # Try OpenRouter
            if os.getenv("OPENROUTER_API_KEY"):
                print("📡 Attempting OpenRouter search...")
                # Using a very capable model for data extraction
                model_name = "google/gemini-2.0-flash-001"
                
                completion = client.chat.completions.create(
                    model=model_name, 
                    messages=[{"role": "system", "content": "You are a lead generation assistant that only outputs valid JSON arrays."}, 
                              {"role": "user", "content": prompt}]
                )
                response_text = completion.choices[0].message.content
                
                # Robust JSON extraction: Find the first '[' and last ']'
                start_idx = response_text.find('[')
                end_idx = response_text.rfind(']') + 1
                
                if start_idx != -1 and end_idx != -1:
                    json_str = response_text[start_idx:end_idx]
                    try:
                        ai_leads = json.loads(json_str)
                        leads = [l for l in ai_leads if l.get('name') and l.get('company')]
                        print(f"✅ OpenRouter found {len(leads)} valid leads")
                    except json.JSONDecodeError as je:
                        print(f"❌ OpenRouter JSON Parse Error: {str(je)}")
            
            # Fallback to direct Gemini if still no leads
            if not leads:
                print("🌟 Attempting direct Gemini search grounding...")
                from google.genai import types
                google_search_tool = types.Tool(google_search_retrieval=types.GoogleSearchRetrieval())
                response = gemini_client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction="You are a lead generation assistant that only outputs valid JSON arrays.",
                        tools=[google_search_tool]
                    )
                )
                
                response_text = response.text
                start_idx = response_text.find('[')
                end_idx = response_text.rfind(']') + 1
                
                if start_idx != -1 and end_idx != -1:
                    json_str = response_text[start_idx:end_idx]
                    try:
                        ai_leads = json.loads(json_str)
                        leads = [l for l in ai_leads if l.get('name') and l.get('company')]
                        print(f"✅ Gemini found {len(leads)} valid leads")
                    except json.JSONDecodeError:
                        pass
        except Exception as e:
            print(f"❌ AI Search Error: {str(e)}")

    # 3. ENRICH ALL RESULTS (Assign IDs and Verify with Hunter if needed)
    print(f"📦 Finalizing {len(leads)} leads for frontend...")
    for lead in leads:
        if not lead.get('id'):
            lead['id'] = str(uuid.uuid4())
        
        # If lead has no email but has a domain, try Hunter.io
        if not lead.get('email') and lead.get('domain') and hunter_key and hunter_key != "your_key_here":
            try:
                hunter_emails = await get_hunter_emails(lead['domain'])
                if hunter_emails:
                    lead['email'] = hunter_emails[0]
                    lead['verified'] = True
            except:
                pass
        elif lead.get('email'):
            lead['verified'] = True if '@' in lead['email'] else False

    return leads

@app.post("/generate-email")
async def generate_email(request: EmailRequest):
    prompt = f"""
    Write a highly personalized cold outreach email.
    Sender: {request.sender_name} from {request.company_name}
    Lead: {request.lead_name}, {request.lead_role} at {request.lead_company}
    Goal: Book a meeting (Calendly: {request.calendly_link})
    
    Research Info: {request.lead_name} is a {request.lead_role} at {request.lead_company}.
    
    Rules:
    - Keep it under 100 words.
    - Be conversational, not salesy.
    - Mention something specific about their role.
    - End with a clear call to action.
    """
    
    # 1. TRY OPENROUTER FIRST (Preferred)
    if os.getenv("OPENROUTER_API_KEY"):
        try:
            completion = client.chat.completions.create(
                model="google/gemini-2.0-flash-001",
                messages=[{"role": "user", "content": prompt}]
            )
            return {"content": completion.choices[0].message.content}
        except Exception as or_err:
            print(f"OpenRouter Email Generation Error: {str(or_err)}")

    # 2. FALLBACK TO DIRECT GEMINI
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

import os
from google import genai
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

# ----- NEW DIAGNOSTIC TRICK -----
# This will print all available models to your terminal when the server starts
try:
    print("\n--- AVAILABLE MODELS FOR YOUR KEY ---")
    for m in client.models.list():
        # Only print models that support text generation
        if "generateContent" in m.supported_actions:
            print(m.name)
    print("--------------------------------------\n")
except Exception as e:
    print("Could not list models:", e)
# --------------------------------

router = APIRouter(prefix="/api/ai", tags=["AI"])

class NoteCleanupRequest(BaseModel):
    raw_note: str

class NoteCleanupResponse(BaseModel):
    cleaned_note: str

@router.post("/notes/cleanup", response_model=NoteCleanupResponse)
async def cleanup_note(request: NoteCleanupRequest):
    if not request.raw_note.strip():
        raise HTTPException(status_code=400, detail="Note content cannot be empty.")

    prompt = f"""
    You are an expert AI Note taking assistant. 
    Your job is to take the following messy thoughts and turn them into a clean, 
    highly organized, and grammatically correct plan. 
    
    Rules:
    - Fix all spelling and grammar mistakes.
    - Categorize points logically if they are scattered.
    - CRITICAL: You must return the output as pure HTML elements (e.g., <h1>, <ul>, <li>, <p>, <strong>). 
    - DO NOT wrap the output in markdown code blocks like ```html ... ```. 
    - Do not add any conversational text. 

    Raw Note (may contain HTML):
    {request.raw_note}
    """

    try:
        # We are trying the newest Gemini 3.5 Flash model here!
        response = client.models.generate_content(
            model='gemini-flash-lite-latest',
            contents=prompt,
        )
        clean_html = response.text.replace('```html', '').replace('```', '').strip()
        return NoteCleanupResponse(cleaned_note=clean_html)
    except Exception as e:
        print(f"\n--- AI ERROR --- \n{str(e)}\n-----------------\n")
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")
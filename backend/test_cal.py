import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models
from app.services import calendar_service

def test():
    db = SessionLocal()
    integration = db.query(models.AppIntegration).filter(
        models.AppIntegration.provider == "google_calendar",
        models.AppIntegration.is_active == True
    ).order_by(models.AppIntegration.id.desc()).first()

    if not integration:
        print("No active Google Calendar integration found.")
        return

    print(f"Integration ID: {integration.id}")
    print(f"Access Token exists: {bool(integration.access_token)}")
    print(f"Refresh Token exists: {bool(integration.refresh_token)}")

    task = db.query(models.Task).order_by(models.Task.id.desc()).first()
    if not task:
        print("No task found to sync.")
        return
        
    print(f"Syncing task {task.id} with due_date {task.due_date}")
    
    try:
        # Instead of calling sync_task_due_date, let's replicate the API call to see what happens
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        
        creds = Credentials(
            token=integration.access_token,
            refresh_token=integration.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=["https://www.googleapis.com/auth/calendar.events"]
        )
        
        service = build('calendar', 'v3', credentials=creds)
        print("Built service.")
        
        target_calendar = "primary"
        cal_info = service.calendars().get(calendarId=target_calendar).execute()
        time_zone = cal_info.get('timeZone', 'UTC')
        print(f"Timezone: {time_zone}")
        
        event = {
            'summary': f'[PM Tool] TEST {task.name}'.strip(),
            'description': 'Created from PM Tool test',
            'start': {'dateTime': '2025-01-01T11:00:00', 'timeZone': time_zone},
            'end': {'dateTime': '2025-01-01T12:00:00', 'timeZone': time_zone}
        }
        
        event_result = service.events().insert(calendarId=target_calendar, body=event).execute()
        print(f"SUCCESS! Event created: {event_result.get('htmlLink')}")
        
    except Exception as e:
        import traceback
        if hasattr(e, 'content'):
            print(f"Google API Error: {e.content}")
        else:
            print("General Error:")
            traceback.print_exc()

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    test()

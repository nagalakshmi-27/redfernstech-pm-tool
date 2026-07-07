import os
import logging
from sqlalchemy.orm import Session
from .. import models
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

logger = logging.getLogger("calendar_service")
logger.setLevel(logging.INFO)

def sync_task_due_date(task: models.Task, workspace_id: int, db: Session):
    """
    Sync a task's due date to Google Calendar.
    """
    if not task.due_date:
        return
        
    # Check if the workspace has Google Calendar integration active
    integration = db.query(models.AppIntegration).filter(
        models.AppIntegration.workspace_id == workspace_id,
        models.AppIntegration.provider == "google_calendar",
        models.AppIntegration.is_active == True
    ).first()
    
    if not integration or not integration.access_token:
        return
        
    try:
        # Construct credentials from stored tokens
        creds = Credentials(
            token=integration.access_token,
            refresh_token=integration.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=["https://www.googleapis.com/auth/calendar.events"]
        )
        
        service = build('calendar', 'v3', credentials=creds)
        
        # If the token was refreshed, we should ideally save it back to DB
        if creds.token != integration.access_token:
            integration.access_token = creds.token
            db.commit()
            
        # Target calendar (usually "primary")
        target_calendar = "primary"
        
        # Determine if it's a date or datetime string
        is_datetime = "T" in task.due_date
        
        event = {
            'summary': f'[PM Tool] {task.ticket_id or ""} {task.name}'.strip(),
            'description': task.description or 'Created from PM Tool',
        }
        
        if is_datetime:
            event['start'] = {'dateTime': task.due_date}
            event['end'] = {'dateTime': task.due_date}
        else:
            from datetime import datetime, timedelta
            try:
                # If it's a simple YYYY-MM-DD
                start_date = datetime.strptime(task.due_date.split(" ")[0], "%Y-%m-%d").date()
                end_date = start_date + timedelta(days=1)
                
                event['start'] = {'date': start_date.isoformat()}
                event['end'] = {'date': end_date.isoformat()}
            except ValueError:
                # Fallback if the string is weird but doesn't have a T
                event['start'] = {'date': task.due_date}
                event['end'] = {'date': task.due_date}
            
        event_result = service.events().insert(calendarId=target_calendar, body=event).execute()
        logger.info(f"Event created: {event_result.get('htmlLink')}")
        
    except Exception as e:
        logger.error(f"Failed to sync with Google Calendar: {e}")

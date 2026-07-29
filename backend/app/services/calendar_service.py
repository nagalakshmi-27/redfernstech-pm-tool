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
        
        try:
            cal_info = service.calendars().get(calendarId=target_calendar).execute()
            time_zone = cal_info.get('timeZone', 'UTC')
        except Exception:
            time_zone = 'UTC'
        
        # Determine if it's a date or datetime string
        is_datetime = "T" in task.due_date
        
        event = {
            'summary': f'[PM Tool] {task.ticket_id or ""} {task.name}'.strip(),
            'description': task.description or 'Created from PM Tool',
        }
        
        if is_datetime:
            event['start'] = {'dateTime': task.due_date, 'timeZone': time_zone}
            event['end'] = {'dateTime': task.due_date, 'timeZone': time_zone}
        else:
            from datetime import datetime, timedelta
            try:
                # If it's a simple YYYY-MM-DD
                start_date = datetime.strptime(task.due_date.split(" ")[0], "%Y-%m-%d")
                # Set time to 11 AM on the deadline date
                start_datetime = start_date.replace(hour=11, minute=0, second=0)
                end_datetime = start_datetime + timedelta(hours=1)
                
                event['start'] = {'dateTime': start_datetime.isoformat(), 'timeZone': time_zone}
                event['end'] = {'dateTime': end_datetime.isoformat(), 'timeZone': time_zone}
            except ValueError:
                # Fallback if the string is weird
                event['start'] = {'date': task.due_date}
                event['end'] = {'date': task.due_date}
            
        event_result = service.events().insert(calendarId=target_calendar, body=event).execute()
        logger.info(f"Event created: {event_result.get('htmlLink')}")
        
    except Exception as e:
        import traceback
        if hasattr(e, 'content'):
            logger.error(f"Google Calendar API Error: {e.content}")
        elif hasattr(e, 'read'):
            try:
                logger.error(f"Google Calendar API HTTP Error: {e.read().decode('utf-8')}")
            except Exception:
                logger.error(f"Failed to sync with Google Calendar: {e}")
        else:
            logger.error(f"Failed to sync with Google Calendar: {e}")
            logger.error(traceback.format_exc())

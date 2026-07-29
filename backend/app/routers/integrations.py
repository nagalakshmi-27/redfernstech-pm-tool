from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List
import os
import json
import urllib.parse
import urllib.request
from .. import models, schemas
from .users import get_db, get_current_user

router = APIRouter(
    prefix="/workspaces/{workspace_id}/integrations",
    tags=["Integrations"]
)

public_router = APIRouter(
    prefix="/integrations",
    tags=["Integrations Public"]
)

@router.get("", response_model=List[schemas.IntegrationResponse])
def get_integrations(workspace_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Verify workspace membership
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    is_member = current_user.is_owner or any(w.id == workspace_id for w in current_user.workspaces)
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to access this workspace's integrations")
        
    integrations = db.query(models.AppIntegration).filter(models.AppIntegration.workspace_id == workspace_id).all()
    return integrations

@router.post("/connect/{provider}", response_model=schemas.IntegrationResponse)
def connect_integration(workspace_id: int, provider: str, integration_data: schemas.IntegrationBase, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    is_member = current_user.is_owner or any(w.id == workspace_id for w in current_user.workspaces)
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to configure integrations")
        
    # Check if integration already exists
    existing = db.query(models.AppIntegration).filter(
        models.AppIntegration.workspace_id == workspace_id,
        models.AppIntegration.provider == provider
    ).first()
    
    if existing:
        # Update existing
        existing.access_token = integration_data.access_token
        existing.refresh_token = integration_data.refresh_token
        existing.config = integration_data.config
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return existing
        
    new_integration = models.AppIntegration(
        workspace_id=workspace_id,
        provider=provider,
        access_token=integration_data.access_token,
        refresh_token=integration_data.refresh_token,
        config=integration_data.config,
        is_active=True
    )
    db.add(new_integration)
    db.commit()
    db.refresh(new_integration)
    return new_integration

@router.delete("/{provider}")
def disconnect_integration(workspace_id: int, provider: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    is_member = current_user.is_owner or any(w.id == workspace_id for w in current_user.workspaces)
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to configure integrations")
        
    integration = db.query(models.AppIntegration).filter(
        models.AppIntegration.workspace_id == workspace_id,
        models.AppIntegration.provider == provider
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
        
    db.delete(integration)
    db.commit()
    return {"message": f"Successfully disconnected {provider}"}

@router.get("/google/auth-url")
def get_google_auth_url(workspace_id: int, current_user: models.User = Depends(get_current_user)):
    params = {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "redirect_uri": os.getenv("GOOGLE_REDIRECT_URI"),
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/calendar.events",
        "access_type": "offline",
        "prompt": "consent",
        "state": str(workspace_id)
    }
    authorization_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    return {"auth_url": authorization_url}

@public_router.get("/google/callback")
def google_callback(state: str, code: str, request: Request, db: Session = Depends(get_db)):
    try:
        workspace_id = int(state)
        
        # Exchange code for tokens manually to avoid PKCE session issues
        data = urllib.parse.urlencode({
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": os.getenv("GOOGLE_REDIRECT_URI")
        }).encode("utf-8")
        
        req = urllib.request.Request(
            "https://oauth2.googleapis.com/token", 
            data=data,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json"
            }
        )
        with urllib.request.urlopen(req) as response:
            token_data = json.loads(response.read())
            
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        
        # Check if integration already exists
        existing = db.query(models.AppIntegration).filter(
            models.AppIntegration.workspace_id == workspace_id,
            models.AppIntegration.provider == "google_calendar"
        ).first()
        
        if existing:
            existing.access_token = access_token
            if refresh_token:
                existing.refresh_token = refresh_token
            existing.is_active = True
        else:
            new_integration = models.AppIntegration(
                workspace_id=workspace_id,
                provider="google_calendar",
                access_token=access_token,
                refresh_token=refresh_token,
                config={"calendar_name": "primary"},
                is_active=True
            )
            db.add(new_integration)
            
        db.commit()
        
        # Redirect back to frontend
        frontend_url = os.getenv("FRONTEND_URL", "https://main.d2zlo70oepu5a3.amplifyapp.com").split(",")[0]
        return RedirectResponse(url=f"{frontend_url}/integrations")
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        if hasattr(e, 'read'):
            logger.error(f"OAuth HTTP Error: {e.read().decode('utf-8')}")
        else:
            logger.error(f"OAuth Error: {e}")
        frontend_url = os.getenv("FRONTEND_URL", "https://main.d2zlo70oepu5a3.amplifyapp.com").split(",")[0]
        return RedirectResponse(url=f"{frontend_url}/integrations?error=oauth_failed")

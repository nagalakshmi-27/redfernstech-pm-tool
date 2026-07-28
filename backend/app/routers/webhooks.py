from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from .. import models
from .users import get_db
from ..services.github_service import process_github_webhook

router = APIRouter(
    prefix="/webhooks",
    tags=["Webhooks"]
)

@router.post("/github/{workspace_id}")
async def github_webhook(workspace_id: int, request: Request, db: Session = Depends(get_db)):
    """
    Receive webhook events from GitHub for a specific workspace.
    """
    # Verify the workspace actually has a github integration active
    integration = db.query(models.AppIntegration).filter(
        models.AppIntegration.workspace_id == workspace_id,
        models.AppIntegration.provider == "github",
        models.AppIntegration.is_active == True
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="GitHub integration not found or inactive for this workspace")
        
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
        
    # In a production app, we would verify the X-Hub-Signature-256 header here
    
    result = process_github_webhook(workspace_id, payload, db)
    return result

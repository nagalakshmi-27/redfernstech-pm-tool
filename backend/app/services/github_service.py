import re
from sqlalchemy.orm import Session
from .. import models

def process_github_webhook(workspace_id: int, payload: dict, db: Session):
    """
    Process incoming GitHub webhooks for a workspace.
    """
    # Only handle pull_request events for now
    # We assume the webhook is correctly configured in GitHub to send pull_request events
    
    if "pull_request" not in payload:
        return {"status": "ignored", "reason": "Not a pull request event"}
        
    action = payload.get("action")
    pr = payload.get("pull_request", {})
    
    title = pr.get("title", "")
    body = pr.get("body", "")
    head_ref = pr.get("head", {}).get("ref", "") # branch name
    merged = pr.get("merged", False)
    
    # We want to extract a ticket ID like RED-123 from title, body, or branch name
    # We assume project keys are uppercase letters followed by a hyphen and numbers.
    # We can fetch projects for this workspace to get valid keys, but let's just use a general regex.
    # Pattern: [A-Z]+-\d+
    pattern = r'([A-Z]+-\d+)'
    
    match = re.search(pattern, title) or re.search(pattern, head_ref) or (body and re.search(pattern, body))
    
    if not match:
        return {"status": "ignored", "reason": "No ticket ID found in PR"}
        
    ticket_id = match.group(1)
    
    # Find the task
    # We must ensure the task belongs to a project in the given workspace_id
    task = db.query(models.Task).join(models.Project).filter(
        models.Task.ticket_id == ticket_id,
        models.Project.workspace_id == workspace_id
    ).first()
    
    if not task:
        return {"status": "ignored", "reason": f"Task {ticket_id} not found in this workspace"}
        
    # Determine new status based on action
    # We map typical PR actions to Kanban columns: "To Do", "In Progress", "Completed"
    new_status = None
    
    if action in ["opened", "reopened"]:
        new_status = "In Progress"
    elif action == "closed":
        if merged:
            new_status = "Completed"
        else:
            # PR closed without merging, maybe leave it In Progress or To Do. Let's leave it alone for now.
            pass
            
    if new_status and task.status != new_status:
        old_status = task.status
        task.status = new_status
        db.commit()
        
        # We could also add a comment to the task if we want, but keeping it simple for V1
        return {
            "status": "success", 
            "message": f"Updated {ticket_id} status from {old_status} to {new_status}"
        }
        
    return {"status": "ignored", "reason": "No status change needed"}

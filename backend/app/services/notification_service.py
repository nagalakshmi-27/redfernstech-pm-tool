import logging
from sqlalchemy.orm import Session
from .. import models

logger = logging.getLogger("notification_service")
logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(message)s')
ch.setFormatter(formatter)
if not logger.handlers:
    logger.addHandler(ch)

def _get_active_chat_integrations(workspace_id: int, db: Session):
    return db.query(models.AppIntegration).filter(
        models.AppIntegration.workspace_id == workspace_id,
        models.AppIntegration.provider.in_(["slack", "msteams"]),
        models.AppIntegration.is_active == True
    ).all()

def _simulate_dispatch(provider: str, target: str, payload_type: str, message: str):
    platform = "Slack" if provider == "slack" else "Microsoft Teams"
    
    logger.info(f"\n{'='*10} SIMULATED {platform.upper()} WEBHOOK {'='*10}")
    logger.info(f"Target Channel: {target}")
    logger.info(f"Payload Type: {payload_type}")
    logger.info(f"Message: {message}")
    logger.info(f"{'='*40}\n")

def notify_task_created(task: models.Task, workspace_id: int, db: Session):
    integrations = _get_active_chat_integrations(workspace_id, db)
    if not integrations:
        return
        
    for integration in integrations:
        channel = integration.config.get("default_channel", "#general")
        message = f"New Task Created: [{task.ticket_id or 'TASK'}] {task.name}"
        
        # Simulate sending a Block Kit / Adaptive Card payload
        _simulate_dispatch(
            provider=integration.provider,
            target=channel,
            payload_type="Task Created Card",
            message=message
        )

def notify_task_update(task: models.Task, old_status: str, workspace_id: int, db: Session):
    if task.status == old_status:
        return # Only notify on status change for now to avoid spam
        
    integrations = _get_active_chat_integrations(workspace_id, db)
    if not integrations:
        return
        
    for integration in integrations:
        channel = integration.config.get("default_channel", "#general")
        message = f"Task Status Updated: [{task.ticket_id or 'TASK'}] {task.name} moved from '{old_status}' to '{task.status}'"
        
        _simulate_dispatch(
            provider=integration.provider,
            target=channel,
            payload_type="Task Status Update Card",
            message=message
        )

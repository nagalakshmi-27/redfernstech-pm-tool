import os
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models

def migrate_workspaces():
    db = SessionLocal()
    try:
        users = db.query(models.User).all()
        created_count = 0
        for user in users:
            # Check if user owns any workspace
            owns_workspace = db.query(models.Workspace).filter(models.Workspace.owner_id == user.id).first()
            if not owns_workspace:
                print(f"Creating workspace for user {user.email}")
                ws_name = f"{user.first_name}'s Workspace" if user.first_name else f"{user.email.split('@')[0]}'s Workspace"
                new_workspace = models.Workspace(
                    name=ws_name,
                    owner_id=user.id
                )
                db.add(new_workspace)
                db.flush() # To get the new_workspace.id
                
                # Add user to workspace_members as Admin
                stmt = models.workspace_members.insert().values(
                    workspace_id=new_workspace.id,
                    user_id=user.id,
                    role="Admin"
                )
                db.execute(stmt)
                
                # Assign existing projects of this user to this workspace
                projects = db.query(models.Project).filter(models.Project.created_by_id == user.id).all()
                for project in projects:
                    project.workspace_id = new_workspace.id
                    
                created_count += 1
                
        db.commit()
        print(f"Migration complete. Created workspaces for {created_count} existing users.")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_workspaces()

import sys
from pathlib import Path
from sqlalchemy import text

# Add app directory to Python path
sys.path.append(str(Path(__file__).resolve().parent))

from app.database import SessionLocal
from app import models, crud

def migrate_data():
    db = SessionLocal()
    try:
        # Step 1: Temporarily clear all ticket IDs to prevent UniqueConstraint violations 
        # while we reshuffle and rename the tickets.
        print("Clearing old ticket IDs to avoid collisions...")
        db.execute(text("UPDATE tasks SET ticket_id = NULL"))
        
        # Step 2: Clear old project keys so we generate fresh, globally unique ones
        db.execute(text("UPDATE projects SET project_key = NULL"))
        db.commit()

        print("Generating globally unique project keys...")
        assigned_keys = set()
        projects = db.query(models.Project).all()
        
        for project in projects:
            # Generate a new, globally unique key for the project manually in-memory
            base_key = "".join([c for c in project.name if c.isalnum()]).upper()[:3]
            if len(base_key) < 3:
                base_key = (base_key + "XXX")[:3]
                
            key = base_key
            counter = 1
            while key in assigned_keys:
                key = f"{base_key}{counter}"
                counter += 1
                
            project.project_key = key
            assigned_keys.add(key)
            print(f"Assigned key {project.project_key} to project: {project.name}")
            
            project.task_counter = 0

            # Step 3: Re-number existing tasks sequentially
            tasks = db.query(models.Task).filter(models.Task.project_id == project.id).order_by(models.Task.id).all()
            for task in tasks:
                project.task_counter += 1
                task.ticket_id = f"{project.project_key}-{project.task_counter}"
                print(f"  -> Task {task.id} renamed to {task.ticket_id}")
            
            db.add(project)

        db.commit()
        print("Successfully migrated all projects and tasks!")
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_data()

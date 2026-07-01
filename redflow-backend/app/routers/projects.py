from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, database, models
from .users import get_current_user, get_db # <--- FIXED: We now import get_db from users.py!
import csv
import openpyxl
import io

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/", response_model=List[schemas.ProjectResponse])
def read_projects(workspace_id: int = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_user_projects(db=db, user_id=current_user.id, workspace_id=workspace_id)

@router.post("/", response_model=schemas.ProjectResponse)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_project(db=db, project=project, user_id=current_user.id)

@router.post("/import-excel", response_model=List[schemas.ProjectResponse])
async def import_project_from_excel(
    workspace_id: int = Form(...),
    file: UploadFile = File(...),
    project_name: str = Form(None),
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if not file.filename.endswith(('.xlsx', '.csv')):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .xlsx or .csv file.")
        
    try:
        contents = await file.read()
        rows = []
        
        if file.filename.endswith('.csv'):
            decoded = contents.decode('utf-8')
            reader = csv.reader(io.StringIO(decoded))
            rows = list(reader)
        else:
            wb = openpyxl.load_workbook(filename=io.BytesIO(contents), data_only=True)
            sheet = wb.active
            for row in sheet.iter_rows(values_only=True):
                rows.append(list(row))
                
        if not rows or len(rows) < 2:
            raise HTTPException(status_code=400, detail="File is empty or missing headers.")
            
        headers = [str(h).lower().strip() if h else "" for h in rows[0]]
        
        task_name_idx = next((i for i, h in enumerate(headers) if h in ['task name', 'title', 'name']), None)
        if task_name_idx is None:
            raise HTTPException(status_code=400, detail="Could not find a 'Task Name' column.")
            
        desc_idx = next((i for i, h in enumerate(headers) if h in ['description', 'desc']), None)
        status_idx = next((i for i, h in enumerate(headers) if h == 'status'), None)
        priority_idx = next((i for i, h in enumerate(headers) if h == 'priority'), None)
        assignee_idx = next((i for i, h in enumerate(headers) if h in ['assignee email', 'assignee', 'email']), None)
        project_idx = next((i for i, h in enumerate(headers) if h in ['project', 'project name']), None)
        
        created_projects = {}
        fallback_project_name = project_name or file.filename.rsplit('.', 1)[0]
        
        for row in rows[1:]:
            proj_name = str(row[project_idx]).strip() if project_idx is not None and len(row) > project_idx and row[project_idx] else ""
            if not proj_name or proj_name.lower() in ["none", "nan"]:
                proj_name = fallback_project_name
                
            if proj_name not in created_projects:
                project_create = schemas.ProjectCreate(name=proj_name, workspace_id=workspace_id)
                created_projects[proj_name] = crud.create_project(db=db, project=project_create, user_id=current_user.id)
                
            project = created_projects[proj_name]
            title = str(row[task_name_idx]).strip() if task_name_idx is not None and len(row) > task_name_idx and row[task_name_idx] else "Untitled Task"
            if not title or title.lower() == "none" or title.lower() == "nan":
                continue
                
            description = str(row[desc_idx]).strip() if desc_idx is not None and len(row) > desc_idx and row[desc_idx] else ""
            if description.lower() == "none": description = ""
            
            status = str(row[status_idx]).strip() if status_idx is not None and len(row) > status_idx and row[status_idx] else "To Do"
            if status.lower() == "none": status = "To Do"
            
            priority = str(row[priority_idx]).strip() if priority_idx is not None and len(row) > priority_idx and row[priority_idx] else "Medium"
            if priority.lower() == "none": priority = "Medium"
            
            assignee_email = str(row[assignee_idx]).strip() if assignee_idx is not None and len(row) > assignee_idx and row[assignee_idx] else None
            if assignee_email and assignee_email.lower() == "none": assignee_email = None
            
            assignee_id = current_user.id
            if assignee_email:
                assignee_user = db.query(models.User).filter(models.User.email == assignee_email).first()
                if assignee_user:
                    assignee_id = assignee_user.id
                    if assignee_user not in project.members:
                        project.members.append(assignee_user)
            
            new_task = models.Task(
                name=title,
                description=description,
                status=status,
                priority=priority,
                project_id=project.id,
                assignee_id=assignee_id
            )
            db.add(new_task)
            
        db.commit()
        for p in created_projects.values():
            db.refresh(p)
        return list(created_projects.values())
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(project_id: int, project: schemas.ProjectUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    updated_project = crud.update_project(db=db, project_id=project_id, project_update=project, user_id=current_user.id)
    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated_project

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.delete_project(db=db, project_id=project_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=403, detail="Forbidden")
    return {"message": "Project deleted successfully"}
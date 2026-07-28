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
        assignee_idx = next((i for i, h in enumerate(headers) if h in ['assignee email', 'assignee', 'email', 'assignee name']), None)
        project_idx = next((i for i, h in enumerate(headers) if h in ['project', 'project name']), None)
        due_date_idx = next((i for i, h in enumerate(headers) if h in ['due date', 'due', 'deadline', 'end date']), None)
        
        workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
        workspace_members = workspace.members if workspace else []
        
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
            
            default_status = "To Do"
            if project.board_columns and len(project.board_columns) > 0:
                first_col = project.board_columns[0]
                default_status = first_col.get("name", "To Do") if isinstance(first_col, dict) else first_col
            status = str(row[status_idx]).strip() if status_idx is not None and len(row) > status_idx and row[status_idx] else default_status
            if status.lower() == "none": status = default_status
            
            priority = str(row[priority_idx]).strip() if priority_idx is not None and len(row) > priority_idx and row[priority_idx] else "Medium"
            if priority.lower() == "none": priority = "Medium"
            
            assignee_val = str(row[assignee_idx]).strip() if assignee_idx is not None and len(row) > assignee_idx and row[assignee_idx] else None
            if assignee_val and assignee_val.lower() in ["none", "nan", ""]: assignee_val = None
            
            assignee_id = current_user.id
            if assignee_val:
                search_val = assignee_val.lower()
                matched_user = None
                for member in workspace_members:
                    if (member.email and search_val == member.email.lower()) or \
                       (member.full_name and search_val == member.full_name.lower()) or \
                       (member.username and search_val == member.username.lower()):
                        matched_user = member
                        break
                        
                if matched_user:
                    assignee_id = matched_user.id
                    if matched_user not in project.members:
                        project.members.append(matched_user)
                        
            due_date = str(row[due_date_idx]).strip() if due_date_idx is not None and len(row) > due_date_idx and row[due_date_idx] else None
            if due_date and due_date.lower() in ["none", "nan", ""]: 
                due_date = None
            elif due_date and " " in due_date and "-" in due_date:
                due_date = due_date.split(" ")[0]
            
            project.task_counter = (project.task_counter or 0) + 1
            prefix = project.project_key if project.project_key else "".join([c for c in project.name if c.isalnum()]).upper()[:3]
            ticket_id = f"{prefix}-{project.task_counter}"
            
            new_task = models.Task(
                name=title,
                description=description,
                status=status,
                priority=priority,
                project_id=project.id,
                assignee_id=assignee_id,
                due_date=due_date,
                ticket_id=ticket_id,
                created_by_id=current_user.id
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

@router.put("/{project_id}/board-view")
def update_project_board_view(project_id: int, view_update: schemas.ProjectBoardViewUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    prefs = current_user.preferences or {}
    if "project_boards" not in prefs:
        prefs["project_boards"] = {}
    
    prefs["project_boards"][str(project_id)] = view_update.board_type
    
    from sqlalchemy.orm.attributes import flag_modified
    current_user.preferences = prefs
    flag_modified(current_user, "preferences")
    
    db.commit()
    return {"message": "Board view preference updated", "board_type": view_update.board_type}
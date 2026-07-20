import os
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models

def update_existing_usernames_dot_to_at():
    db = SessionLocal()
    users = db.query(models.User).all()
    updated_count = 0
    
    print(f"Found {len(users)} users in the database. Updating usernames...")
    
    for user in users:
        # Check if username contains a dot and doesn't contain an @ yet
        if user.username and "." in user.username and "@" not in user.username:
            
            # Replace the first dot with an @
            parts = user.username.split(".", 1)
            new_username = f"{parts[0]}@{parts[1]}"
            
            # Ensure uniqueness
            counter = 1
            temp_username = new_username
            while db.query(models.User).filter(models.User.username == temp_username, models.User.id != user.id).first():
                temp_username = f"{parts[0]}@{parts[1]}{counter}"
                counter += 1
                
            old_username = user.username
            user.username = temp_username
            updated_count += 1
            print(f"Updated: {old_username} -> {temp_username}")
            
    db.commit()
    print(f"Successfully updated {updated_count} usernames!")
    db.close()

if __name__ == "__main__":
    update_existing_usernames_dot_to_at()

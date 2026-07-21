from app.database import SessionLocal
from app import models

def sync_passwords():
    db = SessionLocal()
    try:
        # Group users by email
        users = db.query(models.User).all()
        email_map = {}
        for u in users:
            if u.email not in email_map:
                email_map[u.email] = []
            email_map[u.email].append(u)
            
        for email, email_users in email_map.items():
            if len(email_users) > 1:
                # Take the password of the first user that is an owner, or just the first user
                owner = next((u for u in email_users if u.is_owner), email_users[0])
                master_hash = owner.hashed_password
                
                # Sync to all others
                for u in email_users:
                    if u.hashed_password != master_hash:
                        u.hashed_password = master_hash
                        print(f"Synced password for {u.username}")
        db.commit()
        print("Done syncing passwords.")
    finally:
        db.close()

if __name__ == "__main__":
    sync_passwords()

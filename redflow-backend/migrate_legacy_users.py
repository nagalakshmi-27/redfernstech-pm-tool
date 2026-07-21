import sys
from app.database import SessionLocal
from app import models, crud

def migrate_users(target_email: str):
    db = SessionLocal()
    try:
        # Find the target account by the friend's email
        owner = db.query(models.User).filter(models.User.email == target_email, models.User.is_owner == True).first()
        if not owner:
            print(f"Error: Could not find an organization owner with email '{target_email}'.")
            return
            
        target_account_id = owner.account_id
        target_account = db.query(models.Account).filter(models.Account.id == target_account_id).first()
        
        print(f"Found target organization: '{target_account.name}' (ID: {target_account_id})")
        
        org_name = "".join(e for e in target_account.name if e.isalnum())
        
        # Find all legacy users (account_id is None)
        legacy_users = db.query(models.User).filter(models.User.account_id == None).all()
        
        if not legacy_users:
            print("No legacy users found to migrate.")
            return
            
        print(f"Found {len(legacy_users)} legacy users. Migrating...")
        
        for user in legacy_users:
            email_prefix = user.email.split("@")[0]
            base_username = f"{email_prefix}@{org_name}"
            username = base_username
            
            # Ensure unique username
            counter = 1
            while crud.get_user_by_username(db, username):
                if crud.get_user_by_username(db, username).id == user.id:
                    break # Already this user
                username = f"{base_username}{counter}"
                counter += 1
                
            user.username = username
            user.account_id = target_account_id
            user.is_owner = False
            
            print(f"Migrated {user.email} -> New Username: {user.username}")
            
        db.commit()
        print("Migration complete!")
        
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python migrate_legacy_users.py <teammate_email>")
        print("Example: python migrate_legacy_users.py admin@example.com")
        sys.exit(1)
        
    migrate_users(sys.argv[1])

from app.database import SessionLocal
from app import models

def fix_production_accounts():
    db = SessionLocal()
    try:
        # 1. Fix missing usernames for old accounts
        from app import crud
        users_without_usernames = db.query(models.User).filter(models.User.username == None).all()
        for user in users_without_usernames:
            email_prefix = user.email.split("@")[0]
            base_username = f"{email_prefix}_admin"
            username = base_username
            
            counter = 1
            while crud.get_user_by_username(db, username):
                username = f"{base_username}{counter}"
                counter += 1
                
            user.username = username
            print(f"Fixed missing username for: {user.email} -> {user.username}")
            
        # 2. Sync all passwords so Organization Selection works
        users = db.query(models.User).all()
        email_map = {}
        for u in users:
            if u.email not in email_map:
                email_map[u.email] = []
            email_map[u.email].append(u)
            
        for email, account_list in email_map.items():
            if len(account_list) > 1:
                # Find the most recently updated password (or the owner's password)
                owner_account = next((a for a in account_list if a.is_owner), account_list[0])
                master_hash = owner_account.hashed_password
                
                for account in account_list:
                    account.hashed_password = master_hash
                print(f"Synchronized {len(account_list)} accounts for {email}")
                
        db.commit()
        print("Production database fully patched and ready!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_production_accounts()

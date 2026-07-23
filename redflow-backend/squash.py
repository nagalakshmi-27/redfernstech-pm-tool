import os
import glob
import sys

# Ensure we can import the app module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine, Base
import app.models

print("1. Wiping database tables...")
Base.metadata.drop_all(bind=engine)

with engine.begin() as conn:
    conn.execute(text("DROP TABLE IF EXISTS alembic_version"))

print("2. Deleting old, messy migration history...")
versions_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "alembic", "versions")
version_files = glob.glob(os.path.join(versions_dir, "*.py"))

for f in version_files:
    os.remove(f)

print("✅ System successfully wiped and prepped for Production Launch!")
print("👉 NEXT STEP: Run this to create one clean master migration:")
print('   alembic revision --autogenerate -m "Production Launch Phase 1"')
print("👉 FINAL STEP: Apply it to the database:")
print("   alembic upgrade head")

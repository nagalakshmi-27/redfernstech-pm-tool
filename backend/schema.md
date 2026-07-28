Tables

users:
Core table for all authentication and user profiles.
id (Integer, Primary Key)
email (String, Unique)
full_name (String, Nullable)
hashed_password (String)
role (String) - e.g., "Admin", "User"
department (String, Nullable)
created_at (DateTime)

projects:
Workspaces created by users.
id (Integer, Primary Key)
name (String)
description (String, Nullable)
start_date (String, Nullable)
end_date (String, Nullable)
status (String) - Default: "Planning"
created_by_id (Integer, Foreign Key -> users.id)

tasks:
Individual work items belonging to a specific project.
id (Integer, Primary Key)
name (String)
description (String, Nullable)
status (String) - Default: "To Do"
priority (String) - Default: "Medium"
due_date (String, Nullable)
created_at (DateTime)
project_id (Integer, Foreign Key -> projects.id)
assignee_id (Integer, Nullable, Foreign Key -> users.id)

events:
Global or personal manual calendar events.
id (Integer, Primary Key)
title (String)
description (String, Nullable)
date (String)
type (String) - Default: "Meeting"
status (String) - Default: "Upcoming"
created_by_id (Integer, Foreign Key -> users.id)

notifications:
Automated system alerts generated when tasks change status.
id (Integer, Primary Key)
message (String)
is_read (Boolean) - Default: False
created_at (DateTime)
user_id (Integer, Foreign Key -> users.id)

teams:
Groups of users for organizational purposes.
id (Integer, Primary Key)
name (String)
created_at (DateTime)

invitations:
Pending invites sent to unregistered teammates.
id (Integer, Primary Key)
email (String)
token (String, Unique)
status (String) - Default: "Pending"
invited_by_id (Integer, Foreign Key -> users.id)
created_at (DateTime)


Association Tables (Many-to-Many)
These tables map relationships without having their own primary keys.

project_members:
Maps users to the projects they are collaborating on.
user_id (Foreign Key -> users.id)
project_id (Foreign Key -> projects.id)

team_members:
Maps users to their respective teams.
user_id (Foreign Key -> users.id)
team_id (Foreign Key -> teams.id)
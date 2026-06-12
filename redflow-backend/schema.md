Tables & Relationships:

Users:
id (Primary Key, Integer)
email (String, Unique)
hashed_password (String)
role (String) - admin, pm, team_mate, client
created_at (DateTime)
Relationships: Has many Projects (as creator), has many Tasks (as assignee), belongs to many Teams.

Teams:
id (Primary Key, Integer)
name (String)
created_at (DateTime)
Relationships: Has many Users (Many-to-Many).

Projects:
id (Primary Key, Integer)
name (String)
description (String)
start_date (DateTime)
end_date (DateTime)
created_by_id (Foreign Key -> Users.id)
Relationships: Has many Tasks.

Tasks:
id (Primary Key, Integer)
title (String)
description (String)
status (String) - To Do, In Progress, Completed
priority (String) - Low, Medium, High
due_date (DateTime)
project_id (Foreign Key -> Projects.id)
assignee_id (Foreign Key -> Users.id)
created_at (DateTime)

Notifications:
id (Primary Key, Integer)
user_id (Foreign Key -> Users.id)
message (String)
is_read (Boolean)
created_at (DateTime)

TeamMembers (Association Table for Many-to-Many):
user_id (Foreign Key -> Users.id)
team_id (Foreign Key -> Teams.id)

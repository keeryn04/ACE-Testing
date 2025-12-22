from datetime import datetime, timedelta
import uuid
import bcrypt
from database import get_db_connection
from helpers.user_helpers import hash_password

MAX_MEMBERS = 5

def register_new_user(name, email, password, ucid):
    db = get_db_connection()

    #Check if user exists
    response = db.table("user").select("email, ucid").or_(f"ucid.eq.{ucid},email.eq.{email}").limit(1).execute()
    if response.data:
        return False, "user_exists", None
    
    password_hash = hash_password(password)

    #Insert new user
    new_user_id = str(uuid.uuid4())
    response = db.table("user").insert({
        "user_id": new_user_id,
        "name": name,
        "email": email,
        "password": password_hash,
        "ucid": ucid,
        "is_prof": False
    }).execute()

    if response.data:
        return True, None, new_user_id
    return False, "insert_failed", None

def get_all_users():
    db = get_db_connection()
    response = db.table("user").select("*").execute()
    return response.data or []

def get_user_by_id(user_id):
    db = get_db_connection()
    response = db.table("user").select("*").eq("user_id", user_id).limit(1).execute()
    return response.data[0] if response.data else None

def get_user_by_email(email):
    db = get_db_connection()
    response = db.table("user").select("*").eq("email", email).limit(1).execute()
    return response.data[0] if response.data else None

def hash_password(plain_password: str) -> str:
    hashed = bcrypt.hashpw(plain_password.encode('utf-8'), bcrypt.gensalt())
    return hashed.decode('utf-8')

def check_user_password(plain_password: str, user: dict) -> bool:
    hashed = user.get("password")
    if not hashed:
        return False
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed.encode('utf-8'))

def get_team_session(team_id):
    db = get_db_connection()
    response = db.table("team_sessions").select("*").eq("team_id", team_id).limit(1).execute()
    return response.data[0] if response.data else None

def get_teams():
    db = get_db_connection()
    response = db.table("team").select("*").execute()
    return response.data or []

def get_teams_with_members():
    db = get_db_connection()
    teams_response = db.table("team").select("team_id, name, created_at").execute()
    teams = teams_response.data or []

    for team in teams:
        members_response = db.table("user").select("user_id, name").eq("team_id", team["team_id"]).execute()
        team["members"] = members_response.data or []

    return teams

def get_team(team_id):
    db = get_db_connection()
    response = db.table("team").select("*").eq("team_id", team_id).limit(1).execute()
    return response.data[0] if response.data else None

def add_user_to_team(user_id, team_id, team_password):
    db = get_db_connection()

    # Check if user is already in a team
    user_resp = db.table("user").select("team_id").eq("user_id", user_id).limit(1).execute()
    if user_resp.data and user_resp.data[0].get("team_id"):
        return False, "User already in a team"

    # Check if team is full
    count_resp = db.table("user").select("user_id", count="exact").eq("team_id", team_id).execute()
    if count_resp.count >= MAX_MEMBERS:
        return False, "Team is full"
    
    team_resp = db.table("team").select("team_password").eq("team_id", team_id).limit(1).execute()
    if not team_resp.data:
        return False, "Team not found"
    stored_password = team_resp.data[0]["team_password"]

    if team_password != stored_password:
        return False, "Incorrect team password"

    # Assign user to team
    response = db.table("user").update({"team_id": team_id}).eq("user_id", user_id).execute()
    if response.data:
        return True, None
    return False, "update_failed"

def upsert_team_session(team_id, user_id, jwt_token, login_time):
    db = get_db_connection()
    existing_session = get_team_session(team_id)

    if existing_session:
        db.table("team_sessions").update({
            "current_user_id": user_id,
            "jwt_token": jwt_token,
            "login_time": login_time
        }).eq("team_id", team_id).execute()
    else:
        db.table("team_sessions").insert({
            "team_id": team_id,
            "current_user_id": user_id,
            "jwt_token": jwt_token,
            "login_time": login_time
        }).execute()

def delete_team_session(team_id):
    db = get_db_connection()
    db.table("team_sessions").delete().eq("team_id", team_id).execute()


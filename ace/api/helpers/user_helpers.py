from datetime import datetime, timedelta
import uuid
from database import get_db_connection

MAX_MEMBERS = 4

def register_new_user(name, email, password, ucid):
    db = get_db_connection()

    # Check if user exists
    response = db.table("users").select("email, ucid").or_(f"ucid.eq.{ucid},email.eq.{email}").limit(1).execute()
    if response.data:
        return False, "user_exists", None

    # Insert new user
    new_user_id = str(uuid.uuid4())
    response = db.table("users").insert({
        "user_id": new_user_id,
        "name": name,
        "email": email,
        "password": password,  # hashed if you want
        "ucid": ucid,
        "is_prof": False
    }).execute()

    if response.data:
        return True, None, new_user_id
    return False, "insert_failed", None


def get_all_users():
    db = get_db_connection()
    response = db.table("users").select("*").execute()
    return response.data or []


def get_user_by_id(user_id):
    db = get_db_connection()
    response = db.table("users").select("*").eq("user_id", user_id).limit(1).execute()
    return response.data[0] if response.data else None


def get_user_by_email(email):
    db = get_db_connection()
    response = db.table("users").select("*").eq("email", email).limit(1).execute()
    return response.data[0] if response.data else None


def check_user_password(password, user):
    if not user:
        return False
    return user.get("password") == password


def get_team_session(team_id):
    db = get_db_connection()
    response = db.table("team_sessions").select("*").eq("team_id", team_id).limit(1).execute()
    return response.data[0] if response.data else None


def get_teams():
    db = get_db_connection()
    response = db.table("teams").select("*").execute()
    return response.data or []


def get_teams_with_members():
    db = get_db_connection()
    teams_response = db.table("teams").select("team_id, name, created_at").execute()
    teams = teams_response.data or []

    for team in teams:
        members_response = db.table("users").select("user_id, name").eq("team_id", team["team_id"]).execute()
        team["members"] = members_response.data or []

    return teams


def get_team(team_id):
    db = get_db_connection()
    response = db.table("teams").select("*").eq("team_id", team_id).limit(1).execute()
    return response.data[0] if response.data else None


def add_user_to_team(user_id, team_id):
    db = get_db_connection()

    # Check if user is already in a team
    user_resp = db.table("users").select("team_id").eq("user_id", user_id).limit(1).execute()
    if user_resp.data and user_resp.data[0].get("team_id"):
        return False, "User already in a team"

    # Check if team is full
    count_resp = db.table("users").select("user_id", count="exact").eq("team_id", team_id).execute()
    if count_resp.count >= MAX_MEMBERS:
        return False, "Team is full"

    # Assign user to team
    response = db.table("users").update({"team_id": team_id}).eq("user_id", user_id).execute()
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


def cleanup_expired_sessions():
    db = get_db_connection()
    expire_time = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    db.table("team_sessions").delete().lt("login_time", expire_time).execute()
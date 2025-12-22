import os
from dotenv import load_dotenv
from datetime import datetime, time, timedelta
from flask import Blueprint, request, jsonify
import jwt
from helpers.user_helpers import add_user_to_team, check_user_password, get_team, get_team_session, get_teams, get_teams_with_members, get_user_by_email, get_user_by_id, register_new_user, get_all_users, upsert_team_session

load_dotenv()
SECRET = os.getenv("JWT_ACCESS_KEY")

user_bp = Blueprint("user", __name__)

# ------------------------------------------------------------
# POST /api/register_user
# ------------------------------------------------------------
@user_bp.post("/api/register_user")
def register_user():
    data = request.get_json() or {}

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    ucid = data.get("ucid")

    if not all([name, email, password, ucid]):
        return jsonify({"success": False, "error": "missing_fields"}), 400

    try:
        success, error, user_id = register_new_user(name, email, password, ucid)
        if not success:
            if error == "user_exists":
                return jsonify({"success": False, "error": error}), 409
            return jsonify({"success": False, "error": error}), 500

        user = get_user_by_id(user_id)
        team_id = user.get("team_id")
        now = datetime.utcnow()
        exp_time = int((now + timedelta(hours=1)).timestamp())
        login_time = now.isoformat()

        if team_id:
            #user on team, track 1-hour session
            session = get_team_session(team_id)
            if session and now - session["login_time"] < timedelta(hours=1):
                return jsonify({"error": "Another team member is logged in"}), 403

            token = jwt.encode({
                "current_user": user_id,
                "team_id": team_id,
                "exp": exp_time
            }, SECRET)

            upsert_team_session(team_id, user_id, token, login_time)

            return jsonify({"token": token, "requires_team": False}), 201

        else:
            #user not in a team yet
            token = jwt.encode({
                "current_user": user_id,
                "team_id": None,
                "exp": exp_time
            }, SECRET)

            return jsonify({"token": token, "requires_team": True}), 201

    except Exception as e:
        print("Registration error:", e)
        return jsonify({"error": "Unexpected server error"}), 500

# ------------------------------------------------------------
# POST /api/login
# ------------------------------------------------------------
@user_bp.post("/api/login")
def login():
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")

        if not email:
                return jsonify({"error": "Email is required"}), 400

        if not password:
            return jsonify({"error": "Password is required"}), 400

        #User lookup
        user = get_user_by_email(email)
        if not user:
            return jsonify({"error": "User not found"}), 404

        #Password check
        if not check_user_password(password, user):
            return jsonify({"error": "Incorrect password"}), 403
        
        team_id = user.get("team_id")
        now = datetime.utcnow()
        exp_time = int((now + timedelta(hours=1)).timestamp())
        login_time = now.isoformat()
        can_send_messages = True
        
        if team_id:
            #User on team
            session = get_team_session(team_id)

            #Issue token either way
            token = jwt.encode({
                "current_user": user.get("user_id"),
                "team_id": team_id,
                "exp": exp_time
            }, SECRET)

            if session:
                session_login_time = session["login_time"]

                if now - session_login_time < timedelta(hours=1):
                    #Session is still valid
                    if session["current_user_id"] != user.get("user_id"):
                        can_send_messages = False  #Someone else owns it
                    #If it's the same user, can_send_messages stays True
                else:
                    #Session expired -> allow login to create a new session
                    upsert_team_session(team_id, user.get("user_id"), token, login_time)
            else:
                #No session exists -> create one
                upsert_team_session(team_id, user.get("user_id"), token, login_time)

            return jsonify({
                "token": token,
                "requires_team": False,
                "can_send_messages": can_send_messages
            })

        else:
            #user not in team, allow login but no functionality
            token = jwt.encode({
                "current_user": user.get("user_id"),
                "team_id": None,
                "exp": exp_time
            }, SECRET)

            return jsonify({
                "token": token,
                "requires_team": True,
                "can_send_messages": False
            }), 200

    except Exception as e:
        print("Login error:", e)
        return jsonify({"error": "Unexpected server error"}), 500

# ------------------------------------------------------------
# GET /api/get_users
# ------------------------------------------------------------
@user_bp.get("/api/get_users")
def get_users():
    try:
        users = get_all_users()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch users: {e}"}), 500
    
@user_bp.get("/api/team/<user_id>")
def get_user_team(user_id):
    try:
        user = get_user_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        team = None
        if user['team_id']:
            team = get_team(user['team_id'])

        return jsonify({"team": team}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch user team: {e}"}), 500
    
@user_bp.get("/api/teams")
def get_all_team():
    try:
        teams = get_teams_with_members()
        return jsonify({"teams": teams}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch teams: {e}"}), 500
    
@user_bp.post("/api/join_team/<team_id>")
def join_team(team_id):
    try:
        #decode token to get current user
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing token"}), 401

        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        current_user_id = payload.get("current_user")

        if not current_user_id:
            return jsonify({"error": "Invalid token"}), 401

        #assign user to team
        success, error = add_user_to_team(current_user_id, team_id)
        if not success:
            return jsonify({"error": error}), 403

        return jsonify({"success": True, "team_id": team_id}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to join team: {e}"}), 500
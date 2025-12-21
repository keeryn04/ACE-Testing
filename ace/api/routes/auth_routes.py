import os
from flask import Blueprint, request, jsonify
import jwt

SECRET = os.getenv("JWT_ACCESS_KEY")

auth_bp = Blueprint("auth", __name__)

@auth_bp.get("/api/decode_token")
def decode_token():
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "No token provided"}), 400

    #remove 'Bearer ' if present
    if token.startswith("Bearer "):
        token = token[len("Bearer "):]

    try:
        decoded = jwt.decode(token, SECRET, algorithms=["HS256"])
        #decoded will have current_user, team_id, exp.
        return jsonify({"current_user": decoded.get("current_user"),
                        "team_id": decoded.get("team_id"),
                        "exp": decoded.get("exp")})
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

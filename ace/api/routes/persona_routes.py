from flask import Blueprint, jsonify
from helpers.persona_helpers import get_all_personas

personas_bp = Blueprint("personas", __name__)

@personas_bp.get("/api/personas")
def list_personas():
    try:
        personas = get_all_personas()
        return jsonify(personas), 200
    except Exception as e:
        return jsonify({"error": "Failed to load personas", "detail": str(e)}), 500
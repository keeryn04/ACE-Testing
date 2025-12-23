from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from helpers.user_helpers import get_team_session
from helpers.persona_helpers import get_persona_by_name, get_requirement_doc
from helpers.db_helpers import get_past_messages, insert_message
from helpers.chat_helpers import build_chat_messages, call_openai_chat

messages_bp = Blueprint("messages", __name__)

# ------------------------------------------------------------
# GET /api/past_messages
# ------------------------------------------------------------
@messages_bp.get("/api/past_messages")
def past_messages():
    team_id = request.args.get("team_id")
    persona_name = request.args.get("persona_name")

    if not persona_name:
        return jsonify({"error": "Missing persona name"}), 400

    #Fetch persona
    persona = get_persona_by_name(persona_name)
    persona_id = persona["persona_id"] if persona else None

    #Fetch past messages
    messages = get_past_messages(team_id, persona_id)

    return jsonify(messages), 200


# ------------------------------------------------------------
# POST /api/send_message
# ------------------------------------------------------------
@messages_bp.post("/api/send_message")
def send_message():
    data = request.get_json() or {}
    team_id = data.get("team_id")
    persona_name = data.get("persona_name")
    user_message = data.get("user_message")
    current_user_id = data.get("user_id")

    if not persona_name:
        return jsonify({"error": "Missing persona_name"}), 400
    if not user_message:
        return jsonify({"error": "Missing user_message"}), 400
    if not team_id:
        return jsonify({"error": "You must join a team before chatting."}), 403

    session = get_team_session(team_id)
    now = datetime.utcnow()
    if session and session["current_user_id"] != current_user_id and now - session["login_time"] < timedelta(hours=1):
        return jsonify({"error": "Another team member currently controls the session."}), 403

    try:
        #Fetch persona and requirement doc
        persona = get_persona_by_name(persona_name)
        if not persona:
            return jsonify({"error": "Persona not found"}), 404

        persona_id = persona["persona_id"]
        requirement_doc = get_requirement_doc(persona["requirement_id"])

        #Fetch chat history
        history = get_past_messages(team_id, persona_id)

        #Get OpenAI messages and AI response
        messages = build_chat_messages(
            persona_id=persona_id,
            persona_description=persona["persona_description"],
            requirement_doc=requirement_doc,
            history=history,
            user_message=user_message
        )
        ai_text = call_openai_chat(messages)

        #Save user, AI messages
        insert_message(team_id, persona_id=persona_id, sender_type="user", content=user_message)
        insert_message(team_id, persona_id=persona_id, sender_type="ai", content=ai_text)

        return jsonify({"success": True, "message": ai_text}), 200

    except Exception as e:
        return jsonify({"error": "Internal error", "detail": str(e)}), 500
from flask import Blueprint, request, jsonify
from database import Supabase_singleton
from openai_client import query_openai

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    team_id = data.get("team_id")
    persona_id = data.get("persona_id")
    message = data.get("message")

    db = Supabase_singleton().client

    # Fetch persona description
    persona = db.table("ai_personas").select("persona_description").eq("persona_id", persona_id).execute().data[0]

    # Fetch requirements
    req = db.table("requirement_docs").select("requirement_path").limit(1).execute().data[0]

    # Query OpenAI
    ai_response = query_openai(persona["persona_description"], req["requirement_path"], message)

    # Save user + AI messages to DB
    db.table("messages").insert({
        "team_id": team_id,
        "sender_type": "User",
        "content": message,
        "persona_id": persona_id
    }).execute()

    db.table("messages").insert({
        "team_id": team_id,
        "sender_type": "AI",
        "content": ai_response,
        "persona_id": persona_id
    }).execute()

    return jsonify({"response": ai_response})

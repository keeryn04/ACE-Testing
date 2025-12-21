from flask import Blueprint, jsonify, send_file
from tempfile import NamedTemporaryFile
from pdf_export import export_conversation_to_pdf
from helpers.persona_helpers import get_persona_by_name
from helpers.db_helpers import get_past_messages

export_bp = Blueprint("export", __name__)

@export_bp.get("/api/export/conversations/<team_id>/<persona_name>.pdf")
def export_conversation(team_id, persona_name):
    persona = get_persona_by_name(persona_name)
    persona_id = persona["persona_id"] if persona else None

    messages = get_past_messages(team_id, persona_id)
    if not messages:
        return jsonify({"error": "No messages found"}), 400

    tmp = NamedTemporaryFile(suffix=".pdf", delete=False)
    export_conversation_to_pdf(messages, tmp.name, title=f"Conversation {team_id}")
    tmp.close()

    return send_file(
        tmp.name,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"conversation_{team_id}_{persona_name}.pdf"
    )
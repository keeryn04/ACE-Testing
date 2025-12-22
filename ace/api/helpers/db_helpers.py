from database import get_db_connection

def get_past_messages(team_id, persona_id):
    db = get_db_connection()
    response = (
        db.table("messages")
          .select("sender_type, content, timestamp, persona_id")
          .eq("team_id", team_id)
          .eq("persona_id", persona_id)
          .order("timestamp", desc=True)
          .execute()
    )

    rows = response.data or []
    messages = [
        {
            "role": "assistant" if m["sender_type"] == "ai" else "user",
            "content": m["content"],
            "timestamp": m["timestamp"] if m["timestamp"] else None,
        }
        for m in rows
    ]
    return messages


def insert_message(team_id, sender_type, content, persona_id):
    db = get_db_connection()
    response = db.table("messages").insert({
        "team_id": team_id,
        "sender_type": sender_type,
        "content": content,
        "persona_id": persona_id,
    }).execute()
    # Supabase doesn't have lastrowid; return the inserted row if needed
    return response.data[0] if response.data else None


def get_persona_description(persona_id):
    db = get_db_connection()
    response = (
        db.table("ai_personas")
          .select("persona_description")
          .eq("persona_id", persona_id)
          .limit(1)
          .execute()
    )
    row = response.data[0] if response.data else None
    return row["persona_description"] if row else None


def get_requirement_path(team_id):
    db = get_db_connection()
    response = (
        db.table("requirement_doc")
          .select("requirement_doc")
          .eq("requirement_id", team_id)
          .limit(1)
          .execute()
    )
    row = response.data[0] if response.data else None
    if row:
        return row["requirement_doc"]

    # Fallback: get first doc
    fallback_resp = db.table("requirement_doc").select("requirement_doc").limit(1).execute()
    fallback = fallback_resp.data[0] if fallback_resp.data else None
    return fallback["requirement_doc"] if fallback else None


def save_message(team_id, persona_id, sender_type, content):
    db = get_db_connection()
    response = db.table("messages").insert({
        "team_id": team_id,
        "persona_id": persona_id,
        "sender_type": sender_type,
        "content": content,
    }).execute()
    return response.data[0] if response.data else None


def get_message_history(team_id, persona_id):
    db = get_db_connection()
    response = (
        db.table("messages")
          .select("sender_type, content")
          .eq("team_id", team_id)
          .eq("persona_id", persona_id)
          .order("timestamp", ascending=True)
          .execute()
    )
    rows = response.data or []

    history = []
    for msg in rows:
        role = "user" if msg["sender_type"].lower() == "user" else "assistant"
        history.append({"role": role, "content": msg["content"]})

    return history
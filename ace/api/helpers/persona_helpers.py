from database.database import get_db_connection

def get_persona_by_name(persona_name):
    db = get_db_connection()
    response = (
        db.table("ai_personas")
          .select("persona_id, persona_name, role, persona_description, requirement_id")
          .eq("persona_name", persona_name)
          .limit(1)
          .execute()
    )
    row = response.data[0] if response.data else None
    return row


def get_all_personas():
    db = get_db_connection()
    response = db.table("ai_personas").select(
        "persona_id, persona_name, role, persona_description, requirement_id"
    ).execute()
    return response.data or []


def get_requirement_doc(requirement_id):
    db = get_db_connection()
    response = (
        db.table("requirement_doc")
          .select("requirement_doc")
          .eq("requirement_id", requirement_id)
          .limit(1)
          .execute()
    )
    row = response.data[0] if response.data else None
    return row["requirement_doc"] if row else None
import openai

def build_chat_messages(persona_id, persona_description, requirement_doc, history, user_message):
    return [
        {
            "role": "system",
            "content": f"{persona_id}\nPersona Description: {persona_description}, Requirements: {requirement_doc}"
        },
        *history,
        {
            "role": "user",
            "content": user_message
        }
    ]

def call_openai_chat(messages):
    resp = openai.chat.completions.create(
        model="gpt-4o",
        messages=messages
    )
    return resp.choices[0].message.content

def chat_with_ai(persona_description, requirement_path, user_message, persona_id=None, history=None):
    #Ensure history is a list, properly formatted
    if history is None:
        history = []

    system_req = requirement_path
    messages = build_chat_messages(
        persona_id=persona_id or "unknown",
        persona_description=persona_description or "",
        requirement_doc=system_req or "",
        history=history,
        user_message=user_message
    )

    return call_openai_chat(messages)
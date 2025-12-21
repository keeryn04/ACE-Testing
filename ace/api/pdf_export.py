# pdf_export.py
from fpdf import FPDF
from datetime import datetime
import re
import os

FONT_DIR = os.path.join(os.path.dirname(__file__), "fonts")
REGULAR_FONT = os.path.join(FONT_DIR, "NotoSans-Regular.ttf")
BOLD_FONT = os.path.join(FONT_DIR, "NotoSans-SemiBold.ttf")
def strip_markdown(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"[*_~`>#\-]+", "", text)
    text = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", text)
    text = re.sub(r"!\[(.*?)\]\(.*?\)", r"\1", text)
    return text.strip()

def format_timestamp(ts: str):
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        return ts or ""

class ConversationPDF(FPDF):
    def header(self):
        self.set_font("Noto", "B", 14)
        self.cell(0, 10, self.title, ln=True, align="C")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Noto", "", 8)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

def export_conversation_to_pdf(messages, out_path, title="Conversation Export"):
    pdf = ConversationPDF()
    pdf.title = title
    pdf.set_auto_page_break(auto=True, margin=15)

    # Register the Noto fonts with Unicode support
    pdf.add_font("Noto", "", REGULAR_FONT, uni=True)
    pdf.add_font("Noto", "B", BOLD_FONT, uni=True)

    pdf.add_page()
    pdf.set_font("Noto", size=12)

    for m in messages:
        role = m.get("role") or m.get("sender") or "user"
        text = m.get("content") if "content" in m else m.get("message_text", "")
        ts = format_timestamp(m.get("timestamp", ""))
        sender = "User" if role == "user" else "AI"

        # Strip markdown
        plain_text = strip_markdown(text)

        # Sender + time
        pdf.set_font("Noto", "B", 12)
        pdf.cell(0, 8, f"[{ts}] {sender}:", ln=True)

        # Message body (multi-line)
        pdf.set_font("Noto", "", 12)
        pdf.multi_cell(0, 8, plain_text or "")
        pdf.ln(3)

    pdf.output(out_path)
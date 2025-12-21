import os
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
import openai
from routes.persona_routes import personas_bp
from routes.message_routes import messages_bp
from routes.export_routes import export_bp
from routes.user_routes import user_bp
from routes.auth_routes import auth_bp

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)
CORS(app)
app.register_blueprint(personas_bp)
app.register_blueprint(messages_bp)
app.register_blueprint(export_bp)
app.register_blueprint(user_bp)
app.register_blueprint(auth_bp)

if __name__ == "__main__":
    app.run(debug=True, port=8000)

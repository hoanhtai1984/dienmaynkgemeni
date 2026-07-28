import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
PORT = int(os.environ.get("PORT", 8000))
CLIENT_URL = os.environ.get("CLIENT_URL", "http://localhost:5173")
# Must match the Node server's JWT_SECRET exactly - used to verify customer
# tokens sent by ChatWidget so chat messages can be attributed to an account.
JWT_SECRET = os.environ["JWT_SECRET"]

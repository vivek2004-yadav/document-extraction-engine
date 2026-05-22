# Document Processing & Editing App

This is a full-stack web application designed to help manage and edit key details from files. Invoices, resumes, or contracts (in PDF, DOCX, TXT, or image format) can be uploaded, and the application will automatically organize the contents into clean tables.

It includes a **React** frontend styled with clean borders, a **FastAPI** backend, and a local **SQLite** database to keep a history of all uploads and edits.

---

## What this App Does

- **File Parsing:** It reads standard text files, Word docs, and clear PDFs directly.
- **Image Fallback:** If an image (PNG/JPG) or a scanned document is uploaded, the file is sent directly to Gemini's visual API to accurately read the coordinates and tables.
- **Manual Auditing & Editing:** If the system gets a field wrong or leaves it empty, cells in the table can be double-clicked to edit the value manually, saving changes directly to the database.
- **Verification Tags:** Fields are highlighted with simple labels like **Verified**, **Review**, or **Unverified** to indicate what needs manual checking.
- **Local History Log:** Every processed file is saved in a local SQLite file (`backend/extractions.db`), which can be loaded at any time from the sidebar.
- **Exporting Options:** The completed tables can be downloaded as clean **CSV** files or raw **JSON** configurations at the click of a button.

---

## How to Set It Up

Make sure **Python 3.10+** and **Node.js 18+** are installed on the host system.

### 1. Configure the Backend
Navigate to the `backend` folder and create a file named `.env`. Add the API keys there:
```env
# Choose 'gemini' or 'openai'
API_PROVIDER=gemini

# Google Gemini Credentials (Recommended)
GEMINI_API_KEY=actual_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# OpenAI Credentials (Optional)
OPENAI_API_KEY=openai_key_here
OPENAI_MODEL=gpt-4o-mini
```
*(Note: Keys can also be entered directly in the frontend UI under "Configure Connection" if editing the file is not preferred).*

### 2. Launch the Application
An automatic batch script is provided to set up the environment. Simply double-click **`run.bat`** in the main folder, or run it in a terminal:
```powershell
.\run.bat
```
This batch script will automatically:
1. Create a Python virtual environment (`.venv`).
2. Install all required Python packages.
3. Boot up the FastAPI server on `http://localhost:8000`.
4. Boot up the Vite-React development server on `http://localhost:5173`.

---

## Under the Hood: Code Architecture

This details how the project files work together:

1. **`backend/app/schemas.py` (Validation):**
   Defines the exact structures of the documents (Invoice, Resume, and Contract). Every field holds a value, an audit status tag, and a source note explaining where it was found or why it is empty.

2. **`backend/app/parser.py` (File Reading):**
   Handles standard file types using local libraries. If a PDF has no selectable text (scanned page) or is a raw image file, the document is flagged as visual to trigger visual parsing.

3. **`backend/app/extractor.py` (Field Parsing):**
   Formats the prompt and forwards it to the provider. It uses Gemini's native `response_schema` feature to guarantee that the output matches the exact Pydantic types.

4. **`backend/app/database.py` (Local Persistence):**
   Creates a standard SQLite database (`extractions.db`) on startup. It saves the original file name, document type, raw text, structured JSON data, and handles saving manual inline corrections.

5. **`backend/app/main.py` (API Routes):**
   Defines the endpoints for frontend communication:
   - `POST /api/extract` for uploads.
   - `GET /api/extractions` to load sidebar history.
   - `PUT /api/extractions/{id}` to save manual cell corrections.

---

## Technical Features Built-In

- **No Guessed Data:** System instructions strictly forbid the AI from guessing missing values. If a field is missing, it returns a safe `null` value with a note.
- **Decoupled Setup:** Separating the frontend and backend ensures the user interface stays highly responsive even during heavy document analysis.
- **Client-Side API Storage:** Any keys entered in the dashboard are stored securely in the browser's local storage (`localStorage`) and are never saved on the server.

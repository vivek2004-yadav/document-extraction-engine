# 📊 Intelligent Document Extraction Engine (ExEngine)

A state-of-the-art Document Extraction Engine designed to parse unstructured documents (PDFs, plain text, PNG/JPG images) and transform them into clean, structured, and validated JSON data.

Built using a high-performance **FastAPI** backend and a premium, responsive **React + Vite** frontend styled with custom glassmorphic dark UI.

---

## ✨ Features & Architecture

- **Unified LLM Extraction Module**: Native support for **Google Gemini** (via `google-genai` SDK) and **OpenAI** APIs.
- **Multimodal Vision Fallback**: Automatically uploads scanned/image documents directly to LLM Vision APIs to achieve perfect structural accuracy without requiring fragile local Tesseract OCR installations on Windows.
- **Interactive Schema Visualizer**: A beautiful field-by-field editor highlighting confidence flags (`high`, `medium`, `low`) and hallucination prevention notes.
- **Inline Corrections & Persistency**: Allows users to manually overwrite fields directly on-screen and save corrections back to the database.
- **History Drawer**: A sliding side panel listing all past extractions with schema tags and ready/error statuses.
- **Instant Exports**: Modules to download validated dataset payloads as clean **CSV** files or raw **JSON** configurations.

---

## 🛠️ Step-by-Step Installation & Setup

Ensure you have **Python 3.10+** and **Node.js 18+** installed.

### 1. Clone/Open the Project Directory
Navigate to your workspace directory:
```bash
cd c:\Users\enqui\Desktop\Placement
```

### 2. Configure Backend Credentials
Create a `.env` file inside the `backend/` folder (or copy `.env.example`):
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and insert your credentials:
```env
# API Provider: 'gemini' or 'openai'
API_PROVIDER=gemini

# Google Gemini Credentials (Recommended)
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash

# OpenAI Credentials (Optional)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```
> 💡 *Note: You can also configure API keys dynamically in the frontend UI under "Configure LLM Key"!*

### 3. Startup the Services (The Easiest Way)
We have provided a unified Windows batch script. Double-click the `run.bat` file in the root workspace folder, or run it via PowerShell:
```powershell
.\run.bat
```
This script will automatically:
1. Initialize a Python virtual environment (`.venv`).
2. Install all required dependencies (`requirements.txt`).
3. Start the FastAPI API server on `http://localhost:8000`.
4. Start the Vite React development server on `http://localhost:5173`.

---

## 🎯 Target Schema Definitions

The extraction engine strictly validates all parsed documents against typed **Pydantic (v2)** schemas before returning:

### 1. Invoice Schema
- `vendor_name`: Vendor or merchant name
- `invoice_date`: Date issued
- `invoice_number`: Unique invoice identifier
- `line_items`: Array of line items (each with `description`, `quantity`, `unit_price`, `amount`)
- `subtotal`: Net amount billed
- `tax`: Tax applied
- `total`: Grand total billed
- `billing_address`: Billed customer/merchant address

### 2. Resume Schema
- `name`: Candidate's full name
- `email`: Direct email address
- `phone`: Direct contact number
- `linkedin_or_website`: Personal site or LinkedIn profile
- `summary`: Biography or professional statement
- `skills`: List of technical or soft skills
- `experience`: Professional experience list (each with `job_title`, `company`, `period`, `responsibilities`)
- `education`: Academic education list (each with `degree`, `institution`, `graduation_year`)
- `certifications`: Credentials and achievements

### 3. Contract Schema (Bonus!)
- `contract_title`: Official title of agreement
- `parties`: Signatories involved
- `effective_date`: Start date of agreement
- `expiration_date`: End date or conditions
- `governing_law`: Jurisdiction of resolution
- `termination_clause`: Terms of termination
- `key_obligations`: Crucial promises and obligations

---

## 🤖 Prompt Engineering & Structured Outputs

### Output Integrity
We achieve **100% Schema Adherence** by utilizing native structural JSON configurations built into the APIs:
- **Gemini**: We leverage `google-genai`'s native `response_schema` option, sending the Pydantic class structure directly as configuration parameters. Gemini guarantees that the returned output perfectly conforms to the schema.
- **OpenAI**: We utilize the `beta.chat.completions.parse` method with standard Structured Outputs, locking model generation inside a rigorous Pydantic boundary.

### Hallucination Prevention
To prevent models from filling in gaps with guesses, we inject a strict no-hallucination directive in our system prompts:
> *"Accuracy first. If a field is not present or cannot be inferred, set 'value' to null and provide a helpful note in the 'note' field explaining why it is null. Never make up values."*

---

## 🔍 How to Improve Accuracy & Handling Complex Documents

### What Fails with Complex/Scanned Layouts?
1. **Scanned/Handwritten Documents**: Standard OCR text parsers (like PyPDF/pdfplumber) fail to extract text entirely, yielding empty strings.
2. **Dense Multi-column Structures**: Standard text line-readers read left-to-right across columns, mixing paragraphs together and ruining contextual structure.

### ExEngine's Solution
1. **Multimodal API Bypass**: If our local text parser detects less than 50 characters of readable text, it marks the document as "visual". ExEngine then converts the binary PDF page or uploaded image directly into base64/bytes and streams it into the multimodal Vision API (Gemini/GPT-4o).
2. **Layout & Grid Analysis**: Vision LLMs have outstanding layout-grid reasoning capabilities. Instead of relying on raw text extraction, they view the actual document visual placement to determine line items, tables, and signatures perfectly!

### Further Enhancements
- **Retrieval-Augmented Parsing**: For documents exceeding model context sizes, parse pages independently, vectorize tables, and feed specific sub-pages to the LLM.
- **Fine-Tuning**: Fine-tune smaller parameter models on specialized invoice datasets (like FUNSD or Cord) to reduce API consumption overhead while maintaining accuracy.

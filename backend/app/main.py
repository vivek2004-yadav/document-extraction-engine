import os
import shutil
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

from backend.app.database import (
    init_db,
    create_extraction,
    get_all_extractions,
    get_extraction_by_id,
    update_extraction_data
)
from backend.app.parser import extract_content
from backend.app.extractor import extract_structured_data

app = FastAPI(
    title="Document Extraction Engine API",
    description="Extracts structured, validated JSON data from unstructured documents using LLMs.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

class CorrectionRequest(BaseModel):
    extracted_data: Dict[str, Any]

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Document Extraction Engine API",
        "endpoints": {
            "extract": "POST /api/extract",
            "history": "GET /api/extractions",
            "retrieve": "GET /api/extractions/{id}",
            "update": "PUT /api/extractions/{id}"
        }
    }

@app.post("/api/extract")
async def extract_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    api_provider: Optional[str] = Form(None),
    api_key: Optional[str] = Form(None)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".txt", ".png", ".jpg", ".jpeg", ".docx"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Only PDF, TXT, PNG, JPG/JPEG, and DOCX are supported."
        )
    doc_type = document_type.lower()
    if doc_type not in ["invoice", "resume", "contract"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported document type '{document_type}'. Supported types: 'invoice', 'resume', 'contract'."
        )

    temp_dir = tempfile.mkdtemp()
    temp_file_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        with open(temp_file_path, "rb") as f:
            file_bytes = f.read()
            
        file_mime = file.content_type
        raw_text = ""
        is_scanned = True
        try:
            raw_text, is_scanned = extract_content(temp_file_path)
        except Exception as e:
            print(f"Local text extraction failed or skipped: {e}")
        try:
            extracted_json = extract_structured_data(
                doc_type=doc_type,
                raw_text=raw_text,
                file_bytes=file_bytes if is_scanned else None,
                file_mime=file_mime if is_scanned else None,
                api_provider=api_provider,
                api_key=api_key
            )
            
            new_id = create_extraction(
                filename=file.filename,
                document_type=doc_type,
                status="success",
                extracted_data=extracted_json,
                raw_text=raw_text if raw_text else "[Scanned/Image Processing]"
            )
            
            return {
                "id": new_id,
                "filename": file.filename,
                "document_type": doc_type,
                "status": "success",
                "extracted_data": extracted_json,
                "raw_text": raw_text
            }
            
        except Exception as llm_error:
            err_msg = str(llm_error)
            print(f"Extraction execution failed: {err_msg}")
            
            failed_id = create_extraction(
                filename=file.filename,
                document_type=doc_type,
                status="failed",
                error_message=err_msg,
                raw_text=raw_text
            )
            
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "Structured LLM extraction failed.",
                    "error": err_msg,
                    "id": failed_id
                }
            )
            
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.get("/api/extractions")
def list_extractions():
    try:
        return get_all_extractions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database retrieval failed: {e}")

@app.get("/api/extractions/{id}")
def retrieve_extraction(id: int):
    extraction = get_extraction_by_id(id)
    if not extraction:
        raise HTTPException(status_code=404, detail=f"Extraction record with ID {id} not found.")
    return extraction

@app.put("/api/extractions/{id}")
def update_extraction(id: int, request: CorrectionRequest):
    success = update_extraction_data(id, request.extracted_data)
    if not success:
        raise HTTPException(status_code=404, detail=f"Extraction record with ID {id} not found to update.")
    return {"status": "success", "message": "Manual corrections saved successfully."}

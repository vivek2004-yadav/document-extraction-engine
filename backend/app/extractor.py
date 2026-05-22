import os
import json
import base64
from typing import Dict, Any, Optional, Type
from pydantic import BaseModel

from backend.app.schemas import InvoiceSchema, ResumeSchema, ContractSchema

GEMINI_DEFAULT_MODEL = "gemini-2.5-flash"
OPENAI_DEFAULT_MODEL = "gpt-4o-mini"

SCHEMA_MAP: Dict[str, Type[BaseModel]] = {
    "invoice": InvoiceSchema,
    "resume": ResumeSchema,
    "contract": ContractSchema
}

def get_schema_class(doc_type: str) -> Type[BaseModel]:
    schema = SCHEMA_MAP.get(doc_type.lower())
    if not schema:
        raise ValueError(f"Unsupported document type: {doc_type}. Must be 'invoice', 'resume', or 'contract'.")
    return schema

def extract_structured_data(
    doc_type: str,
    raw_text: str,
    file_bytes: Optional[bytes] = None,
    file_mime: Optional[str] = None,
    api_provider: Optional[str] = None,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    provider = (api_provider or os.getenv("API_PROVIDER", "gemini")).lower()
    key = api_key or os.getenv("GEMINI_API_KEY" if provider == "gemini" else "OPENAI_API_KEY")
    
    if not key:
        raise ValueError(f"API Key for provider '{provider}' is missing. Please configure it in your settings.")
        
    schema_class = get_schema_class(doc_type)
    system_instruction = (
        "You are an expert unstructured-to-structured document extraction engine. "
        "Your task is to parse the uploaded document and return a fully populated JSON structure matching the requested schema.\n\n"
        "Strict Extraction Principles:\n"
        "1. Accuracy first: Extract values exactly as they appear in the source.\n"
        "2. No Hallucinations: If a field is not present or cannot be inferred from the document, set 'value' to null. "
        "Provide a helpful note in the 'note' field (e.g. 'Not specified in document'). Never make up values.\n"
        "3. Confidence Scoring: Score each field as:\n"
        "   - 'high': Value is clearly stated, easily read, and matches type exactly.\n"
        "   - 'medium': Value is present but requires minor inference, formatting, or parsing context.\n"
        "   - 'low': Value is highly ambiguous, blurry, poorly OCR'd, or guessed from loose context.\n"
        "4. Strict schema validation: Ensure all nested arrays or fields fit their sub-schemas."
    )

    user_prompt = f"""
    Please analyze the following document content and extract structured fields for an: {doc_type.upper()}.
    
    DOCUMENT CONTENT:
    \"\"\"
    {raw_text or '[Visual Document - Processing via Multi-modal API]'}
    \"\"\"
    
    Analyze structural details, tables, dates, names, and key metrics. Return the extracted data in strict JSON conforming to the requested schema.
    """

    if provider == "gemini":
        return _extract_with_gemini(system_instruction, user_prompt, schema_class, key, file_bytes, file_mime)
    elif provider == "openai":
        return _extract_with_openai(system_instruction, user_prompt, schema_class, key, file_bytes, file_mime)
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")

def _extract_with_gemini(
    system_instruction: str,
    user_prompt: str,
    schema_class: Type[BaseModel],
    api_key: str,
    file_bytes: Optional[bytes] = None,
    file_mime: Optional[str] = None
) -> Dict[str, Any]:
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        raise ImportError("google-genai library is not installed. Please check your requirements.txt.")

    client = genai.Client(api_key=api_key)
    
    contents = []
    
    if file_bytes and file_mime:
        contents.append(
            types.Part.from_bytes(
                data=file_bytes,
                mime_type=file_mime
            )
        )
    
    contents.append(user_prompt)
    
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        response_mime_type="application/json",
        response_schema=schema_class,
        temperature=0.1
    )
    
    model = os.getenv("GEMINI_MODEL", GEMINI_DEFAULT_MODEL)
    
    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=config
    )
    
    if not response.text:
        raise RuntimeError("Empty response received from Gemini API.")
        
    try:
        parsed_json = json.loads(response.text)
        return parsed_json
    except json.JSONDecodeError:
        print("Raw response text was:", response.text)
        raise RuntimeError("Gemini failed to output valid JSON conforming to the schema.")

def _extract_with_openai(
    system_instruction: str,
    user_prompt: str,
    schema_class: Type[BaseModel],
    api_key: str,
    file_bytes: Optional[bytes] = None,
    file_mime: Optional[str] = None
) -> Dict[str, Any]:
    try:
        from openai import OpenAI
    except ImportError:
        raise ImportError("openai library is not installed. Please check your requirements.txt.")

    client = OpenAI(api_key=api_key)
    
    messages = [
        {"role": "system", "content": system_instruction}
    ]
    
    if file_bytes and file_mime and file_mime.startswith("image/"):
        base64_image = base64.b64encode(file_bytes).decode("utf-8")
        image_url = f"data:{file_mime};base64,{base64_image}"
        
        user_content = [
            {"type": "text", "text": user_prompt},
            {
                "type": "image_url",
                "image_url": {
                    "url": image_url
                }
            }
        ]
        messages.append({"role": "user", "content": user_content})
    else:
        messages.append({"role": "user", "content": user_prompt})

    model = os.getenv("OPENAI_MODEL", OPENAI_DEFAULT_MODEL)
    response = client.beta.chat.completions.parse(
        model=model,
        messages=messages,
        response_format=schema_class,
        temperature=0.1
    )
    
    parsed_model = response.choices[0].message.parsed
    if not parsed_model:
        raise RuntimeError("OpenAI failed to parse response into structural model.")
        
    return parsed_model.model_dump()

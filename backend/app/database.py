import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DATABASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "extractions.db")

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS extractions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            document_type TEXT NOT NULL,
            status TEXT NOT NULL,
            extracted_data TEXT,
            raw_text TEXT,
            error_message TEXT,
            timestamp TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def create_extraction(
    filename: str,
    document_type: str,
    status: str,
    extracted_data: Optional[Dict[str, Any]] = None,
    raw_text: Optional[str] = None,
    error_message: Optional[str] = None
) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    timestamp = datetime.now().isoformat()
    extracted_data_str = json.dumps(extracted_data) if extracted_data else None
    
    cursor.execute("""
        INSERT INTO extractions (filename, document_type, status, extracted_data, raw_text, error_message, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (filename, document_type, status, extracted_data_str, raw_text, error_message, timestamp))
    
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id

def get_all_extractions() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, filename, document_type, status, timestamp, error_message
        FROM extractions
        ORDER BY id DESC
    """)
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def get_extraction_by_id(extraction_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, filename, document_type, status, extracted_data, raw_text, error_message, timestamp
        FROM extractions
        WHERE id = ?
    """, (extraction_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
        
    result = dict(row)
    if result["extracted_data"]:
        result["extracted_data"] = json.loads(result["extracted_data"])
    return result

def update_extraction_data(extraction_id: int, updated_data: Dict[str, Any]) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if record exists
    cursor.execute("SELECT id FROM extractions WHERE id = ?", (extraction_id,))
    if not cursor.fetchone():
        conn.close()
        return False
        
    updated_data_str = json.dumps(updated_data)
    
    cursor.execute("""
        UPDATE extractions
        SET extracted_data = ?, status = 'success', error_message = NULL
        WHERE id = ?
    """, (updated_data_str, extraction_id))
    
    conn.commit()
    conn.close()
    return True

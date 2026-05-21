from typing import TypeVar, Generic, Optional, List
from pydantic import BaseModel, Field

T = TypeVar('T')

class ExtractedField(BaseModel, Generic[T]):
    value: Optional[T] = Field(default=None, description="The extracted data value. Must be null if the information is missing from the document.")
    confidence: str = Field(..., description="Confidence flag for this field. Must be 'high', 'medium', or 'low'.")
    note: Optional[str] = Field(default=None, description="A note describing where the field was found, or why it is null (e.g. 'Field not found in text'). Absolutely no hallucinations.")

# --- Invoice Schema Sub-components ---
class InvoiceLineItem(BaseModel):
    description: Optional[str] = Field(default=None, description="Description of the item or service.")
    quantity: Optional[int] = Field(default=None, description="Quantity of items.")
    unit_price: Optional[float] = Field(default=None, description="Unit price of the item.")
    amount: Optional[float] = Field(default=None, description="Total amount for this line item (qty * unit price).")

# --- Resume Schema Sub-components ---
class ResumeExperienceItem(BaseModel):
    job_title: Optional[str] = Field(default=None, description="Job title or role.")
    company: Optional[str] = Field(default=None, description="Company or organization name.")
    period: Optional[str] = Field(default=None, description="Employment dates or duration, e.g. 'June 2021 - Present'.")
    responsibilities: Optional[str] = Field(default=None, description="Key duties and achievements in this role.")

class ResumeEducationItem(BaseModel):
    degree: Optional[str] = Field(default=None, description="Degree or certification title, e.g. 'Bachelor of Science in Computer Science'.")
    institution: Optional[str] = Field(default=None, description="School, university, or academy name.")
    graduation_year: Optional[str] = Field(default=None, description="Year of graduation or study period, e.g. '2020'.")

# --- Document-Level Target Schemas ---

class InvoiceSchema(BaseModel):
    vendor_name: ExtractedField[str] = Field(..., description="Name of the selling merchant or vendor.")
    invoice_date: ExtractedField[str] = Field(..., description="Date the invoice was issued.")
    invoice_number: ExtractedField[str] = Field(..., description="Invoice identifier number/string.")
    line_items: ExtractedField[List[InvoiceLineItem]] = Field(..., description="List of individual items/services billed.")
    subtotal: ExtractedField[float] = Field(..., description="Invoice subtotal before tax.")
    tax: ExtractedField[float] = Field(..., description="Total tax applied to the invoice.")
    total: ExtractedField[float] = Field(..., description="Grand total amount billed.")
    billing_address: ExtractedField[str] = Field(..., description="Billing address of the customer or vendor.")

class ResumeSchema(BaseModel):
    name: ExtractedField[str] = Field(..., description="Full name of the candidate.")
    email: ExtractedField[str] = Field(..., description="Email address of the candidate.")
    phone: ExtractedField[str] = Field(..., description="Phone number of the candidate.")
    linkedin_or_website: ExtractedField[str] = Field(..., description="LinkedIn profile link, portfolio, or personal website.")
    summary: ExtractedField[str] = Field(..., description="Professional summary or bio statement.")
    skills: ExtractedField[List[str]] = Field(..., description="List of technical, functional, or soft skills listed.")
    experience: ExtractedField[List[ResumeExperienceItem]] = Field(..., description="List of professional work experiences.")
    education: ExtractedField[List[ResumeEducationItem]] = Field(..., description="List of schools, degrees, and education history.")
    certifications: ExtractedField[List[str]] = Field(..., description="List of credentials, certifications, or awards.")

class ContractSchema(BaseModel):
    contract_title: ExtractedField[str] = Field(..., description="Official title or name of the agreement.")
    parties: ExtractedField[List[str]] = Field(..., description="List of the primary corporate or individual parties signing the agreement.")
    effective_date: ExtractedField[str] = Field(..., description="Date on which the agreement becomes active.")
    expiration_date: ExtractedField[str] = Field(..., description="Date or condition on which the agreement terminates or expires.")
    governing_law: ExtractedField[str] = Field(..., description="Jurisdiction or governing law under which disputes will be resolved.")
    termination_clause: ExtractedField[str] = Field(..., description="Summary of terms or conditions regarding termination of the contract.")
    key_obligations: ExtractedField[List[str]] = Field(..., description="List of crucial promises, duties, or obligations for the parties.")

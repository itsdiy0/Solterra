import re
import random
from sqlalchemy.orm import Session
from app.models.event import Event

def extract_district_code(address: str) -> str:
    """
    Extract first 3 letters from district name in address.
    Fallback to first 3 letters if no clear district found.
    """
    # Common Malaysian district patterns
    # Try to find district names (e.g., "Kampung Sentosa", "Petaling Jaya", "Shah Alam")
    
    # Remove common prefixes
    cleaned = re.sub(r'^(Kampung|Kg\.|Taman|Jalan|Jln\.)\s+', '', address, flags=re.IGNORECASE)
    
    # Get first word (likely district/area name)
    words = cleaned.split()
    if words:
        first_word = words[0]
        # Take first 3 letters, uppercase
        district_code = first_word[:3].upper()
        # Remove non-alphabetic characters
        district_code = re.sub(r'[^A-Z]', '', district_code)
        
        if len(district_code) >= 3:
            return district_code[:3]
    
    # Fallback: first 3 alphabetic characters from address
    alpha_only = re.sub(r'[^A-Za-z]', '', address)
    if len(alpha_only) >= 3:
        return alpha_only[:3].upper()
    
    # Ultimate fallback
    return "EVT"


def generate_event_code(db: Session, address: str, use_sequential: bool = True) -> str:
    """
    Generate unique event code: ABC-XXXX
    
    Args:
        db: Database session
        address: Event address to extract district code
        use_sequential: If True, use sequential numbering. If False, random.
    
    Returns:
        Event code like "TAN-0284"
    """
    district_code = extract_district_code(address)
    
    if use_sequential:
        # Get the highest number for this district
        latest_event = (
            db.query(Event)
            .filter(Event.event_code.like(f"{district_code}-%"))
            .order_by(Event.event_code.desc())
            .first()
        )
        
        if latest_event:
            # Extract number from code (e.g., "TAN-0284" -> 284)
            try:
                last_number = int(latest_event.event_code.split('-')[1])
                next_number = last_number + 1
            except (ValueError, IndexError):
                next_number = 1
        else:
            next_number = 1
        
        # Format as 4 digits
        number_part = str(next_number).zfill(4)
    else:
        # Random 4-digit number
        number_part = str(random.randint(1000, 9999))
    
    event_code = f"{district_code}-{number_part}"
    
    # Ensure uniqueness (rare collision case)
    while db.query(Event).filter(Event.event_code == event_code).first():
        if use_sequential:
            next_number += 1
            number_part = str(next_number).zfill(4)
        else:
            number_part = str(random.randint(1000, 9999))
        event_code = f"{district_code}-{number_part}"
    
    return event_code
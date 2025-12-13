import re

def format_phone_number(phone: str, default_country: str = "MY") -> str:
    """
    Format phone number to E.164 format
    
    Args:
        phone: Input phone number
        default_country: Default country code (MY for Malaysia, GB for UK)
    
    Returns:
        Formatted phone number in E.164 format (+countryXXXXXXXXX)
    """
    # Remove all non-digit characters except +
    cleaned = re.sub(r'[^\d+]', '', phone)
    
    # Already in E.164 format
    if cleaned.startswith('+'):
        return cleaned
    
    # UK number starting with 07
    if cleaned.startswith('07') and len(cleaned) == 11:
        return f'+44{cleaned[1:]}'
    
    # Malaysian number starting with 01
    if cleaned.startswith('01') and len(cleaned) >= 10:
        return f'+60{cleaned[1:]}'
    
    # Malaysian number starting with 6 (already has country code without +)
    if cleaned.startswith('60') and len(cleaned) >= 11:
        return f'+{cleaned}'
    
    # UK number starting with 44 (already has country code without +)
    if cleaned.startswith('44') and len(cleaned) >= 12:
        return f'+{cleaned}'
    
    # Default: assume Malaysian number, add +60
    if default_country == "MY":
        if cleaned.startswith('0'):
            return f'+60{cleaned[1:]}'
        return f'+60{cleaned}'
    
    # Default: assume UK number, add +44
    if default_country == "GB":
        if cleaned.startswith('0'):
            return f'+44{cleaned[1:]}'
        return f'+44{cleaned}'
    
    # Can't determine format, return as is
    return cleaned if cleaned.startswith('+') else f'+{cleaned}'


def validate_phone_number(phone: str) -> bool:
    """
    Validate if phone number is in correct E.164 format
    """
    pattern = r'^\+[1-9]\d{1,14}$'
    return bool(re.match(pattern, phone))
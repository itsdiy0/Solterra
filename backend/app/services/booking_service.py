import random
import string


def generate_booking_reference(length: int = 6) -> str:
    """Generate a unique booking reference like ROSE-XXXXXX"""
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    return f"ROSE-{code}"
print(generate_booking_reference())
import re


class PIISanitizer:
    """Privacy-Preserving PII Redaction & Sanitizer Layer"""

    def __init__(self):
        # Regex patterns for PII detection
        self.nik_nip_pattern = r'\b(19|20)\d{16}\b|\b\d{16}\b'
        self.phone_pattern = r'\b(\+62|62|0)8[1-9][0-9]{7,10}\b'
        self.email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        self.currency_pattern = r'Rp\s?\d{1,3}(\.\d{3})*(,\d{2})?'

    def sanitize(self, raw_text: str) -> str:
        sanitized = raw_text

        # Redact NIK / NIP
        sanitized = re.sub(self.nik_nip_pattern, '[REDACTED_NIK_NIP]', sanitized)

        # Redact Phone Numbers
        sanitized = re.sub(self.phone_pattern, '[REDACTED_PHONE]', sanitized)

        # Redact Email Addresses
        sanitized = re.sub(self.email_pattern, '[REDACTED_EMAIL]', sanitized)

        # Redact Financial Amounts
        sanitized = re.sub(self.currency_pattern, 'Rp [REDACTED_AMOUNT]', sanitized)

        return sanitized

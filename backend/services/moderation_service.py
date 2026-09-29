import re
from typing import Tuple

class ContentModerationService:
    """
    Cloud Content Moderation & Sanitization Service.
    Protects the community feed against abusive words, script injection, and spam.
    Demonstrates Trust & Safety in User-Generated Content (UGC) platforms.
    """

    PROFANITY_LIST = {
        "spam", "phishing", "scam", "hack", "exploit", "malware", "virus"
    }

    @classmethod
    def sanitize_text(cls, text: str) -> str:
        """Strips harmful HTML/script tags to prevent XSS (Cross-Site Scripting)."""
        if not text:
            return ""
        # Remove script and HTML tags
        clean_text = re.sub(r'<[^>]*>', '', text)
        return clean_text.strip()

    @classmethod
    def moderate_content(cls, text: str) -> Tuple[bool, str]:
        """
        Scans text for prohibited terms.
        Returns: (is_clean, sanitized_or_flagged_message)
        """
        sanitized = cls.sanitize_text(text)
        lower_text = sanitized.lower()

        for word in cls.PROFANITY_LIST:
            # Word boundary regex check
            if re.search(r'\b' + re.escape(word) + r'\b', lower_text):
                return False, f"Content contains restricted term: '{word}'. Please follow community guidelines."

        return True, sanitized

content_moderation = ContentModerationService()

import os
import hashlib
import secrets


PBKDF2_ROUNDS = int(os.getenv("PBKDF2_ROUNDS", "200000"))


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ROUNDS)
    return f"{salt.hex()}:{digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, digest_hex = stored_hash.split(":", 1)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ROUNDS)
        return secrets.compare_digest(actual, expected)
    except Exception:
        return False


def generate_token() -> str:
    return secrets.token_urlsafe(48)
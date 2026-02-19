from __future__ import annotations
import hashlib
import numpy as np
from spacy.lang.es import Spanish

nlp = Spanish()


def normalize_text(text: str) -> str:
    doc = nlp(text.lower().strip())
    return " ".join([t.lemma_ if t.lemma_ else t.text for t in doc if not t.is_space])


def simple_embedding(text: str, dim: int = 8) -> list[float]:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    values = np.frombuffer(digest[:dim], dtype=np.uint8).astype(np.float32) / 255.0
    return values.tolist()

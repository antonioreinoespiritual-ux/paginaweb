from __future__ import annotations
from rapidfuzz import fuzz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.schemas.core import RuleConfig


def _contains_keyword(text: str, keyword: str) -> bool:
    score = fuzz.partial_ratio(text, keyword)
    return score >= 80


def evaluate_rule(rule: RuleConfig, text: str, manual_value: float | None = None) -> tuple[float, list[str]]:
    text_l = text.lower()
    evidence: list[str] = []

    if rule.tipo_score == "manual":
        value = manual_value or 0.0
    elif rule.tipo_score == "similaridad" and rule.keywords_incluir:
        vect = TfidfVectorizer().fit([text_l, *rule.keywords_incluir])
        m = vect.transform([text_l, rule.keywords_incluir[0]])
        value = float(cosine_similarity(m[0], m[1])[0][0])
        if value >= rule.similitud_minima:
            evidence.append(rule.keywords_incluir[0])
    else:
        positives = []
        for keyword in rule.keywords_incluir:
            if _contains_keyword(text_l, keyword.lower()):
                positives.append(keyword)
        for root, synonyms in rule.sinonimos.items():
            for syn in synonyms:
                if _contains_keyword(text_l, syn.lower()):
                    positives.append(root)
        negatives = [k for k in rule.keywords_excluir if _contains_keyword(text_l, k.lower())]
        value = max(0.0, float(len(set(positives)) - len(negatives)))
        evidence.extend(list(set(positives))[:3])

    if rule.tipo_score == "binario":
        value = 1.0 if value > 0 else 0.0
    elif rule.tipo_score == "escala":
        value = min(5.0, value)
    elif rule.tipo_score == "porcentaje":
        value = min(100.0, value * 100)

    return value, evidence[:3]

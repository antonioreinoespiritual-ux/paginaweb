from __future__ import annotations
import numpy as np
from app.schemas.core import RuleConfig
from app.services.rule_engine import evaluate_rule


def apply_operator(value: float, threshold: float, operator: str) -> bool:
    if operator == ">=":
        return value >= threshold
    if operator == "<=":
        return value <= threshold
    return value == threshold


def compute_scores(rules: list[RuleConfig], text: str) -> dict:
    criteria_scores: dict[str, float] = {}
    flags: dict[str, bool] = {}
    evidence: dict[str, list[str]] = {}
    weighted_scores = []

    for rule in rules:
        value, excerpts = evaluate_rule(rule, text)
        criteria_scores[rule.id] = value
        evidence[rule.id] = excerpts
        passed = apply_operator(value, rule.umbral, rule.operador)
        flags[rule.id] = passed
        weighted_scores.append(value * rule.peso)

    total = float(np.clip(np.mean(weighted_scores) * 20 if weighted_scores else 0, 0, 100))
    return {
        "score_total_hipotesis": total,
        "score_por_criterio": criteria_scores,
        "flags": flags,
        "evidencia": evidence,
    }

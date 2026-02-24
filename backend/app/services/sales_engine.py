from __future__ import annotations


def should_activate_sale(signal_scores: dict[str, float], thresholds: dict[str, float]) -> bool:
    required = ["dolor", "urgencia", "intent"]
    for key in required:
        if signal_scores.get(key, 0) < thresholds.get(key, 1):
            return False
    return True

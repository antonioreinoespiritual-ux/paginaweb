from __future__ import annotations
from collections import Counter
import numpy as np
import pandas as pd
from scipy.stats import norm


def wilson_interval(successes: int, total: int, confidence: float = 0.95) -> tuple[float, float]:
    if total == 0:
        return (0.0, 0.0)
    z = norm.ppf(1 - (1 - confidence) / 2)
    phat = successes / total
    denom = 1 + z**2 / total
    center = (phat + z**2 / (2 * total)) / denom
    margin = (z * np.sqrt((phat * (1 - phat) + z**2 / (4 * total)) / total)) / denom
    return float(max(0.0, center - margin)), float(min(1.0, center + margin))


def build_hypothesis_dashboard(scores: list[dict], threshold: float) -> dict:
    df = pd.DataFrame(scores)
    if df.empty:
        return {"n_entrevistas_total": 0, "n_entrevistas_validas": 0, "tasa_validacion": 0, "intervalo_confianza": [0, 0]}
    total = len(df)
    validas = int((df["total_score"] >= threshold).sum())
    ci = wilson_interval(validas, total)
    phrase_counter = Counter()
    for row in scores:
        for arr in row.get("evidence", {}).values():
            phrase_counter.update(arr)
    return {
        "n_entrevistas_total": total,
        "n_entrevistas_validas": validas,
        "tasa_validacion": validas / total,
        "intervalo_confianza": ci,
        "score_promedio": float(df["total_score"].mean()),
        "distribucion": df["total_score"].tolist(),
        "top_frases_repetidas": phrase_counter.most_common(10),
    }

from __future__ import annotations

import json
import math
import re
from collections import Counter
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import yake
from sklearn.cluster import KMeans
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import silhouette_score
from sklearn.metrics.pairwise import cosine_similarity

from .database import EXPORT_DIR, get_conn, to_json

DEFAULT_PATTERNS = {
    "frustration": [r"no funciona", r"frustra", r"cansad[oa]", r"bloquead[oa]", r"problema"],
    "urgency": [r"urgente", r"hoy", r"ya", r"rápido", r"inmediato"],
    "prior_attempt": [r"intent[ée]", r"prob[ée]", r"hice", r"probando"],
    "econ_impact": [r"ventas", r"lead", r"roas", r"ctr", r"cpc", r"checkout", r"spam", r"pixel", r"whatsapp"],
    "tech_block": [r"error", r"api", r"capi", r"evento", r"tracking", r"atribuci[oó]n"],
    "coldfit_neg": [r"marca personal", r"branding", r"autoridad", r"influencer"],
}

DEFAULT_WEIGHTS = {
    "frustration": 1.2,
    "urgency": 1.1,
    "prior_attempt": 1.0,
    "econ_impact": 1.4,
    "tech_block": 1.1,
    "coldfit_neg": -1.0,
}

PROMO_PATTERN = re.compile(r"https?://|www\.|whatsapp|telegram|link|gratis|curso|masterclass|mentor[ií]a|agenda|inscr[ií]bete", re.I)


def normalize_text(text: str) -> str:
    text = (text or "").lower().strip()
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def ingest_dataset(dataset_id: str, colmap: dict[str, str] | None = None) -> None:
    conn = get_conn()
    row = conn.execute("SELECT filepath FROM datasets WHERE id = ?", [dataset_id]).fetchone()
    if not row:
        raise ValueError("Dataset not found")
    path = row[0]
    df = pd.read_csv(path, sep=None, engine="python", encoding_errors="ignore")
    cols = {c.lower(): c for c in df.columns}

    def pick(name: str, optional: bool = True) -> str | None:
        if colmap and name in colmap:
            return colmap[name]
        if name in cols:
            return cols[name]
        return None if optional else ""

    comment_col = pick("comment", optional=False)
    if not comment_col:
        raise ValueError("CSV must contain comment column or mapping")
    like_col = pick("like_count")

    records: list[dict[str, Any]] = []
    seen_norm = set()
    for i, r in df.iterrows():
        comment = str(r.get(comment_col, "") or "")
        if not comment.strip():
            continue
        comment_norm = normalize_text(comment)
        cid = str(r.get(pick("comment_id") or "", i))
        is_dup = comment_norm in seen_norm
        seen_norm.add(comment_norm)
        records.append(
            {
                "dataset_id": dataset_id,
                "comment_id": cid,
                "comment": comment,
                "like_count": int(r.get(like_col, 0) or 0) if like_col else 0,
                "query": str(r.get(pick("query") or "", "") or ""),
                "title": str(r.get(pick("title") or "", "") or ""),
                "channel": str(r.get(pick("channel") or "", "") or ""),
                "video_id": str(r.get(pick("video_id") or "", "") or ""),
                "published_at": str(r.get(pick("published_at") or "", "") or ""),
                "comment_published_at": str(r.get(pick("comment_published_at") or "", "") or ""),
                "author": str(r.get(pick("author") or "", "") or ""),
                "comment_norm": comment_norm,
                "is_promo": bool(PROMO_PATTERN.search(comment_norm)),
                "is_duplicate": is_dup,
            }
        )

    out = pd.DataFrame(records)
    conn.execute("DELETE FROM comments WHERE dataset_id = ?", [dataset_id])
    conn.register("comments_df", out)
    conn.execute("INSERT INTO comments SELECT * FROM comments_df")
    conn.execute(
        "UPDATE datasets SET n_rows = ?, schema_json = ? WHERE id = ?",
        [len(out), json.dumps({"columns": list(df.columns)}), dataset_id],
    )
    conn.close()


def compute_signals(dataset_id: str, patterns: dict[str, list[str]] | None = None, weights: dict[str, float] | None = None) -> None:
    patterns = patterns or DEFAULT_PATTERNS
    weights = weights or DEFAULT_WEIGHTS
    conn = get_conn()
    df = conn.execute("SELECT dataset_id, comment_id, comment_norm FROM comments WHERE dataset_id = ?", [dataset_id]).df()
    if df.empty:
        conn.close()
        return

    flags = {}
    for key, regex_list in patterns.items():
        merged = re.compile("|".join(regex_list), re.I)
        flags[key] = df["comment_norm"].fillna("").str.contains(merged)

    scored = pd.DataFrame({"dataset_id": df["dataset_id"], "comment_id": df["comment_id"]})
    for key in ["frustration", "urgency", "prior_attempt", "econ_impact", "tech_block", "coldfit_neg"]:
        scored[key] = flags.get(key, pd.Series([False] * len(df))).astype(bool)

    raw = np.zeros(len(scored))
    for key, w in weights.items():
        if key in scored:
            raw += scored[key].astype(int) * w
    min_v, max_v = float(raw.min()), float(raw.max())
    norm = np.zeros(len(raw)) if math.isclose(max_v, min_v) else ((raw - min_v) / (max_v - min_v)) * 100
    scored["signal_score"] = norm

    conn.execute("DELETE FROM signals WHERE dataset_id = ?", [dataset_id])
    conn.register("signals_df", scored)
    conn.execute("INSERT INTO signals SELECT * FROM signals_df")
    conn.close()


def _choose_k(x: np.ndarray, min_k: int = 8, max_k: int = 20) -> int:
    if len(x) < 12:
        return 3
    sample_idx = np.random.default_rng(42).choice(len(x), size=min(10000, len(x)), replace=False)
    xs = x[sample_idx]
    best_k, best_s = min_k, -1.0
    for k in range(min_k, min(max_k, len(xs) - 1) + 1):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(xs)
        if len(set(labels)) < 2:
            continue
        s = silhouette_score(xs, labels)
        if s > best_s:
            best_s, best_k = s, k
    return best_k


def _gap_statement(cluster_name: str, comments: list[str]) -> dict[str, Any]:
    txt = " ".join(comments).lower()
    mapping = {
        "ecommerce": ["shopify", "carrito", "checkout"],
        "leads/whatsapp": ["whatsapp", "seguimiento", "mensajes"],
        "ads": ["roas", "ctr", "cpc", "anuncios", "campaña"],
        "email": ["spam", "deliverability", "newsletter", "secuencia"],
        "tracking": ["pixel", "capi", "evento", "api", "atribución"],
    }
    who = "operador de marketing digital"
    for k, words in mapping.items():
        if any(w in txt for w in words):
            who = k
            break
    return {
        "hueco": cluster_name,
        "quien": who,
        "proceso_roto": f"Fallo recurrente detectado en {who}",
        "que_falta": "Plantilla + sistema operativo accionable sin depender de marca personal",
    }


def analyze_dataset(dataset_id: str) -> None:
    compute_signals(dataset_id)
    conn = get_conn()
    q = """
        SELECT c.comment_id, c.comment, c.comment_norm, c.like_count, s.signal_score,
               s.econ_impact, s.urgency, s.tech_block, s.coldfit_neg
        FROM comments c
        LEFT JOIN signals s ON c.dataset_id=s.dataset_id AND c.comment_id=s.comment_id
        WHERE c.dataset_id = ?
    """
    df = conn.execute(q, [dataset_id]).df()
    if df.empty:
        conn.close()
        return
    texts = df["comment_norm"].fillna("").tolist()
    vect = TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_df=0.95)
    X = vect.fit_transform(texts)
    n_comp = min(150, max(10, X.shape[1] - 1))
    svd = TruncatedSVD(n_components=n_comp, random_state=42)
    Xs = svd.fit_transform(X)
    k = _choose_k(Xs)
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = km.fit_predict(Xs)
    df["cluster_id"] = labels

    conn.execute("DELETE FROM clusters WHERE dataset_id = ?", [dataset_id])
    conn.execute("DELETE FROM evidence WHERE dataset_id = ?", [dataset_id])

    feature_names = np.array(vect.get_feature_names_out())
    keyword_extractor = yake.KeywordExtractor(lan="es", n=2, top=10)

    report: dict[str, Any] = {"dataset_id": dataset_id, "clusters": []}

    for cid in sorted(df["cluster_id"].unique()):
        part = df[df["cluster_id"] == cid].copy()
        size = len(part)
        mean_signal = float(part["signal_score"].fillna(0).mean())
        econ_rate = float(part["econ_impact"].fillna(False).mean()) * 100
        urgency_rate = float(part["urgency"].fillna(False).mean()) * 100
        tech_rate = float(part["tech_block"].fillna(False).mean()) * 100
        cold_pen = float(part["coldfit_neg"].fillna(False).mean()) * 100
        score = (
            0.20 * math.log1p(size)
            + 0.35 * mean_signal
            + 0.20 * econ_rate
            + 0.15 * urgency_rate
            + 0.10 * tech_rate
            - 0.30 * cold_pen
        )
        score = max(0.0, min(100.0, score))

        centroid = km.cluster_centers_[cid].reshape(1, -1)
        part_idx = part.index.to_numpy()
        sims = cosine_similarity(Xs[part_idx], centroid).reshape(-1)
        part["_sim"] = sims
        part["_rank_score"] = part["_sim"] * 0.5 + np.log1p(part["like_count"].fillna(0)) * 0.2 + part["signal_score"].fillna(0) * 0.3
        top_e = part.sort_values("_rank_score", ascending=False).head(8)

        top_term_idx = X[part_idx].sum(axis=0).A1.argsort()[::-1][:10]
        top_terms = feature_names[top_term_idx].tolist()

        ngram_counter: Counter[str] = Counter()
        for t in part["comment_norm"].tolist():
            toks = t.split()
            for i in range(len(toks) - 1):
                ngram_counter[f"{toks[i]} {toks[i+1]}"] += 1
        top_ngrams = [x for x, _ in ngram_counter.most_common(10)]

        yk = [kw for kw, _ in keyword_extractor.extract_keywords(" ".join(part["comment_norm"].tolist())[:20000])][:10]
        cname = " / ".join([x for x in [yk[0] if yk else "cluster", yk[1] if len(yk) > 1 else "tema", top_ngrams[0] if top_ngrams else ""] if x])

        signal_rates = {
            "mean_signal": mean_signal,
            "econ_rate": econ_rate,
            "urgency_rate": urgency_rate,
            "tech_rate": tech_rate,
            "cold_penalty": cold_pen,
        }

        conn.execute(
            """
            INSERT INTO clusters VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [dataset_id, int(cid), cname, score, size, to_json({"yake": yk}), to_json({"terms": top_terms}), to_json({"ngrams": top_ngrams}), to_json(signal_rates)],
        )

        ev_rank = 1
        ev_comments = []
        for _, row in top_e.iterrows():
            conn.execute(
                "INSERT INTO evidence VALUES (?, ?, ?, ?, ?, ?, ?)",
                [dataset_id, int(cid), str(row["comment_id"]), ev_rank, str(row["comment"]), int(row["like_count"] or 0), float(row["signal_score"] or 0)],
            )
            ev_comments.append(str(row["comment"]))
            ev_rank += 1

        gs = _gap_statement(cname, ev_comments)
        gs["evidencia"] = ev_comments[:3]
        report["clusters"].append({"cluster_id": int(cid), "cluster_score": score, **gs})

    report_path = EXPORT_DIR / f"{dataset_id}_report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    conn.close()


def export_dataset(dataset_id: str, export_type: str) -> Path:
    conn = get_conn()
    if export_type == "clusters.csv":
        out = conn.execute("SELECT * FROM clusters WHERE dataset_id = ? ORDER BY cluster_score DESC", [dataset_id]).df()
    elif export_type == "evidence.csv":
        out = conn.execute("SELECT * FROM evidence WHERE dataset_id = ? ORDER BY cluster_id, rank", [dataset_id]).df()
    elif export_type == "report.json":
        return EXPORT_DIR / f"{dataset_id}_report.json"
    else:
        raise ValueError("Invalid export type")
    path = EXPORT_DIR / f"{dataset_id}_{export_type}"
    out.to_csv(path, index=False)
    conn.close()
    return path

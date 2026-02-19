from __future__ import annotations
import numpy as np
import hdbscan
import umap
from keybert import KeyBERT

kw_model = KeyBERT(model=None)


def cluster_embeddings(texts: list[str], vectors: list[list[float]]) -> dict:
    if len(vectors) < 3:
        return {"labels": [-1] * len(vectors), "coords": [[0.0, 0.0] for _ in vectors], "keywords": []}
    arr = np.array(vectors)
    labels = hdbscan.HDBSCAN(min_cluster_size=2).fit_predict(arr)
    reducer = umap.UMAP(n_components=2, random_state=42)
    coords = reducer.fit_transform(arr).tolist()
    joined = " ".join(texts)
    keywords = [kw for kw, _ in kw_model.extract_keywords(joined, top_n=5)] if joined else []
    return {"labels": labels.tolist(), "coords": coords, "keywords": keywords}

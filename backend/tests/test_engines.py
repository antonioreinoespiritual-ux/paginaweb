from app.schemas.core import RuleConfig
from app.services.rule_engine import evaluate_rule
from app.services.scoring_engine import compute_scores
from app.services.analytics_engine import build_hypothesis_dashboard


def test_rule_engine_keyword_match():
    rule = RuleConfig(id="dolor", nombre="Dolor", tipo_score="binario", keywords_incluir=["dolor"], umbral=1)
    value, evidence = evaluate_rule(rule, "Tengo mucho dolor al procesar pagos")
    assert value == 1.0
    assert evidence


def test_scoring_engine_total_score():
    rules = [
        RuleConfig(id="a", nombre="A", tipo_score="binario", keywords_incluir=["dolor"], peso=1, umbral=1),
        RuleConfig(id="b", nombre="B", tipo_score="binario", keywords_incluir=["urgente"], peso=1, umbral=1),
    ]
    result = compute_scores(rules, "dolor urgente")
    assert result["score_total_hipotesis"] > 0


def test_dashboard_aggregates():
    scores = [
        {"total_score": 80, "evidence": {"a": ["x"]}},
        {"total_score": 60, "evidence": {"a": ["x"], "b": ["y"]}},
    ]
    dashboard = build_hypothesis_dashboard(scores, threshold=70)
    assert dashboard["n_entrevistas_total"] == 2
    assert dashboard["n_entrevistas_validas"] == 1

"""init research os tables"""
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.create_table("hypotheses",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("short_name", sa.String(120), nullable=False, unique=True),
        sa.Column("statement", sa.Text, nullable=False),
        sa.Column("independent_variable", sa.String(120), nullable=False),
        sa.Column("primary_metric", sa.String(120), nullable=False),
        sa.Column("channel", sa.String(120), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("validation_threshold", sa.Float, nullable=False),
        sa.Column("min_volume", sa.Integer, nullable=False),
        sa.Column("tags", sa.JSON, nullable=False),
        sa.Column("target_segments", sa.JSON, nullable=False),
        sa.Column("created_at", sa.DateTime),
        sa.Column("updated_at", sa.DateTime),
    )
    for table in [
        "hypothesis_rules","interview_templates","interview_flows","interviews","interview_participants",
        "interview_responses","interview_notes","interview_scores","offers","objections","sales_events","analytics_snapshots"
    ]:
        op.create_table(table, sa.Column("id", sa.Integer, primary_key=True), sa.Column("created_at", sa.DateTime), sa.Column("updated_at", sa.DateTime))
    op.create_table("embeddings_store",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("interview_id", sa.Integer),
        sa.Column("hypothesis_id", sa.Integer),
        sa.Column("source_text", sa.Text),
        sa.Column("vector", Vector(8)),
        sa.Column("metadata_json", sa.JSON),
        sa.Column("cluster_label", sa.Integer),
        sa.Column("umap_x", sa.Float),
        sa.Column("umap_y", sa.Float),
        sa.Column("keyphrases", sa.JSON),
        sa.Column("is_live", sa.Boolean),
        sa.Column("created_at", sa.DateTime),
        sa.Column("updated_at", sa.DateTime),
    )


def downgrade() -> None:
    for table in ["embeddings_store","analytics_snapshots","sales_events","objections","offers","interview_scores","interview_notes","interview_responses","interview_participants","interviews","interview_flows","interview_templates","hypothesis_rules","hypotheses"]:
        op.drop_table(table)

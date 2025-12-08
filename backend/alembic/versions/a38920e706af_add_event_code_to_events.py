"""add_event_code_to_events

Revision ID: a38920e706af
Revises: 12625d129923
Create Date: 2025-12-08 12:27:30.404657

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a38920e706af'
down_revision: Union[str, None] = '12625d129923'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Add event_code column (nullable first)
    op.add_column('events', sa.Column('event_code', sa.String(20), nullable=True))
    
    # Generate codes for existing events using a subquery
    connection = op.get_bind()
    
    # Get all existing events and update them one by one
    result = connection.execute(sa.text("SELECT id, address, created_at FROM events WHERE event_code IS NULL ORDER BY created_at"))
    events = result.fetchall()
    
    for idx, (event_id, address, created_at) in enumerate(events, start=1):
        # Simple sequential code for existing events
        event_code = f"EVT-{str(idx).zfill(4)}"
        connection.execute(
            sa.text("UPDATE events SET event_code = :code WHERE id = :id"),
            {"code": event_code, "id": event_id}
        )
    
    # Make it non-nullable and unique
    op.alter_column('events', 'event_code', nullable=False)
    op.create_unique_constraint('uq_event_code', 'events', ['event_code'])
    op.create_index('ix_events_event_code', 'events', ['event_code'])


def downgrade():
    op.drop_index('ix_events_event_code')
    op.drop_constraint('uq_event_code', 'events')
    op.drop_column('events', 'event_code')
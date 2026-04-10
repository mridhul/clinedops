"""add_performance_indexes

Revision ID: b8706927c988
Revises: 2dd1c1b262e0
Create Date: 2026-03-23 10:33:44.572331
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b8706927c988'
down_revision = '2dd1c1b262e0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Students list performance
    op.create_index('ix_students_discipline_active', 'students', ['discipline', 'is_active'])
    
    # Tutors list performance
    op.create_index('ix_tutors_discipline_active', 'tutors', ['discipline', 'is_active'])
    
    # Teaching sessions dashboard + list performance
    op.create_index('ix_sessions_status_created', 'teaching_sessions', ['approval_status', 'created_at'])
    op.create_index('ix_sessions_posting_id', 'teaching_sessions', ['posting_id'])
    
    # Survey analytics performance
    op.create_index('ix_survey_submissions_template_status', 'survey_submissions', ['template_id', 'status'])
    
    # Admin audit log performance
    op.create_index('ix_audit_logs_actor_action_created', 'audit_logs', ['created_by', 'action', 'created_at'])
    
    # Notifications unread count performance
    op.create_index('ix_notifications_recipient_unread', 'notifications', ['recipient_id', 'is_read'])


def downgrade() -> None:
    op.drop_index('ix_notifications_recipient_unread', table_name='notifications')
    op.drop_index('ix_audit_logs_actor_action_created', table_name='audit_logs')
    op.drop_index('ix_survey_submissions_template_status', table_name='survey_submissions')
    op.drop_index('ix_sessions_posting_id', table_name='teaching_sessions')
    op.drop_index('ix_sessions_status_created', table_name='teaching_sessions')
    op.drop_index('ix_tutors_discipline_active', table_name='tutors')
    op.drop_index('ix_students_discipline_active', table_name='students')


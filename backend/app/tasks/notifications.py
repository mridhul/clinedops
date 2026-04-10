import asyncio
import logging
from typing import Optional
import boto3
from botocore.exceptions import ClientError
from sqlalchemy import select, and_

from app.celery_app import celery_app
from app.core.config import get_settings
from app.db.session import async_session_factory
from app.db.models.user import User

logger = logging.getLogger(__name__)

@celery_app.task(name="app.tasks.notifications.send_email_notification_task")
def send_email_notification_task(
    notification_id: str,
    recipient_id: str,
    title: str,
    message: str
):
    """
    Background task to send email via AWS SES.
    """
    settings = get_settings()
    
    # In a real async scenario, we might need a sync wrapper around the async DB fetch
    # for simplicity in this demo task, we'll focus on the SES integration.
    # We'll need the recipient's email.
    
    async def get_recipient_email():
        async with async_session_factory() as db:
            result = await db.execute(select(User.email).where(User.id == recipient_id))
            return result.scalar()

    try:
        recipient_email = asyncio.run(get_recipient_email())
    except Exception as e:
        logger.error(f"Failed to fetch recipient email: {e}")
        return False

    if not recipient_email:
        logger.error(f"No email found for user {recipient_id}")
        return False

    # SES client
    ses_client = boto3.client(
        'ses',
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region
    )

    try:
        response = ses_client.send_email(
            Source=settings.ses_sender_email,
            Destination={'ToAddresses': [recipient_email]},
            Message={
                'Subject': {'Data': title},
                'Body': {
                    'Text': {'Data': message},
                    'Html': {'Data': f"<h3>{title}</h3><p>{message}</p>"}
                }
            }
        )
        logger.info(f"Email sent to {recipient_email}. Message ID: {response['MessageId']}")
        return True
    except ClientError as e:
        logger.error(f"Failed to send email via SES: {e.response['Error']['Message']}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error in email task: {e}")
        return False

@celery_app.task(name="app.tasks.notifications.check_overdue_feedback_escalation")
def check_overdue_feedback_escalation():
    """
    Scheduled task (e.g. daily) to find overdue feedback and escalate.
    """
    # This would involve querying SurveyAssignment which are pending and > N days old.
    # For now, we'll leave the implementation shell as specified in the plan.
    pass

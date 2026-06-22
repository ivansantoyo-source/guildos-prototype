from celery import Celery
from core.config import settings

celery_app = Celery(
    "guildos_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Example task registration
# celery_app.autodiscover_tasks(['tasks.pricing_sweeper', 'tasks.the_oracle'])

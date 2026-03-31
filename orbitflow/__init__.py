from .celery import app as celery_app

# this ensures that the app is always imported when
# Django starts so that shared tasks use this app.
__all__ = ['celery_app']
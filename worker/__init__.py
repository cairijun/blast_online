from celery import Celery
import config


app = Celery('worker', broker=config.CELERY_BROKER)

from . import blast

from celery import shared_task
from .models import WorkFlow
from .services.executor import run_workflow


@shared_task
def run_workflow_task(execution_id, trigger_data= None):

    try:
        run_workflow(execution_id, trigger_data= trigger_data)
    except Exception as e:
        print(f"Error executing workflow: {str(e)}")
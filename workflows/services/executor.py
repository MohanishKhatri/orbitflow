from workflows.models import WorkFlow, Execution, WorkFlowStep
from django.utils import timezone

def run_workflow(id):
    workflow=WorkFlow.objects.get(id=id)
    if not workflow.is_active:
        print(f'worlflow is inactive')
        return
    execution = Execution.objects.create(workflow=workflow)
    execution.status = Execution.STEP_RUNNING
    execution.save()

    workflow_steps = workflow.steps.all().order_by('step_number')

    for step in workflow_steps:
        try:
            execution.current_step = step.step_number
            # if(step.step_number == 3):
            #     raise Exception("Simulated step failure")
        except:
            execution.status = Execution.STEP_FAILED
            execution.finished_at = timezone.now()
            execution.save()
            return
     
        execution.save()
        print(f'step is done')
            

    execution.status = Execution.STEP_SUCCESSFUL
    execution.finished_at = timezone.now()
    execution.save()
    return execution
    

    
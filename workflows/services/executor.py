from workflows.models import WorkFlow, Execution, WorkFlowStep
from django.utils import timezone
from workflows.registry import get_runner_class
import workflows.steps

def run_workflow(id):
    workflow=WorkFlow.objects.get(id=id)
    if not workflow.is_active:
        print(f'worlflow is inactive')
        return
    execution = Execution.objects.create(workflow=workflow)
    execution.status = Execution.STEP_RUNNING
    execution.save()

    context = {"execution_id": execution.id,
               "workflow_id": workflow.id,
               "steps": {}
               }
    

    workflow_steps = workflow.steps.all().order_by('step_number')

    try:
        for step in workflow_steps:
            execution.current_step = step.step_number
            execution.save()

            print(f"[*] Processing step {step.step_number} ({step.type})..." )
            RunnerClass = get_runner_class(step.type)
            runner = RunnerClass(step.config, context)
            runner.validate()
            result = runner.execute()
            context['steps'][str(step.step_number)] = result
            print(f" -> Success: {result.get('status_code', 'OK')}")
                

        execution.status = Execution.STEP_SUCCESSFUL
    
    except Exception as e:
        print(f"[!] Error {e}")
        execution.status = Execution.STEP_FAILED

    finally:
        execution.finished_at = timezone.now()
        execution.save()
    return execution
    

    
from workflows.models import WorkFlow, Execution, WorkFlowStep, ExecutionStepLog
from django.utils import timezone
from workflows.registry import get_runner_class
import workflows.steps
from .variable_resolver import resolve_config

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

            step_log = ExecutionStepLog.objects.create(
                execution=execution,
                step_number=step.step_number,
                status=ExecutionStepLog.STATUS_RUNNING
            )


            try:
                RunnerClass = get_runner_class(step.type)
                # resolving variables with past step outputs and context values
                resolved_config = resolve_config(step.config, context)
                runner = RunnerClass(resolved_config, context)
                runner.validate()
                result = runner.execute()
                context['steps'][str(step.step_number)] = result
                print(f" -> Success: {result.get('status_code', 'OK')}")

                step_log.status = ExecutionStepLog.STATUS_SUCCESSFUL
                step_log.output = result
                step_log.finished_at = timezone.now()
                step_log.save()

            except Exception as step_error:
                print(f" -> Step {step.step_number} failed: {step_error}")
                step_log.status = ExecutionStepLog.STATUS_FAILED
                step_log.error_message = str(step_error)
                step_log.finished_at = timezone.now()
                step_log.save()

                raise
                

        execution.status = Execution.STEP_SUCCESSFUL
    
    except Exception as e:
        print(f"[!] Error {e}")
        execution.status = Execution.STEP_FAILED

    finally:
        execution.finished_at = timezone.now()
        execution.save()
    return execution
    

    
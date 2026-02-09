from django.db import models

# Create your models here.
class WorkFlow(models.Model):
    title = models.CharField(max_length = 255)
    created_at = models.DateTimeField(auto_now_add = True)
    is_active= models.BooleanField(default = True)

    # this is useful for display like if we dont set we get some internally stored name like WorkFlow object(1)
    def __str__(self):
        return self.title


class WorkFlowStep(models.Model):
    class Meta:
        unique_together = ('workflow', 'step_number')
    workflow = models.ForeignKey('WorkFlow', on_delete = models.CASCADE, related_name = 'steps')
    step_number = models.IntegerField()
    config = models.JSONField()
    type = models.CharField(max_length=50, default="HTTP")

    def __str__(self):
        return f"WorkFlow {self.workflow} - Step {self.step_number}"


class Execution(models.Model):
    STEP_PENDING = 'P'
    STEP_RUNNING = 'R'
    STEP_FAILED = 'F'
    STEP_SUCCESSFUL = 'S'
    STEP_STATUS = [
        (STEP_PENDING,'Pending'),
        (STEP_FAILED,'Failed'),
        (STEP_RUNNING, 'Running'),
        (STEP_SUCCESSFUL, 'Successful')
    ]
    status=models.CharField(max_length = 1, choices = STEP_STATUS, default=STEP_PENDING)
    workflow = models.ForeignKey('WorkFlow', on_delete=models.CASCADE, related_name='executions')
    current_step = models.IntegerField(null = True, blank = True)
    started_at = models.DateTimeField(auto_now_add = True)
    finished_at = models.DateTimeField(null = True, blank = True)

    def __str__(self):
        return f"Execution {self.id} of WorkFlow {self.workflow_id}"
    

class ExecutionStepLog(models.Model):
    STATUS_RUNNING = 'R'
    STATUS_SUCCESSFUL = 'S'
    STATUS_FAILED = 'F'
    STATUS_CHOICES = [
        (STATUS_RUNNING, 'Running'),
        (STATUS_SUCCESSFUL, 'Successful'),
        (STATUS_FAILED, 'Failed')
    ]
    status = models.CharField(max_length=1, choices=STATUS_CHOICES)
    execution = models.ForeignKey('Execution', on_delete=models.CASCADE, related_name='step_logs')
    step_number = models.IntegerField()
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    output = models.JSONField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Execution {self.execution_id} - Step {self.step_number} Log"



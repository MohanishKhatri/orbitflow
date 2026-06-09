from rest_framework import serializers
from .models import WorkFlow, WorkFlowStep, Execution, ExecutionStepLog


class WorkFlowSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    class Meta:
        model = WorkFlow
        fields = ['id', 'created_at', 'title', 'is_active', 'owner', 'owner_username']
        read_only_fields = ['id', 'created_at', 'owner']


class WorkFlowStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkFlowStep
        fields = ['id', 'workflow', 'step_number', 'config']
        read_only_fields = ['id', 'workflow']

    def validate(self, data):
        workflow = self.context['view'].kwargs['workflow_id']
        step_number = data.get('step_number')

        if WorkFlowStep.objects.filter(
            workflow_id=workflow,
            step_number=step_number
        ).exists():
            raise serializers.ValidationError(
                "Step number already exists for this workflow."
            )

        return data


class ExecutionSerializer(serializers.ModelSerializer):
    workflow_title = serializers.CharField(source='workflow.title', read_only=True)
    triggered_by_username = serializers.CharField(source='triggered_by.username', read_only=True)
    class Meta:
        model = Execution
        fields = ['id', 'workflow', 'workflow_title', 'status', 'current_step', 'started_at', 'finished_at', 'triggered_by', 'triggered_by_username']
        read_only_fields = ['id', 'workflow', 'started_at', 'finished_at']


class ExecutionStepLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExecutionStepLog
        fields = ['id', 'step_number', 'status', 'started_at', 'finished_at', 'output', 'error_message']
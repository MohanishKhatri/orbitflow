from rest_framework import serializers
from .models import WorkFlow, WorkFlowStep


class WorkFlowSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkFlow
        fields = ['id', 'created_at', 'title', 'is_active']
        read_only_fields = ['id', 'created_at']

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

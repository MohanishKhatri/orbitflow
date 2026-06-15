from rest_framework import serializers
from .models import WorkFlow, WorkFlowStep, Execution, ExecutionStepLog


import hmac
import hashlib
from django.conf import settings

class WorkFlowSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    webhook_token = serializers.SerializerMethodField()
    class Meta:
        model = WorkFlow
        fields = ['id', 'created_at', 'title', 'is_active', 'owner', 'owner_username', 'webhook_token']
        read_only_fields = ['id', 'created_at', 'owner']

    def get_webhook_token(self, obj):
        key = settings.SECRET_KEY.encode('utf-8')
        msg = str(obj.id).encode('utf-8')
        return hmac.new(key, msg, hashlib.sha256).hexdigest()[:20]


class WorkFlowStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkFlowStep
        fields = ['id', 'workflow', 'step_number', 'type', 'config']
        read_only_fields = ['id', 'workflow']

    def validate(self, data):
        view_kwargs = self.context['view'].kwargs
        workflow_id = view_kwargs.get('workflow_id')
        
        if not workflow_id and self.instance:
            workflow_id = self.instance.workflow_id
            
        step_number = data.get('step_number')

        if step_number and workflow_id:
            qs = WorkFlowStep.objects.filter(workflow_id=workflow_id, step_number=step_number)
            if self.instance:
                qs = qs.exclude(id=self.instance.id)
            if qs.exists():
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
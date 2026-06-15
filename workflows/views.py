from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from workflows.services.executor import run_workflow
from rest_framework.decorators import api_view
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView, RetrieveAPIView
from rest_framework.views import APIView
from rest_framework import status

from .models import WorkFlow, WorkFlowStep, Execution, ExecutionStepLog
from .serializers import WorkFlowSerializer, WorkFlowStepSerializer, ExecutionSerializer, ExecutionStepLogSerializer
from .pagination import DefaultPagination
from .tasks import run_workflow_task
from rest_framework.permissions import IsAuthenticated, AllowAny

import hmac
import hashlib
from django.conf import settings


# Create your views here.

# # its literally same as webhook view (though it was first one i made xd)
# @api_view(['POST'])
# @permission_classes([AllowAny])
# def workflow_execution_handler(request, workflow_id):
#     get_object_or_404(WorkFlow, id=workflow_id, owner=request.user)
#     webhook_data = request.data
#     run_workflow(workflow_id, trigger_data=webhook_data)
#     return Response(f'Workflow {workflow_id} execution started.')


class WorkFlowListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
   
    serializer_class = WorkFlowSerializer
    def get_queryset(self):
        # return only workflows of the logged in user
        queryset = WorkFlow.objects.filter(owner=self.request.user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class WorkFlowDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkFlowSerializer

    def get_queryset(self):
        # return only workflows of the logged in user
        queryset = WorkFlow.objects.filter(owner=self.request.user)
        return queryset


class WorkFlowStepsListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkFlowStepSerializer
    def get_queryset(self):
        workflow_id = self.kwargs['workflow_id']
        queryset = WorkFlowStep.objects.filter(workflow_id=workflow_id, workflow__owner=self.request.user).order_by('step_number')
        return queryset


    def perform_create(self, serializer):
        workflow_id = self.kwargs['workflow_id']
        get_object_or_404(WorkFlow, id=workflow_id, owner=self.request.user)
        serializer.save(workflow_id=workflow_id)


class WorkFlowStepDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkFlowStepSerializer

    def get_queryset(self):
        return WorkFlowStep.objects.filter(workflow__owner=self.request.user)


class ExecutionListView(ListAPIView):

    permission_classes = [IsAuthenticated]
    serializer_class = ExecutionSerializer
    pagination_class = DefaultPagination

    def get_queryset(self):
        queryset = Execution.objects.filter(workflow__owner=self.request.user)

        # extracting data from query
        workflow = self.request.query_params.get('workflow')
        status = self.request.query_params.get('status')
        ordering = self.request.query_params.get('ordering')

        # filtering logic
        if workflow:
            queryset = queryset.filter(workflow=workflow)
        if(status):
            queryset = queryset.filter(status=status)

        # ordering logic
        allowed_ordering_fields = ['started_at', '-started_at', 'status', '-status']
        if ordering in allowed_ordering_fields:
            queryset = queryset.order_by(ordering)

        return queryset


class ExecutionDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ExecutionSerializer

    def get_queryset(self):
        return Execution.objects.filter(workflow__owner=self.request.user)


class ExecutionRetryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, execution_id):
        # If requested execution is not in failed state
        old_execution = get_object_or_404(Execution, id=execution_id, workflow__owner=request.user)
        if old_execution.status != Execution.STEP_FAILED:
            return Response(
                {"error": "Only failed executions can be retried!"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # If another execution of same workflow is running
        running_execution = Execution.objects.filter(
            workflow=old_execution.workflow,
            status=Execution.STEP_RUNNING
        ).first()
        if running_execution:
            return Response(
                {"error": "Another execution of this workflow is currently running!"},
                status=status.HTTP_409_CONFLICT
            )
        
        if not old_execution.workflow.is_active:
            return Response(
                {"error": "Workflow is inactive"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Making a new execution
        new_execution = Execution.objects.create(
            workflow=old_execution.workflow,
            status=Execution.STEP_PENDING,
            triggered_by=request.user
        )
        run_workflow_task.delay(new_execution.id)

        return Response(
            {"message" : "Execution retried successfully",
             "execution_id" : new_execution.id
            },
            status=status.HTTP_202_ACCEPTED
        )


class ExecutionStepLogsView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ExecutionStepLogSerializer
    pagination_class = DefaultPagination

    def get_queryset(self):
        execution_id = self.kwargs['execution_id']
        queryset = ExecutionStepLog.objects.filter(execution_id=execution_id, execution__workflow__owner=self.request.user).order_by('step_number')
        return queryset
    

class WebHookTriggerView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, workflow_id):

        workflow = get_object_or_404(WorkFlow, id=workflow_id)    

        if not workflow.is_active:
            return Response({"error": "Workflow is inactive"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify webhook token
        token = request.query_params.get('token')
        expected_token = hmac.new(
            settings.SECRET_KEY.encode('utf-8'),
            str(workflow.id).encode('utf-8'),
            hashlib.sha256
        ).hexdigest()[:20]

        if not token or not hmac.compare_digest(token, expected_token):
            return Response({"error": "Invalid or missing webhook token"}, status=status.HTTP_403_FORBIDDEN)
        
        # Merge body data at root level for easy access: {{trigger.field}}
        trigger_data = {
            **request.data,  # Body fields at root level coz variable resolving was failing
            # its convinient to have it direct access else we need to do trigger.data.field for each field
            # but after this we can directly do trigger.fielf
            "headers": dict(request.headers),
            "query_params": dict(request.query_params)
        }

        try:
            user = request.user if request.user.is_authenticated else None
            execution = Execution.objects.create(
                workflow=workflow,
                status=Execution.STEP_PENDING,
                triggered_by=user,
            )

            run_workflow_task.delay(execution.id, trigger_data=trigger_data)

            return Response({
                "status": "success",
                "message": "Workflow triggered",
                "execution_id": execution.id
            }, status=status.HTTP_202_ACCEPTED)
        
        except Exception as e:
            return Response({
                "error": "Workflow execution failed",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

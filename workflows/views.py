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


# Create your views here.

# its literally same as webhook view (though it was first one i made xd)
@api_view(['POST'])
def workflow_execution_handler(request, workflow_id):
    get_object_or_404(WorkFlow, id=workflow_id)
    webhook_data = request.data
    run_workflow(workflow_id, trigger_data=webhook_data)
    return Response(f'Workflow {workflow_id} execution started.')


class WorkFlowListCreateView(ListCreateAPIView):
    queryset = WorkFlow.objects.all()
    serializer_class = WorkFlowSerializer


class WorkFlowDetailView(RetrieveUpdateDestroyAPIView):
    queryset = WorkFlow.objects.all()
    serializer_class = WorkFlowSerializer


class WorkFlowStepsListCreateView(ListCreateAPIView):
    def get_queryset(self):
        workflow_id = self.kwargs['workflow_id']
        queryset = WorkFlowStep.objects.filter(workflow_id=workflow_id)
        return queryset

    serializer_class = WorkFlowStepSerializer

    def perform_create(self, serializer):
        workflow_id = self.kwargs['workflow_id']
        serializer.save(workflow_id=workflow_id)


class ExecutionListView(ListAPIView):
    
    serializer_class = ExecutionSerializer
    pagination_class = DefaultPagination

    def get_queryset(self):
        queryset = Execution.objects.all()

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
    queryset = Execution.objects.all()
    serializer_class = ExecutionSerializer


class ExecutionRetryView(APIView):

    def post(self, request, execution_id):
        # If requested execution is not in failed state
        old_execution = get_object_or_404(Execution, id=execution_id)
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
        new_execution = Execution.objects.create(workflow=old_execution.workflow, status=Execution.STEP_PENDING)
        run_workflow_task.delay(new_execution.id)

        return Response(
            {"message" : "Execution retried successfully",
             "execution_id" : new_execution.id
            },
            status=status.HTTP_202_ACCEPTED
        )


class ExecutionStepLogsView(ListAPIView):
    serializer_class = ExecutionStepLogSerializer
    pagination_class = DefaultPagination

    def get_queryset(self):
        execution_id = self.kwargs['execution_id']
        queryset = ExecutionStepLog.objects.filter(execution_id=execution_id).order_by('step_number')
        return queryset
    

class WebHookTriggerView(APIView):

    def post(self, request, workflow_id):

        workflow = get_object_or_404(WorkFlow, id=workflow_id)    

        if not workflow.is_active:
            return Response({"error": "Workflow is inactive"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Merge body data at root level for easy access: {{trigger.field}}
        trigger_data = {
            **request.data,  # Body fields at root level coz variable resolving was failing
            # its convinient to have it direct access else we need to do trigger.data.field for each field
            # but after this we can directly do trigger.fielf
            "headers": dict(request.headers),
            "query_params": dict(request.query_params)
        }

        try:
            execution = Execution.objects.create(workflow=workflow, status=Execution.STEP_PENDING)

            run_workflow_task.delay(execution.id, trigger_data = trigger_data)

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
        

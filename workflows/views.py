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


# Create your views here.

@api_view(['POST'])
def workflow_execution_handler(request, workflow_id):
    get_object_or_404(WorkFlow, id=workflow_id)
    run_workflow(workflow_id)
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
        
        # Making a new execution
        new_execution = run_workflow(old_execution.workflow.id)
        if new_execution is None:
            return Response(
                {"error": "Workflow is inactive, cannot retry execution!"},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            {"message" : "Execution retried successfully",
             "execution_id" : new_execution.id
            },
            status=status.HTTP_201_CREATED
        )


class ExecutionStepLogsView(ListAPIView):
    serializer_class = ExecutionStepLogSerializer
    pagination_class = DefaultPagination

    def get_queryset(self):
        execution_id = self.kwargs['execution_id']
        queryset = ExecutionStepLog.objects.filter(execution_id=execution_id).order_by('step_number')
        return queryset

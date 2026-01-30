from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from workflows.services.executor import run_workflow
from rest_framework.decorators import api_view
from rest_framework.generics import ListCreateAPIView,RetrieveUpdateDestroyAPIView

from .models import WorkFlow, WorkFlowStep
from .serializers import WorkFlowSerializer, WorkFlowStepSerializer


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



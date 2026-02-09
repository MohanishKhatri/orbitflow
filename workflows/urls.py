from django.urls import path
from .views import workflow_execution_handler,WorkFlowListCreateView,WorkFlowDetailView,WorkFlowStepsListCreateView
from .views import ExecutionListView,ExecutionDetailView,ExecutionRetryView, ExecutionStepLogsView

urlpatterns=[
    path('workflows/<int:workflow_id>/execute/',workflow_execution_handler),
    path('workflows/', WorkFlowListCreateView.as_view()),
    path('workflows/<int:pk>/', WorkFlowDetailView.as_view()),
    path('workflows/<int:workflow_id>/steps/',WorkFlowStepsListCreateView.as_view()),
    path('workflows/executions/', ExecutionListView.as_view()),
    path('workflows/executions/<int:pk>/',  ExecutionDetailView.as_view()),
    path('workflows/executions/<int:execution_id>/retry/', ExecutionRetryView.as_view()),
    path('workflows/executions/<int:execution_id>/step-runs/', ExecutionStepLogsView.as_view())
]
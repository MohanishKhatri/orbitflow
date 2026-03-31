from django.urls import path
from .views import WorkFlowListCreateView,WorkFlowDetailView,WorkFlowStepsListCreateView
from .views import ExecutionListView,ExecutionDetailView,ExecutionRetryView, ExecutionStepLogsView, WebHookTriggerView

urlpatterns=[
    path('workflows/', WorkFlowListCreateView.as_view()),
    path('workflows/<int:pk>/', WorkFlowDetailView.as_view()),
    path('workflows/<int:workflow_id>/steps/',WorkFlowStepsListCreateView.as_view()),
    path('workflows/executions/', ExecutionListView.as_view()),
    path('workflows/executions/<int:pk>/',  ExecutionDetailView.as_view()),
    path('workflows/executions/<int:execution_id>/retry/', ExecutionRetryView.as_view()),
    path('workflows/executions/<int:execution_id>/step-runs/', ExecutionStepLogsView.as_view()),
    path('webhook/<int:workflow_id>/', WebHookTriggerView.as_view())
]
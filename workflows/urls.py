from django.urls import path
from .views import workflow_execution_handler,WorkFlowListCreateView,WorkFlowDetailView,WorkFlowStepsListCreateView

urlpatterns=[
    path('workflows/<int:workflow_id>/execute/',workflow_execution_handler),
    path('workflows/', WorkFlowListCreateView.as_view()),
    path('workflows/<int:pk>/', WorkFlowDetailView.as_view()),
    path('workflows/<int:workflow_id>/steps/',WorkFlowStepsListCreateView.as_view())
]
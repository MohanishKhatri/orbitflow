from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView

urlpatterns = [
    path('signup/', RegisterView.as_view(), name='auth_signup'),
    path('login/', TokenObtainPairView.as_view(), name='auth_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
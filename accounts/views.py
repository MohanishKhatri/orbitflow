from rest_framework import generics, permissions
from .models import CustomUser
from .serializers import RegisterSerializer

# Create your views here.

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer



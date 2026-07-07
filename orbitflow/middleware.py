from django.http import JsonResponse

class Api404Middleware:
    """
    Middleware to intercept 404 responses for API requests
    and return them as clean JSON objects instead of HTML pages.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        if response.status_code == 404 and request.path.startswith('/api/'):
            content_type = response.get('Content-Type', '')
            if 'text/html' in content_type:
                return JsonResponse({
                    'detail': f"The requested API path '{request.path}' was not found on this server."
                }, status=404)
            
        return response

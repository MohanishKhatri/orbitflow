import requests
from .registry import BaseStepRunner, STEP_REGISTRY

class HttpStepRunner(BaseStepRunner):


    def validate(self):
        if "url" not in self.config:
            raise ValueError("URL is required in config for HttpStepRunner")
        
        if "method" not in self.config:
            raise ValueError("HTTP method is required in config for HttpStepRunner")

    def execute(self):
        method = self.config["method"].upper()
        url = self.config["url"]
        payload = self.config.get("payload", {})
        headers = self.config.get("headers", {})

        print(f"Executing {method} on {url}")

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=payload)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=payload)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
        except requests.RequestException as e:
            raise RuntimeError(f"HTTP request failed: {e}")
                      
        if not response.ok:
            raise RuntimeError(f"HTTP {method} {url} failed with status: {response.status_code}")
        
        return {
            "status_code": response.status_code,
            "response_body": response.json() if response.content else {}
        }

STEP_REGISTRY['HTTP'] = HttpStepRunner

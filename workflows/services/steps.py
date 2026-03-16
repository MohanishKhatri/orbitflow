import requests
from django.core.mail import send_mail
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




class DiscordStepRunner(BaseStepRunner):

    def validate(self):
        if "url" not in self.config:
            raise ValueError("URL is required in cofig for DiscordStepRunner")
        if "content" not in self.config:
            raise ValueError("content is required for DiscordStepRunner")
        
    def execute(self):
        url= self.config["url"]
        content= self.config["content"]
        payload= { "content" : content}

        try:
            response = requests.post(url, json= payload)
        except requests.RequestException as e:
            raise RuntimeError(f"Discord webhook request failed: {e}")
        if not response.ok:
            raise RuntimeError(f"Webhook failed to execute: {response.status_code} - {response.text}")
        
        return {
            "status_code": response.status_code
        }
    
STEP_REGISTRY['DISCORD_WEBHOOK']= DiscordStepRunner



class EmailStepRunner(BaseStepRunner):

    def validate(self):
        if "sender_mail" not in self.config:
            raise ValueError("sender_mail is required in config for EmailStepRunner")
        if "sender_password" not in self.config:
            raise ValueError("sender_password is required in config for EmailStepRunner")
        if "receiver_mail" not in self.config:
            raise ValueError("receiver_mail is required in config for EmailStepRunner")
        if "subject" not in self.config:
            raise ValueError("subject is required in config for EmailStepRunner")
        if "body" not in self.config:
            raise ValueError("body is required in config for EmailStepRunner")
        
    def execute(self):
        subject = self.config["subject"]
        body = self.config["body"]
        sender_mail = self.config["sender_mail"]
        sender_password = self.config["sender_password"]
        receiver_mail = self.config["receiver_mail"]
        try:
            send_mail(
                subject, body, sender_mail, [receiver_mail],
                  auth_user=sender_mail, auth_password=sender_password, fail_silently=False
                )
            return {
            "status": "success",
            "message": f"Email sent successfully to {receiver_mail}"
        }

        except Exception as e:
            raise RuntimeError(f"Failed to send email: {e}")
        
STEP_REGISTRY['SMTP_EMAIL'] = EmailStepRunner


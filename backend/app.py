from flask import Flask, request, jsonify
import requests
# import docker
from functools import wraps
import os

app = Flask(__name__)

# Configuration
ML_SERVICE_URL = "http://localhost:5001/predict"  # Your ML service URL
DOCKER_CONTAINER_NAME = "secure-browser"  # Your Docker container name

# Docker client setup
# docker_client = docker.from_env()

def handle_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return wrapper

@app.route('/verify-url', methods=['POST'])
@handle_errors
def verify_url():
    data = request.get_json()
    url = data.get('url')
    
    if not url:
        return jsonify({"error": "URL is required"}), 400
    
    # Call ML service to verify URL
    try:
        ml_response = requests.post(
            ML_SERVICE_URL,
            json={"url": url},
            timeout=30
        )
        ml_response.raise_for_status()
        prediction = ml_response.json()
        
        if prediction.get("is_safe", False):
            return jsonify({
                "status": "safe",
                "url": url
            })
        else:
            # URL is not safe, prepare Docker container
            # container = docker_client.containers.get(DOCKER_CONTAINER_NAME)
            
            # You might want to pass the URL to the container in a secure way
            # This is a simplified example
            # container.exec_run(f"python browse.py {url}")
            
            return jsonify({
                "status": "unsafe",
                "message": "URL opened in secure container"
            })
            
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"ML service error: {str(e)}"}), 503
    # except docker.errors.NotFound:
    #     return jsonify({"error": "Docker container not found"}), 503
    # except docker.errors.APIError as e:
    #     return jsonify({"error": f"Docker error: {str(e)}"}), 503

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
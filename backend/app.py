from flask import Flask, request, jsonify
import requests
from functools import wraps

app = Flask(__name__)

# Configuration
ML_SERVICE_URL = "http://localhost:5000/predict"  # Corrected ML service URL

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
        
        return jsonify({
            "status": "safe" if not prediction.get("phishing", True) else "unsafe",
            "url": url
        })
            
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"ML service error: {str(e)}"}), 503

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

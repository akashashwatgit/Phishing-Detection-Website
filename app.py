from flask import Flask, request, jsonify
import numpy as np
import pickle
from urllib.parse import urlparse
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Load ML model
with open('mlp_model.pkl', 'rb') as file:
    loaded_model = pickle.load(file)

def have_at_sign(url):
    return 1 if "@" in url else 0

def get_length(url):
    return 1 if len(url) >= 54 else 0

def get_depth(url):
    return urlparse(url).path.count('/')

def redirection(url):
    return 1 if url.rfind('//') > 7 else 0

def http_domain(url):
    return 1 if 'https' in urlparse(url).netloc else 0

shortening_services = r"bit\.ly|goo\.gl|t\.co|tinyurl|shorte\.st|tr\.im"
def tiny_url(url):
    return 1 if re.search(shortening_services, url) else 0

def prefix_suffix(url):
    return 1 if '-' in urlparse(url).netloc else 0 

def extract_features(url):
    features = [
        have_at_sign(url),
        get_length(url),
        get_depth(url),
        redirection(url),
        http_domain(url),
        tiny_url(url),
        prefix_suffix(url)
    ]
    return features

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    url = data.get("url")
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    features = np.array([extract_features(url)])
    prediction = loaded_model.predict(features)[0]
    return jsonify({"phishing": bool(prediction == 0)})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

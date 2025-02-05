from flask import Flask, request, jsonify
import numpy as np
import pickle
from urllib.parse import urlparse
import requests
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Load ML model
with open('mlp_model.pkl', 'rb') as file:
    loaded_model = pickle.load(file)

def get_domain(url):  
    domain = urlparse(url).netloc
    return domain.replace("www.", "") if domain.startswith("www.") else domain

def have_at_sign(url):
    return 1 if "@" in url else 0

def get_length(url):
    return 1 if len(url) >= 54 else 0

def get_depth(url):
    return len([s for s in urlparse(url).path.split('/') if s])

def redirection(url):
    return 1 if url.rfind('//') > 7 else 0

def http_domain(url):
    return 1 if 'https' in urlparse(url).netloc else 0

def tiny_url(url):
    shortening_services = r"bit\.ly|goo\.gl|t\.co|tinyurl|shorte\.st|tr\.im"
    return 1 if re.search(shortening_services, url) else 0

def prefix_suffix(url):
    return 1 if '-' in urlparse(url).netloc else 0 

def web_traffic(url):
    try:
        response = requests.get("https://similar-web.p.rapidapi.com/get-analysis", 
                                headers={"X-RapidAPI-Key": "your_api_key"}, 
                                params={"domain": url})
        rank = int(response.json().get('GlobalRank', {}).get('Rank', 1))
    except:
        rank = 1
    return 1 if rank < 100000 else 0

def get_http_response(url):
    try:
        return requests.get(url, timeout=5)
    except:
        return None

def extract_features(url):
    features = [have_at_sign(url), get_length(url), get_depth(url), redirection(url),
                http_domain(url), tiny_url(url), prefix_suffix(url), web_traffic(url)]
    response = get_http_response(url)
    if response:
        features.extend([1 if re.search("<iframe>|<frameBorder>", response.text) else 0,
                         1 if re.search("<script>.+onmouseover.+</script>", response.text) else 0,
                         1 if "event.button == 2" in response.text else 0,
                         1 if len(response.history) > 2 else 0])
    else:
        features.extend([0, 0, 0, 0])
    return features

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    url = data.get("url")
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    features = extract_features(url)
    prediction = loaded_model.predict(np.array([features]))[0]
    return jsonify({"phishing": bool(prediction == 0)})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

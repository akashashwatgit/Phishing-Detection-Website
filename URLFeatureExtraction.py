import ipaddress
import re
import numpy as np
from urllib.parse import urlparse

def havingIP(url):
    try:
        ipaddress.ip_address(url)
        return 1
    except:
        return 0

def haveAtSign(url):
    return 1 if "@" in url else 0

def getLength(url):
    return 1 if len(url) >= 54 else 0

def getDepth(url):
    return urlparse(url).path.count('/')

def redirection(url):
    return 1 if url.rfind('//') > 7 else 0

def httpDomain(url):
    return 1 if "https" in urlparse(url).netloc else 0

shortening_services = r"bit\.ly|goo\.gl|tinyurl|t\.co|ow\.ly|is\.gd"
def tinyURL(url):
    return 1 if re.search(shortening_services, url) else 0

def prefixSuffix(url):
    return 1 if '-' in urlparse(url).netloc else 0

def featureExtraction(url):
    """ Extracts features from a URL for phishing detection. """
    features = [
        havingIP(url),
        haveAtSign(url),
        getLength(url),
        getDepth(url),
        redirection(url),
        httpDomain(url),
        tinyURL(url),
        prefixSuffix(url),
    ]
    return np.array(features).reshape(1, -1)

"""
Sample HTTP operations for testing outbound HTTP detection.
Contains various patterns: direct calls, environment URLs, dynamic compositions.
"""
import os
import requests
import httpx
import aiohttp
from urllib.request import urlopen
from urllib.parse import urljoin

# Direct HTTP calls
def fetch_data():
    """Direct requests.get() call."""
    response = requests.get('https://api.example.com/data')
    return response.json()


# Environment variable URLs
API_URL = os.getenv('API_URL', 'https://api.default.com')
WEBHOOK_URL = os.environ.get('WEBHOOK_URL')


def call_external_api():
    """Call using environment variable."""
    response = requests.get(API_URL)
    return response.json()


# F-string URL composition
def fetch_versioned_api(version):
    """Build URL with f-string."""
    api_host = os.getenv('API_HOST', 'api.example.com')
    url = f"https://{api_host}/v{version}/users"
    return requests.get(url)


# String concatenation
def call_service():
    """Build URL with concatenation."""
    base_url = os.getenv('SERVICE_URL', 'https://service.local')
    endpoint = '/api/v2/data'
    full_url = base_url + endpoint
    return requests.post(full_url, json={"action": "fetch"})


# Base URL + endpoint pattern
def api_call_with_base():
    """Use base_url + endpoint pattern."""
    base = os.getenv('BASE_URL', 'https://api.example.com')
    endpoints = {
        'users': '/users',
        'posts': '/posts',
        'comments': '/comments'
    }
    
    for resource, path in endpoints.items():
        url = base + path
        requests.get(url)


# Session-based calls (indirect)
def session_requests():
    """Session with environment URL."""
    session = requests.Session()
    session.headers.update({
        'Authorization': f"Bearer {os.getenv('API_KEY')}",
        'Content-Type': 'application/json'
    })
    
    api_base = os.environ.get('API_BASE', 'https://api.service.com')
    session.get(f"{api_base}/protected")
    session.post(f"{api_base}/submit", json={"data": "value"})


# httpx client calls
async def fetch_with_httpx():
    """httpx async calls."""
    async with httpx.AsyncClient() as client:
        url = os.getenv('HTTPX_URL', 'https://httpx-api.example.com')
        response = await client.get(url)
        return response.json()


# aiohttp usage
async def fetch_with_aiohttp():
    """aiohttp async calls."""
    async with aiohttp.ClientSession() as session:
        webhook = os.getenv('WEBHOOK_URL', 'https://webhook.service.com')
        async with session.post(webhook, json={"event": "trigger"}) as r:
            return await r.json()


# urllib usage
def urllib_calls():
    """urllib.request.urlopen."""
    url = os.getenv('URLLIB_URL', 'https://urllib-endpoint.local')
    response = urlopen(url)
    return response.read()


# URL building with urljoin
def build_api_url():
    """Construct URL with urljoin."""
    base = os.getenv('API_BASE', 'https://api.example.com/')
    endpoint = 'v1/users'
    full_url = urljoin(base, endpoint)
    return requests.get(full_url)


# Complex dynamic URL
def dynamic_api_call(region, resource_id):
    """Complex dynamic URL construction."""
    region_url = os.getenv(f'API_URL_{region.upper()}', f'https://api-{region}.example.com')
    
    # F-string with variables
    url = f"{region_url}/api/v2/resources/{resource_id}"
    
    # Add query params
    url = url + f"?client_id={os.getenv('CLIENT_ID')}"
    
    return requests.get(url)


# Client pattern (indirect)
class APIClient:
    def __init__(self):
        self.base_url = os.getenv('API_BASE_URL', 'https://api.example.com')
        self.client = requests.Session()
    
    def get_users(self):
        """Indirect HTTP call through method."""
        url = f"{self.base_url}/users"
        return self.client.get(url)
    
    def create_resource(self, name):
        """POST via client object."""
        url = self.base_url + "/resources"
        return self.client.post(url, json={"name": name})


# Method chaining
def chained_requests():
    """Chained HTTP operations."""
    api_url = os.environ.get('CHAINED_API_URL', 'https://api.chain.local')
    
    # First call
    users = requests.get(f"{api_url}/users").json()
    
    # Second call using first result
    for user in users:
        requests.get(f"{api_url}/users/{user['id']}/profile")

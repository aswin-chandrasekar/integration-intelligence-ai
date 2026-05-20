import requests
# Trigger a scan for the cloned folder repository
res = requests.post("http://127.0.0.1:5000/api/scan", json={
    "repo_path": "c:\\Users\\aswin.chandrasekar\\Desktop\\integration-intelligence-ai\\data\\clones\\integration-intelligence-ai"
})
print("Scan Response Status:", res.status_code)
print("Scan Response Body:", res.json())

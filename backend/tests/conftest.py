"""
Pytest configuration and fixtures for integration detection tests.
"""
import pytest
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))


@pytest.fixture
def sample_http_file():
    """Fixture providing path to sample HTTP operations file."""
    return str(Path(__file__).parent / "sample_repos" / "sample_http_ops.py")


@pytest.fixture
def sample_flask_file():
    """Fixture providing path to sample Flask app file."""
    return str(Path(__file__).parent / "sample_repos" / "sample_flask_app.py")


@pytest.fixture
def sample_db_file():
    """Fixture providing path to sample database operations file."""
    return str(Path(__file__).parent / "sample_repos" / "sample_db_ops.py")


@pytest.fixture
def sample_file_file():
    """Fixture providing path to sample file operations file."""
    return str(Path(__file__).parent / "sample_repos" / "sample_file_ops.py")


@pytest.fixture
def golden_http_output():
    """Fixture providing golden reference output for HTTP parser."""
    import json
    golden_path = Path(__file__).parent / "golden_outputs" / "http_ops_expected.json"
    if golden_path.exists():
        with open(golden_path, 'r') as f:
            return json.load(f)
    return None


@pytest.fixture
def golden_flask_output():
    """Fixture providing golden reference output for Flask parser."""
    import json
    golden_path = Path(__file__).parent / "golden_outputs" / "flask_app_expected.json"
    if golden_path.exists():
        with open(golden_path, 'r') as f:
            return json.load(f)
    return None


@pytest.fixture
def golden_db_output():
    """Fixture providing golden reference output for DB parser."""
    import json
    golden_path = Path(__file__).parent / "golden_outputs" / "db_ops_expected.json"
    if golden_path.exists():
        with open(golden_path, 'r') as f:
            return json.load(f)
    return None


@pytest.fixture
def golden_file_output():
    """Fixture providing golden reference output for file parser."""
    import json
    golden_path = Path(__file__).parent / "golden_outputs" / "file_ops_expected.json"
    if golden_path.exists():
        with open(golden_path, 'r') as f:
            return json.load(f)
    return None


@pytest.fixture
def sample_edges():
    """Fixture providing sample integration edges."""
    return [
        {"source": "UserService", "target": "PaymentAPI", "type": "SYNC_API"},
        {"source": "UserService", "target": "EmailService", "type": "SYNC_API"},
        {"source": "UserService", "target": "AnalyticsDB", "type": "DB"},
        {"source": "OrderService", "target": "InventoryService", "type": "SYNC_API"},
        {"source": "OrderService", "target": "PaymentService", "type": "SYNC_API"},
        {"source": "OrderService", "target": "OrderDB", "type": "DB"},
        {"source": "APIGateway", "target": "UserService", "type": "SYNC_API"},
        {"source": "APIGateway", "target": "OrderService", "type": "SYNC_API"},
    ]


def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "parser: mark test as parser test"
    )
    config.addinivalue_line(
        "markers", "engine: mark test as recommendation/risk engine test"
    )
    config.addinivalue_line(
        "markers", "golden: mark test as golden output comparison test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as full integration test"
    )

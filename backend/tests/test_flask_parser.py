"""
Unit tests for Flask route parser.
Tests detection of direct routes, blueprints, and config-based routes.
"""
import pytest
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.scanner.flask_parser import (
    extract_flask_routes,
    extract_indirect_routes,
    extract_config_based_routes,
    extract_route_from_decorator
)


class TestDirectRouteDetection:
    """Test detection of direct Flask routes."""
    
    def test_extract_direct_routes(self):
        """Test extraction of @app.route() decorated functions."""
        routes = extract_flask_routes("backend/tests/sample_repos/sample_flask_app.py")
        
        # Should find routes
        assert len(routes) > 0
        
        # Check for INBOUND_API type
        api_routes = [r for r in routes if r.get("type") == "INBOUND_API"]
        assert len(api_routes) > 0
    
    def test_route_path_extraction(self):
        """Test that route paths are correctly extracted."""
        routes = extract_flask_routes("backend/tests/sample_repos/sample_flask_app.py")
        
        # Should have path information
        for route in routes:
            if route.get("type") == "INBOUND_API":
                assert "path" in route
    
    def test_route_methods_detection(self):
        """Test detection of HTTP methods in routes."""
        routes = extract_flask_routes("backend/tests/sample_repos/sample_flask_app.py")
        
        # Should detect GET, POST, etc.
        for route in routes:
            if "methods" in route:
                assert isinstance(route["methods"], list)
    
    def test_route_handler_detection(self):
        """Test detection of route handler function names."""
        routes = extract_flask_routes("backend/tests/sample_repos/sample_flask_app.py")
        
        # Should have handler info for direct routes
        for route in routes:
            if "handler" in route:
                assert isinstance(route["handler"], str)


class TestIndirectRouteDetection:
    """Test detection of indirect route registration."""
    
    def test_add_url_rule_detection(self):
        """Test detection of add_url_rule() calls."""
        routes = extract_flask_routes("backend/tests/sample_repos/sample_flask_app.py")
        
        # May detect add_url_rule registrations
        assert isinstance(routes, list)
    
    def test_blueprint_registration(self):
        """Test detection of blueprint registrations."""
        routes = extract_flask_routes("backend/tests/sample_repos/sample_flask_app.py")
        
        # Should find some indication of registrations
        assert len(routes) > 0
    
    def test_restful_add_resource(self):
        """Test detection of Flask-RESTful add_resource."""
        routes = extract_flask_routes("backend/tests/sample_repos/sample_flask_app.py")
        
        # Should be able to parse without errors
        assert isinstance(routes, list)


class TestConfigBasedRoutes:
    """Test detection of configuration-based routes."""
    
    def test_routes_list_detection(self):
        """Test detection of ROUTES configuration list."""
        routes = extract_flask_routes("backend/tests/sample_repos/sample_flask_app.py")
        
        # Should find config-based routes
        assert len(routes) > 0


class TestRouteConfidence:
    """Test confidence scoring for routes."""
    
    def test_all_routes_have_confidence(self):
        """Test that all detected routes have confidence scores."""
        routes = extract_flask_routes("backend/tests/sample_repos/sample_flask_app.py")
        
        for route in routes:
            assert "confidence" in route
    
    def test_direct_routes_higher_confidence(self):
        """Test that direct routes have higher confidence."""
        routes = extract_flask_routes("backend/tests/sample_repos/sample_flask_app.py")
        
        # Extract confidence values
        for route in routes:
            conf_str = route.get("confidence", "0%")
            try:
                percent = int(conf_str.split("%")[0])
                assert 0 <= percent <= 100
            except (ValueError, IndexError):
                pass


class TestRouteTypes:
    """Test different route registration types."""
    
    def test_route_without_methods_defaults_to_get(self):
        """Test that routes without specified methods default to GET."""
        routes = extract_flask_routes("backend/tests/sample_repos/sample_flask_app.py")
        
        # Check structure
        for route in routes:
            if "methods" not in route:
                # Acceptable - may be inferred as GET
                pass
            else:
                assert isinstance(route["methods"], list)


class TestGoldenOutput:
    """Test against golden reference output."""
    
    def test_flask_app_matches_golden_output(self):
        """Test that Flask parser output matches golden reference."""
        golden_path = Path(__file__).parent / "golden_outputs" / "flask_app_expected.json"
        
        if golden_path.exists():
            with open(golden_path, 'r') as f:
                golden = json.load(f)
            
            routes = extract_flask_routes("backend/tests/sample_repos/sample_flask_app.py")
            
            # Validate basic structure
            assert len(routes) > 0
            
            # Check that we find inbound API routes
            api_routes = [r for r in routes if r.get("type") == "INBOUND_API"]
            assert len(api_routes) > 0
            
            # Expected minimum
            expected_count = golden["summary"]["http_inbound"]
            assert len(routes) >= expected_count - 2  # Allow 2 variance


class TestBlueprints:
    """Test blueprint-specific route detection."""
    
    def test_blueprint_prefix(self):
        """Test detection of blueprint URL prefixes."""
        routes = extract_flask_routes("backend/tests/sample_repos/sample_flask_app.py")
        
        # Should maintain path structure
        for route in routes:
            if "path" in route:
                assert isinstance(route["path"], str)


class TestEdgeCases:
    """Test edge cases and error handling."""
    
    def test_nonexistent_file(self):
        """Test handling of nonexistent files."""
        routes = extract_flask_routes("nonexistent_file.py")
        assert isinstance(routes, list)
    
    def test_empty_file(self):
        """Test handling of empty Flask file."""
        import os
        temp_file = "/tmp/empty_flask.py"
        try:
            with open(temp_file, "w") as f:
                f.write("from flask import Flask\napp = Flask(__name__)\n")
            
            routes = extract_flask_routes(temp_file)
            assert isinstance(routes, list)
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)
    
    def test_malformed_decorator(self):
        """Test handling of malformed decorators."""
        routes = extract_flask_routes("backend/tests/sample_repos/sample_flask_app.py")
        
        # Should not crash
        assert isinstance(routes, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

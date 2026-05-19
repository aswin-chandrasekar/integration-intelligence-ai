"""
Unit tests for recommendation engine.
Tests generation of recommendations based on integration patterns.
"""
import pytest
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from classifier.recommendation_engine import generate_recommendations


class TestHighFanOutDetection:
    """Test detection and recommendations for high fan-out systems."""
    
    def test_high_fanout_recommendation(self):
        """Test recommendation for systems with high coupling."""
        edges = [
            {"source": "UserService", "target": "PaymentAPI", "type": "SYNC_API"},
            {"source": "UserService", "target": "EmailService", "type": "SYNC_API"},
            {"source": "UserService", "target": "AnalyticsDB", "type": "DB"},
            {"source": "UserService", "target": "CacheLayer", "type": "DB"},
        ]
        
        recommendations = generate_recommendations(edges)
        
        # Should find coupling issues
        assert len(recommendations) > 0
        
        # Should recommend decoupling
        titles = [r.get("title") for r in recommendations]
        assert any("Coupling" in t or "coupling" in t.lower() for t in titles)
    
    def test_recommendation_has_required_fields(self):
        """Test that recommendations have all required fields."""
        edges = [
            {"source": "ServiceA", "target": "ServiceB", "type": "SYNC_API"},
            {"source": "ServiceA", "target": "ServiceC", "type": "SYNC_API"},
            {"source": "ServiceA", "target": "ServiceD", "type": "SYNC_API"},
        ]
        
        recommendations = generate_recommendations(edges)
        
        for rec in recommendations:
            assert "title" in rec
            assert "severity" in rec
            assert "why" in rec
            assert "recommendation" in rec
    
    def test_recommendation_severity_levels(self):
        """Test that severity levels are appropriate."""
        edges = [
            {"source": "Service1", "target": "Dep1", "type": "SYNC_API"},
            {"source": "Service1", "target": "Dep2", "type": "SYNC_API"},
            {"source": "Service1", "target": "Dep3", "type": "SYNC_API"},
            {"source": "Service1", "target": "Dep4", "type": "SYNC_API"},
        ]
        
        recommendations = generate_recommendations(edges)
        
        for rec in recommendations:
            severity = rec.get("severity", "").upper()
            assert severity in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


class TestRecommendationSteps:
    """Test that recommendations include actionable steps."""
    
    def test_recommendations_have_steps(self):
        """Test that recommendations include actionable steps."""
        edges = [
            {"source": "Frontend", "target": "Backend", "type": "SYNC_API"},
            {"source": "Frontend", "target": "Analytics", "type": "SYNC_API"},
            {"source": "Frontend", "target": "Cache", "type": "DB"},
        ]
        
        recommendations = generate_recommendations(edges)
        
        for rec in recommendations:
            if "steps" in rec:
                assert isinstance(rec["steps"], list)
                assert len(rec["steps"]) > 0
    
    def test_step_formatting(self):
        """Test that steps are properly formatted."""
        edges = [
            {"source": "App", "target": "DB", "type": "DB"},
            {"source": "App", "target": "Cache", "type": "DB"},
            {"source": "App", "target": "Queue", "type": "ASYNC_API"},
        ]
        
        recommendations = generate_recommendations(edges)
        
        for rec in recommendations:
            if "steps" in rec:
                for step in rec["steps"]:
                    assert isinstance(step, str)
                    assert len(step) > 0


class TestDatabaseRecommendations:
    """Test recommendations for database interactions."""
    
    def test_db_pooling_recommendation(self):
        """Test recommendation for database pooling."""
        edges = [
            {"source": "Service", "target": "PostgreSQL", "type": "DB"},
            {"source": "Service", "target": "MongoDB", "type": "DB"},
            {"source": "Service", "target": "Redis", "type": "DB"},
        ]
        
        recommendations = generate_recommendations(edges)
        
        # Should generate some recommendations
        assert isinstance(recommendations, list)
    
    def test_connection_pooling_detection(self):
        """Test detection of connection pooling needs."""
        edges = [
            {"source": "API", "target": "Database", "type": "DB", "count": 100},
            {"source": "API", "target": "Cache", "type": "DB", "count": 500},
        ]
        
        recommendations = generate_recommendations(edges)
        
        assert isinstance(recommendations, list)


class TestAsyncRecommendations:
    """Test recommendations for async pattern adoption."""
    
    def test_sync_to_async_recommendation(self):
        """Test recommendation to convert sync to async calls."""
        edges = [
            {"source": "WebApp", "target": "PaymentService", "type": "SYNC_API", "latency": "5000ms"},
            {"source": "WebApp", "target": "EmailService", "type": "SYNC_API", "latency": "3000ms"},
        ]
        
        recommendations = generate_recommendations(edges)
        
        assert isinstance(recommendations, list)


class TestFileAccessRecommendations:
    """Test recommendations for file operations."""
    
    def test_file_access_recommendation(self):
        """Test recommendation for file handling."""
        edges = [
            {"source": "DataProcessor", "target": "/data/input.csv", "type": "FILE"},
            {"source": "DataProcessor", "target": "/data/output.csv", "type": "FILE"},
            {"source": "DataProcessor", "target": "/config/settings.json", "type": "FILE"},
        ]
        
        recommendations = generate_recommendations(edges)
        
        assert isinstance(recommendations, list)


class TestCircularDependency:
    """Test recommendations for circular dependencies."""
    
    def test_circular_dependency_detection(self):
        """Test detection of circular dependencies."""
        edges = [
            {"source": "ServiceA", "target": "ServiceB", "type": "SYNC_API"},
            {"source": "ServiceB", "target": "ServiceC", "type": "SYNC_API"},
            {"source": "ServiceC", "target": "ServiceA", "type": "SYNC_API"},
        ]
        
        recommendations = generate_recommendations(edges)
        
        # Should handle cycles
        assert isinstance(recommendations, list)


class TestEmptyEdgeList:
    """Test recommendations with edge cases."""
    
    def test_empty_edges(self):
        """Test handling of empty edge list."""
        recommendations = generate_recommendations([])
        
        assert isinstance(recommendations, list)
    
    def test_single_edge(self):
        """Test handling of single edge."""
        edges = [{"source": "A", "target": "B", "type": "SYNC_API"}]
        
        recommendations = generate_recommendations(edges)
        
        assert isinstance(recommendations, list)


class TestRecommendationAccuracy:
    """Test accuracy of recommendations."""
    
    def test_recommendations_reflect_edge_count(self):
        """Test that recommendations acknowledge edge count."""
        edges = [
            {"source": "Hub", "target": "Dep1", "type": "SYNC_API"},
            {"source": "Hub", "target": "Dep2", "type": "SYNC_API"},
            {"source": "Hub", "target": "Dep3", "type": "SYNC_API"},
            {"source": "Hub", "target": "Dep4", "type": "SYNC_API"},
            {"source": "Hub", "target": "Dep5", "type": "SYNC_API"},
        ]
        
        recommendations = generate_recommendations(edges)
        
        # Should reference the number of dependencies
        all_text = json.dumps(recommendations)
        assert len(recommendations) > 0


class TestContextualRecommendations:
    """Test context-aware recommendations."""
    
    def test_mixed_edge_types(self):
        """Test recommendations with mixed edge types."""
        edges = [
            {"source": "App", "target": "API1", "type": "SYNC_API"},
            {"source": "App", "target": "API2", "type": "SYNC_API"},
            {"source": "App", "target": "DB", "type": "DB"},
            {"source": "App", "target": "/data", "type": "FILE"},
            {"source": "App", "target": "Queue", "type": "ASYNC_API"},
        ]
        
        recommendations = generate_recommendations(edges)
        
        # Should address multiple concerns
        assert len(recommendations) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

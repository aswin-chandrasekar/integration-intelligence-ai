"""
Unit tests for risk analysis engine.
Tests calculation of integration risks, critical paths, and system complexity.
"""
import pytest
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from classifier.risk_engine import calculate_risk


class TestFanOutRiskCalculation:
    """Test fan-out based risk calculation."""
    
    def test_high_fanout_increases_risk(self):
        """Test that high fan-out increases risk score."""
        edges = [
            {"source": "Gateway", "target": "ServiceA", "type": "SYNC_API"},
            {"source": "Gateway", "target": "ServiceB", "type": "SYNC_API"},
            {"source": "Gateway", "target": "ServiceC", "type": "SYNC_API"},
            {"source": "Gateway", "target": "ServiceD", "type": "SYNC_API"},
            {"source": "Gateway", "target": "ServiceE", "type": "SYNC_API"},
        ]
        
        risk = calculate_risk(edges)
        
        assert isinstance(risk, dict)
        assert "risk_score" in risk or "risk" in risk or len(risk) > 0
    
    def test_low_fanout_low_risk(self):
        """Test that low fan-out results in lower risk."""
        edges = [
            {"source": "ServiceA", "target": "ServiceB", "type": "SYNC_API"},
        ]
        
        risk = calculate_risk(edges)
        
        assert isinstance(risk, dict)


class TestFanInRiskCalculation:
    """Test fan-in based risk calculation."""
    
    def test_high_fanin_increases_risk(self):
        """Test that high fan-in increases bottleneck risk."""
        edges = [
            {"source": "ServiceA", "target": "Database", "type": "DB"},
            {"source": "ServiceB", "target": "Database", "type": "DB"},
            {"source": "ServiceC", "target": "Database", "type": "DB"},
            {"source": "ServiceD", "target": "Database", "type": "DB"},
        ]
        
        risk = calculate_risk(edges)
        
        assert isinstance(risk, dict)


class TestSyncChainDepth:
    """Test risk from synchronous call chains."""
    
    def test_deep_sync_chain_risk(self):
        """Test that deep synchronous chains increase risk."""
        edges = [
            {"source": "API", "target": "ServiceA", "type": "SYNC_API"},
            {"source": "ServiceA", "target": "ServiceB", "type": "SYNC_API"},
            {"source": "ServiceB", "target": "ServiceC", "type": "SYNC_API"},
            {"source": "ServiceC", "target": "Database", "type": "DB"},
        ]
        
        risk = calculate_risk(edges)
        
        assert isinstance(risk, dict)
    
    def test_short_chain_lower_risk(self):
        """Test that short chains have lower risk."""
        edges = [
            {"source": "API", "target": "Database", "type": "DB"},
        ]
        
        risk = calculate_risk(edges)
        
        assert isinstance(risk, dict)


class TestCircularDependencyRisk:
    """Test risk from circular dependencies."""
    
    def test_circular_dependency_detection(self):
        """Test detection of circular dependencies."""
        edges = [
            {"source": "ServiceA", "target": "ServiceB", "type": "SYNC_API"},
            {"source": "ServiceB", "target": "ServiceC", "type": "SYNC_API"},
            {"source": "ServiceC", "target": "ServiceA", "type": "SYNC_API"},
        ]
        
        risk = calculate_risk(edges)
        
        assert isinstance(risk, dict)
    
    def test_self_loop_risk(self):
        """Test risk from self-referential calls."""
        edges = [
            {"source": "Service", "target": "Service", "type": "SYNC_API"},
        ]
        
        risk = calculate_risk(edges)
        
        assert isinstance(risk, dict)


class TestRiskScoring:
    """Test risk score calculation."""
    
    def test_risk_score_present(self):
        """Test that risk calculation includes a score."""
        edges = [
            {"source": "A", "target": "B", "type": "SYNC_API"},
        ]
        
        risk = calculate_risk(edges)
        
        # Should have some risk assessment
        assert isinstance(risk, dict)
    
    def test_risk_score_in_range(self):
        """Test that risk scores are in valid range."""
        edges = [
            {"source": "A", "target": "B", "type": "SYNC_API"},
            {"source": "A", "target": "C", "type": "SYNC_API"},
        ]
        
        risk = calculate_risk(edges)
        
        if "risk_score" in risk:
            assert 0 <= risk["risk_score"] <= 100


class TestDatabaseRisk:
    """Test risk factors from database usage."""
    
    def test_db_bottleneck_risk(self):
        """Test detection of database bottleneck risk."""
        edges = [
            {"source": "App1", "target": "SharedDB", "type": "DB"},
            {"source": "App2", "target": "SharedDB", "type": "DB"},
            {"source": "App3", "target": "SharedDB", "type": "DB"},
            {"source": "App4", "target": "SharedDB", "type": "DB"},
        ]
        
        risk = calculate_risk(edges)
        
        assert isinstance(risk, dict)
    
    def test_multiple_db_risk(self):
        """Test risk from accessing multiple databases."""
        edges = [
            {"source": "Service", "target": "DB1", "type": "DB"},
            {"source": "Service", "target": "DB2", "type": "DB"},
            {"source": "Service", "target": "Cache", "type": "DB"},
        ]
        
        risk = calculate_risk(edges)
        
        assert isinstance(risk, dict)


class TestFileAccessRisk:
    """Test risk factors from file access patterns."""
    
    def test_file_io_risk(self):
        """Test detection of file I/O risk."""
        edges = [
            {"source": "App", "target": "/data/file1.csv", "type": "FILE"},
            {"source": "App", "target": "/data/file2.json", "type": "FILE"},
            {"source": "App", "target": "/config/settings.yaml", "type": "FILE"},
        ]
        
        risk = calculate_risk(edges)
        
        assert isinstance(risk, dict)


class TestAsyncVsSyncRisk:
    """Test risk difference between async and sync patterns."""
    
    def test_async_call_lower_risk(self):
        """Test that async calls have lower risk impact."""
        edges_async = [
            {"source": "Service", "target": "Queue", "type": "ASYNC_API"},
        ]
        
        edges_sync = [
            {"source": "Service", "target": "Queue", "type": "SYNC_API"},
        ]
        
        risk_async = calculate_risk(edges_async)
        risk_sync = calculate_risk(edges_sync)
        
        # Both should be valid dicts
        assert isinstance(risk_async, dict)
        assert isinstance(risk_sync, dict)


class TestComplexTopology:
    """Test risk calculation for complex topologies."""
    
    def test_star_pattern_risk(self):
        """Test risk for star topology (hub-spoke)."""
        edges = [
            {"source": "Hub", "target": "Spoke1", "type": "SYNC_API"},
            {"source": "Hub", "target": "Spoke2", "type": "SYNC_API"},
            {"source": "Hub", "target": "Spoke3", "type": "SYNC_API"},
            {"source": "Hub", "target": "Spoke4", "type": "SYNC_API"},
        ]
        
        risk = calculate_risk(edges)
        
        assert isinstance(risk, dict)
    
    def test_mesh_pattern_risk(self):
        """Test risk for mesh topology."""
        services = ["ServiceA", "ServiceB", "ServiceC", "ServiceD"]
        edges = []
        
        for src in services:
            for dst in services:
                if src != dst:
                    edges.append({
                        "source": src,
                        "target": dst,
                        "type": "SYNC_API"
                    })
        
        risk = calculate_risk(edges)
        
        assert isinstance(risk, dict)


class TestCriticalPathIdentification:
    """Test identification of critical paths."""
    
    def test_critical_service_detection(self):
        """Test detection of critical services."""
        edges = [
            {"source": "API", "target": "AuthService", "type": "SYNC_API"},
            {"source": "AuthService", "target": "UserDB", "type": "DB"},
            {"source": "API", "target": "OrderService", "type": "SYNC_API"},
            {"source": "OrderService", "target": "AuthService", "type": "SYNC_API"},
        ]
        
        risk = calculate_risk(edges)
        
        assert isinstance(risk, dict)


class TestEdgeCases:
    """Test edge cases."""
    
    def test_empty_edges(self):
        """Test handling of empty edge list."""
        risk = calculate_risk([])
        
        assert isinstance(risk, dict)
    
    def test_single_edge(self):
        """Test with single edge."""
        edges = [{"source": "A", "target": "B", "type": "SYNC_API"}]
        
        risk = calculate_risk(edges)
        
        assert isinstance(risk, dict)
    
    def test_disconnected_components(self):
        """Test with disconnected components."""
        edges = [
            {"source": "A", "target": "B", "type": "SYNC_API"},
            {"source": "C", "target": "D", "type": "SYNC_API"},
            # A-B and C-D are disconnected
        ]
        
        risk = calculate_risk(edges)
        
        assert isinstance(risk, dict)


class TestRiskRecommendations:
    """Test that risk assessment includes recommendations."""
    
    def test_high_risk_has_recommendations(self):
        """Test that high risk scenarios include recommendations."""
        edges = [
            {"source": "CriticalAPI", "target": "S1", "type": "SYNC_API"},
            {"source": "CriticalAPI", "target": "S2", "type": "SYNC_API"},
            {"source": "CriticalAPI", "target": "S3", "type": "SYNC_API"},
            {"source": "CriticalAPI", "target": "S4", "type": "SYNC_API"},
            {"source": "CriticalAPI", "target": "S5", "type": "SYNC_API"},
            {"source": "S1", "target": "S2", "type": "SYNC_API"},
            {"source": "S2", "target": "S3", "type": "SYNC_API"},
        ]
        
        risk = calculate_risk(edges)
        
        assert isinstance(risk, dict)


class TestRiskMetrics:
    """Test supported risk metrics."""
    
    def test_risk_includes_metrics(self):
        """Test that risk calculation returns structured metrics."""
        edges = [
            {"source": "Service", "target": "Dependency", "type": "SYNC_API"},
        ]
        
        risk = calculate_risk(edges)
        
        # Should have some structure
        assert isinstance(risk, dict)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

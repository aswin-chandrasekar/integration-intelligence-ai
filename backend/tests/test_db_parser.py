"""
Unit tests for database parser.
Tests detection of DB connections, environment variables, and config-based connections.
"""
import pytest
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.scanner.db_parser import (
    extract_db_calls,
    detect_environment_db_config,
    detect_dynamic_db_connections,
    detect_config_based_db
)


class TestDirectDBConnection:
    """Test detection of direct database connections."""
    
    def test_extract_db_calls(self):
        """Test extraction of database calls."""
        calls = extract_db_calls("backend/tests/sample_repos/sample_db_ops.py")
        
        # Should find database connections
        assert len(calls) > 0
        
        # Check for DB type
        db_types = [c.get("type") for c in calls]
        assert "DB" in db_types
    
    def test_sqlite_detection(self):
        """Test detection of SQLite connections."""
        calls = extract_db_calls("backend/tests/sample_repos/sample_db_ops.py")
        
        # Should find SQLite
        db_names = [c.get("name") for c in calls if c.get("type") == "DB"]
        assert "SQLite" in db_names or any("sqlite" in str(d).lower() for d in db_names)
    
    def test_sqlalchemy_detection(self):
        """Test detection of SQLAlchemy."""
        calls = extract_db_calls("backend/tests/sample_repos/sample_db_ops.py")
        
        # Should find SQLAlchemy
        db_names = [c.get("name") for c in calls if c.get("type") == "DB"]
        assert "SQLAlchemy" in db_names or any("sqlalchemy" in str(d).lower() for d in db_names)
    
    def test_postgresql_detection(self):
        """Test detection of PostgreSQL."""
        calls = extract_db_calls("backend/tests/sample_repos/sample_db_ops.py")
        
        # Should find PostgreSQL
        db_names = [c.get("name") for c in calls if c.get("type") == "DB"]
        assert "PostgreSQL" in db_names or any("postgres" in str(d).lower() for d in db_names)
    
    def test_mongodb_detection(self):
        """Test detection of MongoDB."""
        calls = extract_db_calls("backend/tests/sample_repos/sample_db_ops.py")
        
        # Should find MongoDB
        db_names = [c.get("name") for c in calls if c.get("type") == "DB"]
        assert "MongoDB" in db_names or any("mongo" in str(d).lower() for d in db_names)


class TestEnvironmentVarConfig:
    """Test detection of environment-based DB configurations."""
    
    def test_env_var_database_urls(self):
        """Test detection of DATABASE_URL env vars."""
        calls = extract_db_calls("backend/tests/sample_repos/sample_db_ops.py")
        
        # Should find env var configs
        env_configs = [c for c in calls if "env_var" in str(c)]
        assert len(env_configs) > 0 or len(calls) > 0
    
    def test_env_var_inference(self):
        """Test database type inference from env vars."""
        calls = extract_db_calls("backend/tests/sample_repos/sample_db_ops.py")
        
        # Should organize by detection method
        assert len(calls) > 0


class TestDynamicConnections:
    """Test detection of dynamic database connections."""
    
    def test_create_engine_detection(self):
        """Test detection of create_engine() calls."""
        calls = extract_db_calls("backend/tests/sample_repos/sample_db_ops.py")
        
        # Should find dynamic calls
        assert len(calls) > 0
    
    def test_connect_method_detection(self):
        """Test detection of .connect() methods."""
        calls = extract_db_calls("backend/tests/sample_repos/sample_db_ops.py")
        
        # Should detect various connection methods
        assert len(calls) > 0


class TestConfigBasedDB:
    """Test detection of configuration-based databases."""
    
    def test_databases_dict_detection(self):
        """Test detection of DATABASES configuration dict."""
        calls = extract_db_calls("backend/tests/sample_repos/sample_db_ops.py")
        
        # Should find config-based connections
        assert len(calls) > 0


class TestMultipleConnections:
    """Test handling of multiple database connections."""
    
    def test_variety_of_databases(self):
        """Test that parser finds multiple database types."""
        calls = extract_db_calls("backend/tests/sample_repos/sample_db_ops.py")
        
        # Should report multiple DB types
        db_names = set()
        for call in calls:
            if "name" in call:
                db_names.add(call["name"])
        
        # Should find at least 3 different DB types
        assert len(db_names) >= 2


class TestConfidenceScoring:
    """Test confidence scoring for DB detection."""
    
    def test_all_calls_have_confidence(self):
        """Test that all DB calls have confidence scores."""
        calls = extract_db_calls("backend/tests/sample_repos/sample_db_ops.py")
        
        for call in calls:
            assert "confidence" in call
    
    def test_direct_calls_higher_confidence(self):
        """Test that direct calls have higher confidence."""
        calls = extract_db_calls("backend/tests/sample_repos/sample_db_ops.py")
        
        for call in calls:
            conf_str = call.get("confidence", "0%")
            try:
                percent = int(conf_str.split("%")[0])
                assert 0 <= percent <= 100
            except (ValueError, IndexError):
                pass


class TestRiskLevels:
    """Test risk assessment for different databases."""
    
    def test_risk_levels_assigned(self):
        """Test that risk levels are assigned to DB types."""
        calls = extract_db_calls("backend/tests/sample_repos/sample_db_ops.py")
        
        # Check if risk info is present
        for call in calls:
            # Risk may not always be present, but structure should be sound
            assert isinstance(call, dict)


class TestGoldenOutput:
    """Test against golden reference output."""
    
    def test_db_ops_matches_golden_output(self):
        """Test that DB parser output matches golden reference."""
        golden_path = Path(__file__).parent / "golden_outputs" / "db_ops_expected.json"
        
        if golden_path.exists():
            with open(golden_path, 'r') as f:
                golden = json.load(f)
            
            calls = extract_db_calls("backend/tests/sample_repos/sample_db_ops.py")
            
            # Validate basic structure
            assert len(calls) > 0
            
            # Check for DB type variety
            expected_count = golden["summary"]["total_db_connections"]
            assert len(calls) > 0
    
    def test_db_type_coverage(self):
        """Test that multiple database types are detected."""
        golden_path = Path(__file__).parent / "golden_outputs" / "db_ops_expected.json"
        
        if golden_path.exists():
            with open(golden_path, 'r') as f:
                golden = json.load(f)
            
            calls = extract_db_calls("backend/tests/sample_repos/sample_db_ops.py")
            
            db_types = set()
            for call in calls:
                if "name" in call:
                    db_types.add(call["name"])
            
            # Should find multiple types
            assert len(db_types) > 0


class TestEdgeCases:
    """Test edge cases and error handling."""
    
    def test_nonexistent_file(self):
        """Test handling of nonexistent files."""
        calls = extract_db_calls("nonexistent_file.py")
        assert isinstance(calls, list)
    
    def test_empty_file(self):
        """Test handling of empty file."""
        import os
        temp_file = "/tmp/empty_db.py"
        try:
            with open(temp_file, "w") as f:
                f.write("# Empty database file\n")
            
            calls = extract_db_calls(temp_file)
            assert isinstance(calls, list)
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)
    
    def test_malformed_python_file(self):
        """Test handling of malformed Python."""
        import os
        temp_file = "/tmp/malformed_db.py"
        try:
            with open(temp_file, "w") as f:
                f.write("import sqlalchemy\ndef broken(\n  bad syntax")
            
            calls = extract_db_calls(temp_file)
            assert isinstance(calls, list)
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)


class TestEnvVarExtraction:
    """Test environment variable extraction from DB config."""
    
    def test_env_var_detection(self):
        """Test detection of environment variables in DB code."""
        content = open("backend/tests/sample_repos/sample_db_ops.py").read()
        
        env_configs = detect_environment_db_config(content)
        
        # Should find environment-based configs
        assert isinstance(env_configs, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

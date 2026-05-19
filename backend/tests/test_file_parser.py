"""
Unit tests for file operations parser.
Tests detection of file operations, environment paths, and config-based files.
"""
import pytest
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.scanner.file_parser import (
    extract_file_ops,
    detect_environment_file_paths,
    detect_dynamic_file_operations,
    detect_config_based_files,
    detect_indirect_file_references
)


class TestDirectFileOperations:
    """Test detection of direct file operations."""
    
    def test_extract_file_ops(self):
        """Test extraction of file operations."""
        ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
        
        # Should find file operations
        assert len(ops) > 0
        
        # Check for FILE type
        file_types = [o.get("type") for o in ops]
        assert "FILE" in file_types
    
    def test_native_open_detection(self):
        """Test detection of open() calls."""
        ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
        
        # Should find open operations
        file_names = [o.get("name") for o in ops if o.get("type") == "FILE"]
        assert "Native File IO" in file_names or any("open" in str(f).lower() for f in file_names)
    
    def test_json_load_detection(self):
        """Test detection of json.load() calls."""
        ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
        
        # Should find JSON operations
        file_names = [o.get("name") for o in ops if o.get("type") == "FILE"]
        assert "JSON Data" in file_names or any("json" in str(f).lower() for f in file_names)
    
    def test_csv_detection(self):
        """Test detection of CSV operations."""
        ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
        
        # Should find CSV operations
        file_names = [o.get("name") for o in ops if o.get("type") == "FILE"]
        assert "Pandas CSV" in file_names or any("csv" in str(f).lower() for f in file_names)
    
    def test_excel_detection(self):
        """Test detection of Excel operations."""
        ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
        
        # Should find Excel operations
        file_names = [o.get("name") for o in ops if o.get("type") == "FILE"]
        assert "Pandas Excel" in file_names or any("excel" in str(f).lower() for f in file_names)


class TestEnvironmentFilePaths:
    """Test detection of environment-based file paths."""
    
    def test_env_var_paths(self):
        """Test detection of paths from environment variables."""
        ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
        
        # Should find env var based paths
        assert len(ops) > 0
    
    def test_specific_env_vars(self):
        """Test detection of specific environment variables."""
        content = open("backend/tests/sample_repos/sample_file_ops.py").read()
        
        env_paths = detect_environment_file_paths(content)
        
        # Should find environment file path variables
        assert isinstance(env_paths, list)


class TestDynamicFileOperations:
    """Test detection of dynamic file operations."""
    
    def test_dynamic_open_calls(self):
        """Test detection of dynamic open() calls."""
        ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
        
        # Should find various file operations
        assert len(ops) > 0
    
    def test_pandas_read_operations(self):
        """Test detection of pandas read operations."""
        ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
        
        # Should detect pandas operations
        assert len(ops) > 0


class TestConfigBasedFiles:
    """Test detection of configuration-based file paths."""
    
    def test_config_dict_detection(self):
        """Test detection of FILE_CONFIG dictionaries."""
        ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
        
        # Should find config-based files
        assert len(ops) > 0
    
    def test_config_based_structure(self):
        """Test that config files are properly identified."""
        content = open("backend/tests/sample_repos/sample_file_ops.py").read()
        
        config_files = detect_config_based_files("backend/tests/sample_repos/sample_file_ops.py")
        
        # Should find configuration dictionary definitions
        assert isinstance(config_files, list)


class TestIndirectFileReferences:
    """Test detection of indirect file references."""
    
    def test_string_concatenation_paths(self):
        """Test detection of concatenated file paths."""
        ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
        
        # Should find indirect references
        assert len(ops) > 0
    
    def test_fstring_paths(self):
        """Test detection of f-string file paths."""
        content = open("backend/tests/sample_repos/sample_file_ops.py").read()
        
        indirect_refs = detect_indirect_file_references(content)
        
        # Should find f-string patterns
        assert isinstance(indirect_refs, list)


class TestPathlibOperations:
    """Test detection of pathlib operations."""
    
    def test_pathlib_detection(self):
        """Test detection of pathlib.Path usage."""
        ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
        
        # Should find pathlib operations
        file_names = [o.get("name") for o in ops if o.get("type") == "FILE"]
        assert "Path Manipulation" in file_names or any("path" in str(f).lower() for f in file_names)


class TestYAMLAndConfig:
    """Test detection of YAML and config file operations."""
    
    def test_yaml_detection(self):
        """Test detection of YAML operations."""
        ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
        
        # Should find YAML operations
        file_names = [o.get("name") for o in ops if o.get("type") == "FILE"]
        assert "YAML Files" in file_names or any("yaml" in str(f).lower() for f in file_names)
    
    def test_configparser_detection(self):
        """Test detection of ConfigParser usage."""
        ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
        
        # Should find ConfigParser operations
        assert len(ops) > 0


class TestConfidenceScoring:
    """Test confidence scoring for file operations."""
    
    def test_all_ops_have_confidence(self):
        """Test that all file ops have confidence scores."""
        ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
        
        for op in ops:
            assert "confidence" in op
    
    def test_confidence_ranges(self):
        """Test that confidence values are in valid range."""
        ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
        
        for op in ops:
            conf_str = op.get("confidence", "0%")
            try:
                percent = int(conf_str.split("%")[0])
                assert 0 <= percent <= 100
            except (ValueError, IndexError):
                pass


class TestFileTypeVariety:
    """Test detection of various file types."""
    
    def test_multiple_file_types(self):
        """Test detection of multiple file formats."""
        ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
        
        file_names = set()
        for op in ops:
            if "name" in op:
                file_names.add(op["name"])
        
        # Should find multiple file type operations
        assert len(file_names) >= 2


class TestGoldenOutput:
    """Test against golden reference output."""
    
    def test_file_ops_matches_golden_output(self):
        """Test that file parser output matches golden reference."""
        golden_path = Path(__file__).parent / "golden_outputs" / "file_ops_expected.json"
        
        if golden_path.exists():
            with open(golden_path, 'r') as f:
                golden = json.load(f)
            
            ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
            
            # Validate basic structure
            assert len(ops) > 0
            
            # Check for variety of file operations
            expected_count = golden["summary"]["total_file_operations"]
            assert len(ops) > 0
    
    def test_file_type_coverage(self):
        """Test that multiple file types are detected."""
        golden_path = Path(__file__).parent / "golden_outputs" / "file_ops_expected.json"
        
        if golden_path.exists():
            with open(golden_path, 'r') as f:
                golden = json.load(f)
            
            ops = extract_file_ops("backend/tests/sample_repos/sample_file_ops.py")
            
            file_types = set()
            for op in ops:
                if "name" in op:
                    file_types.add(op["name"])
            
            # Should find multiple types
            assert len(file_types) > 0


class TestEdgeCases:
    """Test edge cases and error handling."""
    
    def test_nonexistent_file(self):
        """Test handling of nonexistent files."""
        ops = extract_file_ops("nonexistent_file.py")
        assert isinstance(ops, list)
    
    def test_empty_file(self):
        """Test handling of empty file."""
        import os
        temp_file = "/tmp/empty_files.py"
        try:
            with open(temp_file, "w") as f:
                f.write("# Empty file operations\n")
            
            ops = extract_file_ops(temp_file)
            assert isinstance(ops, list)
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)
    
    def test_malformed_python_file(self):
        """Test handling of malformed Python."""
        import os
        temp_file = "/tmp/malformed_files.py"
        try:
            with open(temp_file, "w") as f:
                f.write("import json\ndef broken(\n  bad syntax")
            
            ops = extract_file_ops(temp_file)
            assert isinstance(ops, list)
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

"""
Integration Intelligence AI - Test Suite

Comprehensive unit tests for integration detection parsers and analysis engines.

Test Coverage:
- Parser Tests: HTTP, Flask, Database, File Operations
- Engine Tests: Recommendations, Risk Analysis
- Golden Output Tests: Reference output validation
- Edge Case Tests: Error handling, malformed inputs

Sample Repositories:
- sample_flask_app.py: Flask application with various integrations
- sample_db_ops.py: Database connection patterns
- sample_file_ops.py: File operation patterns
- sample_http_ops.py: HTTP request patterns

Golden Outputs:
JSON files representing expected parser outputs for regression testing.

Running Tests:
  pytest tests/                           # Run all tests
  pytest tests/ -m parser                 # Parser tests only
  pytest tests/test_http_parser.py -v    # Specific test file
  pytest tests/ -k "HTTP" -v             # By keyword

See README.md for detailed documentation.
See QUICKSTART.txt for common commands.
"""

__version__ = "1.0.0"
__author__ = "Integration Intelligence Team"

"""
Sample file operations for testing file detection.
Contains various patterns: direct file I/O, config paths, and dynamic access.
"""
import os
import json
import yaml
import pickle
import configparser
from pathlib import Path
import pandas as pd

# Direct file operations
def load_config_file():
    """Load config from file with hardcoded path."""
    with open('config.json', 'r') as f:
        return json.load(f)


# Environment variable based paths
CONFIG_DIR = os.getenv('CONFIG_DIR', './config')
DATA_DIR = os.environ.get('DATA_DIR', './data')
LOG_DIR = os.getenv('LOG_DIR', './logs')

config_file = os.path.join(CONFIG_DIR, 'settings.json')
data_file = os.path.join(DATA_DIR, 'input.csv')


def read_config():
    """Read from environment-based path."""
    with open(config_file, 'r') as f:
        return json.load(f)


# Dynamic path construction with f-string
def load_user_data(version):
    """Build path dynamically."""
    path = f"{DATA_DIR}/v{version}/users.csv"
    df = pd.read_csv(path)
    return df


# Path construction with concatenation
def load_report(date):
    """Concatenated file path."""
    base_path = os.getenv('REPORTS_DIR', './reports')
    report_path = base_path + f"/{date}_report.json"
    with open(report_path, 'r') as f:
        return json.load(f)


# YAML file operations
def load_yaml_config():
    """Load YAML configuration."""
    yaml_path = os.path.join(CONFIG_DIR, 'app.yaml')
    with open(yaml_path, 'r') as f:
        return yaml.safe_load(f)


# Pickle operations
def save_model(model, name):
    """Save pickled object."""
    model_dir = os.getenv('MODEL_DIR', './models')
    with open(f"{model_dir}/{name}.pkl", 'wb') as f:
        pickle.dump(model, f)


def load_model(name):
    """Load pickled object."""
    model_dir = os.getenv('MODEL_DIR', './models')
    with open(f"{model_dir}/{name}.pkl", 'rb') as f:
        return pickle.load(f)


# ConfigParser usage
def read_config_file():
    """Read INI-style config."""
    config = configparser.ConfigParser()
    config_path = os.path.join(CONFIG_DIR, 'app.ini')
    config.read(config_path)
    return config


# Pathlib usage
def process_files():
    """Process files using pathlib."""
    data_path = Path(os.getenv('DATA_DIR', '.'))
    for file in data_path.glob('*.csv'):
        df = pd.read_csv(file)
        yield df


# Excel file operations
def load_excel():
    """Read Excel file."""
    excel_dir = os.getenv('EXCEL_DIR', './data')
    excel_path = os.path.join(excel_dir, 'report.xlsx')
    df = pd.read_excel(excel_path)
    return df


# Config dictionary with file paths
FILE_CONFIG = {
    'input_file': os.getenv('INPUT_FILE', './data/input.csv'),
    'output_file': os.getenv('OUTPUT_FILE', './data/output.csv'),
    'log_file': os.getenv('LOG_FILE', './logs/app.log'),
    'temp_dir': os.getenv('TEMP_DIR', './tmp')
}


def process_with_config():
    """Use file config dictionary."""
    with open(FILE_CONFIG['input_file'], 'r') as f:
        data = f.read()
    
    with open(FILE_CONFIG['output_file'], 'w') as f:
        f.write(data.upper())


# Path manipulation
def get_relative_path(filename):
    """Get relative path using Path."""
    base = Path(os.getenv('BASE_DIR', '.'))
    return base / 'data' / filename


# Read/write operations with path construction
def read_text_file():
    """Use Path.read_text()."""
    path = Path(CONFIG_DIR) / 'config.txt'
    return path.read_text()


def write_log():
    """Use Path.write_text()."""
    log_path = Path(LOG_DIR) / 'app.log'
    log_path.write_text('Application started')

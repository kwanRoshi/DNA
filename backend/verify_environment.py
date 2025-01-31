import os
import sys
import subprocess
import platform
from typing import Dict, List, Tuple
import json

def check_python_version() -> Tuple[bool, str]:
    required_version = (3, 12)
    current_version = sys.version_info[:2]
    result = current_version >= required_version
    message = f"Python Version: {'.'.join(map(str, current_version))} {'✓' if result else '✗'}"
    return result, message

def check_node_version() -> Tuple[bool, str]:
    try:
        node_version = subprocess.check_output(['node', '--version']).decode().strip()
        current_version = int(node_version.lstrip('v').split('.')[0])
        required_version = 18
        result = current_version == required_version
        message = f"Node.js Version: {node_version} {'✓' if result else '✗'} (required: v{required_version}.x)"
        return result, message
    except Exception as e:
        return False, f"Node.js not found: {str(e)}"

def check_package_manager() -> Tuple[bool, str]:
    try:
        pnpm_path = subprocess.check_output(['which', 'pnpm']).decode().strip()
        return True, f"Package Manager: pnpm found at {pnpm_path} ✓"
    except:
        return False, "Package Manager: pnpm not found ✗"

def check_ollama() -> Tuple[bool, str]:
    try:
        response = subprocess.check_output(['curl', '-s', 'http://localhost:11434/api/tags']).decode()
        models = json.loads(response).get('models', [])
        required_model = 'deepseek-r1:1.5b'
        has_model = any(m['name'] == required_model for m in models)
        status = '✓' if has_model else '✗'
        return has_model, f"Ollama Model ({required_model}): {status}"
    except Exception as e:
        return False, f"Ollama Service: Not running ✗ ({str(e)})"

def check_mongodb() -> Tuple[bool, str]:
    try:
        subprocess.check_output(['mongod', '--version'])
        return True, "MongoDB: Installed ✓"
    except:
        return False, "MongoDB: Not installed ✗"

def check_python_packages() -> List[Tuple[bool, str]]:
    required_packages = {
        'fastapi': '0.104.1',
        'uvicorn': '0.24.0',
        'httpx': '0.24.0',
        'python-multipart': '0.0.6',
        'python-dotenv': '1.0.0',
        'requests': '2.31.0',
        'motor': '3.7.0',
        'aiohttp': '3.9.1',
        'pydantic': '2.5.2'
    }
    
    results = []
    for package, version in required_packages.items():
        try:
            installed = subprocess.check_output([sys.executable, '-m', 'pip', 'show', package]).decode()
            installed_version = [line.split(': ')[1].strip() for line in installed.split('\n') if line.startswith('Version:')][0]
            status = installed_version == version
            results.append((status, f"{package}: {installed_version} {'✓' if status else '✗'} (required: {version})"))
        except:
            results.append((False, f"{package}: Not installed ✗"))
    return results

def check_environment_files() -> List[Tuple[bool, str]]:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    required_files = [
        os.path.join(base_dir, 'backend', '.env'),
        os.path.join(base_dir, 'frontend', '.env'),
        os.path.join(base_dir, 'backend', 'deployment.env'),
        os.path.join(base_dir, 'frontend', 'deployment.env')
    ]
    
    results = []
    for file in required_files:
        exists = os.path.exists(file)
        display_path = os.path.relpath(file, base_dir)
        results.append((exists, f"Config File {display_path}: {'✓' if exists else '✗'}"))
    return results

def main():
    print("\nDNA Analysis System Environment Verification")
    print("=" * 50)
    
    # Core Requirements
    python_ok, python_msg = check_python_version()
    node_ok, node_msg = check_node_version()
    pnpm_ok, pnpm_msg = check_package_manager()
    ollama_ok, ollama_msg = check_ollama()
    mongo_ok, mongo_msg = check_mongodb()
    
    print("\nCore Requirements:")
    print("-" * 50)
    print(python_msg)
    print(node_msg)
    print(pnpm_msg)
    print(ollama_msg)
    print(mongo_msg)
    
    # Python Packages
    print("\nPython Package Requirements:")
    print("-" * 50)
    package_results = check_python_packages()
    for ok, msg in package_results:
        print(msg)
    
    # Environment Files
    print("\nConfiguration Files:")
    print("-" * 50)
    env_results = check_environment_files()
    for ok, msg in env_results:
        print(msg)
    
    # Overall Status
    core_checks = [python_ok, node_ok, pnpm_ok, ollama_ok, mongo_ok]
    package_checks = [ok for ok, _ in package_results]
    env_checks = [ok for ok, _ in env_results]
    
    all_checks = core_checks + package_checks + env_checks
    total_checks = len(all_checks)
    passed_checks = sum(1 for check in all_checks if check)
    
    print("\nVerification Summary:")
    print("=" * 50)
    print(f"Total Checks: {total_checks}")
    print(f"Passed: {passed_checks}")
    print(f"Failed: {total_checks - passed_checks}")
    print(f"Status: {'✓ All checks passed' if passed_checks == total_checks else '✗ Some checks failed'}")
    
    sys.exit(0 if passed_checks == total_checks else 1)

if __name__ == "__main__":
    main()

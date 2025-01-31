import sys
import subprocess
import pkg_resources
from typing import Dict, List, Tuple

def check_python_version() -> bool:
    required = (3, 12)
    current = sys.version_info[:2]
    return current >= required

def get_installed_packages() -> Dict[str, str]:
    return {pkg.key: pkg.version for pkg in pkg_resources.working_set}

def check_package_versions() -> List[Tuple[str, str, str, bool]]:
    required = {
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
    
    installed = get_installed_packages()
    results = []
    
    for package, version in required.items():
        installed_version = installed.get(package)
        status = installed_version == version if installed_version else False
        results.append((package, version, installed_version or 'Not installed', status))
    
    return results

def check_dev_packages() -> List[Tuple[str, str, str, bool]]:
    required = {
        'pytest': '7.4.3',
        'pytest-asyncio': '0.21.1',
        'pytest-cov': '4.1.0',
        'pytest-timeout': '2.1.0',
        'pytest-env': '1.1.1',
        'pytest-aiohttp': '1.0.5',
        'pytest-mock': '3.12.0',
        'pytest-xdist': '3.5.0',
        'pytest-sugar': '0.9.7',
        'coverage': '7.3.2',
        'black': '23.11.0',
        'isort': '5.12.0',
        'mypy': '1.7.1',
        'ruff': '0.1.6'
    }
    
    installed = get_installed_packages()
    results = []
    
    for package, version in required.items():
        installed_version = installed.get(package)
        status = installed_version == version if installed_version else False
        results.append((package, version, installed_version or 'Not installed', status))
    
    return results

def main():
    print("\nPython Environment Verification")
    print("=" * 50)
    
    # Check Python version
    python_ok = check_python_version()
    print(f"\nPython Version: {'.'.join(map(str, sys.version_info[:3]))} {'✓' if python_ok else '✗'}")
    
    # Check production dependencies
    print("\nProduction Dependencies:")
    print("-" * 50)
    prod_results = check_package_versions()
    for package, required, installed, status in prod_results:
        print(f"{package}: {installed} {'✓' if status else '✗'} (required: {required})")
    
    # Check development dependencies
    print("\nDevelopment Dependencies:")
    print("-" * 50)
    dev_results = check_dev_packages()
    for package, required, installed, status in dev_results:
        print(f"{package}: {installed} {'✓' if status else '✗'} (required: {required})")
    
    # Summary
    prod_ok = all(status for _, _, _, status in prod_results)
    dev_ok = all(status for _, _, _, status in dev_results)
    
    print("\nVerification Summary:")
    print("=" * 50)
    print(f"Python Version: {'✓' if python_ok else '✗'}")
    print(f"Production Dependencies: {'✓' if prod_ok else '✗'}")
    print(f"Development Dependencies: {'✓' if dev_ok else '✗'}")
    
    if not (python_ok and prod_ok and dev_ok):
        print("\nMissing or Incorrect Dependencies:")
        print("-" * 50)
        for package, required, installed, status in prod_results + dev_results:
            if not status:
                print(f"- {package}: Have {installed}, need {required}")
    
    sys.exit(0 if python_ok and prod_ok and dev_ok else 1)

if __name__ == "__main__":
    main()

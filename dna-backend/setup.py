from setuptools import setup, find_packages

setup(
    name="dna-backend",
    version="0.1.0",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "fastapi>=0.68.0",
        "uvicorn>=0.15.0",
        "pydantic>=2.5.2",
        "httpx>=0.24.0",
        "aiohttp>=3.9.1",
        "pytest>=7.4.3",
        "pytest-asyncio>=0.21.1",
        "pytest-cov>=4.1.0",
        "pytest-timeout>=2.1.0"
    ]
)

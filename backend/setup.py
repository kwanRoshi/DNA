from setuptools import setup, find_packages

setup(
    name="dna-analysis",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.104.1",
        "uvicorn[standard]>=0.24.0",
        "python-multipart>=0.0.6",
        "python-dotenv>=1.0.0",
        "requests>=2.31.0",
        "motor>=3.7.0",
        "httpx>=0.24.0",
        "aiohttp>=3.9.1",
        "pydantic>=2.5.2"
    ],
)

#!/bin/bash

# Update package list
sudo apt-get update

# Import MongoDB public GPG key
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
    sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list again
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Wait for MongoDB to start
sleep 5

# Check MongoDB status
if systemctl is-active --quiet mongod; then
    echo "MongoDB installed and running successfully"
    mongod --version
else
    echo "MongoDB installation or startup failed"
    exit 1
fi

# Create database and user for DNA analysis
mongosh --eval '
  db = db.getSiblingDB("dna_analysis");
  db.createUser({
    user: "dna_user",
    pwd: "dna_password",  // This should be changed in production
    roles: [
      { role: "readWrite", db: "dna_analysis" }
    ]
  });
'

echo "MongoDB setup completed"

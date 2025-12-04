#!/bin/bash

# Ensure we are on scm branch
git checkout scm

# Add all changes
git add .

# Commit with message provided as argument, or default message
COMMIT_MSG="$1"
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Update: Auto-deployment"
fi

git commit -m "$COMMIT_MSG"

# Push scm
git push origin scm

# Merge to main and push
git checkout main
git merge scm
git push origin main

# Return to scm
git checkout scm

echo "Deployment to main completed successfully!"

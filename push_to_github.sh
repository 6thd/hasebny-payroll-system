#!/bin/bash
echo "===================================================================="
echo "== This script will upload your project to GitHub.                =="
echo "===================================================================="

# Initialize a Git repository if it doesn't exist
if [ ! -d ".git" ]; then
  echo "Initializing Git repository..."
  git init -b main
else
  echo "Git repository already initialized."
fi

# Add all the files to be tracked
echo "Adding all files..."
git add .

# Use a default commit message
commit_message="feat: Finalize system features and documentation"
echo "Using commit message: $commit_message"

# Commit the files with the provided message
echo "Committing files..."
if git diff-index --quiet HEAD --; then
  echo "No changes to commit."
else
  git commit -m "$commit_message"
fi

# Check if the origin remote is set
if ! git remote get-url origin > /dev/null 2>&1; then
  echo "GitHub remote 'origin' not found. Please enter the remote URL (e.g., https://github.com/user/repo.git):"
  read remote_url
  git remote add origin "$remote_url"
else
  echo "GitHub remote 'origin' already set."
fi

# Push the changes to the main branch
echo "Pushing changes to GitHub..."
git push -u origin main

echo "===================================================================="
echo "== Project successfully pushed to GitHub!                         =="
echo "===================================================================="

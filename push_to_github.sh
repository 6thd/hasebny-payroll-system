
#!/bin/bash
echo "===================================================================="
echo "== This script will upload your project to GitHub.                =="
echo "== Make sure you have Git installed on your system.               =="
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

# Commit the files with a message
echo "Committing files..."
# Check if there are any changes to commit
if git diff-index --quiet HEAD --; then
  echo "No changes to commit."
else
  git commit -m "Initial commit of Hasebny Payroll System"
fi

# Check if the remote 'origin' already exists
if ! git remote get-url origin > /dev/null 2>&1; then
  echo "Adding GitHub repository as a remote..."
  git remote add origin https://github.com/6thd/hasebny-payroll-system.git
else
  echo "Remote 'origin' already exists."
  git remote set-url origin https://github.com/6thd/hasebny-payroll-system.git
fi

# Push the code to GitHub
echo "Pushing files to GitHub..."
git push -u origin main

echo ""
echo "===================================================================="
echo "== Done! Your files have been uploaded to your GitHub repository. =="
echo "===================================================================="
read -p "Press any key to continue..."

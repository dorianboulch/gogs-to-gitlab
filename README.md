# Gogs to Gitlab

This project aims to migrate Gogs issues to Gitlab.

## Usage
Installation :
```bash
cd src
npm install
cp .env.dist .env #Adjust the settings in the .env file
```
Run :
```bash
cd src
node index.js yourname/your-repo-on-gogs yourname/your-repo-on-gitlab
```

## Task
- Add milestones
- Add labels
- Add issues with assignees

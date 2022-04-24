# Gogs to Gitlab

This project aims to migrate Gogs issues to Gitlab.

## Usage
### Installation :
```bash
cd src
npm install
cp .env.dist .env #Adjust the settings in the .env file
```
### Run :
```bash
cd src
node index.js yourname/your-repo-on-gogs yourname/your-repo-on-gitlab
```

### Install & Run in Docker :
```bash
docker build . --tag gogs2gitlab
docker run --env GITLAB_URL=https://gitlab.com --env GITLAB_TOKEN=abcdefghijklmnopsrs --env GOGS_URL=https://try.gogs.io/api/v1 --env=GOGS_TOKEN=abcdefghijklmnopqrstuvwxyz123456789101112 gogs2gitlab yourname/your-repo-on-gogs yourname/your-repo-on-gitlab
```

## Task
- Add milestones
- Add labels
- Add issues with assignees

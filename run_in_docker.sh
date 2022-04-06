docker build . --tag gogs2gitlab
docker run --env GITLAB_URL=https://gitlab.com --env GITLAB_TOKEN=abcdefghijklmnopsrs --env GOGS_URL=https://try.gogs.io/api/v1 --env=GOGS_TOKEN=abcdefghijklmnopqrstuvwxyz123456789101112 gogs2gitlab yourname/your-repo-on-gogs yourname/your-repo-on-gitlab

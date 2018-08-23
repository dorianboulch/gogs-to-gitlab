const rp = require('request-promise');


function GogsApi(gogsParams) {
    let params = gogsParams;

    return {
        get: function (uri) {
            return rp({
                uri: params.url + uri,
                headers: {
                    'Authorization': `token ${params.token}`
                }
            });
        },
        getRepo: function (repoUrl) {
            return new Promise((async (resolve, reject) => {
                try {
                    let data = await this.get(`/repos/${repoUrl}`);
                    let repo = JSON.parse(data);
                    resolve(repo);
                } catch (e) {
                    reject(e);
                }
            }));
        },
        getMilestones: function (repo) {
            return new Promise((async (resolve, reject) => {
                try {
                    let data = await this.get(`/repos/${repo}/milestones`);
                    let milestones = JSON.parse(data);
                    resolve(milestones);
                } catch (e) {
                    reject(e);
                }
            }));
        },
        getLabels: function (repo) {
            return new Promise((async (resolve, reject) => {
                try {
                    let data = await this.get(`/repos/${repo}/labels`);
                    let labels = JSON.parse(data);
                    resolve(labels);
                } catch (e) {
                    reject(e);
                }
            }));
        },
        getAllIssues: function (repo) {
            return new Promise((async (resolve, reject) => {
                let issues = [];


                try {
                    let openedIssues = await this.getOpenedIssues(repo);
                    let closedIssues = await this.getClosedIssues(repo);

                    issues = issues.concat(openedIssues, closedIssues);
                    issues.sort((a, b) => {
                        if (parseInt(a.number) < parseInt(b.number)) {
                            return -1
                        } else {
                            return 1;
                        }
                    });
                    resolve(issues);
                } catch (e) {
                    reject(e)
                }


            }));
        },
        getClosedIssues: function (repo) {
            return this.getIssues(repo, 'closed')
        },
        getOpenedIssues: function (repo) {
            return this.getIssues(repo, 'open')
        },
        getIssues: function (repo, state) {
            return new Promise((async (resolve, reject) => {
                let gogsIssues = [];

                let hasIssues = true;
                for (let page = 1; hasIssues; page++) {
                    try {
                        let data = await this.get(`/repos/${repo}/issues?page=${page}&state=${state}`);
                        let issues = JSON.parse(data);
                        if (issues.length === 0) {
                            hasIssues = false;
                        } else {
                            for (let issue of issues) {
                                gogsIssues.push(issue);
                            }
                        }
                    } catch (e) {
                        reject(e);
                    }
                }

                gogsIssues.sort((a, b) => {
                    if (parseInt(a.number) < parseInt(b.number)) {
                        return -1
                    } else {
                        return 1;
                    }
                });
                resolve(gogsIssues);
            }));

        }
    }
}

module.exports = GogsApi;
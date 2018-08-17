function GogsToGitlabFormatters(gitlabApi) {
    return {
        issue: async function (issue, gitlabUserIds, milestonesIds) {
            let assigneeId = null;
            if (typeof issue.assignee !== 'undefined' && issue.assignee !== null) {
                let gogsLogin = issue.assignee.login;

                if (typeof gitlabUserIds[gogsLogin] !== 'undefined') {
                    assigneeId = gitlabUserIds[gogsLogin];
                } else {
                    let users = await gitlabApi.Users.search(gogsLogin);
                    if (users.length > 0) {
                        let user = users[0];
                        gitlabUserIds[gogsLogin] = user.id;
                        assigneeId = user.id;
                    }
                }
            }

            let gitlabIssue = {
                title: issue.title,
                description: issue.body,
                created_at: issue.created_at,
                updated_at: issue.updated_at,
            };

            if (assigneeId !== null) {
                gitlabIssue.assignee_ids = [assigneeId]
            }

            if (issue.labels.length > 0) {
                gitlabIssue.labels = issue.labels.map(value => value.name).join(',');
            }

            if(typeof issue.milestone !== 'undefined' && issue.milestone !== null && milestonesIds[issue.milestone.title] != null) {
                gitlabIssue.milestone_id = milestonesIds[issue.milestone.title]
            }

            return gitlabIssue;
        },

        label: function (gogsLabel) {
            return {
                name: gogsLabel.name,
                color: '#' + gogsLabel.color
            }
        },

        milestones: function (gogsMilestone) {
            return {
                title: gogsMilestone.title,
                description: gogsMilestone.description,
                due_date: gogsMilestone.due_on
            }
        }
    }
}

module.exports = GogsToGitlabFormatters;
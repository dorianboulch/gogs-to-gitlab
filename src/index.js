require('dotenv').config();

const GogsApi = require('./GogsApi');
const Gitlab = require('gitlab/dist/es5').default;
const GogsToGitlabFormatters = require('./GogsToGitlabFormatters');


let sourceRepo;
let targetRepo;

let gitlabApi;
let gogsApi;

let gogsToGitlabFormatters;

function init() {

    if(
        process.env.GITLAB_URL == null ||
        process.env.GITLAB_TOKEN == null ||
        process.env.GOGS_URL == null ||
        process.env.GOGS_TOKEN == null
    ){
        help();
        process.exit(1);
    }

    const gitlabParams = {
        url: process.env.GITLAB_URL,
        token: process.env.GITLAB_TOKEN
    };
    gitlabApi = new Gitlab(gitlabParams);

    const gogsParams = {
        url: process.env.GOGS_URL,
        token: process.env.GOGS_TOKEN
    };
    gogsApi = new GogsApi(gogsParams);

    gogsToGitlabFormatters = new GogsToGitlabFormatters(gitlabApi);


    const argv = process.argv.slice(2);

    if(argv.length !== 2){
        help();
        process.exit(1);
    }

    sourceRepo = argv[0];
    targetRepo = argv[1];
}

function help(){
    console.error("Two paramters required : ${sourceRepository} ${targetRepository}");
    console.error("Env var required :");
    console.error("- GITLAB_URL");
    console.error("- GITLAB_TOKEN");
    console.error("- GOGS_URL");
    console.error("- GOGS_TOKEN");
}


async function getGogsRepo(repoUrl) {

    try {
        return await gogsApi.getRepo(repoUrl);
    } catch (error) {
        if (error.statusCode == '404') {
            throw new Error(`Repo "${sourceRepo}" not found in gogs`);
        }
        throw new Error(error.message);
    }
}

async function getGogsIssues(gogsRepo) {
    let gogsIssues;
    try {
        gogsIssues = await gogsApi.getAllIssues(gogsRepo.full_name);
    } catch (error) {
        if (error.statusCode == '404') {
            throw new Error(`Repo "${sourceRepo}" not found in gogs`);
        }
        throw new Error(error.message);
    }

    return gogsIssues;
}

async function getGogsLabels(gogsRepo) {
    return await gogsApi.getLabels(gogsRepo.full_name);
}

async function getGogsMilestones(gogsRepo) {
    return await gogsApi.getMilestones(gogsRepo.full_name);
}

async function getGitlabProject(targetRepo) {

    try {
        return await gitlabApi.Projects.show(targetRepo);
    } catch (error) {
        if (error.statusCode == '404') {
            throw new Error(`Repo "${targetRepo}" not found in gitlab`);
        }
        throw new Error(error.message);
    }
}

async function createLabelsInGitlab(gitlabProject, labels) {
    console.log('-----------------------------\nCreating labels in GITLAB\n-----------------------------');
    console.log(`${labels.length} labels found in "${sourceRepo}"`);
    labels = labels.map(gogsToGitlabFormatters.label);
    for (let label of labels) {
        gitlabApi.Labels.create(gitlabProject.id, label);
        console.log(`- [CREATED] ${label.name}`);
    }
}

async function createIssuesInGitlab(gitlabProject, issues) {

    console.log('-----------------------------\nCreating issues in GITLAB\n-----------------------------');
    console.log(`${issues.length} issues found in "${sourceRepo}"`);

    let gitlabUserIds = {};
    let milestonesIds = {};

    let milestones = await gitlabApi.ProjectMilestones.all(gitlabProject.id);
    for(let milestone of milestones){
        milestonesIds[milestone.title] = milestone.id
    }

    let previousIssueNumber = 0;
    for (let issue of issues) {

        let gitlabIssue = await gogsToGitlabFormatters.issue(issue, gitlabUserIds, milestonesIds);

        while (parseInt(issue.number) > (previousIssueNumber + 1)) {
            try {
                let issue = await gitlabApi.Issues.create(gitlabProject.id, {
                    title: 'Fake from gogs'
                });
                await gitlabApi.Issues.remove(gitlabProject.id, issue.iid);
            } catch (e) {
                console.error(e);
            }
            previousIssueNumber++;
        }

        try {
            let createdIssue = await gitlabApi.Issues.create(gitlabProject.id, gitlabIssue);
            if (issue.state === 'closed') {
                gitlabApi.Issues.edit(gitlabProject.id, createdIssue.iid, {
                    state_event: 'close'
                });
            }
            console.log(`- [CREATED] #${issue.number}: ${issue.title}`);
        } catch (e) {
            console.error(e);
        }
        previousIssueNumber = issue.number;

    }

}

async function createMilestonesInGitlab(gitlabProject, gogsMilestones) {
    console.log('-----------------------------\nCreating milestones in GITLAB\n-----------------------------');
    console.log(`${gogsMilestones.length} milestones found in "${sourceRepo}"`);

    let gitlabMilestones = gogsMilestones.map(gogsToGitlabFormatters.milestones);

    for (let milestone of gitlabMilestones) {
        gitlabApi.ProjectMilestones.create(gitlabProject.id, milestone.title, milestone);
        console.log(`- [CREATED] ${milestone.title}`);
    }

}


/**
 * Fonction principale du programme
 * @return {Promise<void>}
 */
async function run() {

    init();

    let gogsRepo = await getGogsRepo(sourceRepo);
    let gitlabProject = await getGitlabProject(targetRepo);

    let gogsMilestones = await getGogsMilestones(gogsRepo);
    await createMilestonesInGitlab(gitlabProject, gogsMilestones);

    let gogsLabels = await getGogsLabels(gogsRepo);
    await createLabelsInGitlab(gitlabProject, gogsLabels);

    let gogsIssues = await getGogsIssues(gogsRepo);
    await createIssuesInGitlab(gitlabProject, gogsIssues);

}

run().then(() => {
    process.exit(0)
}).catch((err) => {
    console.error(err.message);
    process.exit(1);
});

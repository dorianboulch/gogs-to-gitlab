const GogsApi = require('./utils/GogsApi');
const Gitlab = require('gitlab/dist/es5').default;
require('dotenv').config();

let ProjectSelectService = require('./services/ProjectsSelectService');

let gitlabApi;
let gogsApi;
let projectSelectService;


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

    projectSelectService = new ProjectSelectService(gogsApi, gitlabApi);
}

function help(){
    console.error("Env var required :");
    console.error("- GITLAB_URL");
    console.error("- GITLAB_TOKEN");
    console.error("- GOGS_URL");
    console.error("- GOGS_TOKEN");
}


/**
 * Fonction principale du programme
 * @return {Promise<void>}
 */
async function run() {

    init();

    let projects = await projectSelectService.askProjects();

    console.log(projects);

}

run().then(() => {
    process.exit(0)
}).catch((err) => {
    console.error(err.message);
    process.exit(1);
});

const inquirer = require('inquirer');

/**
 *
 * @returns {{get: (function(*))}}
 * @constructor
 */
function ProjectsSelectService(gogsApi, gitlabApi) {

    async function projectExistsOnGitlab(projectFullNamespace) {

        let split = projectFullNamespace.split('/');
        const projectName = split[split.length - 1];

        let founds = await gitlabApi.Search.all('projects', projectName);
        let filtered = founds.filter((found) => {
            return found.path_with_namespace === projectFullNamespace
        });
        return filtered.length > 0
    }

    return {
        askProjects: async () => {
            const gogsProjects = await gogsApi.getProjects();
            const projectsNames = gogsProjects.map((p) => {
                return p.full_name
            }).sort();
            const prompts = await inquirer.prompt([{
                type: 'checkbox',
                name: 'Which repository have to be migrated ?',
                choices: projectsNames
            }]);
            const selectedProjects = prompts['Which repository have to be migrated ?'];

            let projects = [];

            for(let selectedProject of selectedProjects){
                let gogsProject = gogsProjects.filter((p) => {
                    return p.full_name === selectedProject;
                })[0];

                let gitlabDestination, destinationChosen, ignoreProject;
                do{
                    const customDestPrompt = await inquirer.prompt([{
                        type: 'input',
                        prefix:selectedProject,
                        name: 'must be transfered to',
                        default: selectedProject
                    }]);
                    gitlabDestination = customDestPrompt['must be transfered to'];

                    if(await projectExistsOnGitlab(gitlabDestination)){
                        console.log(`The project ${gitlabDestination} already exists on Gitlab.`);
                        let actPrompt = await inquirer.prompt({
                            type: 'list',
                            name: 'What do you want to do ?',
                            choices: [
                                'Choose another destination',
                                'Ignore this project'
                            ]
                        });
                        switch (actPrompt['What do you want to do ?']) {
                            case 'Ignore this project':
                                ignoreProject = true;
                                break;
                            case 'Choose another destination':
                                destinationChosen = false;
                                break;
                        }
                    }else{
                        destinationChosen = true;
                    }

                } while (!destinationChosen && !ignoreProject);

                if(!ignoreProject){
                    gogsProject.gitlabDestination = gitlabDestination;
                    projects.push(gogsProject);
                }
            }

            return projects;
        },
    }
}

module.exports = ProjectsSelectService;
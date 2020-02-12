const fs = require('fs-extra');
const path = require('path');
const AWSClient = require('./awsClient');

module.exports = class KelchDeploy {

    constructor(config, workingDirPath = path.join(__dirname, '.tmp')) {
        this.config = config;
        this.workingDirPath = workingDirPath;
    }

    async deploy(stackName, bucketName) {
        try {

            // Create working directory for the following process
            await this.createWorkingDirectory();

            // Generate AWS CloudFormation template file
            console.log('Creating upload artifacts and AWS CloudFormation template file');
            const userCodesPath = '.';
            var template = await this.createTeamplte(userCodesPath);
            const templateFilePath = path.join(this.workingDirPath, 'template.json');
            await this.outputTemplateFile(template, templateFilePath)

            // Upload functions code and deploy AWS CloudFormation stack
            await AWSClient.deployStack(templateFilePath, stackName, bucketName);

            // Show API endpoints of uploaded function codes
            var apiPaths = this.listFunctionsApiPath(template);
            await this.displayEndpoint(stackName, apiPaths);

        } catch (e) {
            console.error(e);
        } finally {
            // Delete working directory
            await this.deleteWorkingDirectory();
        }
    }

    async createWorkingDirectory() {
        await fs.remove(this.workingDirPath);
        await fs.mkdir(this.workingDirPath);
    }

    async createTeamplte(userCodesPath) {

        // Read template file of AWS CloudFormation template
        var template = await fs.readJSON(path.join(__dirname, 'template', 'cloudformation-template-base.json'));

        // Read Handler code that will be attached with user's codes
        var handlerCode = await fs.readFile(path.join(__dirname, 'handler.js'), { encoding: 'utf-8' });

        // Get JavaScript file names
        var fileNames = (await fs.readdir(userCodesPath)).filter(file => path.extname(file).toLowerCase() == '.js');

        // Process for each function code
        for (var i = 0; i < fileNames.length; i++) {
            var fileName = fileNames[i];

            // Get function name (filename except extension)
            var resourceName = path.basename(fileName, path.extname(fileName));

            // Create a folder for each JavaScript file
            var codeDirName = resourceName;
            var functionDirPath = path.join(this.workingDirPath, codeDirName);
            await fs.mkdir(functionDirPath);

            // Read JavaScript file
            var userCode = await fs.readFile(path.join(userCodesPath, fileName), { encoding: 'utf-8' });

            // Create JS file merged with Handler code
            await fs.writeFile(path.join(functionDirPath, fileName), userCode + "\n" + handlerCode);

            // Copy node_modules folder
            var nodeModulesPath = path.join(userCodesPath, 'node_modules');
            if (await fs.exists(nodeModulesPath)) {
                await fs.copy(nodeModulesPath, path.join(functionDirPath, 'node_modules'));
            }

            // Get properties of AWS Lambda function for this function
            var properties = {
                timeout: this.getFunctionParameter(fileName, 'timeout', 3),
                memorySize: this.getFunctionParameter(fileName, 'memorySize', 128),
                runtime: this.getFunctionParameter(fileName, 'runtime', 'nodejs12.x'),
                policies: this.getFunctionPolicies(fileName),
                enviroments: this.getFunctionParameter(fileName, 'enviroments', {}),
                tags: this.getFunctionParameter(fileName, 'tags', {}),
                reservedConcurrentExecutions: this.getFunctionParameter(fileName, 'reservedConcurrentExecutions', null),
            };

            // Add Lambda function resource to Resources section at the template
            var logicalName = resourceName.match(/[0-9a-zA-Z]+/g).join("");
            template.Resources[logicalName] = {
                Type: 'AWS::Serverless::Function',
                Properties: {
                    CodeUri: codeDirName,
                    Handler: resourceName + ".handler",
                    Timeout: properties.timeout,
                    MemorySize: properties.memorySize,
                    Runtime: properties.runtime,
                    Policies: properties.policies,
                    Environment: {
                        Variables: properties.enviroments
                    },
                    Tags: properties.tags,
                    ReservedConcurrentExecutions: properties.reservedConcurrentExecutions,
                    Events: {
                        APIGateway: {
                            Type: 'Api',
                            Properties: {
                                Path: '/' + resourceName,
                                Method: 'ANY',
                                RestApiId: {
                                    Ref: "KelchAPIGateway"
                                }
                            }
                        }
                    }
                }
            };
            if (properties.reservedConcurrentExecutions) {
                template.Resources[logicalName].Properties.ReservedConcurrentExecutions = properties.reservedConcurrentExecutions
            }
        }
        return template;
    }

    getFunctionParameter(functionName, parameterName, defaultValue) {
        if (this.config['functions'] != null
            && this.config['functions'][functionName] != null
            && this.config['functions'][functionName][parameterName] != null) {
            return this.config['functions'][functionName][parameterName];
        } else if (this.config['default'] != null
            && this.config['default'][parameterName] != null) {
            return this.config['default'][parameterName];
        } else {
            return defaultValue;
        }
    }

    getFunctionPolicies(functionName) {
        var resources = this.getFunctionParameter(functionName, 'policies', []);
        if (resources.length == 0) return [];
        var policies = [{
            Version: '2012-10-17',
            Statement: []
        }];
        for (var resource in resources) {
            var actions = resources[resource];
            policies[0].Statement.push({
                Effect: 'Allow',
                Action: actions,
                Resource: resource
            });
        }
        return policies;
    }

    // Output the specified AWS CloudFormation template (JSON) as a file
    async outputTemplateFile(template, outputPath) {
        await fs.writeFile(outputPath, JSON.stringify(template));
    }

    // Return API path list of Function set in template
    listFunctionsApiPath(template) {
        var apiPaths = [];
        for (var logicalName in template.Resources) {
            if (logicalName == 'KelchAPIGateway') continue;
            var resource = template.Resources[logicalName];
            apiPaths.push(resource.Properties.Events.APIGateway.Properties.Path);
        }
        return apiPaths;
    }

    // Show generated API Gateway endpoints
    async displayEndpoint(stackName, apiPaths) {
        var outputs = await AWSClient.getStackOutput(stackName);
        var endpoint = outputs['KelchAPIGatewayOutput'];
        if (!endpoint) return;
        console.log('REST APIs URL:');
        apiPaths.forEach(apiPath => console.log(endpoint + apiPath.replace('/', '')));
        console.log('');
    }

    // Delete working directory
    async deleteWorkingDirectory() {
        await fs.remove(this.workingDirPath);
    }

}


Some badges here (unit test coverage rate, build status, etc.)

## Table of Contents

* [Setup](#setup)
* [Available Scripts](#available-scripts)
  * [Start](#start)
  * [Test](#test)
  * [Lint](#lint)
* [Spec Documentation](#spec-documentation)
  * [Edit documentation](#Edit-Spec)
  * [View documentation](#View-Spec)
* [Jsdoc Documentation](#jsdoc-documentation)
  * [Edit documentation](#Edit-jsdoc)
  * [View documentation](#View-jsdoc)
* [Unit Test Coverage Report](#Unit-Test-Coverage-Report)

## Setup
Install dependencies
```
npm install
```
Or using yarn
```
yarn
```

## Available Scripts
### Development start
Run the project in development mode
```
npm run dev
```
Or
```
yarn dev
```

### ESlint Checking
Run [eslint](https://github.com/eslint/eslint) utility to check whether the code format is correct.
```
npm run eslintChecking
```
Or
```
yarn eslintChecking
```

### Unit Test
Runs the [jest](https://github.com/facebook/jest) test runner on your tests.
```
npm run unitTest
```
Or
```
yarn unitTest
```



### Generate jsdoc page
Generate [jsdoc](http://usejsdoc.org/) page with Docdash [template](https://github.com/clenemt/docdash)
```
npm run generateJsdoc
```
Or
```
yarn generateJsdoc
```


### Detect vulnerable dependencies
Use npm audit tool to check vulnerable dependencies in cause bring vulnerable dependencies into our project
```
npm run vulnerabilitiesChecking
```
Or
```
yarn vulnerabilitiesChecking
```

## Endpoint Spec Documentation
### Edit Spec.

There are 3 ways to edit spec documentation:
1. Download [swagger editor](https://github.com/swagger-api/swagger-editor) and import /docs/swagger.yaml to edit the documentation. Don't forget to save after editing and replace previous one.

2. Install swagger viewer plugin on your IDE and edit with viewer.This plugin is for [VSCode](https://marketplace.visualstudio.com/items?itemName=Arjun.swagger-viewer).
This plugin is for [Webstorm](https://plugins.jetbrains.com/plugin/8347-swagger-plugin).

3. Using online editor. (https://editor.swagger.io/). But this method has security issue. Maybe our spec will leakage to public Internet.

Note: Please follow the [REST API style](https://www.restapitutorial.com/lessons/httpmethods.html), [best practice](https://hackernoon.com/restful-api-designing-guidelines-the-best-practices-60e1d954e7c9) and [swagger documentation](https://swagger.io/docs/specification/basic-structure/) to design or update documentation


### View Spec

You can refer to [online version](http://paste.spec.link.here)

## Jsdoc Documentation
### Edit jsdoc
Appropriate comments is better for us to understand the code more conveniently. We use the universal method: [jsdoc](http://usejsdoc.org/) and [Docdash template](https://github.com/clenemt/docdash) to view. Above each function and global variables, please add jsdoc for it. At lease, it should includes author, description. For convenience, recommend a plugin named [Add jsdoc comments](https://marketplace.visualstudio.com/items?itemName=stevencl.addDocComments) when you use VSCode for your IDE. Use [Auto create jsdoc comments](https://www.jetbrains.com/help/webstorm/creating-jsdoc-comments.html) when you use Webstorm for your IDE.

### View jsdoc
1. If you are in local environment, run ```npm run jsdoc``` and then it when generate jsdoc folder under the root folder. Open the ```index.html``` file inside, you will see the jsdoc page with [Docdash template](https://github.com/clenemt/docdash)

2. If you are in other environment, refer to [online version](http://paste.spec.link.here)

## Unit Test Coverage Report
### Unit Test command
```
npm run unitTest
```
Or
```
yarn unitTest
```

### View coverage report
A coverage report will generate. It is on `./coverage/lcov-report` folder. You can click `index.html` to view the report.

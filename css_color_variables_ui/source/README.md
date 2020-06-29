# Folder structure

## NPM

Pleas use [NVM](https://github.com/nvm-sh/nvm/blob/master/README.md) or node version defined in .nvmrc

## babel-compiled
Files which are needed for tests in cli. Because [Babel](https://babeljs.io/) is transpiling the modern ES6 import
statement to CommonJS, which can be parsed by NodeJS.

## node-modules
Third-party JavaScript libraries.

## source
Color

### Building the application

```
nvm use
npm install
npm run build
# or for a watch task
npm run dev
```


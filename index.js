const _ = require('lodash');
const chalk = require('chalk');
const fetch = require('node-fetch');
const fs = require('fs');
const md = require('markdown').markdown;

/**
 * Lodash documentation URL.
 * @type {string}
 */
const kDocUrl = 'https://raw.githubusercontent.com/lodash/lodash/master/doc/README.md';

/**
 * List of blacklisted Lodash methods.
 * @type {Array<string>}
 */
const kBlacklistedMethods = [
];

/**
 * Logs a message
 * @param  {string} message The message to log.
 */
function log(message) {
  console.log(chalk.green(message));
}

/**
 * Logs an error.
 * @param  {string} message The message to log as an error.
 */
function err(message) {
  console.log(chalk.red(message));
}

/**
 * Determines if an element is a paragraph.
 * @param  {Array}    element The parsed element.
 * @return {Boolean}          TRUE if the element is a paragraph.
 */
function isPara(element) {
  return element[0] === 'para';
}

/**
 * Determines if an element is a header.
 * @param  {Array}    element The parsed element.
 * @return {Boolean}          TRUE if the element is a header.
 */
function isHeader(element) {
  return element[0] === 'header';
}

/**
 * Determines if an item is a Lodash method.
 * @param  {string}  item The item to parse.
 * @return {Boolean}      TRUE if the item is a Lodash method.
 */
function isMethod(item) {
  return /\.[a-zA-Z]+\(/.test(item);
}

/**
 * Returns the method name.
 * @param  {string} item The raw item containing the method name.
 * @return {string}      The method name.
 */
function getMethodName(item) {
  const matches = /\.([a-zA-Z]+)\(/.exec(item);

  return matches[1];
}

/**
 * Returns the arguments of a method.
 * @param  {Array} list Parsed list of arguments.
 * @return {Array}      The method arguments.
 */
function getArgs(list) {
  const args = [];

  _.forEach(list, element => {
    if (_.isArray(element) && element[0] === 'listitem') {
      args.push(element[1][1]);
    }
  })

  return args;
}

/**
 * Returns the returns value of a method.
 * @param  {Array}  para Paragraph containing the returns value of a method.
 * @return {string}      The returns value.
 */
function getReturns(para) {
  let returnValue = para[1][1];

  if (returnValue === '(&#42;)') {
    returnValue = '(*)';
  }

  return returnValue;
}

/**
 * Returns the Lodash version.
 * @param  {Array}  header Parsed header containing the version.
 * @return {string}        The Lodash version.
 */
function getVersion(header) {
  const matches = /v([0-9]+\.[0-9]+\.[0-9]+)</.exec(header[2]);

  return matches[1];
}

/**
 * Returns the text from a paragraph.
 * @param  {Array}  para The paragraph to extract text from.
 * @return {string}      The string from the paragraph.
 */
function getTextFromPara(para) {
  let text = '';
  let isEmptyLine =  false;

  _.forEach(para, (element, index) => {
    if (index === 0 || isEmptyLine) {
      return;
    } else if (_.isString(element)) {
      if (/[^:]<br>/.test(element)) {
        isEmptyLine = true;
      }

      text += element;
    } else if (_.isArray(element)) {
      text += element[1];
    }
  });

  text = text.replace(/\n/g, ' ');
  text = text.replace(/<br>/g, '');
  text = text.trim();

  return text;
}

/**
 * Parses the documentation.
 * @param  {Array} tree Parsed Markdown tree.
 * @return {Array}      Array containing all methods in Lodash.
 */
function parseDocumentation(tree) {
  const methods = [];

  let isParsingDoc = false;
  let isParsingMethod = false;
  let isParsingArgs = false;
  let isParsingReturns = false;
  let methodIndex = 0;
  let methodCount = 0;
  let version = '?.?.?';

  log('Parsing Markdown documentation.');

  let currentMethod = {};

  _.forEach(tree, (element, index) => {
    if (index === 2 && isHeader(element)) {
      version = getVersion(element);
    }

    /**
     * Documentation: container.
     */
    if (isPara(element) && element[1] === '<!-- div class="doc-container" -->') {
      isParsingDoc = true;

      log('Found documentation container.');
    }

    if (!isParsingDoc) {
      return;
    }

    /**
     * Item: title.
     */
    if (!isParsingMethod && isPara(element) && element[1] === '<h3 id="') {
      const rawItem = element[3];

      if (!isMethod(rawItem)) {
        return;
      }

      const methodName = getMethodName(rawItem);

      if (_.includes(kBlacklistedMethods, methodName)) {
        return;
      }

      isParsingMethod = true;
      isParsingArgs =  false;
      isParsingReturns =  false;
      methodIndex = 0;
      methodCount++;

      // log(`Found new method: _.${methodName}`);

      currentMethod.name = methodName;

      return;
    }

    methodIndex++;

    /**
     * Item: end.
     */
    if (isParsingMethod && isPara(element) && element[1] === '<!-- /div -->') {
      isParsingMethod = false;
      methodIndex = 0;

      if (_.isNil(currentMethod.args)) {
        currentMethod.args = [];
      }

      if (_.isNil(currentMethod.returns)) {
        currentMethod.returns = 'undefined';
      }

      currentMethod.url = `https://lodash.com/docs/4.16.4#${currentMethod.name}`;

      methods.push(currentMethod);

      currentMethod = {};

      return;
    }

    /**
     * Method: description.
     */
    if (isParsingMethod && isPara(element) && methodIndex === 1) {
      currentMethod.description = getTextFromPara(element);

      return;
    }

    /**
     * Method: arguments header.
     */
    if (isParsingMethod && isHeader(element) && element[2] === 'Arguments') {
      isParsingArgs =  true;

      return;
    }

    /**
     * Method: arguments.
     */
    if (isParsingMethod && isParsingArgs) {
      isParsingArgs =  false;

      currentMethod.args = getArgs(element);

      return;
    }

    /**
     * Method: returns header.
     */
    if (isParsingMethod && isHeader(element) && element[2] === 'Returns') {
      isParsingReturns = true;

      return;
    }

    /**
     * Method: returns.
     */
    if (isParsingMethod && isParsingReturns) {
      isParsingReturns = false;

      currentMethod.returns = getReturns(element);

      return;
    }
  });

  log('Done parsing Markdown documentation.');
  log(`Found ${methodCount} methods for Lodash v${version}.`);

  return methods;
}

log(`Fetching documentation from ${kDocUrl}.`);

fetch(kDocUrl)
  .then(result => {
    if (result.status !== 200) {
      throw new Error('Something went wrong while fetching the documentation.');
    }

    return result.text();
  })
  .then(markdown => {
    log('Documentation successfully fetched.');

    return parseDocumentation(md.parse(markdown));
  })
  .then(documentation => {
    log('Saving parsed documentation in lodash.json.');

    fs.writeFileSync('./lodash.json', JSON.stringify(documentation, null, '  ') , 'utf-8');
  })
  .catch(error => {
    err(error.message);
  });

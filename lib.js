'use strict';

const countries = require('./countries.json');
const countriesRu = require('./countries.ru.json');

const MAGIC_NUMBER = 127462 - 65;

const CODE_RE = /^[a-z]{2}$/i;
const NAME_RE = /^.{2,}$/;
const FLAG_RE = /\uD83C[\uDDE6-\uDDFF]/;

function fuzzyCompare(str, name) {
  name = name.toLowerCase();

  // cases like:
  //    "Vatican" <-> "Holy See (Vatican City State)"
  //    "Russia"  <-> "Russian Federation"
  if (name.indexOf(str) !== -1 || str.indexOf(name) !== -1) {
    return true;
  }

  // cases like:
  // "British Virgin Islands" <-> "Virgin Islands, British"
  // "Republic of Moldova"    <-> "Moldova, Republic of"
  if (name.indexOf(',') !== -1) {
    const reversedName = name.split(', ').reverse().join(' ');
    if (reversedName.indexOf(str) !== -1 || str.indexOf(reversedName) !== -1) {
      return true;
    }
  }

  return false;
}

function isCode(code) {
  code = code.toUpperCase();

  return countries[code] ? code : undefined;
}

function nameToCode(name) {
  if (!name || !NAME_RE.test(name)) {
    return;
  }

  name = name.trim().toLowerCase();

  // look for exact match
  // NOTE: normal loop to terminate ASAP
  for (const code in countries) {
    if ({}.hasOwnProperty.call(countries, code)) {
      let names = countries[code];

      if (!Array.isArray(names)) {
        names = [names];
      }

      for (const n of names) {
        if (n.toLowerCase() === name) {
          return code;
        }
      }
    }
  }

  // look for inexact match
  // NOTE: .filter() to aggregate all matches
  const matches = Object.keys(countries)
    .filter(code => {
      let names = countries[code];

      if (!Array.isArray(names)) {
        names = [names];
      }

      for (const n of names) {
        if (fuzzyCompare(name, n)) {
          return true;
        }
      }

      return false;
    });

  // return only when exactly one match was found
  //   prevents cases like "United"
  if (matches.length === 1) {
    return matches[0];
  }

  return;
}

function codeToName(code, locale) {
  if (!code || !CODE_RE.test(code)) {
    return;
  }

  var names = ''
  if (locale === 'ru') {
      names = countriesRu[code.toUpperCase()];
      if (Array.isArray(names)) {
          return names[0];
      }
  } else {
      names = countries[code.toUpperCase()];
      if (Array.isArray(names)) {
          return names[0];
      }
  }

  return names;
}

function codeToFlag(code) {
  if (!code || !CODE_RE.test(code)) {
    return;
  }

  code = isCode(code);
  if (!code) {
    return;
  }

  return String.fromCodePoint(...[...code].map(c => MAGIC_NUMBER + c.charCodeAt()));
}

function flagToCode(flag) {
  if (!flag || !FLAG_RE.test(flag)) {
    return;
  }

  return isCode([...flag].map(c => c.codePointAt(0) - MAGIC_NUMBER).map(c => String.fromCharCode(c)).join(''));
}

// takes either emoji or full name
function code(input) {
  return flagToCode(input) || nameToCode(input);
}

// takes either code or full name
function flag(input) {
  if (!CODE_RE.test(input) || input === 'UK') {
    input = nameToCode(input);
  }

  return codeToFlag(input);
}

// takes either emoji or code
function name(input, locale) {
  if (FLAG_RE.test(input)) {
    input = flagToCode(input);
  }

  return codeToName(input, locale);
}

module.exports = {
  MAGIC_NUMBER,

  CODE_RE,
  NAME_RE,
  FLAG_RE,

  code,
  flag,
  name,

  isCode,
  fuzzyCompare,

  codeToName,
  codeToFlag,
  nameToCode,
  flagToCode
};

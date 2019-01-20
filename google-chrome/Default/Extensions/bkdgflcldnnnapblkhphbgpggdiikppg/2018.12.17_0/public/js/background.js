(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = {
    Grade: require('./src/classes/grade')
}

},{"./src/classes/grade":2}],2:[function(require,module,exports){
const UNKNOWN_PRIVACY_SCORE = 2

/**
 * Range map data structures:
 *
 * Maps a numeric input to an arbitrary output based on provided ranges
 *
 * `steps` defines the range of inputs for each output,
 * `max` defines what happens if the input is above the given ranges
 * `zero` is a special case for when the input is 0 or falsy
 *
 * For example:
 *
 * zero: 'foo',
 * max: 'qux',
 * steps: [
 *     [1, 'bar'],
 *     [2, 'baz']
 * ]
 *
 * means:
 *
 * input === 0      maps to 'foo'
 * 0 < input < 1    maps to 'bar'
 * 1 <= input < 2   maps to 'baz'
 * input >= 2       maps to 'qux'
 */

const TRACKER_RANGE_MAP = {
    zero: 0,
    max: 10,
    steps: [
        [0.1, 1],
        [1, 2],
        [5, 3],
        [10, 4],
        [15, 5],
        [20, 6],
        [30, 7],
        [45, 8],
        [66, 9]
    ]
}

const GRADE_RANGE_MAP = {
    zero: 'A',
    max: 'D-',
    steps: [
        [2, 'A'],
        [4, 'B+'],
        [10, 'B'],
        [14, 'C+'],
        [20, 'C'],
        [30, 'D']
    ]
}

class Grade {
    constructor (attrs) {
        // defaults
        this.https = false
        this.httpsAutoUpgrade = false
        this.privacyScore = UNKNOWN_PRIVACY_SCORE // unknown

        this.entitiesBlocked = {}
        this.entitiesNotBlocked = {}

        this.scores = null

        // set any values that were passed in
        attrs = attrs || {}

        if (attrs.https) {
            this.setHttps(attrs.https, attrs.httpsAutoUpgrade)
        }
        if (typeof attrs.privacyScore !== 'undefined') {
            this.setPrivacyScore(attrs.privacyScore)
        }
        if (attrs.parentEntity) {
            this.setParentEntity(attrs.parentEntity, attrs.prevalence)
        }
        if (attrs.trackersBlocked) {
            Object.keys(attrs.trackersBlocked).forEach((entityName) => {
                this.addEntityBlocked(entityName, attrs.trackersBlocked[entityName].prevalence)
            })
        }
        if (attrs.trackersNotBlocked) {
            Object.keys(attrs.trackersNotBlocked).forEach((entityName) => {
                this.addEntityNotBlocked(entityName, attrs.trackersNotBlocked[entityName].prevalence)
            })
        }
    }

    setHttps (https, httpsAutoUpgrade) {
        this.scores = null
        this.https = https
        this.httpsAutoUpgrade = httpsAutoUpgrade
    }

    setPrivacyScore (score) {
        this.scores = null
        this.privacyScore = typeof score === 'number' ? score : UNKNOWN_PRIVACY_SCORE
    }

    addEntityBlocked (name, prevalence) {
        if (!name) return

        this.scores = null
        this.entitiesBlocked[name] = prevalence
    }

    addEntityNotBlocked (name, prevalence) {
        if (!name) return

        this.scores = null
        this.entitiesNotBlocked[name] = prevalence
    }

    setParentEntity (name, prevalence) {
        this.scores = null
        this.addEntityNotBlocked(name, prevalence)
    }

    calculate () {
        // HTTPS
        let siteHttpsScore, enhancedHttpsScore

        if (this.httpsAutoUpgrade) {
            siteHttpsScore = 0
            enhancedHttpsScore = 0
        } else if (this.https) {
            siteHttpsScore = 3
            enhancedHttpsScore = 0
        } else {
            siteHttpsScore = 10
            enhancedHttpsScore = 10
        }

        // PRIVACY
        // clamp to 10
        let privacyScore = Math.min(this.privacyScore, 10)

        // TRACKERS
        let siteTrackerScore = 0
        let enhancedTrackerScore = 0

        for (let entity in this.entitiesBlocked) {
            siteTrackerScore += this._normalizeTrackerScore(this.entitiesBlocked[entity])
        }

        for (let entity in this.entitiesNotBlocked) {
            siteTrackerScore += this._normalizeTrackerScore(this.entitiesNotBlocked[entity])
            enhancedTrackerScore += this._normalizeTrackerScore(this.entitiesNotBlocked[entity])
        }

        let siteTotalScore = siteHttpsScore + siteTrackerScore + privacyScore
        let enhancedTotalScore = enhancedHttpsScore + enhancedTrackerScore + privacyScore

        this.scores = {
            site: {
                grade: this._scoreToGrade(siteTotalScore),
                score: siteTotalScore,
                trackerScore: siteTrackerScore,
                httpsScore: siteHttpsScore,
                privacyScore: privacyScore
            },
            enhanced: {
                grade: this._scoreToGrade(enhancedTotalScore),
                score: enhancedTotalScore,
                trackerScore: enhancedTrackerScore,
                httpsScore: enhancedHttpsScore,
                privacyScore: privacyScore
            }
        }
    }

    get () {
        if (!this.scores) this.calculate()

        return this.scores
    }

    _getValueFromRangeMap (value, rangeMapData) {
        let steps = rangeMapData.steps

        if (!value || value <= 0) {
            return rangeMapData.zero
        }

        if (value >= steps[steps.length - 1][0]) {
            return rangeMapData.max
        }

        for (let i = 0; i < steps.length; i++) {
            if (value < steps[i][0]) {
                return steps[i][1]
            }
        }
    }

    _normalizeTrackerScore (pct) {
        return this._getValueFromRangeMap(pct, TRACKER_RANGE_MAP)
    }

    _scoreToGrade (score) {
        return this._getValueFromRangeMap(score, GRADE_RANGE_MAP)
    }
}

module.exports = Grade

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.elementTypeMaskMap = exports.setFilterDebugging = exports.elementTypes = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.parseDomains = parseDomains;
exports.parseOptions = parseOptions;
exports.parseHTMLFilter = parseHTMLFilter;
exports.parseFilter = parseFilter;
exports.parse = parse;
exports.matchesFilter = matchesFilter;
exports.matches = matches;
exports.getFingerprint = getFingerprint;

var _bloomFilterJs = require('bloom-filter-js');

var BloomFilterJS = _interopRequireWildcard(_bloomFilterJs);

var _badFingerprints = require('./badFingerprints.js');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var fs = require('fs');

/**
 * bitwise mask of different request types
 */
var elementTypes = exports.elementTypes = {
  SCRIPT: 1,
  IMAGE: 2,
  STYLESHEET: 4,
  OBJECT: 8,
  XMLHTTPREQUEST: 16,
  OBJECTSUBREQUEST: 32,
  SUBDOCUMENT: 64,
  DOCUMENT: 128,
  OTHER: 256
};

var filterDebugging = false;
var setFilterDebugging = exports.setFilterDebugging = function setFilterDebugging(debug) {
  if (debug) filterDebugging = debug;
};

// Maximum number of cached entries to keep for subsequent lookups
var maxCached = 100;

// Maximum number of URL chars to check in match clauses
var maxUrlChars = 100;

// Exact size for fingerprints, if you change also change fingerprintRegexs
var fingerprintSize = 8;
// Regexes used to create fingerprints
// There's more than one because sometimes a fingerprint is determined to be a bad
// one and would lead to a lot of collisions in the bloom filter). In those cases
// we use the 2nd fingerprint.
var fingerprintRegexs = [/.*([./&_\-=a-zA-Z0-9]{8})\$?.*/, /([./&_\-=a-zA-Z0-9]{8})\$?.*/];

/**
 * Maps element types to type mask.
 */
var elementTypeMaskMap = exports.elementTypeMaskMap = new Map([['script', elementTypes.SCRIPT], ['image', elementTypes.IMAGE], ['stylesheet', elementTypes.STYLESHEET], ['object', elementTypes.OBJECT], ['xmlhttprequest', elementTypes.XMLHTTPREQUEST], ['object-subrequest', elementTypes.OBJECTSUBREQUEST], ['subdocument', elementTypes.SUBDOCUMENT], ['document', elementTypes.DOCUMENT], ['other', elementTypes.OTHER]]);

var separatorCharacters = ':?/=^';

/**
 * Parses the domain string using the passed in separator and
 * fills in options.
 */
function parseDomains(input, separator, options) {
  options.domains = options.domains || [];
  options.skipDomains = options.skipDomains || [];
  var domains = input.split(separator);
  options.domains = options.domains.concat(domains.filter(function (domain) {
    return domain[0] !== '~';
  }));
  options.skipDomains = options.skipDomains.concat(domains.filter(function (domain) {
    return domain[0] === '~';
  }).map(function (domain) {
    return domain.substring(1);
  }));
}

if (!Array.prototype.includes) {
  Array.prototype.includes = function (searchElement /*, fromIndex*/) {
    'use strict';

    var O = Object(this);
    var len = parseInt(O.length, 10) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1], 10) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {
        k = 0;
      }
    }
    var currentElement;
    while (k < len) {
      currentElement = O[k];
      if (searchElement === currentElement || searchElement !== searchElement && currentElement !== currentElement) {
        // NaN !== NaN
        return true;
      }
      k++;
    }
    return false;
  };
}

/**
 * Parses options from the passed in input string
 */
function parseOptions(input) {
  var output = {
    binaryOptions: new Set()
  };

  var optionSupport = { 'third-party': 1, '~third-party': 0 };

  input.split(',').forEach(function (option) {
    option = option.trim();
    if (option.startsWith('domain=')) {
      var domainString = option.split('=')[1].trim();
      parseDomains(domainString, '|', output);
    } else {
      var optionWithoutPrefix = option[0] === '~' ? option.substring(1) : option;
      if (elementTypeMaskMap.has(optionWithoutPrefix)) {
        if (option[0] === '~') {
          output.skipElementTypeMask |= elementTypeMaskMap.get(optionWithoutPrefix);
        } else {
          output.elementTypeMask |= elementTypeMaskMap.get(optionWithoutPrefix);
        }
      }

      // unsupported options: this can include unsupported request types since they
      // fall through the if(elementTypeMaskMap) above
      if (!(optionSupport[option] || elementTypeMaskMap.has(optionWithoutPrefix))) {
        if (!output.unsupported) {
          output.unsupported = [];
        }
        output.unsupported.push(option);
      }

      output.binaryOptions.add(option);
    }
  });
  return output;
}

/**
 * Finds the first separator character in the input string
 */
function findFirstSeparatorChar(input, startPos) {
  for (var i = startPos; i < input.length; i++) {
    if (separatorCharacters.indexOf(input[i]) !== -1) {
      return i;
    }
  }
  return -1;
}

/**
 * Parses an HTML filter and modifies the passed in parsedFilterData
 * as necessary.
 *
 * @param input: The entire input string to consider
 * @param index: Index of the first hash
 * @param parsedFilterData: The parsedFilterData object to fill
 */
function parseHTMLFilter(input, index, parsedFilterData) {
  var domainsStr = input.substring(0, index);
  parsedFilterData.options = {};
  if (domainsStr.length > 0) {
    parseDomains(domainsStr, ',', parsedFilterData.options);
  }

  // The XOR parsedFilterData.elementHidingException is in case the rule already
  // was specified as exception handling with a prefixed @@
  parsedFilterData.isException = !!(input[index + 1] === '@' ^ parsedFilterData.isException);
  if (input[index + 1] === '@') {
    // Skip passed the first # since @# is 2 chars same as ##
    index++;
  }
  parsedFilterData.htmlRuleSelector = input.substring(index + 2);
}

function parseFilter(input, parsedFilterData, bloomFilter, exceptionBloomFilter) {
  input = input.trim();
  parsedFilterData.rawFilter = input;

  // Check for comment or nothing
  if (input.length === 0) {
    return false;
  }

  // Check for comments
  var beginIndex = 0;
  if (input[beginIndex] === '[' || input[beginIndex] === '!') {
    parsedFilterData.isComment = true;
    return false;
  }

  // Check for exception instead of filter
  parsedFilterData.isException = input[beginIndex] === '@' && input[beginIndex + 1] === '@';
  if (parsedFilterData.isException) {
    beginIndex = 2;
  }

  // Check for element hiding rules
  var index = input.indexOf('#', beginIndex);
  if (index !== -1) {
    if (input[index + 1] === '#' || input[index + 1] === '@') {
      parseHTMLFilter(input.substring(beginIndex), index - beginIndex, parsedFilterData);
      // HTML rules cannot be combined with other parsing,
      // other than @@ exception marking.
      return true;
    }
  }

  // Check for options, regex can have options too so check this before regex
  index = input.lastIndexOf('$');
  if (index !== -1) {
    parsedFilterData.options = parseOptions(input.substring(index + 1));
    // Get rid of the trailing options for the rest of the parsing
    input = input.substring(0, index);
  } else {
    parsedFilterData.options = {};
  }

  // Check for a regex
  parsedFilterData.isRegex = input[beginIndex] === '/' && input[input.length - 1] === '/' && beginIndex !== input.length - 1;
  if (parsedFilterData.isRegex) {
    parsedFilterData.data = input.slice(beginIndex + 1, -1);
    return true;
  }

  // Check if there's some kind of anchoring
  if (input[beginIndex] === '|') {
    // Check for an anchored domain name
    if (input[beginIndex + 1] === '|') {
      parsedFilterData.hostAnchored = true;
      var indexOfSep = findFirstSeparatorChar(input, beginIndex + 1);
      if (indexOfSep === -1) {
        indexOfSep = input.length;
      }
      beginIndex += 2;
      parsedFilterData.host = input.substring(beginIndex, indexOfSep);
      // remove wildcard from host name.
      // Fixes bug with filters like: ||facebook.com*/impression.php
      parsedFilterData.host = parsedFilterData.host.replace('*', '');
    } else {
      parsedFilterData.leftAnchored = true;
      beginIndex++;
    }
  }
  if (input[input.length - 1] === '|') {
    parsedFilterData.rightAnchored = true;
    input = input.substring(0, input.length - 1);
  }

  parsedFilterData.data = input.substring(beginIndex) || '*';
  // Use the host bloom filter if the filter is a host anchored filter rule with no other data
  if (exceptionBloomFilter && parsedFilterData.isException) {
    exceptionBloomFilter.add(getFingerprint(parsedFilterData.data));
  } else if (bloomFilter) {
    // To check for duplicates
    //if (bloomFilter.exists(getFingerprint(parsedFilterData.data))) {
    // console.log('duplicate found for data: ' + getFingerprint(parsedFilterData.data));
    //}
    // console.log('parse:', parsedFilterData.data, 'fingerprint:', getFingerprint(parsedFilterData.data));
    bloomFilter.add(getFingerprint(parsedFilterData.data));
  }

  return true;
}

/**
 * Parses the set of filter rules and fills in parserData
 * @param input filter rules
 * @param parserData out parameter which will be filled
 *   with the filters, exceptionFilters and htmlRuleFilters.
 */
function parse(input, parserData) {
  parserData.bloomFilter = parserData.bloomFilter || new BloomFilterJS.BloomFilter();
  parserData.exceptionBloomFilter = parserData.exceptionBloomFilter || new BloomFilterJS.BloomFilter();
  parserData.filters = parserData.filters || [];
  parserData.noFingerprintFilters = parserData.noFingerprintFilters || [];
  parserData.exceptionFilters = parserData.exceptionFilters || [];
  parserData.htmlRuleFilters = parserData.htmlRuleFilters || [];
  var startPos = 0;
  var endPos = input.length;
  var newline = '\n';
  while (startPos <= input.length) {
    endPos = input.indexOf(newline, startPos);
    if (endPos === -1) {
      newline = '\r';
      endPos = input.indexOf(newline, startPos);
    }
    if (endPos === -1) {
      endPos = input.length;
    }
    var filter = input.substring(startPos, endPos);
    var parsedFilterData = {};
    if (parseFilter(filter, parsedFilterData, parserData.bloomFilter, parserData.exceptionBloomFilter)) {
      var fingerprint = getFingerprint(parsedFilterData.data);
      if (parsedFilterData.htmlRuleSelector) {
        parserData.htmlRuleFilters.push(parsedFilterData);
      } else if (parsedFilterData.isException) {
        parserData.exceptionFilters.push(parsedFilterData);
      } else if (fingerprint.length > 0) {
        parserData.filters.push(parsedFilterData);
      } else {
        parserData.noFingerprintFilters.push(parsedFilterData);
      }
    }
    startPos = endPos + 1;
  }
}

/**
 * Obtains the domain index of the input filter line
 */
function getDomainIndex(input) {
  var index = input.indexOf(':');
  ++index;
  while (input[index] === '/') {
    index++;
  }
  return index;
}

/**
 * Similar to str1.indexOf(filter, startingPos) but with
 * extra consideration to some ABP filter rules like ^.
 */
function indexOfFilter(input, filter, startingPos) {
  if (filter.length > input.length) {
    return -1;
  }

  var filterParts = filter.split('^');
  var index = startingPos;
  var beginIndex = -1;
  var prefixedSeparatorChar = false;

  for (var f = 0; f < filterParts.length; f++) {
    if (filterParts[f] === '') {
      prefixedSeparatorChar = true;
      continue;
    }

    index = input.indexOf(filterParts[f], index);
    if (index === -1) {
      return -1;
    }
    if (beginIndex === -1) {
      beginIndex = index;
    }

    if (prefixedSeparatorChar) {
      if (separatorCharacters.indexOf(input[index - 1]) === -1) {
        return -1;
      }
    }
    // If we are in an in between filterPart
    if (f + 1 < filterParts.length &&
    // and we have some chars left in the input past the last filter match
    input.length > index + filterParts[f].length) {
      if (separatorCharacters.indexOf(input[index + filterParts[f].length]) === -1) {
        return -1;
      }
    }

    prefixedSeparatorChar = false;
  }
  return beginIndex;
}

function getUrlHost(input) {
  var domainIndexStart = getDomainIndex(input);
  var domainIndexEnd = findFirstSeparatorChar(input, domainIndexStart);
  if (domainIndexEnd === -1) {
    domainIndexEnd = input.length;
  }
  return input.substring(domainIndexStart, domainIndexEnd);
}

function filterDataContainsOption(parsedFilterData, option) {
  return parsedFilterData.options && parsedFilterData.options.binaryOptions && parsedFilterData.options.binaryOptions.has(option);
}

function isThirdPartyHost(baseContextHost, testHost) {
  if (!testHost.endsWith(baseContextHost)) {
    return true;
  }

  var c = testHost[testHost.length - baseContextHost.length - 1];
  return c !== '.' && c !== undefined;
}

// Determines if there's a match based on the options, this doesn't
// mean that the filter rule shoudl be accepted, just that the filter rule
// should be considered given the current context.
// By specifying context params, you can filter out the number of rules which are
// considered.
function matchOptions(parsedFilterData, input) {
  var contextParams = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (contextParams.elementTypeMask !== undefined && parsedFilterData.options) {
    if (parsedFilterData.options.elementTypeMask !== undefined && !(parsedFilterData.options.elementTypeMask & contextParams.elementTypeMask)) {
      return false;
    }if (parsedFilterData.options.skipElementTypeMask !== undefined && parsedFilterData.options.skipElementTypeMask & contextParams.elementTypeMask) {
      return false;
    }
  }

  // Domain option check
  if (contextParams.domain !== undefined && parsedFilterData.options) {
    if (parsedFilterData.options.domains || parsedFilterData.options.skipDomains) {
      // Get the domains that should be considered
      var shouldBlockDomains = parsedFilterData.options.domains.filter(function (domain) {
        return !isThirdPartyHost(domain, contextParams.domain);
      });

      var shouldSkipDomains = parsedFilterData.options.skipDomains.filter(function (domain) {
        return !isThirdPartyHost(domain, contextParams.domain);
      });
      // Handle cases like: example.com|~foo.example.com should llow for foo.example.com
      // But ~example.com|foo.example.com should block for foo.example.com
      var leftOverBlocking = shouldBlockDomains.filter(function (shouldBlockDomain) {
        return shouldSkipDomains.every(function (shouldSkipDomain) {
          return isThirdPartyHost(shouldBlockDomain, shouldSkipDomain);
        });
      });
      var leftOverSkipping = shouldSkipDomains.filter(function (shouldSkipDomain) {
        return shouldBlockDomains.every(function (shouldBlockDomain) {
          return isThirdPartyHost(shouldSkipDomain, shouldBlockDomain);
        });
      });

      // If we have none left over, then we shouldn't consider this a match
      if (shouldBlockDomains.length === 0 && parsedFilterData.options.domains.length !== 0 || shouldBlockDomains.length > 0 && leftOverBlocking.length === 0 || shouldSkipDomains.length > 0 && leftOverSkipping.length > 0) {
        return false;
      }
    }
  }

  // If we're in the context of third-party site, then consider third-party option checks
  if (contextParams['third-party'] !== undefined) {
    // Is the current rule check for third party only?
    if (filterDataContainsOption(parsedFilterData, 'third-party')) {
      var inputHost = getUrlHost(input);
      var inputHostIsThirdParty = isThirdPartyHost(parsedFilterData.host, inputHost);
      if (inputHostIsThirdParty || !contextParams['third-party']) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Given an individual parsed filter data determines if the input url should block.
 */
function matchesFilter(parsedFilterData, input) {
  var contextParams = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var cachedInputData = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  if (parsedFilterData.options && parsedFilterData.options.unsupported) {
    return false;
  }

  if (!matchOptions(parsedFilterData, input, contextParams)) {
    return false;
  }

  // Check for a regex match
  if (parsedFilterData.isRegex) {
    if (!parsedFilterData.regex) {
      parsedFilterData.regex = new RegExp(parsedFilterData.data);
    }
    return parsedFilterData.regex.test(input);
  }

  // Check for both left and right anchored
  if (parsedFilterData.leftAnchored && parsedFilterData.rightAnchored) {
    return parsedFilterData.data === input;
  }

  // Check for right anchored
  if (parsedFilterData.rightAnchored) {
    return input.slice(-parsedFilterData.data.length) === parsedFilterData.data;
  }

  // Check for left anchored
  if (parsedFilterData.leftAnchored) {
    return input.substring(0, parsedFilterData.data.length) === parsedFilterData.data;
  }

  // Check for domain name anchored
  if (parsedFilterData.hostAnchored) {
    if (!cachedInputData.currentHost) {
      cachedInputData.currentHost = getUrlHost(input);
    }

    // domain anchored, first check if we're on the correct domain
    if (!isThirdPartyHost(parsedFilterData.host, cachedInputData.currentHost)) {
      // check wildcard filters
      if (parsedFilterData.rawFilter.match(/\*/)) {
        return wildcardMatch(parsedFilterData, input);
        // or check normal filters
      } else {
        return indexOfFilter(input, parsedFilterData.data) !== -1;
      }
    } else {
      // fails domain anchor check
      return false;
    }
  }

  if (!wildcardMatch(parsedFilterData, input)) return false;

  return true;
}

function wildcardMatch(parsedFilterData, input) {
  // Wildcard match comparison
  var parts = parsedFilterData.data.split('*');
  var index = 0;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = parts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var part = _step.value;

      var newIndex = indexOfFilter(input, part, index);
      if (newIndex === -1) {
        return false;
      }
      index = newIndex + part.length;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return true;
}

function discoverMatchingPrefix(array, bloomFilter, str) {
  var prefixLen = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : fingerprintSize;

  for (var i = 0; i < str.length - prefixLen + 1; i++) {
    var sub = str.substring(i, i + prefixLen);
    if (bloomFilter.exists(sub)) {
      array.push({ badFingerprint: sub, src: str });
      // console.log('bad-fingerprint:', sub, 'for url:', str);
    } else {
        // console.log('good-fingerprint:', sub, 'for url:', str);
      }
  }
}

function hasMatchingFilters(filterList, parsedFilterData, input, contextParams, cachedInputData) {
  var foundFilter = filterList.find(function (parsedFilterData2) {
    return matchesFilter(parsedFilterData2, input, contextParams, cachedInputData);
  });
  if (foundFilter && cachedInputData.matchedFilters && foundFilter.rawFilter) {

    // debug logging for matched filters. To turn this on run this in the extension console
    // abp.setFilterDebugging(true)
    if (filterDebugging) {
      console.log('Matched Filter\nList name: ' + contextParams.listName + '\nRequest: ' + input + '\nFilter: ' + JSON.stringify(foundFilter));
    }

    // increment the count of matches
    // we store an extra object and a count so that in the future
    // other bits of information can be recorded during match time
    if (cachedInputData.matchedFilters[foundFilter.rawFilter]) {
      cachedInputData.matchedFilters[foundFilter.rawFilter].matches += 1;
    } else {
      cachedInputData.matchedFilters[foundFilter.rawFilter] = { matches: 1 };
    }

    // can't write to local files like this
    //fs.writeFileSync('easylist-matches.json', JSON.stringify(cachedInputData.matchedFilters), 'utf-8');
  }
  return !!foundFilter;
}

/**
 * Using the parserData rules will try to see if the input URL should be blocked or not
 * @param parserData The filter data obtained from a call to parse
 * @param input The input URL
 * @return true if the URL should be blocked
 */
function matches(parserData, input) {
  var contextParams = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var cachedInputData = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  cachedInputData.bloomNegativeCount = cachedInputData.bloomNegativeCount || 0;
  cachedInputData.bloomPositiveCount = cachedInputData.bloomPositiveCount || 0;
  cachedInputData.notMatchCount = cachedInputData.notMatchCount || 0;
  cachedInputData.badFingerprints = cachedInputData.badFingerprints || [];
  cachedInputData.matchedFilters = cachedInputData.matchedFilters || {};

  cachedInputData.bloomFalsePositiveCount = cachedInputData.bloomFalsePositiveCount || 0;
  var hasMatchingNoFingerprintFilters = void 0;
  var cleanedInput = input.replace(/^https?:\/\//, '');
  if (cleanedInput.length > maxUrlChars) {
    cleanedInput = cleanedInput.substring(0, maxUrlChars);
  }
  if (parserData.bloomFilter) {
    if (!parserData.bloomFilter.substringExists(cleanedInput, fingerprintSize)) {
      cachedInputData.bloomNegativeCount++;
      cachedInputData.notMatchCount++;
      // console.log('early return because of bloom filter check!');
      hasMatchingNoFingerprintFilters = hasMatchingFilters(parserData.noFingerprintFilters, parserData, input, contextParams, cachedInputData);

      if (!hasMatchingNoFingerprintFilters) {
        return false;
      }
    }
    // console.log('looked for url in bloom filter and it said yes:', cleaned);
  }
  cachedInputData.bloomPositiveCount++;

  // console.log('not early return: ', input);
  delete cachedInputData.currentHost;
  cachedInputData.misses = cachedInputData.misses || new Set();
  cachedInputData.missList = cachedInputData.missList || [];
  if (cachedInputData.missList.length > maxCached) {
    cachedInputData.misses.delete(cachedInputData.missList[0]);
    cachedInputData.missList = cachedInputData.missList.splice(1);
  }
  if (cachedInputData.misses.has(input)) {
    cachedInputData.notMatchCount++;
    // console.log('positive match for input: ', input);
    return false;
  }

  if (hasMatchingFilters(parserData.filters, parserData, input, contextParams, cachedInputData) || hasMatchingNoFingerprintFilters === true || hasMatchingNoFingerprintFilters === undefined && hasMatchingFilters(parserData.noFingerprintFilters, parserData, input, contextParams, cachedInputData)) {
    // Check for exceptions only when there's a match because matches are
    // rare compared to the volume of checks
    var exceptionBloomFilterMiss = parserData.exceptionBloomFilter && !parserData.exceptionBloomFilter.substringExists(cleanedInput, fingerprintSize);
    if (!exceptionBloomFilterMiss && hasMatchingFilters(parserData.exceptionFilters, parserData, input, contextParams, cachedInputData)) {
      cachedInputData.notMatchCount++;
      return false;
    }
    return true;
  }

  // The bloom filter had a false positive, se we checked for nothing! :'(
  // This is probably (but not always) an indication that the fingerprint selection should be tweaked!
  cachedInputData.missList.push(input);
  cachedInputData.misses.add(input);
  cachedInputData.notMatchCount++;
  cachedInputData.bloomFalsePositiveCount++;
  discoverMatchingPrefix(cachedInputData.badFingerprints, parserData.bloomFilter, cleanedInput);
  // console.log('positive match for input: ', input);
  return false;
}

/**
 * Obtains a fingerprint for the specified filter
 */
function getFingerprint(str) {
  var _loop = function _loop() {
    var fingerprintRegex = fingerprintRegexs[i];
    var result = fingerprintRegex.exec(str);
    fingerprintRegex.lastIndex = 0;

    if (result && !_badFingerprints.badFingerprints.includes(result[1]) && !_badFingerprints.badSubstrings.find(function (badSubstring) {
      return result[1].includes(badSubstring);
    })) {
      return {
        v: result[1]
      };
    }
    if (result) {
      // console.log('checking again for str:', str, 'result:', result[1]);
    } else {
        // console.log('checking again for str, no result');
      }
  };

  for (var i = 0; i < fingerprintRegexs.length; i++) {
    var _ret = _loop();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
  }
  // This is pretty ugly but getting fingerprints is assumed to be used only when preprocessing and
  // in a live environment.
  if (str.length > 8) {
    // Remove first and last char
    return getFingerprint(str.slice(1, -1));
  }
  // console.warn('Warning: Could not determine a good fingerprint for:', str);
  return '';
}

},{"./badFingerprints.js":4,"bloom-filter-js":5,"fs":6}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var badFingerprints = exports.badFingerprints = ["/walmart", "redirect", "/microso", "/jquery.", "/library", "/account", "/common/", "/generat", "homepage", "social/j", "googlead", "tag/js/g", "analytic", "oublecli", "provider", "gpt/puba", "js?callb", "recommen", "&callbac", "ubads.g.", "gampad/a", "w.google", "google.c", "pagead/e", "pagead/j", "pagead/g", "ahoo.com", "zz/combo", "content/", "desktop-", "content-", ".yimg.co", "img.com/", "content_", "/overlay", "assets/s", "/themes/", "/header-", "rq/darla", "default/", "build/js", "/public/", "controll", "interest", "plugin/a", "dserver.", "gallery-", "platform", "resource", "default_", "template", "streams/", "assets/p", "styleshe", "reative/", "delivera", "300x250.", "js/beaco", "/footer-", "facebook", "timg.com", "d.double", "pagead/i", "external", "iframe_a", "instream", "com/js/a", "oogleuse", "gadgets/", "gallery/", "yfpadobj", "com/lib/", "/global-", "/global/", "componen", "/process", "frontpag", "amazon.c", "/images/", "/images-", "adsystem", "microsof", "/jquery-", ".com/lib", "library/", "common/r", "generate", "/Common/", "/product", "/static/", ".com/js/", "/homepag", "/social/", ".googlea", "/pagead/", "/tag/js/", "/googlea", "g.double", ".doublec", "doublecl", "search.c", "/provide", "/gpt/pub", ".js?call", "callback", "pubads.g", "/gampad/", "ww.googl", "oogle.co", "_300x250", "300x250_", "-300x250", "yahoo.co", "ttp://l.", "/zz/comb", "/content", "/ads/ads", "/ads-min", "l.yimg.c", "yimg.com", "-content", "/generic", "overlay/", "/assets/", "overlay.", "/media/t", "/media/p", "/css/ski", "common/a", "/toolbar", "/rq/darl", "/default", "/common_", "/desktop", "/build/j", "/plugin/", "-iframe-", "overlay-", ".adserve", "adserver", "/gallery", "_platfor", "/resourc", "/storage", "-source/", "/templat", "-templat", "/streams", "/video-a", "/stylesh", "/secure/", "/creativ", "creative", "/deliver", "/beacon/", "/js/beac", "/search/", "/search-", "/search_", "common/i", "/preview", "/google.", "/faceboo", "/static.", "ytimg.co", "/pubads.", "/iframe_", "/doublec", "ad.doubl", "/ad_data", "/externa", "accounts", "/instrea", "googleus", ".com/gad", "/gadgets", "-gallery", "/yfpadob", "/compone", "/control", "/recomme", "/frontpa", "/analyti", "/amazon.", "mazon.co", "images-a", "images/G", "images/I", "//images", "/redirec", "-adsyste", "edirect.", "icrosoft", "ommon/re", "omepage/", "oogleads", "ag/js/gp", "nalytics", "ubleclic", "pt/pubad", "s?callba", "allback=", "omepage_", "ecommend", "bads.g.d", "ampad/ad", ".google.", "ogle.com", "agead/ex", "agead/js", "agead/ga", "hoo.com/", "z/combo?", "ontent/s", "ontent_i", "ontent-a", "q/darla/", "ontent/b", "ontent/a", "ontrolle", "ontent/i", "server.y", "latform_", "emplate-", "emplates", "tyleshee", "mg.com/a", "s/beacon", "xternal_", "ogleuser", "ccounts/", "fpadobje", "omponent", "emplate/", "rontpage", "azon.com", "mmon/res", "ogleadse", "g/js/gpt", "ads.g.do", "bleclick", "/beacon.", "t/pubads", "?callbac", "commenda", "mpad/ads", "gle.com/", "gead/exp", "gead/js/", "gead/gad", "mg.com/z", "mg.com/r", "ntent/ad", "ntroller", "erver.ya", "ylesheet", "gleuserc", "padobjec", "mponent/", "g.com/a/", "zon.com/", "gleadser", "ds.g.dou", "leclick.", "/pubads_", "ommendat", "pad/ads?", "le.com/a", "ead/expa", "ead/gadg", "g.com/zz", "g.com/rq", "rver.yah", "ead/js/l", "leclick/", "leuserco", "adobject", ".com/a/1", "leadserv", "s.g.doub", "eclick.n", "pubads_i", "mmendati", "ad/ads?g", "e.com/ad", "ad/expan", "ad/gadge", ".com/zz/", ".com/rq/", "ver.yaho", "ad/js/li", "ad/ads?a", "eusercon", "dobject.", "eadservi", ".g.doubl", "click.ne", "ubads_im", "mendatio", "d/ads?gd", ".com/ads", "d/expans", "d/gadget", "com/zz/c", "com/rq/d", "er.yahoo", "d/js/lid", "d/ads?ad", "usercont", "object.j", "adservic", "lick.net", "bads_imp", "endation", "/ads?gdf", "com/ads/", "/expansi", "om/zz/co", "om/rq/da", "r.yahoo.", "/js/lida", "/ads?ad_", "serconte", "bject.js", "dservice", "ick.net/", "ads_impl", "ndations", "ads?gdfp", "expansio", "m/zz/com", "m/rq/dar", ".yahoo.c", "js/lidar", "ads?ad_r", "erconten", "services", "ck.net/p", "ds_impl_", "ck.net/g", "ds?gdfp_", "xpansion", "oo.com/a", "s/lidar.", "ds?ad_ru", "rcontent", "ervices.", "partner.", "k.net/ga", "s?gdfp_r", "pansion_", "o.com/a?", "/lidar.j", "s?ad_rul", "content.", "rvices.c", "artner.g", ".net/gam", "?gdfp_re", "ansion_e", "lidar.js", "?ad_rule", "ontent.c", "vices.co", "rtner.go", "net/gamp", "gdfp_req", "pagead2.", "nsion_em", "ad_rule=", "ntent.co", "ices.com", "tner.goo", "et/gampa", "dfp_req=", "agead2.g", "sion_emb", "tent.com", "ces.com/", "ner.goog", "t/gampad", "fp_req=1", "gead2.go", "ion_embe", "er.googl", "p_req=1&", "ead2.goo", "on_embed", "r.google", "ad2.goog", "n_embed.", "es.com/g", "d2.googl", "_embed.j", "s.com/gp", "2.google", "embed.js", ".com/gpt", ".googles", "com/gpt/", "googlesy", "om/gpt/p", "ooglesyn", "m/gpt/pu", "oglesynd", "glesyndi", "lesyndic", "esyndica", "syndicat", "yndicati", "ndicatio", "dication", "ication.", "cation.c", "ation.co", "tion.com", "ion.com/", "on.com/p", "n.com/pa", ".com/pag", "com/page", "om/pagea", "m/pagead"];
var badSubstrings = exports.badSubstrings = ['com', 'net', 'http', 'image', 'www', 'img', '.js', 'oogl', 'min.', 'que', 'synd', 'dicat', 'templ', 'tube', 'page', 'home', 'mepa', 'mplat', 'tati', 'user', 'aws', 'omp', 'icros', 'espon', 'org', 'nalyti', 'acebo', 'lead', 'con', 'count', 'vers', 'pres', 'aff', 'atio', 'tent', 'ative', 'en_', 'fr_', 'es_', 'ha1', 'ha2', 'live', 'odu', 'esh', 'adm', 'crip', 'ect', 'tics', 'edia', 'ini', 'yala', 'ana', 'rac', 'trol', 'tern', 'card', 'yah', 'tion', 'erv', '.co', 'lug', 'eat', 'ugi', 'ates', 'loud', 'ner', 'earc', 'atd', 'fro', 'ruct', 'sour', 'news', 'ddr', 'htm', 'fram', 'dar', 'flas', 'lay', 'orig', 'uble', 'om/', 'ext', 'link', '.png', 'com/', 'tri', 'but', 'vity', 'spri'];

},{}],5:[function(require,module,exports){
(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports'], factory);
  } else if (typeof exports !== 'undefined') {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.main = mod.exports;
  }
})(this, function (exports) {
  'use strict';

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var toCharCodeArray = function toCharCodeArray(str) {
    return str.split('').map(function (c) {
      return c.charCodeAt(0);
    });
  };

  exports.toCharCodeArray = toCharCodeArray;
  /**
   * Returns a function that generates a Rabin fingerprint hash function
   * @param p The prime to use as a base for the Rabin fingerprint algorithm
   */
  var simpleHashFn = function simpleHashFn(p) {
    return function (arrayValues, lastHash, lastCharCode) {
      return lastHash ?
      // See the abracadabra example: https://en.wikipedia.org/wiki/Rabin%E2%80%93Karp_algorithm
      (lastHash - lastCharCode * Math.pow(p, arrayValues.length - 1)) * p + arrayValues[arrayValues.length - 1] : arrayValues.reduce(function (total, x, i) {
        return total + x * Math.pow(p, arrayValues.length - i - 1);
      }, 0);
    };
  };

  exports.simpleHashFn = simpleHashFn;
  /*
   * Sets the specific bit location
   */
  var setBit = function setBit(buffer, bitLocation) {
    return buffer[bitLocation / 8 | 0] |= 1 << bitLocation % 8;
  };

  exports.setBit = setBit;
  /**
   * Returns true if the specified bit location is set
   */
  var isBitSet = function isBitSet(buffer, bitLocation) {
    return !!(buffer[bitLocation / 8 | 0] & 1 << bitLocation % 8);
  };

  exports.isBitSet = isBitSet;

  var BloomFilter = (function () {
    /**
     * Constructs a new BloomFilter instance.
     * If you'd like to initialize with a specific size just call BloomFilter.from(Array.from(Uint8Array(size).values()))
     * Note that there is purposely no remove call because adding that would introduce false negatives.
     *
     * @param bitsPerElement Used along with estimatedNumberOfElements to figure out the size of the BloomFilter
     *   By using 10 bits per element you'll have roughly 1% chance of false positives.
     * @param estimatedNumberOfElements Used along with bitsPerElementto figure out the size of the BloomFilter
     * @param hashFns An array of hash functions to use. These can be custom but they should be of the form
     *   (arrayValues, lastHash, lastCharCode) where the last 2 parameters are optional and are used to make
     *   a rolling hash to save computation.
     */

    function BloomFilter(bitsPerElement, estimatedNumberOfElements, hashFns) {
      if (bitsPerElement === undefined) bitsPerElement = 10;
      if (estimatedNumberOfElements === undefined) estimatedNumberOfElements = 50000;

      _classCallCheck(this, BloomFilter);

      if (bitsPerElement.constructor === Uint8Array) {
        // Re-order params
        this.buffer = bitsPerElement;
        if (estimatedNumberOfElements.constructor === Array) {
          hashFns = estimatedNumberOfElements;
        }
        // Calculate new buffer size
        this.bufferBitSize = this.buffer.length * 8;
      } else if (bitsPerElement.constructor === Array) {
        // Re-order params
        var arrayLike = bitsPerElement;
        if (estimatedNumberOfElements.constructor === Array) {
          hashFns = estimatedNumberOfElements;
        }
        // Calculate new buffer size
        this.bufferBitSize = arrayLike.length * 8;
        this.buffer = new Uint8Array(arrayLike);
      } else {
        // Calculate the needed buffer size in bytes
        this.bufferBitSize = bitsPerElement * estimatedNumberOfElements;
        this.buffer = new Uint8Array(Math.ceil(this.bufferBitSize / 8));
      }
      this.hashFns = hashFns || [simpleHashFn(11), simpleHashFn(17), simpleHashFn(23)];
      this.setBit = setBit.bind(this, this.buffer);
      this.isBitSet = isBitSet.bind(this, this.buffer);
    }

    _createClass(BloomFilter, [{
      key: 'toJSON',

      /**
       * Serializing the current BloomFilter into a JSON friendly format.
       * You would typically pass the result into JSON.stringify.
       * Note that BloomFilter.from only works if the hash functions are the same.
       */
      value: function toJSON() {
        return Array.from(this.buffer.values());
      }
    }, {
      key: 'print',

      /**
       * Print the buffer, mostly used for debugging only
       */
      value: function print() {
        console.log(this.buffer);
      }
    }, {
      key: 'getLocationsForCharCodes',

      /**
       * Given a string gets all the locations to check/set in the buffer
       * for that string.
       * @param charCodes An array of the char codes to use for the hash
       */
      value: function getLocationsForCharCodes(charCodes) {
        var _this = this;

        return this.hashFns.map(function (h) {
          return h(charCodes) % _this.bufferBitSize;
        });
      }
    }, {
      key: 'getHashesForCharCodes',

      /**
       * Obtains the hashes for the specified charCodes
       * See "Rabin fingerprint" in https://en.wikipedia.org/wiki/Rabin%E2%80%93Karp_algorithm for more information.
       *
       * @param charCodes An array of the char codes to use for the hash
       * @param lastHashes If specified, it will pass the last hash to the hashing
       * function for a faster computation.  Must be called with lastCharCode.
       * @param lastCharCode if specified, it will pass the last char code
       *  to the hashing function for a faster computation. Must be called with lastHashes.
       */
      value: function getHashesForCharCodes(charCodes, lastHashes, lastCharCode) {
        var _this2 = this;

        return this.hashFns.map(function (h, i) {
          return h(charCodes, lastHashes ? lastHashes[i] : undefined, lastCharCode, _this2.bufferBitSize);
        });
      }
    }, {
      key: 'add',

      /**
       * Adds he specified string to the set
       */
      value: function add(data) {
        if (data.constructor !== Array) {
          data = toCharCodeArray(data);
        }

        this.getLocationsForCharCodes(data).forEach(this.setBit);
      }
    }, {
      key: 'exists',

      /**
       * Checks whether an element probably exists in the set, or definitely doesn't.
       * @param str Either a string to check for existance or an array of the string's char codes
       *   The main reason why you'd want to pass in a char code array is because passing a string
       *   will use JS directly to get the char codes which is very inneficient compared to calling
       *   into C++ code to get it and then making the call.
       *
       * Returns true if the element probably exists in the set
       * Returns false if the element definitely does not exist in the set
       */
      value: function exists(data) {
        if (data.constructor !== Array) {
          data = toCharCodeArray(data);
        }
        return this.getLocationsForCharCodes(data).every(this.isBitSet);
      }
    }, {
      key: 'substringExists',

      /**
       * Checks if any substring of length substringLenght probably exists or definitely doesn't
       * If false is returned then no substring of the specified string of the specified lengthis in the bloom filter
       * @param data The substring or char array to check substrings on.
       */
      value: function substringExists(data, substringLength) {
        var _this3 = this;

        if (data.constructor !== Uint8Array) {
          if (data.constructor !== Array) {
            data = toCharCodeArray(data);
          }
          data = new Uint8Array(data);
        }

        var lastHashes = undefined,
            lastCharCode = undefined;
        for (var i = 0; i < data.length - substringLength + 1; i++) {

          lastHashes = this.getHashesForCharCodes(data.subarray(i, i + substringLength), lastHashes, lastCharCode);
          if (lastHashes.map(function (x) {
            return x % _this3.bufferBitSize;
          }).every(this.isBitSet)) {
            return true;
          }
          lastCharCode = data[i];
        }
        return false;
      }
    }], [{
      key: 'from',

      /**
       * Construct a Bloom filter from a previous array of data
       * Note that the hash functions must be the same!
       */
      value: function from(arrayLike, hashFns) {
        return new BloomFilter(arrayLike, hashFns);
      }
    }]);

    return BloomFilter;
  })();

  exports.BloomFilter = BloomFilter;
});

},{}],6:[function(require,module,exports){

},{}],7:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":8,"ieee754":10}],8:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],9:[function(require,module,exports){
(function (global,setImmediate){
/*
 * Dexie.js - a minimalistic wrapper for IndexedDB
 * ===============================================
 *
 * By David Fahlander, david.fahlander@gmail.com
 *
 * Version 2.0.4, Fri May 25 2018
 *
 * http://dexie.org
 *
 * Apache License Version 2.0, January 2004, http://www.apache.org/licenses/
 */
 
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Dexie = factory());
}(this, (function () { 'use strict';

var keys = Object.keys;
var isArray = Array.isArray;
var _global = typeof self !== 'undefined' ? self :
    typeof window !== 'undefined' ? window :
        global;
function extend(obj, extension) {
    if (typeof extension !== 'object')
        return obj;
    keys(extension).forEach(function (key) {
        obj[key] = extension[key];
    });
    return obj;
}
var getProto = Object.getPrototypeOf;
var _hasOwn = {}.hasOwnProperty;
function hasOwn(obj, prop) {
    return _hasOwn.call(obj, prop);
}
function props(proto, extension) {
    if (typeof extension === 'function')
        extension = extension(getProto(proto));
    keys(extension).forEach(function (key) {
        setProp(proto, key, extension[key]);
    });
}
var defineProperty = Object.defineProperty;
function setProp(obj, prop, functionOrGetSet, options) {
    defineProperty(obj, prop, extend(functionOrGetSet && hasOwn(functionOrGetSet, "get") && typeof functionOrGetSet.get === 'function' ?
        { get: functionOrGetSet.get, set: functionOrGetSet.set, configurable: true } :
        { value: functionOrGetSet, configurable: true, writable: true }, options));
}
function derive(Child) {
    return {
        from: function (Parent) {
            Child.prototype = Object.create(Parent.prototype);
            setProp(Child.prototype, "constructor", Child);
            return {
                extend: props.bind(null, Child.prototype)
            };
        }
    };
}
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
function getPropertyDescriptor(obj, prop) {
    var pd = getOwnPropertyDescriptor(obj, prop), proto;
    return pd || (proto = getProto(obj)) && getPropertyDescriptor(proto, prop);
}
var _slice = [].slice;
function slice(args, start, end) {
    return _slice.call(args, start, end);
}
function override(origFunc, overridedFactory) {
    return overridedFactory(origFunc);
}
function assert(b) {
    if (!b)
        throw new Error("Assertion Failed");
}
function asap(fn) {
    if (_global.setImmediate)
        setImmediate(fn);
    else
        setTimeout(fn, 0);
}

/** Generate an object (hash map) based on given array.
 * @param extractor Function taking an array item and its index and returning an array of 2 items ([key, value]) to
 *        instert on the resulting object for each item in the array. If this function returns a falsy value, the
 *        current item wont affect the resulting object.
 */
function arrayToObject(array, extractor) {
    return array.reduce(function (result, item, i) {
        var nameAndValue = extractor(item, i);
        if (nameAndValue)
            result[nameAndValue[0]] = nameAndValue[1];
        return result;
    }, {});
}
function trycatcher(fn, reject) {
    return function () {
        try {
            fn.apply(this, arguments);
        }
        catch (e) {
            reject(e);
        }
    };
}
function tryCatch(fn, onerror, args) {
    try {
        fn.apply(null, args);
    }
    catch (ex) {
        onerror && onerror(ex);
    }
}
function getByKeyPath(obj, keyPath) {
    // http://www.w3.org/TR/IndexedDB/#steps-for-extracting-a-key-from-a-value-using-a-key-path
    if (hasOwn(obj, keyPath))
        return obj[keyPath]; // This line is moved from last to first for optimization purpose.
    if (!keyPath)
        return obj;
    if (typeof keyPath !== 'string') {
        var rv = [];
        for (var i = 0, l = keyPath.length; i < l; ++i) {
            var val = getByKeyPath(obj, keyPath[i]);
            rv.push(val);
        }
        return rv;
    }
    var period = keyPath.indexOf('.');
    if (period !== -1) {
        var innerObj = obj[keyPath.substr(0, period)];
        return innerObj === undefined ? undefined : getByKeyPath(innerObj, keyPath.substr(period + 1));
    }
    return undefined;
}
function setByKeyPath(obj, keyPath, value) {
    if (!obj || keyPath === undefined)
        return;
    if ('isFrozen' in Object && Object.isFrozen(obj))
        return;
    if (typeof keyPath !== 'string' && 'length' in keyPath) {
        assert(typeof value !== 'string' && 'length' in value);
        for (var i = 0, l = keyPath.length; i < l; ++i) {
            setByKeyPath(obj, keyPath[i], value[i]);
        }
    }
    else {
        var period = keyPath.indexOf('.');
        if (period !== -1) {
            var currentKeyPath = keyPath.substr(0, period);
            var remainingKeyPath = keyPath.substr(period + 1);
            if (remainingKeyPath === "")
                if (value === undefined)
                    delete obj[currentKeyPath];
                else
                    obj[currentKeyPath] = value;
            else {
                var innerObj = obj[currentKeyPath];
                if (!innerObj)
                    innerObj = (obj[currentKeyPath] = {});
                setByKeyPath(innerObj, remainingKeyPath, value);
            }
        }
        else {
            if (value === undefined)
                delete obj[keyPath];
            else
                obj[keyPath] = value;
        }
    }
}
function delByKeyPath(obj, keyPath) {
    if (typeof keyPath === 'string')
        setByKeyPath(obj, keyPath, undefined);
    else if ('length' in keyPath)
        [].map.call(keyPath, function (kp) {
            setByKeyPath(obj, kp, undefined);
        });
}
function shallowClone(obj) {
    var rv = {};
    for (var m in obj) {
        if (hasOwn(obj, m))
            rv[m] = obj[m];
    }
    return rv;
}
var concat = [].concat;
function flatten(a) {
    return concat.apply([], a);
}
//https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
var intrinsicTypes = "Boolean,String,Date,RegExp,Blob,File,FileList,ArrayBuffer,DataView,Uint8ClampedArray,ImageData,Map,Set"
    .split(',').concat(flatten([8, 16, 32, 64].map(function (num) { return ["Int", "Uint", "Float"].map(function (t) { return t + num + "Array"; }); }))).filter(function (t) { return _global[t]; }).map(function (t) { return _global[t]; });
function deepClone(any) {
    if (!any || typeof any !== 'object')
        return any;
    var rv;
    if (isArray(any)) {
        rv = [];
        for (var i = 0, l = any.length; i < l; ++i) {
            rv.push(deepClone(any[i]));
        }
    }
    else if (intrinsicTypes.indexOf(any.constructor) >= 0) {
        rv = any;
    }
    else {
        rv = any.constructor ? Object.create(any.constructor.prototype) : {};
        for (var prop in any) {
            if (hasOwn(any, prop)) {
                rv[prop] = deepClone(any[prop]);
            }
        }
    }
    return rv;
}
function getObjectDiff(a, b, rv, prfx) {
    // Compares objects a and b and produces a diff object.
    rv = rv || {};
    prfx = prfx || '';
    keys(a).forEach(function (prop) {
        if (!hasOwn(b, prop))
            rv[prfx + prop] = undefined; // Property removed
        else {
            var ap = a[prop], bp = b[prop];
            if (typeof ap === 'object' && typeof bp === 'object' &&
                ap && bp &&
                // Now compare constructors are same (not equal because wont work in Safari)
                ('' + ap.constructor) === ('' + bp.constructor))
                // Same type of object but its properties may have changed
                getObjectDiff(ap, bp, rv, prfx + prop + ".");
            else if (ap !== bp)
                rv[prfx + prop] = b[prop]; // Primitive value changed
        }
    });
    keys(b).forEach(function (prop) {
        if (!hasOwn(a, prop)) {
            rv[prfx + prop] = b[prop]; // Property added
        }
    });
    return rv;
}
// If first argument is iterable or array-like, return it as an array
var iteratorSymbol = typeof Symbol !== 'undefined' && Symbol.iterator;
var getIteratorOf = iteratorSymbol ? function (x) {
    var i;
    return x != null && (i = x[iteratorSymbol]) && i.apply(x);
} : function () { return null; };
var NO_CHAR_ARRAY = {};
// Takes one or several arguments and returns an array based on the following criteras:
// * If several arguments provided, return arguments converted to an array in a way that
//   still allows javascript engine to optimize the code.
// * If single argument is an array, return a clone of it.
// * If this-pointer equals NO_CHAR_ARRAY, don't accept strings as valid iterables as a special
//   case to the two bullets below.
// * If single argument is an iterable, convert it to an array and return the resulting array.
// * If single argument is array-like (has length of type number), convert it to an array.
function getArrayOf(arrayLike) {
    var i, a, x, it;
    if (arguments.length === 1) {
        if (isArray(arrayLike))
            return arrayLike.slice();
        if (this === NO_CHAR_ARRAY && typeof arrayLike === 'string')
            return [arrayLike];
        if ((it = getIteratorOf(arrayLike))) {
            a = [];
            while ((x = it.next()), !x.done)
                a.push(x.value);
            return a;
        }
        if (arrayLike == null)
            return [arrayLike];
        i = arrayLike.length;
        if (typeof i === 'number') {
            a = new Array(i);
            while (i--)
                a[i] = arrayLike[i];
            return a;
        }
        return [arrayLike];
    }
    i = arguments.length;
    a = new Array(i);
    while (i--)
        a[i] = arguments[i];
    return a;
}

// By default, debug will be true only if platform is a web platform and its page is served from localhost.
// When debug = true, error's stacks will contain asyncronic long stacks.
var debug = typeof location !== 'undefined' &&
    // By default, use debug mode if served from localhost.
    /^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(location.href);
function setDebug(value, filter) {
    debug = value;
    libraryFilter = filter;
}
var libraryFilter = function () { return true; };
var NEEDS_THROW_FOR_STACK = !new Error("").stack;
function getErrorWithStack() {
    "use strict";
    if (NEEDS_THROW_FOR_STACK)
        try {
            // Doing something naughty in strict mode here to trigger a specific error
            // that can be explicitely ignored in debugger's exception settings.
            // If we'd just throw new Error() here, IE's debugger's exception settings
            // will just consider it as "exception thrown by javascript code" which is
            // something you wouldn't want it to ignore.
            getErrorWithStack.arguments;
            throw new Error(); // Fallback if above line don't throw.
        }
        catch (e) {
            return e;
        }
    return new Error();
}
function prettyStack(exception, numIgnoredFrames) {
    var stack = exception.stack;
    if (!stack)
        return "";
    numIgnoredFrames = (numIgnoredFrames || 0);
    if (stack.indexOf(exception.name) === 0)
        numIgnoredFrames += (exception.name + exception.message).split('\n').length;
    return stack.split('\n')
        .slice(numIgnoredFrames)
        .filter(libraryFilter)
        .map(function (frame) { return "\n" + frame; })
        .join('');
}
function deprecated(what, fn) {
    return function () {
        console.warn(what + " is deprecated. See https://github.com/dfahlander/Dexie.js/wiki/Deprecations. " + prettyStack(getErrorWithStack(), 1));
        return fn.apply(this, arguments);
    };
}

var dexieErrorNames = [
    'Modify',
    'Bulk',
    'OpenFailed',
    'VersionChange',
    'Schema',
    'Upgrade',
    'InvalidTable',
    'MissingAPI',
    'NoSuchDatabase',
    'InvalidArgument',
    'SubTransaction',
    'Unsupported',
    'Internal',
    'DatabaseClosed',
    'PrematureCommit',
    'ForeignAwait'
];
var idbDomErrorNames = [
    'Unknown',
    'Constraint',
    'Data',
    'TransactionInactive',
    'ReadOnly',
    'Version',
    'NotFound',
    'InvalidState',
    'InvalidAccess',
    'Abort',
    'Timeout',
    'QuotaExceeded',
    'Syntax',
    'DataClone'
];
var errorList = dexieErrorNames.concat(idbDomErrorNames);
var defaultTexts = {
    VersionChanged: "Database version changed by other database connection",
    DatabaseClosed: "Database has been closed",
    Abort: "Transaction aborted",
    TransactionInactive: "Transaction has already completed or failed"
};
//
// DexieError - base class of all out exceptions.
//
function DexieError(name, msg) {
    // Reason we don't use ES6 classes is because:
    // 1. It bloats transpiled code and increases size of minified code.
    // 2. It doesn't give us much in this case.
    // 3. It would require sub classes to call super(), which
    //    is not needed when deriving from Error.
    this._e = getErrorWithStack();
    this.name = name;
    this.message = msg;
}
derive(DexieError).from(Error).extend({
    stack: {
        get: function () {
            return this._stack ||
                (this._stack = this.name + ": " + this.message + prettyStack(this._e, 2));
        }
    },
    toString: function () { return this.name + ": " + this.message; }
});
function getMultiErrorMessage(msg, failures) {
    return msg + ". Errors: " + failures
        .map(function (f) { return f.toString(); })
        .filter(function (v, i, s) { return s.indexOf(v) === i; }) // Only unique error strings
        .join('\n');
}
//
// ModifyError - thrown in Collection.modify()
// Specific constructor because it contains members failures and failedKeys.
//
function ModifyError(msg, failures, successCount, failedKeys) {
    this._e = getErrorWithStack();
    this.failures = failures;
    this.failedKeys = failedKeys;
    this.successCount = successCount;
}
derive(ModifyError).from(DexieError);
function BulkError(msg, failures) {
    this._e = getErrorWithStack();
    this.name = "BulkError";
    this.failures = failures;
    this.message = getMultiErrorMessage(msg, failures);
}
derive(BulkError).from(DexieError);
//
//
// Dynamically generate error names and exception classes based
// on the names in errorList.
//
//
// Map of {ErrorName -> ErrorName + "Error"}
var errnames = errorList.reduce(function (obj, name) { return (obj[name] = name + "Error", obj); }, {});
// Need an alias for DexieError because we're gonna create subclasses with the same name.
var BaseException = DexieError;
// Map of {ErrorName -> exception constructor}
var exceptions = errorList.reduce(function (obj, name) {
    // Let the name be "DexieError" because this name may
    // be shown in call stack and when debugging. DexieError is
    // the most true name because it derives from DexieError,
    // and we cannot change Function.name programatically without
    // dynamically create a Function object, which would be considered
    // 'eval-evil'.
    var fullName = name + "Error";
    function DexieError(msgOrInner, inner) {
        this._e = getErrorWithStack();
        this.name = fullName;
        if (!msgOrInner) {
            this.message = defaultTexts[name] || fullName;
            this.inner = null;
        }
        else if (typeof msgOrInner === 'string') {
            this.message = msgOrInner;
            this.inner = inner || null;
        }
        else if (typeof msgOrInner === 'object') {
            this.message = msgOrInner.name + " " + msgOrInner.message;
            this.inner = msgOrInner;
        }
    }
    derive(DexieError).from(BaseException);
    obj[name] = DexieError;
    return obj;
}, {});
// Use ECMASCRIPT standard exceptions where applicable:
exceptions.Syntax = SyntaxError;
exceptions.Type = TypeError;
exceptions.Range = RangeError;
var exceptionMap = idbDomErrorNames.reduce(function (obj, name) {
    obj[name + "Error"] = exceptions[name];
    return obj;
}, {});
function mapError(domError, message) {
    if (!domError || domError instanceof DexieError || domError instanceof TypeError || domError instanceof SyntaxError || !domError.name || !exceptionMap[domError.name])
        return domError;
    var rv = new exceptionMap[domError.name](message || domError.message, domError);
    if ("stack" in domError) {
        // Derive stack from inner exception if it has a stack
        setProp(rv, "stack", { get: function () {
                return this.inner.stack;
            } });
    }
    return rv;
}
var fullNameExceptions = errorList.reduce(function (obj, name) {
    if (["Syntax", "Type", "Range"].indexOf(name) === -1)
        obj[name + "Error"] = exceptions[name];
    return obj;
}, {});
fullNameExceptions.ModifyError = ModifyError;
fullNameExceptions.DexieError = DexieError;
fullNameExceptions.BulkError = BulkError;

function nop() { }
function mirror(val) { return val; }
function pureFunctionChain(f1, f2) {
    // Enables chained events that takes ONE argument and returns it to the next function in chain.
    // This pattern is used in the hook("reading") event.
    if (f1 == null || f1 === mirror)
        return f2;
    return function (val) {
        return f2(f1(val));
    };
}
function callBoth(on1, on2) {
    return function () {
        on1.apply(this, arguments);
        on2.apply(this, arguments);
    };
}
function hookCreatingChain(f1, f2) {
    // Enables chained events that takes several arguments and may modify first argument by making a modification and then returning the same instance.
    // This pattern is used in the hook("creating") event.
    if (f1 === nop)
        return f2;
    return function () {
        var res = f1.apply(this, arguments);
        if (res !== undefined)
            arguments[0] = res;
        var onsuccess = this.onsuccess, // In case event listener has set this.onsuccess
        onerror = this.onerror; // In case event listener has set this.onerror
        this.onsuccess = null;
        this.onerror = null;
        var res2 = f2.apply(this, arguments);
        if (onsuccess)
            this.onsuccess = this.onsuccess ? callBoth(onsuccess, this.onsuccess) : onsuccess;
        if (onerror)
            this.onerror = this.onerror ? callBoth(onerror, this.onerror) : onerror;
        return res2 !== undefined ? res2 : res;
    };
}
function hookDeletingChain(f1, f2) {
    if (f1 === nop)
        return f2;
    return function () {
        f1.apply(this, arguments);
        var onsuccess = this.onsuccess, // In case event listener has set this.onsuccess
        onerror = this.onerror; // In case event listener has set this.onerror
        this.onsuccess = this.onerror = null;
        f2.apply(this, arguments);
        if (onsuccess)
            this.onsuccess = this.onsuccess ? callBoth(onsuccess, this.onsuccess) : onsuccess;
        if (onerror)
            this.onerror = this.onerror ? callBoth(onerror, this.onerror) : onerror;
    };
}
function hookUpdatingChain(f1, f2) {
    if (f1 === nop)
        return f2;
    return function (modifications) {
        var res = f1.apply(this, arguments);
        extend(modifications, res); // If f1 returns new modifications, extend caller's modifications with the result before calling next in chain.
        var onsuccess = this.onsuccess, // In case event listener has set this.onsuccess
        onerror = this.onerror; // In case event listener has set this.onerror
        this.onsuccess = null;
        this.onerror = null;
        var res2 = f2.apply(this, arguments);
        if (onsuccess)
            this.onsuccess = this.onsuccess ? callBoth(onsuccess, this.onsuccess) : onsuccess;
        if (onerror)
            this.onerror = this.onerror ? callBoth(onerror, this.onerror) : onerror;
        return res === undefined ?
            (res2 === undefined ? undefined : res2) :
            (extend(res, res2));
    };
}
function reverseStoppableEventChain(f1, f2) {
    if (f1 === nop)
        return f2;
    return function () {
        if (f2.apply(this, arguments) === false)
            return false;
        return f1.apply(this, arguments);
    };
}

function promisableChain(f1, f2) {
    if (f1 === nop)
        return f2;
    return function () {
        var res = f1.apply(this, arguments);
        if (res && typeof res.then === 'function') {
            var thiz = this, i = arguments.length, args = new Array(i);
            while (i--)
                args[i] = arguments[i];
            return res.then(function () {
                return f2.apply(thiz, args);
            });
        }
        return f2.apply(this, arguments);
    };
}

/*
 * Copyright (c) 2014-2017 David Fahlander
 * Apache License Version 2.0, January 2004, http://www.apache.org/licenses/LICENSE-2.0
 */
//
// Promise and Zone (PSD) for Dexie library
//
// I started out writing this Promise class by copying promise-light (https://github.com/taylorhakes/promise-light) by
// https://github.com/taylorhakes - an A+ and ECMASCRIPT 6 compliant Promise implementation.
//
// In previous versions this was fixed by not calling setTimeout when knowing that the resolve() or reject() came from another
// tick. In Dexie v1.4.0, I've rewritten the Promise class entirely. Just some fragments of promise-light is left. I use
// another strategy now that simplifies everything a lot: to always execute callbacks in a new micro-task, but have an own micro-task
// engine that is indexedDB compliant across all browsers.
// Promise class has also been optimized a lot with inspiration from bluebird - to avoid closures as much as possible.
// Also with inspiration from bluebird, asyncronic stacks in debug mode.
//
// Specific non-standard features of this Promise class:
// * Custom zone support (a.k.a. PSD) with ability to keep zones also when using native promises as well as
//   native async / await.
// * Promise.follow() method built upon the custom zone engine, that allows user to track all promises created from current stack frame
//   and below + all promises that those promises creates or awaits.
// * Detect any unhandled promise in a PSD-scope (PSD.onunhandled). 
//
// David Fahlander, https://github.com/dfahlander
//
// Just a pointer that only this module knows about.
// Used in Promise constructor to emulate a private constructor.
var INTERNAL = {};
// Async stacks (long stacks) must not grow infinitely.
var LONG_STACKS_CLIP_LIMIT = 100;
var MAX_LONG_STACKS = 20;
var ZONE_ECHO_LIMIT = 7;
var nativePromiseInstanceAndProto = (function () {
    try {
        // Be able to patch native async functions
        return new Function("let F=async ()=>{},p=F();return [p,Object.getPrototypeOf(p),Promise.resolve(),F.constructor];")();
    }
    catch (e) {
        var P = _global.Promise;
        return P ?
            [P.resolve(), P.prototype, P.resolve()] :
            [];
    }
})();
var resolvedNativePromise = nativePromiseInstanceAndProto[0];
var nativePromiseProto = nativePromiseInstanceAndProto[1];
var resolvedGlobalPromise = nativePromiseInstanceAndProto[2];
var nativePromiseThen = nativePromiseProto && nativePromiseProto.then;
var NativePromise = resolvedNativePromise && resolvedNativePromise.constructor;
var AsyncFunction = nativePromiseInstanceAndProto[3];
var patchGlobalPromise = !!resolvedGlobalPromise;
var stack_being_generated = false;
/* The default function used only for the very first promise in a promise chain.
   As soon as then promise is resolved or rejected, all next tasks will be executed in micro ticks
   emulated in this module. For indexedDB compatibility, this means that every method needs to
   execute at least one promise before doing an indexedDB operation. Dexie will always call
   db.ready().then() for every operation to make sure the indexedDB event is started in an
   indexedDB-compatible emulated micro task loop.
*/
var schedulePhysicalTick = resolvedGlobalPromise ?
    function () { resolvedGlobalPromise.then(physicalTick); }
    :
        _global.setImmediate ?
            // setImmediate supported. Those modern platforms also supports Function.bind().
            setImmediate.bind(null, physicalTick) :
            _global.MutationObserver ?
                // MutationObserver supported
                function () {
                    var hiddenDiv = document.createElement("div");
                    (new MutationObserver(function () {
                        physicalTick();
                        hiddenDiv = null;
                    })).observe(hiddenDiv, { attributes: true });
                    hiddenDiv.setAttribute('i', '1');
                } :
                // No support for setImmediate or MutationObserver. No worry, setTimeout is only called
                // once time. Every tick that follows will be our emulated micro tick.
                // Could have uses setTimeout.bind(null, 0, physicalTick) if it wasnt for that FF13 and below has a bug 
                function () { setTimeout(physicalTick, 0); };
// Configurable through Promise.scheduler.
// Don't export because it would be unsafe to let unknown
// code call it unless they do try..catch within their callback.
// This function can be retrieved through getter of Promise.scheduler though,
// but users must not do Promise.scheduler = myFuncThatThrowsException
var asap$1 = function (callback, args) {
    microtickQueue.push([callback, args]);
    if (needsNewPhysicalTick) {
        schedulePhysicalTick();
        needsNewPhysicalTick = false;
    }
};
var isOutsideMicroTick = true;
var needsNewPhysicalTick = true;
var unhandledErrors = [];
var rejectingErrors = [];
var currentFulfiller = null;
var rejectionMapper = mirror; // Remove in next major when removing error mapping of DOMErrors and DOMExceptions
var globalPSD = {
    id: 'global',
    global: true,
    ref: 0,
    unhandleds: [],
    onunhandled: globalError,
    pgp: false,
    env: {},
    finalize: function () {
        this.unhandleds.forEach(function (uh) {
            try {
                globalError(uh[0], uh[1]);
            }
            catch (e) { }
        });
    }
};
var PSD = globalPSD;
var microtickQueue = []; // Callbacks to call in this or next physical tick.
var numScheduledCalls = 0; // Number of listener-calls left to do in this physical tick.
var tickFinalizers = []; // Finalizers to call when there are no more async calls scheduled within current physical tick.
function Promise(fn) {
    if (typeof this !== 'object')
        throw new TypeError('Promises must be constructed via new');
    this._listeners = [];
    this.onuncatched = nop; // Deprecate in next major. Not needed. Better to use global error handler.
    // A library may set `promise._lib = true;` after promise is created to make resolve() or reject()
    // execute the microtask engine implicitely within the call to resolve() or reject().
    // To remain A+ compliant, a library must only set `_lib=true` if it can guarantee that the stack
    // only contains library code when calling resolve() or reject().
    // RULE OF THUMB: ONLY set _lib = true for promises explicitely resolving/rejecting directly from
    // global scope (event handler, timer etc)!
    this._lib = false;
    // Current async scope
    var psd = (this._PSD = PSD);
    if (debug) {
        this._stackHolder = getErrorWithStack();
        this._prev = null;
        this._numPrev = 0; // Number of previous promises (for long stacks)
    }
    if (typeof fn !== 'function') {
        if (fn !== INTERNAL)
            throw new TypeError('Not a function');
        // Private constructor (INTERNAL, state, value).
        // Used internally by Promise.resolve() and Promise.reject().
        this._state = arguments[1];
        this._value = arguments[2];
        if (this._state === false)
            handleRejection(this, this._value); // Map error, set stack and addPossiblyUnhandledError().
        return;
    }
    this._state = null; // null (=pending), false (=rejected) or true (=resolved)
    this._value = null; // error or result
    ++psd.ref; // Refcounting current scope
    executePromiseTask(this, fn);
}
// Prepare a property descriptor to put onto Promise.prototype.then
var thenProp = {
    get: function () {
        var psd = PSD, microTaskId = totalEchoes;
        function then(onFulfilled, onRejected) {
            var _this = this;
            var possibleAwait = !psd.global && (psd !== PSD || microTaskId !== totalEchoes);
            if (possibleAwait)
                decrementExpectedAwaits();
            var rv = new Promise(function (resolve, reject) {
                propagateToListener(_this, new Listener(nativeAwaitCompatibleWrap(onFulfilled, psd, possibleAwait), nativeAwaitCompatibleWrap(onRejected, psd, possibleAwait), resolve, reject, psd));
            });
            debug && linkToPreviousPromise(rv, this);
            return rv;
        }
        then.prototype = INTERNAL; // For idempotense, see setter below.
        return then;
    },
    // Be idempotent and allow another framework (such as zone.js or another instance of a Dexie.Promise module) to replace Promise.prototype.then
    // and when that framework wants to restore the original property, we must identify that and restore the original property descriptor.
    set: function (value) {
        setProp(this, 'then', value && value.prototype === INTERNAL ?
            thenProp : // Restore to original property descriptor.
            {
                get: function () {
                    return value; // Getter returning provided value (behaves like value is just changed)
                },
                set: thenProp.set // Keep a setter that is prepared to restore original.
            });
    }
};
props(Promise.prototype, {
    then: thenProp,
    _then: function (onFulfilled, onRejected) {
        // A little tinier version of then() that don't have to create a resulting promise.
        propagateToListener(this, new Listener(null, null, onFulfilled, onRejected, PSD));
    },
    catch: function (onRejected) {
        if (arguments.length === 1)
            return this.then(null, onRejected);
        // First argument is the Error type to catch
        var type = arguments[0], handler = arguments[1];
        return typeof type === 'function' ? this.then(null, function (err) {
            // Catching errors by its constructor type (similar to java / c++ / c#)
            // Sample: promise.catch(TypeError, function (e) { ... });
            return err instanceof type ? handler(err) : PromiseReject(err);
        })
            : this.then(null, function (err) {
                // Catching errors by the error.name property. Makes sense for indexedDB where error type
                // is always DOMError but where e.name tells the actual error type.
                // Sample: promise.catch('ConstraintError', function (e) { ... });
                return err && err.name === type ? handler(err) : PromiseReject(err);
            });
    },
    finally: function (onFinally) {
        return this.then(function (value) {
            onFinally();
            return value;
        }, function (err) {
            onFinally();
            return PromiseReject(err);
        });
    },
    stack: {
        get: function () {
            if (this._stack)
                return this._stack;
            try {
                stack_being_generated = true;
                var stacks = getStack(this, [], MAX_LONG_STACKS);
                var stack = stacks.join("\nFrom previous: ");
                if (this._state !== null)
                    this._stack = stack; // Stack may be updated on reject.
                return stack;
            }
            finally {
                stack_being_generated = false;
            }
        }
    },
    timeout: function (ms, msg) {
        var _this = this;
        return ms < Infinity ?
            new Promise(function (resolve, reject) {
                var handle = setTimeout(function () { return reject(new exceptions.Timeout(msg)); }, ms);
                _this.then(resolve, reject).finally(clearTimeout.bind(null, handle));
            }) : this;
    }
});
if (typeof Symbol !== 'undefined' && Symbol.toStringTag)
    setProp(Promise.prototype, Symbol.toStringTag, 'Promise');
// Now that Promise.prototype is defined, we have all it takes to set globalPSD.env.
// Environment globals snapshotted on leaving global zone
globalPSD.env = snapShot();
function Listener(onFulfilled, onRejected, resolve, reject, zone) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.resolve = resolve;
    this.reject = reject;
    this.psd = zone;
}
// Promise Static Properties
props(Promise, {
    all: function () {
        var values = getArrayOf.apply(null, arguments) // Supports iterables, implicit arguments and array-like.
            .map(onPossibleParallellAsync); // Handle parallell async/awaits 
        return new Promise(function (resolve, reject) {
            if (values.length === 0)
                resolve([]);
            var remaining = values.length;
            values.forEach(function (a, i) { return Promise.resolve(a).then(function (x) {
                values[i] = x;
                if (!--remaining)
                    resolve(values);
            }, reject); });
        });
    },
    resolve: function (value) {
        if (value instanceof Promise)
            return value;
        if (value && typeof value.then === 'function')
            return new Promise(function (resolve, reject) {
                value.then(resolve, reject);
            });
        var rv = new Promise(INTERNAL, true, value);
        linkToPreviousPromise(rv, currentFulfiller);
        return rv;
    },
    reject: PromiseReject,
    race: function () {
        var values = getArrayOf.apply(null, arguments).map(onPossibleParallellAsync);
        return new Promise(function (resolve, reject) {
            values.map(function (value) { return Promise.resolve(value).then(resolve, reject); });
        });
    },
    PSD: {
        get: function () { return PSD; },
        set: function (value) { return PSD = value; }
    },
    //totalEchoes: {get: ()=>totalEchoes},
    //task: {get: ()=>task},
    newPSD: newScope,
    usePSD: usePSD,
    scheduler: {
        get: function () { return asap$1; },
        set: function (value) { asap$1 = value; }
    },
    rejectionMapper: {
        get: function () { return rejectionMapper; },
        set: function (value) { rejectionMapper = value; } // Map reject failures
    },
    follow: function (fn, zoneProps) {
        return new Promise(function (resolve, reject) {
            return newScope(function (resolve, reject) {
                var psd = PSD;
                psd.unhandleds = []; // For unhandled standard- or 3rd party Promises. Checked at psd.finalize()
                psd.onunhandled = reject; // Triggered directly on unhandled promises of this library.
                psd.finalize = callBoth(function () {
                    var _this = this;
                    // Unhandled standard or 3rd part promises are put in PSD.unhandleds and
                    // examined upon scope completion while unhandled rejections in this Promise
                    // will trigger directly through psd.onunhandled
                    run_at_end_of_this_or_next_physical_tick(function () {
                        _this.unhandleds.length === 0 ? resolve() : reject(_this.unhandleds[0]);
                    });
                }, psd.finalize);
                fn();
            }, zoneProps, resolve, reject);
        });
    }
});
/**
* Take a potentially misbehaving resolver function and make sure
* onFulfilled and onRejected are only called once.
*
* Makes no guarantees about asynchrony.
*/
function executePromiseTask(promise, fn) {
    // Promise Resolution Procedure:
    // https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    try {
        fn(function (value) {
            if (promise._state !== null)
                return; // Already settled
            if (value === promise)
                throw new TypeError('A promise cannot be resolved with itself.');
            var shouldExecuteTick = promise._lib && beginMicroTickScope();
            if (value && typeof value.then === 'function') {
                executePromiseTask(promise, function (resolve, reject) {
                    value instanceof Promise ?
                        value._then(resolve, reject) :
                        value.then(resolve, reject);
                });
            }
            else {
                promise._state = true;
                promise._value = value;
                propagateAllListeners(promise);
            }
            if (shouldExecuteTick)
                endMicroTickScope();
        }, handleRejection.bind(null, promise)); // If Function.bind is not supported. Exception is handled in catch below
    }
    catch (ex) {
        handleRejection(promise, ex);
    }
}
function handleRejection(promise, reason) {
    rejectingErrors.push(reason);
    if (promise._state !== null)
        return;
    var shouldExecuteTick = promise._lib && beginMicroTickScope();
    reason = rejectionMapper(reason);
    promise._state = false;
    promise._value = reason;
    debug && reason !== null && typeof reason === 'object' && !reason._promise && tryCatch(function () {
        var origProp = getPropertyDescriptor(reason, "stack");
        reason._promise = promise;
        setProp(reason, "stack", {
            get: function () {
                return stack_being_generated ?
                    origProp && (origProp.get ?
                        origProp.get.apply(reason) :
                        origProp.value) :
                    promise.stack;
            }
        });
    });
    // Add the failure to a list of possibly uncaught errors
    addPossiblyUnhandledError(promise);
    propagateAllListeners(promise);
    if (shouldExecuteTick)
        endMicroTickScope();
}
function propagateAllListeners(promise) {
    //debug && linkToPreviousPromise(promise);
    var listeners = promise._listeners;
    promise._listeners = [];
    for (var i = 0, len = listeners.length; i < len; ++i) {
        propagateToListener(promise, listeners[i]);
    }
    var psd = promise._PSD;
    --psd.ref || psd.finalize(); // if psd.ref reaches zero, call psd.finalize();
    if (numScheduledCalls === 0) {
        // If numScheduledCalls is 0, it means that our stack is not in a callback of a scheduled call,
        // and that no deferreds where listening to this rejection or success.
        // Since there is a risk that our stack can contain application code that may
        // do stuff after this code is finished that may generate new calls, we cannot
        // call finalizers here.
        ++numScheduledCalls;
        asap$1(function () {
            if (--numScheduledCalls === 0)
                finalizePhysicalTick(); // Will detect unhandled errors
        }, []);
    }
}
function propagateToListener(promise, listener) {
    if (promise._state === null) {
        promise._listeners.push(listener);
        return;
    }
    var cb = promise._state ? listener.onFulfilled : listener.onRejected;
    if (cb === null) {
        // This Listener doesnt have a listener for the event being triggered (onFulfilled or onReject) so lets forward the event to any eventual listeners on the Promise instance returned by then() or catch()
        return (promise._state ? listener.resolve : listener.reject)(promise._value);
    }
    ++listener.psd.ref;
    ++numScheduledCalls;
    asap$1(callListener, [cb, promise, listener]);
}
function callListener(cb, promise, listener) {
    try {
        // Set static variable currentFulfiller to the promise that is being fullfilled,
        // so that we connect the chain of promises (for long stacks support)
        currentFulfiller = promise;
        // Call callback and resolve our listener with it's return value.
        var ret, value = promise._value;
        if (promise._state) {
            // cb is onResolved
            ret = cb(value);
        }
        else {
            // cb is onRejected
            if (rejectingErrors.length)
                rejectingErrors = [];
            ret = cb(value);
            if (rejectingErrors.indexOf(value) === -1)
                markErrorAsHandled(promise); // Callback didnt do Promise.reject(err) nor reject(err) onto another promise.
        }
        listener.resolve(ret);
    }
    catch (e) {
        // Exception thrown in callback. Reject our listener.
        listener.reject(e);
    }
    finally {
        // Restore env and currentFulfiller.
        currentFulfiller = null;
        if (--numScheduledCalls === 0)
            finalizePhysicalTick();
        --listener.psd.ref || listener.psd.finalize();
    }
}
function getStack(promise, stacks, limit) {
    if (stacks.length === limit)
        return stacks;
    var stack = "";
    if (promise._state === false) {
        var failure = promise._value, errorName, message;
        if (failure != null) {
            errorName = failure.name || "Error";
            message = failure.message || failure;
            stack = prettyStack(failure, 0);
        }
        else {
            errorName = failure; // If error is undefined or null, show that.
            message = "";
        }
        stacks.push(errorName + (message ? ": " + message : "") + stack);
    }
    if (debug) {
        stack = prettyStack(promise._stackHolder, 2);
        if (stack && stacks.indexOf(stack) === -1)
            stacks.push(stack);
        if (promise._prev)
            getStack(promise._prev, stacks, limit);
    }
    return stacks;
}
function linkToPreviousPromise(promise, prev) {
    // Support long stacks by linking to previous completed promise.
    var numPrev = prev ? prev._numPrev + 1 : 0;
    if (numPrev < LONG_STACKS_CLIP_LIMIT) {
        promise._prev = prev;
        promise._numPrev = numPrev;
    }
}
/* The callback to schedule with setImmediate() or setTimeout().
   It runs a virtual microtick and executes any callback registered in microtickQueue.
 */
function physicalTick() {
    beginMicroTickScope() && endMicroTickScope();
}
function beginMicroTickScope() {
    var wasRootExec = isOutsideMicroTick;
    isOutsideMicroTick = false;
    needsNewPhysicalTick = false;
    return wasRootExec;
}
/* Executes micro-ticks without doing try..catch.
   This can be possible because we only use this internally and
   the registered functions are exception-safe (they do try..catch
   internally before calling any external method). If registering
   functions in the microtickQueue that are not exception-safe, this
   would destroy the framework and make it instable. So we don't export
   our asap method.
*/
function endMicroTickScope() {
    var callbacks, i, l;
    do {
        while (microtickQueue.length > 0) {
            callbacks = microtickQueue;
            microtickQueue = [];
            l = callbacks.length;
            for (i = 0; i < l; ++i) {
                var item = callbacks[i];
                item[0].apply(null, item[1]);
            }
        }
    } while (microtickQueue.length > 0);
    isOutsideMicroTick = true;
    needsNewPhysicalTick = true;
}
function finalizePhysicalTick() {
    var unhandledErrs = unhandledErrors;
    unhandledErrors = [];
    unhandledErrs.forEach(function (p) {
        p._PSD.onunhandled.call(null, p._value, p);
    });
    var finalizers = tickFinalizers.slice(0); // Clone first because finalizer may remove itself from list.
    var i = finalizers.length;
    while (i)
        finalizers[--i]();
}
function run_at_end_of_this_or_next_physical_tick(fn) {
    function finalizer() {
        fn();
        tickFinalizers.splice(tickFinalizers.indexOf(finalizer), 1);
    }
    tickFinalizers.push(finalizer);
    ++numScheduledCalls;
    asap$1(function () {
        if (--numScheduledCalls === 0)
            finalizePhysicalTick();
    }, []);
}
function addPossiblyUnhandledError(promise) {
    // Only add to unhandledErrors if not already there. The first one to add to this list
    // will be upon the first rejection so that the root cause (first promise in the
    // rejection chain) is the one listed.
    if (!unhandledErrors.some(function (p) { return p._value === promise._value; }))
        unhandledErrors.push(promise);
}
function markErrorAsHandled(promise) {
    // Called when a reject handled is actually being called.
    // Search in unhandledErrors for any promise whos _value is this promise_value (list
    // contains only rejected promises, and only one item per error)
    var i = unhandledErrors.length;
    while (i)
        if (unhandledErrors[--i]._value === promise._value) {
            // Found a promise that failed with this same error object pointer,
            // Remove that since there is a listener that actually takes care of it.
            unhandledErrors.splice(i, 1);
            return;
        }
}
function PromiseReject(reason) {
    return new Promise(INTERNAL, false, reason);
}
function wrap(fn, errorCatcher) {
    var psd = PSD;
    return function () {
        var wasRootExec = beginMicroTickScope(), outerScope = PSD;
        try {
            switchToZone(psd, true);
            return fn.apply(this, arguments);
        }
        catch (e) {
            errorCatcher && errorCatcher(e);
        }
        finally {
            switchToZone(outerScope, false);
            if (wasRootExec)
                endMicroTickScope();
        }
    };
}
//
// variables used for native await support
//
var task = { awaits: 0, echoes: 0, id: 0 }; // The ongoing macro-task when using zone-echoing.
var taskCounter = 0; // ID counter for macro tasks.
var zoneStack = []; // Stack of left zones to restore asynchronically.
var zoneEchoes = 0; // zoneEchoes is a must in order to persist zones between native await expressions.
var totalEchoes = 0; // ID counter for micro-tasks. Used to detect possible native await in our Promise.prototype.then.
var zone_id_counter = 0;
function newScope(fn, props$$1, a1, a2) {
    var parent = PSD, psd = Object.create(parent);
    psd.parent = parent;
    psd.ref = 0;
    psd.global = false;
    psd.id = ++zone_id_counter;
    // Prepare for promise patching (done in usePSD):
    var globalEnv = globalPSD.env;
    psd.env = patchGlobalPromise ? {
        Promise: Promise,
        PromiseProp: { value: Promise, configurable: true, writable: true },
        all: Promise.all,
        race: Promise.race,
        resolve: Promise.resolve,
        reject: Promise.reject,
        nthen: getPatchedPromiseThen(globalEnv.nthen, psd),
        gthen: getPatchedPromiseThen(globalEnv.gthen, psd) // global then
    } : {};
    if (props$$1)
        extend(psd, props$$1);
    // unhandleds and onunhandled should not be specifically set here.
    // Leave them on parent prototype.
    // unhandleds.push(err) will push to parent's prototype
    // onunhandled() will call parents onunhandled (with this scope's this-pointer though!)
    ++parent.ref;
    psd.finalize = function () {
        --this.parent.ref || this.parent.finalize();
    };
    var rv = usePSD(psd, fn, a1, a2);
    if (psd.ref === 0)
        psd.finalize();
    return rv;
}
// Function to call if scopeFunc returns NativePromise
// Also for each NativePromise in the arguments to Promise.all()
function incrementExpectedAwaits() {
    if (!task.id)
        task.id = ++taskCounter;
    ++task.awaits;
    task.echoes += ZONE_ECHO_LIMIT;
    return task.id;
}
// Function to call when 'then' calls back on a native promise where onAwaitExpected() had been called.
// Also call this when a native await calls then method on a promise. In that case, don't supply
// sourceTaskId because we already know it refers to current task.
function decrementExpectedAwaits(sourceTaskId) {
    if (!task.awaits || (sourceTaskId && sourceTaskId !== task.id))
        return;
    if (--task.awaits === 0)
        task.id = 0;
    task.echoes = task.awaits * ZONE_ECHO_LIMIT; // Will reset echoes to 0 if awaits is 0.
}
// Call from Promise.all() and Promise.race()
function onPossibleParallellAsync(possiblePromise) {
    if (task.echoes && possiblePromise && possiblePromise.constructor === NativePromise) {
        incrementExpectedAwaits();
        return possiblePromise.then(function (x) {
            decrementExpectedAwaits();
            return x;
        }, function (e) {
            decrementExpectedAwaits();
            return rejection(e);
        });
    }
    return possiblePromise;
}
function zoneEnterEcho(targetZone) {
    ++totalEchoes;
    if (!task.echoes || --task.echoes === 0) {
        task.echoes = task.id = 0; // Cancel zone echoing.
    }
    zoneStack.push(PSD);
    switchToZone(targetZone, true);
}
function zoneLeaveEcho() {
    var zone = zoneStack[zoneStack.length - 1];
    zoneStack.pop();
    switchToZone(zone, false);
}
function switchToZone(targetZone, bEnteringZone) {
    var currentZone = PSD;
    if (bEnteringZone ? task.echoes && (!zoneEchoes++ || targetZone !== PSD) : zoneEchoes && (!--zoneEchoes || targetZone !== PSD)) {
        // Enter or leave zone asynchronically as well, so that tasks initiated during current tick
        // will be surrounded by the zone when they are invoked.
        enqueueNativeMicroTask(bEnteringZone ? zoneEnterEcho.bind(null, targetZone) : zoneLeaveEcho);
    }
    if (targetZone === PSD)
        return;
    PSD = targetZone; // The actual zone switch occurs at this line.
    // Snapshot on every leave from global zone.
    if (currentZone === globalPSD)
        globalPSD.env = snapShot();
    if (patchGlobalPromise) {
        // Let's patch the global and native Promises (may be same or may be different)
        var GlobalPromise = globalPSD.env.Promise;
        // Swich environments (may be PSD-zone or the global zone. Both apply.)
        var targetEnv = targetZone.env;
        // Change Promise.prototype.then for native and global Promise (they MAY differ on polyfilled environments, but both can be accessed)
        // Must be done on each zone change because the patched method contains targetZone in its closure.
        nativePromiseProto.then = targetEnv.nthen;
        GlobalPromise.prototype.then = targetEnv.gthen;
        if (currentZone.global || targetZone.global) {
            // Leaving or entering global zone. It's time to patch / restore global Promise.
            // Set this Promise to window.Promise so that transiled async functions will work on Firefox, Safari and IE, as well as with Zonejs and angular.
            Object.defineProperty(_global, 'Promise', targetEnv.PromiseProp);
            // Support Promise.all() etc to work indexedDB-safe also when people are including es6-promise as a module (they might
            // not be accessing global.Promise but a local reference to it)
            GlobalPromise.all = targetEnv.all;
            GlobalPromise.race = targetEnv.race;
            GlobalPromise.resolve = targetEnv.resolve;
            GlobalPromise.reject = targetEnv.reject;
        }
    }
}
function snapShot() {
    var GlobalPromise = _global.Promise;
    return patchGlobalPromise ? {
        Promise: GlobalPromise,
        PromiseProp: Object.getOwnPropertyDescriptor(_global, "Promise"),
        all: GlobalPromise.all,
        race: GlobalPromise.race,
        resolve: GlobalPromise.resolve,
        reject: GlobalPromise.reject,
        nthen: nativePromiseProto.then,
        gthen: GlobalPromise.prototype.then
    } : {};
}
function usePSD(psd, fn, a1, a2, a3) {
    var outerScope = PSD;
    try {
        switchToZone(psd, true);
        return fn(a1, a2, a3);
    }
    finally {
        switchToZone(outerScope, false);
    }
}
function enqueueNativeMicroTask(job) {
    //
    // Precondition: nativePromiseThen !== undefined
    //
    nativePromiseThen.call(resolvedNativePromise, job);
}
function nativeAwaitCompatibleWrap(fn, zone, possibleAwait) {
    return typeof fn !== 'function' ? fn : function () {
        var outerZone = PSD;
        if (possibleAwait)
            incrementExpectedAwaits();
        switchToZone(zone, true);
        try {
            return fn.apply(this, arguments);
        }
        finally {
            switchToZone(outerZone, false);
        }
    };
}
function getPatchedPromiseThen(origThen, zone) {
    return function (onResolved, onRejected) {
        return origThen.call(this, nativeAwaitCompatibleWrap(onResolved, zone, false), nativeAwaitCompatibleWrap(onRejected, zone, false));
    };
}
var UNHANDLEDREJECTION = "unhandledrejection";
function globalError(err, promise) {
    var rv;
    try {
        rv = promise.onuncatched(err);
    }
    catch (e) { }
    if (rv !== false)
        try {
            var event, eventData = { promise: promise, reason: err };
            if (_global.document && document.createEvent) {
                event = document.createEvent('Event');
                event.initEvent(UNHANDLEDREJECTION, true, true);
                extend(event, eventData);
            }
            else if (_global.CustomEvent) {
                event = new CustomEvent(UNHANDLEDREJECTION, { detail: eventData });
                extend(event, eventData);
            }
            if (event && _global.dispatchEvent) {
                dispatchEvent(event);
                if (!_global.PromiseRejectionEvent && _global.onunhandledrejection)
                    // No native support for PromiseRejectionEvent but user has set window.onunhandledrejection. Manually call it.
                    try {
                        _global.onunhandledrejection(event);
                    }
                    catch (_) { }
            }
            if (!event.defaultPrevented) {
                console.warn("Unhandled rejection: " + (err.stack || err));
            }
        }
        catch (e) { }
}
var rejection = Promise.reject;

function Events(ctx) {
    var evs = {};
    var rv = function (eventName, subscriber) {
        if (subscriber) {
            // Subscribe. If additional arguments than just the subscriber was provided, forward them as well.
            var i = arguments.length, args = new Array(i - 1);
            while (--i)
                args[i - 1] = arguments[i];
            evs[eventName].subscribe.apply(null, args);
            return ctx;
        }
        else if (typeof (eventName) === 'string') {
            // Return interface allowing to fire or unsubscribe from event
            return evs[eventName];
        }
    };
    rv.addEventType = add;
    for (var i = 1, l = arguments.length; i < l; ++i) {
        add(arguments[i]);
    }
    return rv;
    function add(eventName, chainFunction, defaultFunction) {
        if (typeof eventName === 'object')
            return addConfiguredEvents(eventName);
        if (!chainFunction)
            chainFunction = reverseStoppableEventChain;
        if (!defaultFunction)
            defaultFunction = nop;
        var context = {
            subscribers: [],
            fire: defaultFunction,
            subscribe: function (cb) {
                if (context.subscribers.indexOf(cb) === -1) {
                    context.subscribers.push(cb);
                    context.fire = chainFunction(context.fire, cb);
                }
            },
            unsubscribe: function (cb) {
                context.subscribers = context.subscribers.filter(function (fn) { return fn !== cb; });
                context.fire = context.subscribers.reduce(chainFunction, defaultFunction);
            }
        };
        evs[eventName] = rv[eventName] = context;
        return context;
    }
    function addConfiguredEvents(cfg) {
        // events(this, {reading: [functionChain, nop]});
        keys(cfg).forEach(function (eventName) {
            var args = cfg[eventName];
            if (isArray(args)) {
                add(eventName, cfg[eventName][0], cfg[eventName][1]);
            }
            else if (args === 'asap') {
                // Rather than approaching event subscription using a functional approach, we here do it in a for-loop where subscriber is executed in its own stack
                // enabling that any exception that occur wont disturb the initiator and also not nescessary be catched and forgotten.
                var context = add(eventName, mirror, function fire() {
                    // Optimazation-safe cloning of arguments into args.
                    var i = arguments.length, args = new Array(i);
                    while (i--)
                        args[i] = arguments[i];
                    // All each subscriber:
                    context.subscribers.forEach(function (fn) {
                        asap(function fireEvent() {
                            fn.apply(null, args);
                        });
                    });
                });
            }
            else
                throw new exceptions.InvalidArgument("Invalid event config");
        });
    }
}

/*
 * Dexie.js - a minimalistic wrapper for IndexedDB
 * ===============================================
 *
 * Copyright (c) 2014-2017 David Fahlander
 *
 * Version 2.0.4, Fri May 25 2018
 *
 * http://dexie.org
 *
 * Apache License Version 2.0, January 2004, http://www.apache.org/licenses/LICENSE-2.0
 *
 */
var DEXIE_VERSION = '2.0.4';
var maxString = String.fromCharCode(65535);
var maxKey = (function () { try {
    IDBKeyRange.only([[]]);
    return [[]];
}
catch (e) {
    return maxString;
} })();
var minKey = -Infinity;
var INVALID_KEY_ARGUMENT = "Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>.";
var STRING_EXPECTED = "String expected.";
var connections = [];
var isIEOrEdge = typeof navigator !== 'undefined' && /(MSIE|Trident|Edge)/.test(navigator.userAgent);
var hasIEDeleteObjectStoreBug = isIEOrEdge;
var hangsOnDeleteLargeKeyRange = isIEOrEdge;
var dexieStackFrameFilter = function (frame) { return !/(dexie\.js|dexie\.min\.js)/.test(frame); };
var dbNamesDB; // Global database for backing Dexie.getDatabaseNames() on browser without indexedDB.webkitGetDatabaseNames() 
// Init debug
setDebug(debug, dexieStackFrameFilter);
function Dexie(dbName, options) {
    /// <param name="options" type="Object" optional="true">Specify only if you wich to control which addons that should run on this instance</param>
    var deps = Dexie.dependencies;
    var opts = extend({
        // Default Options
        addons: Dexie.addons,
        autoOpen: true,
        indexedDB: deps.indexedDB,
        IDBKeyRange: deps.IDBKeyRange // Backend IDBKeyRange api. Default to browser env.
    }, options);
    var addons = opts.addons, autoOpen = opts.autoOpen, indexedDB = opts.indexedDB, IDBKeyRange = opts.IDBKeyRange;
    var globalSchema = this._dbSchema = {};
    var versions = [];
    var dbStoreNames = [];
    var allTables = {};
    ///<var type="IDBDatabase" />
    var idbdb = null; // Instance of IDBDatabase
    var dbOpenError = null;
    var isBeingOpened = false;
    var onReadyBeingFired = null;
    var openComplete = false;
    var READONLY = "readonly", READWRITE = "readwrite";
    var db = this;
    var dbReadyResolve, dbReadyPromise = new Promise(function (resolve) {
        dbReadyResolve = resolve;
    }), cancelOpen, openCanceller = new Promise(function (_, reject) {
        cancelOpen = reject;
    });
    var autoSchema = true;
    var hasNativeGetDatabaseNames = !!getNativeGetDatabaseNamesFn(indexedDB), hasGetAll;
    function init() {
        // Default subscribers to "versionchange" and "blocked".
        // Can be overridden by custom handlers. If custom handlers return false, these default
        // behaviours will be prevented.
        db.on("versionchange", function (ev) {
            // Default behavior for versionchange event is to close database connection.
            // Caller can override this behavior by doing db.on("versionchange", function(){ return false; });
            // Let's not block the other window from making it's delete() or open() call.
            // NOTE! This event is never fired in IE,Edge or Safari.
            if (ev.newVersion > 0)
                console.warn("Another connection wants to upgrade database '" + db.name + "'. Closing db now to resume the upgrade.");
            else
                console.warn("Another connection wants to delete database '" + db.name + "'. Closing db now to resume the delete request.");
            db.close();
            // In many web applications, it would be recommended to force window.reload()
            // when this event occurs. To do that, subscribe to the versionchange event
            // and call window.location.reload(true) if ev.newVersion > 0 (not a deletion)
            // The reason for this is that your current web app obviously has old schema code that needs
            // to be updated. Another window got a newer version of the app and needs to upgrade DB but
            // your window is blocking it unless we close it here.
        });
        db.on("blocked", function (ev) {
            if (!ev.newVersion || ev.newVersion < ev.oldVersion)
                console.warn("Dexie.delete('" + db.name + "') was blocked");
            else
                console.warn("Upgrade '" + db.name + "' blocked by other connection holding version " + ev.oldVersion / 10);
        });
    }
    //
    //
    //
    // ------------------------- Versioning Framework---------------------------
    //
    //
    //
    this.version = function (versionNumber) {
        /// <param name="versionNumber" type="Number"></param>
        /// <returns type="Version"></returns>
        if (idbdb || isBeingOpened)
            throw new exceptions.Schema("Cannot add version when database is open");
        this.verno = Math.max(this.verno, versionNumber);
        var versionInstance = versions.filter(function (v) { return v._cfg.version === versionNumber; })[0];
        if (versionInstance)
            return versionInstance;
        versionInstance = new Version(versionNumber);
        versions.push(versionInstance);
        versions.sort(lowerVersionFirst);
        // Disable autoschema mode, as at least one version is specified.
        autoSchema = false;
        return versionInstance;
    };
    function Version(versionNumber) {
        this._cfg = {
            version: versionNumber,
            storesSource: null,
            dbschema: {},
            tables: {},
            contentUpgrade: null
        };
        this.stores({}); // Derive earlier schemas by default.
    }
    extend(Version.prototype, {
        stores: function (stores) {
            /// <summary>
            ///   Defines the schema for a particular version
            /// </summary>
            /// <param name="stores" type="Object">
            /// Example: <br/>
            ///   {users: "id++,first,last,&amp;username,*email", <br/>
            ///   passwords: "id++,&amp;username"}<br/>
            /// <br/>
            /// Syntax: {Table: "[primaryKey][++],[&amp;][*]index1,[&amp;][*]index2,..."}<br/><br/>
            /// Special characters:<br/>
            ///  "&amp;"  means unique key, <br/>
            ///  "*"  means value is multiEntry, <br/>
            ///  "++" means auto-increment and only applicable for primary key <br/>
            /// </param>
            this._cfg.storesSource = this._cfg.storesSource ? extend(this._cfg.storesSource, stores) : stores;
            // Derive stores from earlier versions if they are not explicitely specified as null or a new syntax.
            var storesSpec = {};
            versions.forEach(function (version) {
                extend(storesSpec, version._cfg.storesSource);
            });
            var dbschema = (this._cfg.dbschema = {});
            this._parseStoresSpec(storesSpec, dbschema);
            // Update the latest schema to this version
            // Update API
            globalSchema = db._dbSchema = dbschema;
            removeTablesApi([allTables, db, Transaction.prototype]); // Keep Transaction.prototype even though it should be depr.
            setApiOnPlace([allTables, db, Transaction.prototype, this._cfg.tables], keys(dbschema), dbschema);
            dbStoreNames = keys(dbschema);
            return this;
        },
        upgrade: function (upgradeFunction) {
            this._cfg.contentUpgrade = upgradeFunction;
            return this;
        },
        _parseStoresSpec: function (stores, outSchema) {
            keys(stores).forEach(function (tableName) {
                if (stores[tableName] !== null) {
                    var instanceTemplate = {};
                    var indexes = parseIndexSyntax(stores[tableName]);
                    var primKey = indexes.shift();
                    if (primKey.multi)
                        throw new exceptions.Schema("Primary key cannot be multi-valued");
                    if (primKey.keyPath)
                        setByKeyPath(instanceTemplate, primKey.keyPath, primKey.auto ? 0 : primKey.keyPath);
                    indexes.forEach(function (idx) {
                        if (idx.auto)
                            throw new exceptions.Schema("Only primary key can be marked as autoIncrement (++)");
                        if (!idx.keyPath)
                            throw new exceptions.Schema("Index must have a name and cannot be an empty string");
                        setByKeyPath(instanceTemplate, idx.keyPath, idx.compound ? idx.keyPath.map(function () { return ""; }) : "");
                    });
                    outSchema[tableName] = new TableSchema(tableName, primKey, indexes, instanceTemplate);
                }
            });
        }
    });
    function runUpgraders(oldVersion, idbtrans, reject) {
        var trans = db._createTransaction(READWRITE, dbStoreNames, globalSchema);
        trans.create(idbtrans);
        trans._completion.catch(reject);
        var rejectTransaction = trans._reject.bind(trans);
        newScope(function () {
            PSD.trans = trans;
            if (oldVersion === 0) {
                // Create tables:
                keys(globalSchema).forEach(function (tableName) {
                    createTable(idbtrans, tableName, globalSchema[tableName].primKey, globalSchema[tableName].indexes);
                });
                Promise.follow(function () { return db.on.populate.fire(trans); }).catch(rejectTransaction);
            }
            else
                updateTablesAndIndexes(oldVersion, trans, idbtrans).catch(rejectTransaction);
        });
    }
    function updateTablesAndIndexes(oldVersion, trans, idbtrans) {
        // Upgrade version to version, step-by-step from oldest to newest version.
        // Each transaction object will contain the table set that was current in that version (but also not-yet-deleted tables from its previous version)
        var queue = [];
        var oldVersionStruct = versions.filter(function (version) { return version._cfg.version === oldVersion; })[0];
        if (!oldVersionStruct)
            throw new exceptions.Upgrade("Dexie specification of currently installed DB version is missing");
        globalSchema = db._dbSchema = oldVersionStruct._cfg.dbschema;
        var anyContentUpgraderHasRun = false;
        var versToRun = versions.filter(function (v) { return v._cfg.version > oldVersion; });
        versToRun.forEach(function (version) {
            /// <param name="version" type="Version"></param>
            queue.push(function () {
                var oldSchema = globalSchema;
                var newSchema = version._cfg.dbschema;
                adjustToExistingIndexNames(oldSchema, idbtrans);
                adjustToExistingIndexNames(newSchema, idbtrans);
                globalSchema = db._dbSchema = newSchema;
                var diff = getSchemaDiff(oldSchema, newSchema);
                // Add tables           
                diff.add.forEach(function (tuple) {
                    createTable(idbtrans, tuple[0], tuple[1].primKey, tuple[1].indexes);
                });
                // Change tables
                diff.change.forEach(function (change) {
                    if (change.recreate) {
                        throw new exceptions.Upgrade("Not yet support for changing primary key");
                    }
                    else {
                        var store = idbtrans.objectStore(change.name);
                        // Add indexes
                        change.add.forEach(function (idx) {
                            addIndex(store, idx);
                        });
                        // Update indexes
                        change.change.forEach(function (idx) {
                            store.deleteIndex(idx.name);
                            addIndex(store, idx);
                        });
                        // Delete indexes
                        change.del.forEach(function (idxName) {
                            store.deleteIndex(idxName);
                        });
                    }
                });
                if (version._cfg.contentUpgrade) {
                    anyContentUpgraderHasRun = true;
                    return Promise.follow(function () {
                        version._cfg.contentUpgrade(trans);
                    });
                }
            });
            queue.push(function (idbtrans) {
                if (!anyContentUpgraderHasRun || !hasIEDeleteObjectStoreBug) {
                    var newSchema = version._cfg.dbschema;
                    // Delete old tables
                    deleteRemovedTables(newSchema, idbtrans);
                }
            });
        });
        // Now, create a queue execution engine
        function runQueue() {
            return queue.length ? Promise.resolve(queue.shift()(trans.idbtrans)).then(runQueue) :
                Promise.resolve();
        }
        return runQueue().then(function () {
            createMissingTables(globalSchema, idbtrans); // At last, make sure to create any missing tables. (Needed by addons that add stores to DB without specifying version)
        });
    }
    function getSchemaDiff(oldSchema, newSchema) {
        var diff = {
            del: [],
            add: [],
            change: [] // Array of {name: tableName, recreate: newDefinition, del: delIndexNames, add: newIndexDefs, change: changedIndexDefs}
        };
        for (var table in oldSchema) {
            if (!newSchema[table])
                diff.del.push(table);
        }
        for (table in newSchema) {
            var oldDef = oldSchema[table], newDef = newSchema[table];
            if (!oldDef) {
                diff.add.push([table, newDef]);
            }
            else {
                var change = {
                    name: table,
                    def: newDef,
                    recreate: false,
                    del: [],
                    add: [],
                    change: []
                };
                if (oldDef.primKey.src !== newDef.primKey.src) {
                    // Primary key has changed. Remove and re-add table.
                    change.recreate = true;
                    diff.change.push(change);
                }
                else {
                    // Same primary key. Just find out what differs:
                    var oldIndexes = oldDef.idxByName;
                    var newIndexes = newDef.idxByName;
                    for (var idxName in oldIndexes) {
                        if (!newIndexes[idxName])
                            change.del.push(idxName);
                    }
                    for (idxName in newIndexes) {
                        var oldIdx = oldIndexes[idxName], newIdx = newIndexes[idxName];
                        if (!oldIdx)
                            change.add.push(newIdx);
                        else if (oldIdx.src !== newIdx.src)
                            change.change.push(newIdx);
                    }
                    if (change.del.length > 0 || change.add.length > 0 || change.change.length > 0) {
                        diff.change.push(change);
                    }
                }
            }
        }
        return diff;
    }
    function createTable(idbtrans, tableName, primKey, indexes) {
        /// <param name="idbtrans" type="IDBTransaction"></param>
        var store = idbtrans.db.createObjectStore(tableName, primKey.keyPath ? { keyPath: primKey.keyPath, autoIncrement: primKey.auto } : { autoIncrement: primKey.auto });
        indexes.forEach(function (idx) { addIndex(store, idx); });
        return store;
    }
    function createMissingTables(newSchema, idbtrans) {
        keys(newSchema).forEach(function (tableName) {
            if (!idbtrans.db.objectStoreNames.contains(tableName)) {
                createTable(idbtrans, tableName, newSchema[tableName].primKey, newSchema[tableName].indexes);
            }
        });
    }
    function deleteRemovedTables(newSchema, idbtrans) {
        for (var i = 0; i < idbtrans.db.objectStoreNames.length; ++i) {
            var storeName = idbtrans.db.objectStoreNames[i];
            if (newSchema[storeName] == null) {
                idbtrans.db.deleteObjectStore(storeName);
            }
        }
    }
    function addIndex(store, idx) {
        store.createIndex(idx.name, idx.keyPath, { unique: idx.unique, multiEntry: idx.multi });
    }
    //
    //
    //      Dexie Protected API
    //
    //
    this._allTables = allTables;
    this._createTransaction = function (mode, storeNames, dbschema, parentTransaction) {
        return new Transaction(mode, storeNames, dbschema, parentTransaction);
    };
    /* Generate a temporary transaction when db operations are done outside a transaction scope.
    */
    function tempTransaction(mode, storeNames, fn) {
        if (!openComplete && (!PSD.letThrough)) {
            if (!isBeingOpened) {
                if (!autoOpen)
                    return rejection(new exceptions.DatabaseClosed());
                db.open().catch(nop); // Open in background. If if fails, it will be catched by the final promise anyway.
            }
            return dbReadyPromise.then(function () { return tempTransaction(mode, storeNames, fn); });
        }
        else {
            var trans = db._createTransaction(mode, storeNames, globalSchema);
            try {
                trans.create();
            }
            catch (ex) {
                return rejection(ex);
            }
            return trans._promise(mode, function (resolve, reject) {
                return newScope(function () {
                    PSD.trans = trans;
                    return fn(resolve, reject, trans);
                });
            }).then(function (result) {
                // Instead of resolving value directly, wait with resolving it until transaction has completed.
                // Otherwise the data would not be in the DB if requesting it in the then() operation.
                // Specifically, to ensure that the following expression will work:
                //
                //   db.friends.put({name: "Arne"}).then(function () {
                //       db.friends.where("name").equals("Arne").count(function(count) {
                //           assert (count === 1);
                //       });
                //   });
                //
                return trans._completion.then(function () { return result; });
            }); /*.catch(err => { // Don't do this as of now. If would affect bulk- and modify methods in a way that could be more intuitive. But wait! Maybe change in next major.
                trans._reject(err);
                return rejection(err);
            });*/
        }
    }
    this._whenReady = function (fn) {
        return openComplete || PSD.letThrough ? fn() : new Promise(function (resolve, reject) {
            if (!isBeingOpened) {
                if (!autoOpen) {
                    reject(new exceptions.DatabaseClosed());
                    return;
                }
                db.open().catch(nop); // Open in background. If if fails, it will be catched by the final promise anyway.
            }
            dbReadyPromise.then(resolve, reject);
        }).then(fn);
    };
    //
    //
    //
    //
    //      Dexie API
    //
    //
    //
    this.verno = 0;
    this.open = function () {
        if (isBeingOpened || idbdb)
            return dbReadyPromise.then(function () { return dbOpenError ? rejection(dbOpenError) : db; });
        debug && (openCanceller._stackHolder = getErrorWithStack()); // Let stacks point to when open() was called rather than where new Dexie() was called.
        isBeingOpened = true;
        dbOpenError = null;
        openComplete = false;
        // Function pointers to call when the core opening process completes.
        var resolveDbReady = dbReadyResolve, 
        // upgradeTransaction to abort on failure.
        upgradeTransaction = null;
        return Promise.race([openCanceller, new Promise(function (resolve, reject) {
                // Multiply db.verno with 10 will be needed to workaround upgrading bug in IE:
                // IE fails when deleting objectStore after reading from it.
                // A future version of Dexie.js will stopover an intermediate version to workaround this.
                // At that point, we want to be backward compatible. Could have been multiplied with 2, but by using 10, it is easier to map the number to the real version number.
                // If no API, throw!
                if (!indexedDB)
                    throw new exceptions.MissingAPI("indexedDB API not found. If using IE10+, make sure to run your code on a server URL " +
                        "(not locally). If using old Safari versions, make sure to include indexedDB polyfill.");
                var req = autoSchema ? indexedDB.open(dbName) : indexedDB.open(dbName, Math.round(db.verno * 10));
                if (!req)
                    throw new exceptions.MissingAPI("IndexedDB API not available"); // May happen in Safari private mode, see https://github.com/dfahlander/Dexie.js/issues/134
                req.onerror = eventRejectHandler(reject);
                req.onblocked = wrap(fireOnBlocked);
                req.onupgradeneeded = wrap(function (e) {
                    upgradeTransaction = req.transaction;
                    if (autoSchema && !db._allowEmptyDB) {
                        // Caller did not specify a version or schema. Doing that is only acceptable for opening alread existing databases.
                        // If onupgradeneeded is called it means database did not exist. Reject the open() promise and make sure that we
                        // do not create a new database by accident here.
                        req.onerror = preventDefault; // Prohibit onabort error from firing before we're done!
                        upgradeTransaction.abort(); // Abort transaction (would hope that this would make DB disappear but it doesnt.)
                        // Close database and delete it.
                        req.result.close();
                        var delreq = indexedDB.deleteDatabase(dbName); // The upgrade transaction is atomic, and javascript is single threaded - meaning that there is no risk that we delete someone elses database here!
                        delreq.onsuccess = delreq.onerror = wrap(function () {
                            reject(new exceptions.NoSuchDatabase("Database " + dbName + " doesnt exist"));
                        });
                    }
                    else {
                        upgradeTransaction.onerror = eventRejectHandler(reject);
                        var oldVer = e.oldVersion > Math.pow(2, 62) ? 0 : e.oldVersion; // Safari 8 fix.
                        runUpgraders(oldVer / 10, upgradeTransaction, reject, req);
                    }
                }, reject);
                req.onsuccess = wrap(function () {
                    // Core opening procedure complete. Now let's just record some stuff.
                    upgradeTransaction = null;
                    idbdb = req.result;
                    connections.push(db); // Used for emulating versionchange event on IE/Edge/Safari.
                    if (autoSchema)
                        readGlobalSchema();
                    else if (idbdb.objectStoreNames.length > 0) {
                        try {
                            adjustToExistingIndexNames(globalSchema, idbdb.transaction(safariMultiStoreFix(idbdb.objectStoreNames), READONLY));
                        }
                        catch (e) {
                            // Safari may bail out if > 1 store names. However, this shouldnt be a showstopper. Issue #120.
                        }
                    }
                    idbdb.onversionchange = wrap(function (ev) {
                        db._vcFired = true; // detect implementations that not support versionchange (IE/Edge/Safari)
                        db.on("versionchange").fire(ev);
                    });
                    if (!hasNativeGetDatabaseNames && dbName !== '__dbnames') {
                        dbNamesDB.dbnames.put({ name: dbName }).catch(nop);
                    }
                    resolve();
                }, reject);
            })]).then(function () {
            // Before finally resolving the dbReadyPromise and this promise,
            // call and await all on('ready') subscribers:
            // Dexie.vip() makes subscribers able to use the database while being opened.
            // This is a must since these subscribers take part of the opening procedure.
            onReadyBeingFired = [];
            return Promise.resolve(Dexie.vip(db.on.ready.fire)).then(function fireRemainders() {
                if (onReadyBeingFired.length > 0) {
                    // In case additional subscribers to db.on('ready') were added during the time db.on.ready.fire was executed.
                    var remainders = onReadyBeingFired.reduce(promisableChain, nop);
                    onReadyBeingFired = [];
                    return Promise.resolve(Dexie.vip(remainders)).then(fireRemainders);
                }
            });
        }).finally(function () {
            onReadyBeingFired = null;
        }).then(function () {
            // Resolve the db.open() with the db instance.
            isBeingOpened = false;
            return db;
        }).catch(function (err) {
            try {
                // Did we fail within onupgradeneeded? Make sure to abort the upgrade transaction so it doesnt commit.
                upgradeTransaction && upgradeTransaction.abort();
            }
            catch (e) { }
            isBeingOpened = false; // Set before calling db.close() so that it doesnt reject openCanceller again (leads to unhandled rejection event).
            db.close(); // Closes and resets idbdb, removes connections, resets dbReadyPromise and openCanceller so that a later db.open() is fresh.
            // A call to db.close() may have made on-ready subscribers fail. Use dbOpenError if set, since err could be a follow-up error on that.
            dbOpenError = err; // Record the error. It will be used to reject further promises of db operations.
            return rejection(dbOpenError);
        }).finally(function () {
            openComplete = true;
            resolveDbReady(); // dbReadyPromise is resolved no matter if open() rejects or resolved. It's just to wake up waiters.
        });
    };
    this.close = function () {
        var idx = connections.indexOf(db);
        if (idx >= 0)
            connections.splice(idx, 1);
        if (idbdb) {
            try {
                idbdb.close();
            }
            catch (e) { }
            idbdb = null;
        }
        autoOpen = false;
        dbOpenError = new exceptions.DatabaseClosed();
        if (isBeingOpened)
            cancelOpen(dbOpenError);
        // Reset dbReadyPromise promise:
        dbReadyPromise = new Promise(function (resolve) {
            dbReadyResolve = resolve;
        });
        openCanceller = new Promise(function (_, reject) {
            cancelOpen = reject;
        });
    };
    this.delete = function () {
        var hasArguments = arguments.length > 0;
        return new Promise(function (resolve, reject) {
            if (hasArguments)
                throw new exceptions.InvalidArgument("Arguments not allowed in db.delete()");
            if (isBeingOpened) {
                dbReadyPromise.then(doDelete);
            }
            else {
                doDelete();
            }
            function doDelete() {
                db.close();
                var req = indexedDB.deleteDatabase(dbName);
                req.onsuccess = wrap(function () {
                    if (!hasNativeGetDatabaseNames) {
                        dbNamesDB.dbnames.delete(dbName).catch(nop);
                    }
                    resolve();
                });
                req.onerror = eventRejectHandler(reject);
                req.onblocked = fireOnBlocked;
            }
        });
    };
    this.backendDB = function () {
        return idbdb;
    };
    this.isOpen = function () {
        return idbdb !== null;
    };
    this.hasBeenClosed = function () {
        return dbOpenError && (dbOpenError instanceof exceptions.DatabaseClosed);
    };
    this.hasFailed = function () {
        return dbOpenError !== null;
    };
    this.dynamicallyOpened = function () {
        return autoSchema;
    };
    //
    // Properties
    //
    this.name = dbName;
    // db.tables - an array of all Table instances.
    props(this, {
        tables: {
            get: function () {
                /// <returns type="Array" elementType="Table" />
                return keys(allTables).map(function (name) { return allTables[name]; });
            }
        }
    });
    //
    // Events
    //
    this.on = Events(this, "populate", "blocked", "versionchange", { ready: [promisableChain, nop] });
    this.on.ready.subscribe = override(this.on.ready.subscribe, function (subscribe) {
        return function (subscriber, bSticky) {
            Dexie.vip(function () {
                if (openComplete) {
                    // Database already open. Call subscriber asap.
                    if (!dbOpenError)
                        Promise.resolve().then(subscriber);
                    // bSticky: Also subscribe to future open sucesses (after close / reopen) 
                    if (bSticky)
                        subscribe(subscriber);
                }
                else if (onReadyBeingFired) {
                    // db.on('ready') subscribers are currently being executed and have not yet resolved or rejected
                    onReadyBeingFired.push(subscriber);
                    if (bSticky)
                        subscribe(subscriber);
                }
                else {
                    // Database not yet open. Subscribe to it.
                    subscribe(subscriber);
                    // If bSticky is falsy, make sure to unsubscribe subscriber when fired once.
                    if (!bSticky)
                        subscribe(function unsubscribe() {
                            db.on.ready.unsubscribe(subscriber);
                            db.on.ready.unsubscribe(unsubscribe);
                        });
                }
            });
        };
    });
    this.transaction = function () {
        /// <summary>
        ///
        /// </summary>
        /// <param name="mode" type="String">"r" for readonly, or "rw" for readwrite</param>
        /// <param name="tableInstances">Table instance, Array of Table instances, String or String Array of object stores to include in the transaction</param>
        /// <param name="scopeFunc" type="Function">Function to execute with transaction</param>
        var args = extractTransactionArgs.apply(this, arguments);
        return this._transaction.apply(this, args);
    };
    function extractTransactionArgs(mode, _tableArgs_, scopeFunc) {
        // Let table arguments be all arguments between mode and last argument.
        var i = arguments.length;
        if (i < 2)
            throw new exceptions.InvalidArgument("Too few arguments");
        // Prevent optimzation killer (https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments)
        // and clone arguments except the first one into local var 'args'.
        var args = new Array(i - 1);
        while (--i)
            args[i - 1] = arguments[i];
        // Let scopeFunc be the last argument and pop it so that args now only contain the table arguments.
        scopeFunc = args.pop();
        var tables = flatten(args); // Support using array as middle argument, or a mix of arrays and non-arrays.
        return [mode, tables, scopeFunc];
    }
    this._transaction = function (mode, tables, scopeFunc) {
        var parentTransaction = PSD.trans;
        // Check if parent transactions is bound to this db instance, and if caller wants to reuse it
        if (!parentTransaction || parentTransaction.db !== db || mode.indexOf('!') !== -1)
            parentTransaction = null;
        var onlyIfCompatible = mode.indexOf('?') !== -1;
        mode = mode.replace('!', '').replace('?', ''); // Ok. Will change arguments[0] as well but we wont touch arguments henceforth.
        try {
            //
            // Get storeNames from arguments. Either through given table instances, or through given table names.
            //
            var storeNames = tables.map(function (table) {
                var storeName = table instanceof Table ? table.name : table;
                if (typeof storeName !== 'string')
                    throw new TypeError("Invalid table argument to Dexie.transaction(). Only Table or String are allowed");
                return storeName;
            });
            //
            // Resolve mode. Allow shortcuts "r" and "rw".
            //
            if (mode == "r" || mode == READONLY)
                mode = READONLY;
            else if (mode == "rw" || mode == READWRITE)
                mode = READWRITE;
            else
                throw new exceptions.InvalidArgument("Invalid transaction mode: " + mode);
            if (parentTransaction) {
                // Basic checks
                if (parentTransaction.mode === READONLY && mode === READWRITE) {
                    if (onlyIfCompatible) {
                        // Spawn new transaction instead.
                        parentTransaction = null;
                    }
                    else
                        throw new exceptions.SubTransaction("Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY");
                }
                if (parentTransaction) {
                    storeNames.forEach(function (storeName) {
                        if (parentTransaction && parentTransaction.storeNames.indexOf(storeName) === -1) {
                            if (onlyIfCompatible) {
                                // Spawn new transaction instead.
                                parentTransaction = null;
                            }
                            else
                                throw new exceptions.SubTransaction("Table " + storeName +
                                    " not included in parent transaction.");
                        }
                    });
                }
                if (onlyIfCompatible && parentTransaction && !parentTransaction.active) {
                    // '?' mode should not keep using an inactive transaction.
                    parentTransaction = null;
                }
            }
        }
        catch (e) {
            return parentTransaction ?
                parentTransaction._promise(null, function (_, reject) { reject(e); }) :
                rejection(e);
        }
        // If this is a sub-transaction, lock the parent and then launch the sub-transaction.
        return (parentTransaction ?
            parentTransaction._promise(mode, enterTransactionScope, "lock") :
            PSD.trans ?
                // no parent transaction despite PSD.trans exists. Make sure also
                // that the zone we create is not a sub-zone of current, because
                // Promise.follow() should not wait for it if so.
                usePSD(PSD.transless, function () { return db._whenReady(enterTransactionScope); }) :
                db._whenReady(enterTransactionScope));
        function enterTransactionScope() {
            return Promise.resolve().then(function () {
                // Keep a pointer to last non-transactional PSD to use if someone calls Dexie.ignoreTransaction().
                var transless = PSD.transless || PSD;
                // Our transaction.
                //return new Promise((resolve, reject) => {
                var trans = db._createTransaction(mode, storeNames, globalSchema, parentTransaction);
                // Let the transaction instance be part of a Promise-specific data (PSD) value.
                var zoneProps = {
                    trans: trans,
                    transless: transless
                };
                if (parentTransaction) {
                    // Emulate transaction commit awareness for inner transaction (must 'commit' when the inner transaction has no more operations ongoing)
                    trans.idbtrans = parentTransaction.idbtrans;
                }
                else {
                    trans.create(); // Create the backend transaction so that complete() or error() will trigger even if no operation is made upon it.
                }
                // Support for native async await.
                if (scopeFunc.constructor === AsyncFunction) {
                    incrementExpectedAwaits();
                }
                var returnValue;
                var promiseFollowed = Promise.follow(function () {
                    // Finally, call the scope function with our table and transaction arguments.
                    returnValue = scopeFunc.call(trans, trans);
                    if (returnValue) {
                        if (returnValue.constructor === NativePromise) {
                            var decrementor = decrementExpectedAwaits.bind(null, null);
                            returnValue.then(decrementor, decrementor);
                        }
                        else if (typeof returnValue.next === 'function' && typeof returnValue.throw === 'function') {
                            // scopeFunc returned an iterator with throw-support. Handle yield as await.
                            returnValue = awaitIterator(returnValue);
                        }
                    }
                }, zoneProps);
                return (returnValue && typeof returnValue.then === 'function' ?
                    // Promise returned. User uses promise-style transactions.
                    Promise.resolve(returnValue).then(function (x) { return trans.active ?
                        x // Transaction still active. Continue.
                        : rejection(new exceptions.PrematureCommit("Transaction committed too early. See http://bit.ly/2kdckMn")); })
                    // No promise returned. Wait for all outstanding promises before continuing. 
                    : promiseFollowed.then(function () { return returnValue; })).then(function (x) {
                    // sub transactions don't react to idbtrans.oncomplete. We must trigger a completion:
                    if (parentTransaction)
                        trans._resolve();
                    // wait for trans._completion
                    // (if root transaction, this means 'complete' event. If sub-transaction, we've just fired it ourselves)
                    return trans._completion.then(function () { return x; });
                }).catch(function (e) {
                    trans._reject(e); // Yes, above then-handler were maybe not called because of an unhandled rejection in scopeFunc!
                    return rejection(e);
                });
            });
        }
    };
    this.table = function (tableName) {
        /// <returns type="Table"></returns>
        if (!hasOwn(allTables, tableName)) {
            throw new exceptions.InvalidTable("Table " + tableName + " does not exist");
        }
        return allTables[tableName];
    };
    //
    //
    //
    // Table Class
    //
    //
    //
    function Table(name, tableSchema, optionalTrans) {
        /// <param name="name" type="String"></param>
        this.name = name;
        this.schema = tableSchema;
        this._tx = optionalTrans;
        this.hook = allTables[name] ? allTables[name].hook : Events(null, {
            "creating": [hookCreatingChain, nop],
            "reading": [pureFunctionChain, mirror],
            "updating": [hookUpdatingChain, nop],
            "deleting": [hookDeletingChain, nop]
        });
    }
    function BulkErrorHandlerCatchAll(errorList, done, supportHooks) {
        return (supportHooks ? hookedEventRejectHandler : eventRejectHandler)(function (e) {
            errorList.push(e);
            done && done();
        });
    }
    function bulkDelete(idbstore, trans, keysOrTuples, hasDeleteHook, deletingHook) {
        // If hasDeleteHook, keysOrTuples must be an array of tuples: [[key1, value2],[key2,value2],...],
        // else keysOrTuples must be just an array of keys: [key1, key2, ...].
        return new Promise(function (resolve, reject) {
            var len = keysOrTuples.length, lastItem = len - 1;
            if (len === 0)
                return resolve();
            if (!hasDeleteHook) {
                for (var i = 0; i < len; ++i) {
                    var req = idbstore.delete(keysOrTuples[i]);
                    req.onerror = eventRejectHandler(reject);
                    if (i === lastItem)
                        req.onsuccess = wrap(function () { return resolve(); });
                }
            }
            else {
                var hookCtx, errorHandler = hookedEventRejectHandler(reject), successHandler = hookedEventSuccessHandler(null);
                tryCatch(function () {
                    for (var i = 0; i < len; ++i) {
                        hookCtx = { onsuccess: null, onerror: null };
                        var tuple = keysOrTuples[i];
                        deletingHook.call(hookCtx, tuple[0], tuple[1], trans);
                        var req = idbstore.delete(tuple[0]);
                        req._hookCtx = hookCtx;
                        req.onerror = errorHandler;
                        if (i === lastItem)
                            req.onsuccess = hookedEventSuccessHandler(resolve);
                        else
                            req.onsuccess = successHandler;
                    }
                }, function (err) {
                    hookCtx.onerror && hookCtx.onerror(err);
                    throw err;
                });
            }
        });
    }
    props(Table.prototype, {
        //
        // Table Protected Methods
        //
        _trans: function getTransaction(mode, fn, writeLocked) {
            var trans = this._tx || PSD.trans;
            return trans && trans.db === db ?
                trans === PSD.trans ?
                    trans._promise(mode, fn, writeLocked) :
                    newScope(function () { return trans._promise(mode, fn, writeLocked); }, { trans: trans, transless: PSD.transless || PSD }) :
                tempTransaction(mode, [this.name], fn);
        },
        _idbstore: function getIDBObjectStore(mode, fn, writeLocked) {
            var tableName = this.name;
            function supplyIdbStore(resolve, reject, trans) {
                if (trans.storeNames.indexOf(tableName) === -1)
                    throw new exceptions.NotFound("Table" + tableName + " not part of transaction");
                return fn(resolve, reject, trans.idbtrans.objectStore(tableName), trans);
            }
            return this._trans(mode, supplyIdbStore, writeLocked);
        },
        //
        // Table Public Methods
        //
        get: function (keyOrCrit, cb) {
            if (keyOrCrit && keyOrCrit.constructor === Object)
                return this.where(keyOrCrit).first(cb);
            var self = this;
            return this._idbstore(READONLY, function (resolve, reject, idbstore) {
                var req = idbstore.get(keyOrCrit);
                req.onerror = eventRejectHandler(reject);
                req.onsuccess = wrap(function () {
                    resolve(self.hook.reading.fire(req.result));
                }, reject);
            }).then(cb);
        },
        where: function (indexOrCrit) {
            if (typeof indexOrCrit === 'string')
                return new WhereClause(this, indexOrCrit);
            if (isArray(indexOrCrit))
                return new WhereClause(this, "[" + indexOrCrit.join('+') + "]");
            // indexOrCrit is an object map of {[keyPath]:value} 
            var keyPaths = keys(indexOrCrit);
            if (keyPaths.length === 1)
                // Only one critera. This was the easy case:
                return this
                    .where(keyPaths[0])
                    .equals(indexOrCrit[keyPaths[0]]);
            // Multiple criterias.
            // Let's try finding a compound index that matches all keyPaths in
            // arbritary order:
            var compoundIndex = this.schema.indexes.concat(this.schema.primKey).filter(function (ix) {
                return ix.compound &&
                    keyPaths.every(function (keyPath) { return ix.keyPath.indexOf(keyPath) >= 0; }) &&
                    ix.keyPath.every(function (keyPath) { return keyPaths.indexOf(keyPath) >= 0; });
            })[0];
            if (compoundIndex && maxKey !== maxString)
                // Cool! We found such compound index
                // and this browser supports compound indexes (maxKey !== maxString)!
                return this
                    .where(compoundIndex.name)
                    .equals(compoundIndex.keyPath.map(function (kp) { return indexOrCrit[kp]; }));
            if (!compoundIndex)
                console.warn("The query " + JSON.stringify(indexOrCrit) + " on " + this.name + " would benefit of a " +
                    ("compound index [" + keyPaths.join('+') + "]"));
            // Ok, now let's fallback to finding at least one matching index
            // and filter the rest.
            var idxByName = this.schema.idxByName;
            var simpleIndex = keyPaths.reduce(function (r, keyPath) { return [
                r[0] || idxByName[keyPath],
                r[0] || !idxByName[keyPath] ?
                    combine(r[1], function (x) { return '' + getByKeyPath(x, keyPath) ==
                        '' + indexOrCrit[keyPath]; })
                    : r[1]
            ]; }, [null, null]);
            var idx = simpleIndex[0];
            return idx ?
                this.where(idx.name).equals(indexOrCrit[idx.keyPath])
                    .filter(simpleIndex[1]) :
                compoundIndex ?
                    this.filter(simpleIndex[1]) : // Has compound but browser bad. Allow filter.
                    this.where(keyPaths).equals(''); // No index at all. Fail lazily.
        },
        count: function (cb) {
            return this.toCollection().count(cb);
        },
        offset: function (offset) {
            return this.toCollection().offset(offset);
        },
        limit: function (numRows) {
            return this.toCollection().limit(numRows);
        },
        reverse: function () {
            return this.toCollection().reverse();
        },
        filter: function (filterFunction) {
            return this.toCollection().and(filterFunction);
        },
        each: function (fn) {
            return this.toCollection().each(fn);
        },
        toArray: function (cb) {
            return this.toCollection().toArray(cb);
        },
        orderBy: function (index) {
            return new Collection(new WhereClause(this, isArray(index) ?
                "[" + index.join('+') + "]" :
                index));
        },
        toCollection: function () {
            return new Collection(new WhereClause(this));
        },
        mapToClass: function (constructor, structure) {
            /// <summary>
            ///     Map table to a javascript constructor function. Objects returned from the database will be instances of this class, making
            ///     it possible to the instanceOf operator as well as extending the class using constructor.prototype.method = function(){...}.
            /// </summary>
            /// <param name="constructor">Constructor function representing the class.</param>
            /// <param name="structure" optional="true">Helps IDE code completion by knowing the members that objects contain and not just the indexes. Also
            /// know what type each member has. Example: {name: String, emailAddresses: [String], password}</param>
            this.schema.mappedClass = constructor;
            var instanceTemplate = Object.create(constructor.prototype);
            if (structure) {
                // structure and instanceTemplate is for IDE code competion only while constructor.prototype is for actual inheritance.
                applyStructure(instanceTemplate, structure);
            }
            this.schema.instanceTemplate = instanceTemplate;
            // Now, subscribe to the when("reading") event to make all objects that come out from this table inherit from given class
            // no matter which method to use for reading (Table.get() or Table.where(...)... )
            var readHook = function (obj) {
                if (!obj)
                    return obj; // No valid object. (Value is null). Return as is.
                // Create a new object that derives from constructor:
                var res = Object.create(constructor.prototype);
                // Clone members:
                for (var m in obj)
                    if (hasOwn(obj, m))
                        try {
                            res[m] = obj[m];
                        }
                        catch (_) { }
                return res;
            };
            if (this.schema.readHook) {
                this.hook.reading.unsubscribe(this.schema.readHook);
            }
            this.schema.readHook = readHook;
            this.hook("reading", readHook);
            return constructor;
        },
        defineClass: function (structure) {
            /// <summary>
            ///     Define all members of the class that represents the table. This will help code completion of when objects are read from the database
            ///     as well as making it possible to extend the prototype of the returned constructor function.
            /// </summary>
            /// <param name="structure">Helps IDE code completion by knowing the members that objects contain and not just the indexes. Also
            /// know what type each member has. Example: {name: String, emailAddresses: [String], properties: {shoeSize: Number}}</param>
            return this.mapToClass(Dexie.defineClass(structure), structure);
        },
        bulkDelete: function (keys$$1) {
            if (this.hook.deleting.fire === nop) {
                return this._idbstore(READWRITE, function (resolve, reject, idbstore, trans) {
                    resolve(bulkDelete(idbstore, trans, keys$$1, false, nop));
                });
            }
            else {
                return this
                    .where(':id')
                    .anyOf(keys$$1)
                    .delete()
                    .then(function () { }); // Resolve with undefined.
            }
        },
        bulkPut: function (objects, keys$$1) {
            var _this = this;
            return this._idbstore(READWRITE, function (resolve, reject, idbstore) {
                if (!idbstore.keyPath && !_this.schema.primKey.auto && !keys$$1)
                    throw new exceptions.InvalidArgument("bulkPut() with non-inbound keys requires keys array in second argument");
                if (idbstore.keyPath && keys$$1)
                    throw new exceptions.InvalidArgument("bulkPut(): keys argument invalid on tables with inbound keys");
                if (keys$$1 && keys$$1.length !== objects.length)
                    throw new exceptions.InvalidArgument("Arguments objects and keys must have the same length");
                if (objects.length === 0)
                    return resolve(); // Caller provided empty list.
                var done = function (result) {
                    if (errorList.length === 0)
                        resolve(result);
                    else
                        reject(new BulkError(_this.name + ".bulkPut(): " + errorList.length + " of " + numObjs + " operations failed", errorList));
                };
                var req, errorList = [], errorHandler, numObjs = objects.length, table = _this;
                if (_this.hook.creating.fire === nop && _this.hook.updating.fire === nop) {
                    //
                    // Standard Bulk (no 'creating' or 'updating' hooks to care about)
                    //
                    errorHandler = BulkErrorHandlerCatchAll(errorList);
                    for (var i = 0, l = objects.length; i < l; ++i) {
                        req = keys$$1 ? idbstore.put(objects[i], keys$$1[i]) : idbstore.put(objects[i]);
                        req.onerror = errorHandler;
                    }
                    // Only need to catch success or error on the last operation
                    // according to the IDB spec.
                    req.onerror = BulkErrorHandlerCatchAll(errorList, done);
                    req.onsuccess = eventSuccessHandler(done);
                }
                else {
                    var effectiveKeys = keys$$1 || idbstore.keyPath && objects.map(function (o) { return getByKeyPath(o, idbstore.keyPath); });
                    // Generate map of {[key]: object}
                    var objectLookup = effectiveKeys && arrayToObject(effectiveKeys, function (key, i) { return key != null && [key, objects[i]]; });
                    var promise = !effectiveKeys ?
                        // Auto-incremented key-less objects only without any keys argument.
                        table.bulkAdd(objects) :
                        // Keys provided. Either as inbound in provided objects, or as a keys argument.
                        // Begin with updating those that exists in DB:
                        table.where(':id').anyOf(effectiveKeys.filter(function (key) { return key != null; })).modify(function () {
                            this.value = objectLookup[this.primKey];
                            objectLookup[this.primKey] = null; // Mark as "don't add this"
                        }).catch(ModifyError, function (e) {
                            errorList = e.failures; // No need to concat here. These are the first errors added.
                        }).then(function () {
                            // Now, let's examine which items didnt exist so we can add them:
                            var objsToAdd = [], keysToAdd = keys$$1 && [];
                            // Iterate backwards. Why? Because if same key was used twice, just add the last one.
                            for (var i = effectiveKeys.length - 1; i >= 0; --i) {
                                var key = effectiveKeys[i];
                                if (key == null || objectLookup[key]) {
                                    objsToAdd.push(objects[i]);
                                    keys$$1 && keysToAdd.push(key);
                                    if (key != null)
                                        objectLookup[key] = null; // Mark as "dont add again"
                                }
                            }
                            // The items are in reverse order so reverse them before adding.
                            // Could be important in order to get auto-incremented keys the way the caller
                            // would expect. Could have used unshift instead of push()/reverse(),
                            // but: http://jsperf.com/unshift-vs-reverse
                            objsToAdd.reverse();
                            keys$$1 && keysToAdd.reverse();
                            return table.bulkAdd(objsToAdd, keysToAdd);
                        }).then(function (lastAddedKey) {
                            // Resolve with key of the last object in given arguments to bulkPut():
                            var lastEffectiveKey = effectiveKeys[effectiveKeys.length - 1]; // Key was provided.
                            return lastEffectiveKey != null ? lastEffectiveKey : lastAddedKey;
                        });
                    promise.then(done).catch(BulkError, function (e) {
                        // Concat failure from ModifyError and reject using our 'done' method.
                        errorList = errorList.concat(e.failures);
                        done();
                    }).catch(reject);
                }
            }, "locked"); // If called from transaction scope, lock transaction til all steps are done.
        },
        bulkAdd: function (objects, keys$$1) {
            var self = this, creatingHook = this.hook.creating.fire;
            return this._idbstore(READWRITE, function (resolve, reject, idbstore, trans) {
                if (!idbstore.keyPath && !self.schema.primKey.auto && !keys$$1)
                    throw new exceptions.InvalidArgument("bulkAdd() with non-inbound keys requires keys array in second argument");
                if (idbstore.keyPath && keys$$1)
                    throw new exceptions.InvalidArgument("bulkAdd(): keys argument invalid on tables with inbound keys");
                if (keys$$1 && keys$$1.length !== objects.length)
                    throw new exceptions.InvalidArgument("Arguments objects and keys must have the same length");
                if (objects.length === 0)
                    return resolve(); // Caller provided empty list.
                function done(result) {
                    if (errorList.length === 0)
                        resolve(result);
                    else
                        reject(new BulkError(self.name + ".bulkAdd(): " + errorList.length + " of " + numObjs + " operations failed", errorList));
                }
                var req, errorList = [], errorHandler, successHandler, numObjs = objects.length;
                if (creatingHook !== nop) {
                    //
                    // There are subscribers to hook('creating')
                    // Must behave as documented.
                    //
                    var keyPath = idbstore.keyPath, hookCtx;
                    errorHandler = BulkErrorHandlerCatchAll(errorList, null, true);
                    successHandler = hookedEventSuccessHandler(null);
                    tryCatch(function () {
                        for (var i = 0, l = objects.length; i < l; ++i) {
                            hookCtx = { onerror: null, onsuccess: null };
                            var key = keys$$1 && keys$$1[i];
                            var obj = objects[i], effectiveKey = keys$$1 ? key : keyPath ? getByKeyPath(obj, keyPath) : undefined, keyToUse = creatingHook.call(hookCtx, effectiveKey, obj, trans);
                            if (effectiveKey == null && keyToUse != null) {
                                if (keyPath) {
                                    obj = deepClone(obj);
                                    setByKeyPath(obj, keyPath, keyToUse);
                                }
                                else {
                                    key = keyToUse;
                                }
                            }
                            req = key != null ? idbstore.add(obj, key) : idbstore.add(obj);
                            req._hookCtx = hookCtx;
                            if (i < l - 1) {
                                req.onerror = errorHandler;
                                if (hookCtx.onsuccess)
                                    req.onsuccess = successHandler;
                            }
                        }
                    }, function (err) {
                        hookCtx.onerror && hookCtx.onerror(err);
                        throw err;
                    });
                    req.onerror = BulkErrorHandlerCatchAll(errorList, done, true);
                    req.onsuccess = hookedEventSuccessHandler(done);
                }
                else {
                    //
                    // Standard Bulk (no 'creating' hook to care about)
                    //
                    errorHandler = BulkErrorHandlerCatchAll(errorList);
                    for (var i = 0, l = objects.length; i < l; ++i) {
                        req = keys$$1 ? idbstore.add(objects[i], keys$$1[i]) : idbstore.add(objects[i]);
                        req.onerror = errorHandler;
                    }
                    // Only need to catch success or error on the last operation
                    // according to the IDB spec.
                    req.onerror = BulkErrorHandlerCatchAll(errorList, done);
                    req.onsuccess = eventSuccessHandler(done);
                }
            });
        },
        add: function (obj, key) {
            /// <summary>
            ///   Add an object to the database. In case an object with same primary key already exists, the object will not be added.
            /// </summary>
            /// <param name="obj" type="Object">A javascript object to insert</param>
            /// <param name="key" optional="true">Primary key</param>
            var creatingHook = this.hook.creating.fire;
            return this._idbstore(READWRITE, function (resolve, reject, idbstore, trans) {
                var hookCtx = { onsuccess: null, onerror: null };
                if (creatingHook !== nop) {
                    var effectiveKey = (key != null) ? key : (idbstore.keyPath ? getByKeyPath(obj, idbstore.keyPath) : undefined);
                    var keyToUse = creatingHook.call(hookCtx, effectiveKey, obj, trans); // Allow subscribers to when("creating") to generate the key.
                    if (effectiveKey == null && keyToUse != null) {
                        if (idbstore.keyPath)
                            setByKeyPath(obj, idbstore.keyPath, keyToUse);
                        else
                            key = keyToUse;
                    }
                }
                try {
                    var req = key != null ? idbstore.add(obj, key) : idbstore.add(obj);
                    req._hookCtx = hookCtx;
                    req.onerror = hookedEventRejectHandler(reject);
                    req.onsuccess = hookedEventSuccessHandler(function (result) {
                        // TODO: Remove these two lines in next major release (2.0?)
                        // It's no good practice to have side effects on provided parameters
                        var keyPath = idbstore.keyPath;
                        if (keyPath)
                            setByKeyPath(obj, keyPath, result);
                        resolve(result);
                    });
                }
                catch (e) {
                    if (hookCtx.onerror)
                        hookCtx.onerror(e);
                    throw e;
                }
            });
        },
        put: function (obj, key) {
            var _this = this;
            /// <summary>
            ///   Add an object to the database but in case an object with same primary key alread exists, the existing one will get updated.
            /// </summary>
            /// <param name="obj" type="Object">A javascript object to insert or update</param>
            /// <param name="key" optional="true">Primary key</param>
            var creatingHook = this.hook.creating.fire, updatingHook = this.hook.updating.fire;
            if (creatingHook !== nop || updatingHook !== nop) {
                //
                // People listens to when("creating") or when("updating") events!
                // We must know whether the put operation results in an CREATE or UPDATE.
                //
                var keyPath = this.schema.primKey.keyPath;
                var effectiveKey = (key !== undefined) ? key : (keyPath && getByKeyPath(obj, keyPath));
                if (effectiveKey == null)
                    return this.add(obj);
                // Since key is optional, make sure we get it from obj if not provided
                // Primary key exist. Lock transaction and try modifying existing. If nothing modified, call add().
                // clone obj before this async call. If caller modifies obj the line after put(), the IDB spec requires that it should not affect operation.
                obj = deepClone(obj);
                return this._trans(READWRITE, function () {
                    return _this.where(":id").equals(effectiveKey).modify(function () {
                        // Replace extisting value with our object
                        // CRUD event firing handled in Collection.modify()
                        this.value = obj;
                    }).then(function (count) { return count === 0 ? _this.add(obj, key) : effectiveKey; });
                }, "locked"); // Lock needed because operation is splitted into modify() and add().
            }
            else {
                // Use the standard IDB put() method.
                return this._idbstore(READWRITE, function (resolve, reject, idbstore) {
                    var req = key !== undefined ? idbstore.put(obj, key) : idbstore.put(obj);
                    req.onerror = eventRejectHandler(reject);
                    req.onsuccess = wrap(function (ev) {
                        var keyPath = idbstore.keyPath;
                        if (keyPath)
                            setByKeyPath(obj, keyPath, ev.target.result);
                        resolve(req.result);
                    });
                });
            }
        },
        'delete': function (key) {
            /// <param name="key">Primary key of the object to delete</param>
            if (this.hook.deleting.subscribers.length) {
                // People listens to when("deleting") event. Must implement delete using Collection.delete() that will
                // call the CRUD event. Only Collection.delete() will know whether an object was actually deleted.
                return this.where(":id").equals(key).delete();
            }
            else {
                // No one listens. Use standard IDB delete() method.
                return this._idbstore(READWRITE, function (resolve, reject, idbstore) {
                    var req = idbstore.delete(key);
                    req.onerror = eventRejectHandler(reject);
                    req.onsuccess = wrap(function () {
                        resolve(req.result);
                    });
                });
            }
        },
        clear: function () {
            if (this.hook.deleting.subscribers.length) {
                // People listens to when("deleting") event. Must implement delete using Collection.delete() that will
                // call the CRUD event. Only Collection.delete() will knows which objects that are actually deleted.
                return this.toCollection().delete();
            }
            else {
                return this._idbstore(READWRITE, function (resolve, reject, idbstore) {
                    var req = idbstore.clear();
                    req.onerror = eventRejectHandler(reject);
                    req.onsuccess = wrap(function () {
                        resolve(req.result);
                    });
                });
            }
        },
        update: function (keyOrObject, modifications) {
            if (typeof modifications !== 'object' || isArray(modifications))
                throw new exceptions.InvalidArgument("Modifications must be an object.");
            if (typeof keyOrObject === 'object' && !isArray(keyOrObject)) {
                // object to modify. Also modify given object with the modifications:
                keys(modifications).forEach(function (keyPath) {
                    setByKeyPath(keyOrObject, keyPath, modifications[keyPath]);
                });
                var key = getByKeyPath(keyOrObject, this.schema.primKey.keyPath);
                if (key === undefined)
                    return rejection(new exceptions.InvalidArgument("Given object does not contain its primary key"));
                return this.where(":id").equals(key).modify(modifications);
            }
            else {
                // key to modify
                return this.where(":id").equals(keyOrObject).modify(modifications);
            }
        }
    });
    //
    //
    //
    // Transaction Class
    //
    //
    //
    function Transaction(mode, storeNames, dbschema, parent) {
        var _this = this;
        /// <summary>
        ///    Transaction class. Represents a database transaction. All operations on db goes through a Transaction.
        /// </summary>
        /// <param name="mode" type="String">Any of "readwrite" or "readonly"</param>
        /// <param name="storeNames" type="Array">Array of table names to operate on</param>
        this.db = db;
        this.mode = mode;
        this.storeNames = storeNames;
        this.idbtrans = null;
        this.on = Events(this, "complete", "error", "abort");
        this.parent = parent || null;
        this.active = true;
        this._reculock = 0;
        this._blockedFuncs = [];
        this._resolve = null;
        this._reject = null;
        this._waitingFor = null;
        this._waitingQueue = null;
        this._spinCount = 0; // Just for debugging waitFor()
        this._completion = new Promise(function (resolve, reject) {
            _this._resolve = resolve;
            _this._reject = reject;
        });
        this._completion.then(function () {
            _this.active = false;
            _this.on.complete.fire();
        }, function (e) {
            var wasActive = _this.active;
            _this.active = false;
            _this.on.error.fire(e);
            _this.parent ?
                _this.parent._reject(e) :
                wasActive && _this.idbtrans && _this.idbtrans.abort();
            return rejection(e); // Indicate we actually DO NOT catch this error.
        });
    }
    props(Transaction.prototype, {
        //
        // Transaction Protected Methods (not required by API users, but needed internally and eventually by dexie extensions)
        //
        _lock: function () {
            assert(!PSD.global); // Locking and unlocking reuires to be within a PSD scope.
            // Temporary set all requests into a pending queue if they are called before database is ready.
            ++this._reculock; // Recursive read/write lock pattern using PSD (Promise Specific Data) instead of TLS (Thread Local Storage)
            if (this._reculock === 1 && !PSD.global)
                PSD.lockOwnerFor = this;
            return this;
        },
        _unlock: function () {
            assert(!PSD.global); // Locking and unlocking reuires to be within a PSD scope.
            if (--this._reculock === 0) {
                if (!PSD.global)
                    PSD.lockOwnerFor = null;
                while (this._blockedFuncs.length > 0 && !this._locked()) {
                    var fnAndPSD = this._blockedFuncs.shift();
                    try {
                        usePSD(fnAndPSD[1], fnAndPSD[0]);
                    }
                    catch (e) { }
                }
            }
            return this;
        },
        _locked: function () {
            // Checks if any write-lock is applied on this transaction.
            // To simplify the Dexie API for extension implementations, we support recursive locks.
            // This is accomplished by using "Promise Specific Data" (PSD).
            // PSD data is bound to a Promise and any child Promise emitted through then() or resolve( new Promise() ).
            // PSD is local to code executing on top of the call stacks of any of any code executed by Promise():
            //         * callback given to the Promise() constructor  (function (resolve, reject){...})
            //         * callbacks given to then()/catch()/finally() methods (function (value){...})
            // If creating a new independant Promise instance from within a Promise call stack, the new Promise will derive the PSD from the call stack of the parent Promise.
            // Derivation is done so that the inner PSD __proto__ points to the outer PSD.
            // PSD.lockOwnerFor will point to current transaction object if the currently executing PSD scope owns the lock.
            return this._reculock && PSD.lockOwnerFor !== this;
        },
        create: function (idbtrans) {
            var _this = this;
            if (!this.mode)
                return this;
            assert(!this.idbtrans);
            if (!idbtrans && !idbdb) {
                switch (dbOpenError && dbOpenError.name) {
                    case "DatabaseClosedError":
                        // Errors where it is no difference whether it was caused by the user operation or an earlier call to db.open()
                        throw new exceptions.DatabaseClosed(dbOpenError);
                    case "MissingAPIError":
                        // Errors where it is no difference whether it was caused by the user operation or an earlier call to db.open()
                        throw new exceptions.MissingAPI(dbOpenError.message, dbOpenError);
                    default:
                        // Make it clear that the user operation was not what caused the error - the error had occurred earlier on db.open()!
                        throw new exceptions.OpenFailed(dbOpenError);
                }
            }
            if (!this.active)
                throw new exceptions.TransactionInactive();
            assert(this._completion._state === null);
            idbtrans = this.idbtrans = idbtrans || idbdb.transaction(safariMultiStoreFix(this.storeNames), this.mode);
            idbtrans.onerror = wrap(function (ev) {
                preventDefault(ev); // Prohibit default bubbling to window.error
                _this._reject(idbtrans.error);
            });
            idbtrans.onabort = wrap(function (ev) {
                preventDefault(ev);
                _this.active && _this._reject(new exceptions.Abort(idbtrans.error));
                _this.active = false;
                _this.on("abort").fire(ev);
            });
            idbtrans.oncomplete = wrap(function () {
                _this.active = false;
                _this._resolve();
            });
            return this;
        },
        _promise: function (mode, fn, bWriteLock) {
            var _this = this;
            if (mode === READWRITE && this.mode !== READWRITE)
                return rejection(new exceptions.ReadOnly("Transaction is readonly"));
            if (!this.active)
                return rejection(new exceptions.TransactionInactive());
            if (this._locked()) {
                return new Promise(function (resolve, reject) {
                    _this._blockedFuncs.push([function () {
                            _this._promise(mode, fn, bWriteLock).then(resolve, reject);
                        }, PSD]);
                });
            }
            else if (bWriteLock) {
                return newScope(function () {
                    var p = new Promise(function (resolve, reject) {
                        _this._lock();
                        var rv = fn(resolve, reject, _this);
                        if (rv && rv.then)
                            rv.then(resolve, reject);
                    });
                    p.finally(function () { return _this._unlock(); });
                    p._lib = true;
                    return p;
                });
            }
            else {
                var p = new Promise(function (resolve, reject) {
                    var rv = fn(resolve, reject, _this);
                    if (rv && rv.then)
                        rv.then(resolve, reject);
                });
                p._lib = true;
                return p;
            }
        },
        _root: function () {
            return this.parent ? this.parent._root() : this;
        },
        waitFor: function (promise) {
            // Always operate on the root transaction (in case this is a sub stransaction)
            var root = this._root();
            // For stability reasons, convert parameter to promise no matter what type is passed to waitFor().
            // (We must be able to call .then() on it.)
            promise = Promise.resolve(promise);
            if (root._waitingFor) {
                // Already called waitFor(). Wait for both to complete.
                root._waitingFor = root._waitingFor.then(function () { return promise; });
            }
            else {
                // We're not in waiting state. Start waiting state.
                root._waitingFor = promise;
                root._waitingQueue = [];
                // Start interacting with indexedDB until promise completes:
                var store = root.idbtrans.objectStore(root.storeNames[0]);
                (function spin() {
                    ++root._spinCount; // For debugging only
                    while (root._waitingQueue.length)
                        (root._waitingQueue.shift())();
                    if (root._waitingFor)
                        store.get(-Infinity).onsuccess = spin;
                }());
            }
            var currentWaitPromise = root._waitingFor;
            return new Promise(function (resolve, reject) {
                promise.then(function (res) { return root._waitingQueue.push(wrap(resolve.bind(null, res))); }, function (err) { return root._waitingQueue.push(wrap(reject.bind(null, err))); }).finally(function () {
                    if (root._waitingFor === currentWaitPromise) {
                        // No one added a wait after us. Safe to stop the spinning.
                        root._waitingFor = null;
                    }
                });
            });
        },
        //
        // Transaction Public Properties and Methods
        //
        abort: function () {
            this.active && this._reject(new exceptions.Abort());
            this.active = false;
        },
        tables: {
            get: deprecated("Transaction.tables", function () { return allTables; })
        },
        table: function (name) {
            var table = db.table(name); // Don't check that table is part of transaction. It must fail lazily!
            return new Table(name, table.schema, this);
        }
    });
    //
    //
    //
    // WhereClause
    //
    //
    //
    function WhereClause(table, index, orCollection) {
        /// <param name="table" type="Table"></param>
        /// <param name="index" type="String" optional="true"></param>
        /// <param name="orCollection" type="Collection" optional="true"></param>
        this._ctx = {
            table: table,
            index: index === ":id" ? null : index,
            or: orCollection
        };
    }
    props(WhereClause.prototype, function () {
        // WhereClause private methods
        function fail(collectionOrWhereClause, err, T) {
            var collection = collectionOrWhereClause instanceof WhereClause ?
                new Collection(collectionOrWhereClause) :
                collectionOrWhereClause;
            collection._ctx.error = T ? new T(err) : new TypeError(err);
            return collection;
        }
        function emptyCollection(whereClause) {
            return new Collection(whereClause, function () { return IDBKeyRange.only(""); }).limit(0);
        }
        function upperFactory(dir) {
            return dir === "next" ? function (s) { return s.toUpperCase(); } : function (s) { return s.toLowerCase(); };
        }
        function lowerFactory(dir) {
            return dir === "next" ? function (s) { return s.toLowerCase(); } : function (s) { return s.toUpperCase(); };
        }
        function nextCasing(key, lowerKey, upperNeedle, lowerNeedle, cmp, dir) {
            var length = Math.min(key.length, lowerNeedle.length);
            var llp = -1;
            for (var i = 0; i < length; ++i) {
                var lwrKeyChar = lowerKey[i];
                if (lwrKeyChar !== lowerNeedle[i]) {
                    if (cmp(key[i], upperNeedle[i]) < 0)
                        return key.substr(0, i) + upperNeedle[i] + upperNeedle.substr(i + 1);
                    if (cmp(key[i], lowerNeedle[i]) < 0)
                        return key.substr(0, i) + lowerNeedle[i] + upperNeedle.substr(i + 1);
                    if (llp >= 0)
                        return key.substr(0, llp) + lowerKey[llp] + upperNeedle.substr(llp + 1);
                    return null;
                }
                if (cmp(key[i], lwrKeyChar) < 0)
                    llp = i;
            }
            if (length < lowerNeedle.length && dir === "next")
                return key + upperNeedle.substr(key.length);
            if (length < key.length && dir === "prev")
                return key.substr(0, upperNeedle.length);
            return (llp < 0 ? null : key.substr(0, llp) + lowerNeedle[llp] + upperNeedle.substr(llp + 1));
        }
        function addIgnoreCaseAlgorithm(whereClause, match, needles, suffix) {
            /// <param name="needles" type="Array" elementType="String"></param>
            var upper, lower, compare, upperNeedles, lowerNeedles, direction, nextKeySuffix, needlesLen = needles.length;
            if (!needles.every(function (s) { return typeof s === 'string'; })) {
                return fail(whereClause, STRING_EXPECTED);
            }
            function initDirection(dir) {
                upper = upperFactory(dir);
                lower = lowerFactory(dir);
                compare = (dir === "next" ? simpleCompare : simpleCompareReverse);
                var needleBounds = needles.map(function (needle) {
                    return { lower: lower(needle), upper: upper(needle) };
                }).sort(function (a, b) {
                    return compare(a.lower, b.lower);
                });
                upperNeedles = needleBounds.map(function (nb) { return nb.upper; });
                lowerNeedles = needleBounds.map(function (nb) { return nb.lower; });
                direction = dir;
                nextKeySuffix = (dir === "next" ? "" : suffix);
            }
            initDirection("next");
            var c = new Collection(whereClause, function () {
                return IDBKeyRange.bound(upperNeedles[0], lowerNeedles[needlesLen - 1] + suffix);
            });
            c._ondirectionchange = function (direction) {
                // This event onlys occur before filter is called the first time.
                initDirection(direction);
            };
            var firstPossibleNeedle = 0;
            c._addAlgorithm(function (cursor, advance, resolve) {
                /// <param name="cursor" type="IDBCursor"></param>
                /// <param name="advance" type="Function"></param>
                /// <param name="resolve" type="Function"></param>
                var key = cursor.key;
                if (typeof key !== 'string')
                    return false;
                var lowerKey = lower(key);
                if (match(lowerKey, lowerNeedles, firstPossibleNeedle)) {
                    return true;
                }
                else {
                    var lowestPossibleCasing = null;
                    for (var i = firstPossibleNeedle; i < needlesLen; ++i) {
                        var casing = nextCasing(key, lowerKey, upperNeedles[i], lowerNeedles[i], compare, direction);
                        if (casing === null && lowestPossibleCasing === null)
                            firstPossibleNeedle = i + 1;
                        else if (lowestPossibleCasing === null || compare(lowestPossibleCasing, casing) > 0) {
                            lowestPossibleCasing = casing;
                        }
                    }
                    if (lowestPossibleCasing !== null) {
                        advance(function () { cursor.continue(lowestPossibleCasing + nextKeySuffix); });
                    }
                    else {
                        advance(resolve);
                    }
                    return false;
                }
            });
            return c;
        }
        //
        // WhereClause public methods
        //
        return {
            between: function (lower, upper, includeLower, includeUpper) {
                /// <summary>
                ///     Filter out records whose where-field lays between given lower and upper values. Applies to Strings, Numbers and Dates.
                /// </summary>
                /// <param name="lower"></param>
                /// <param name="upper"></param>
                /// <param name="includeLower" optional="true">Whether items that equals lower should be included. Default true.</param>
                /// <param name="includeUpper" optional="true">Whether items that equals upper should be included. Default false.</param>
                /// <returns type="Collection"></returns>
                includeLower = includeLower !== false; // Default to true
                includeUpper = includeUpper === true; // Default to false
                try {
                    if ((cmp(lower, upper) > 0) ||
                        (cmp(lower, upper) === 0 && (includeLower || includeUpper) && !(includeLower && includeUpper)))
                        return emptyCollection(this); // Workaround for idiotic W3C Specification that DataError must be thrown if lower > upper. The natural result would be to return an empty collection.
                    return new Collection(this, function () { return IDBKeyRange.bound(lower, upper, !includeLower, !includeUpper); });
                }
                catch (e) {
                    return fail(this, INVALID_KEY_ARGUMENT);
                }
            },
            equals: function (value) {
                return new Collection(this, function () { return IDBKeyRange.only(value); });
            },
            above: function (value) {
                return new Collection(this, function () { return IDBKeyRange.lowerBound(value, true); });
            },
            aboveOrEqual: function (value) {
                return new Collection(this, function () { return IDBKeyRange.lowerBound(value); });
            },
            below: function (value) {
                return new Collection(this, function () { return IDBKeyRange.upperBound(value, true); });
            },
            belowOrEqual: function (value) {
                return new Collection(this, function () { return IDBKeyRange.upperBound(value); });
            },
            startsWith: function (str) {
                /// <param name="str" type="String"></param>
                if (typeof str !== 'string')
                    return fail(this, STRING_EXPECTED);
                return this.between(str, str + maxString, true, true);
            },
            startsWithIgnoreCase: function (str) {
                /// <param name="str" type="String"></param>
                if (str === "")
                    return this.startsWith(str);
                return addIgnoreCaseAlgorithm(this, function (x, a) { return x.indexOf(a[0]) === 0; }, [str], maxString);
            },
            equalsIgnoreCase: function (str) {
                /// <param name="str" type="String"></param>
                return addIgnoreCaseAlgorithm(this, function (x, a) { return x === a[0]; }, [str], "");
            },
            anyOfIgnoreCase: function () {
                var set = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
                if (set.length === 0)
                    return emptyCollection(this);
                return addIgnoreCaseAlgorithm(this, function (x, a) { return a.indexOf(x) !== -1; }, set, "");
            },
            startsWithAnyOfIgnoreCase: function () {
                var set = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
                if (set.length === 0)
                    return emptyCollection(this);
                return addIgnoreCaseAlgorithm(this, function (x, a) {
                    return a.some(function (n) {
                        return x.indexOf(n) === 0;
                    });
                }, set, maxString);
            },
            anyOf: function () {
                var set = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
                var compare = ascending;
                try {
                    set.sort(compare);
                }
                catch (e) {
                    return fail(this, INVALID_KEY_ARGUMENT);
                }
                if (set.length === 0)
                    return emptyCollection(this);
                var c = new Collection(this, function () { return IDBKeyRange.bound(set[0], set[set.length - 1]); });
                c._ondirectionchange = function (direction) {
                    compare = (direction === "next" ? ascending : descending);
                    set.sort(compare);
                };
                var i = 0;
                c._addAlgorithm(function (cursor, advance, resolve) {
                    var key = cursor.key;
                    while (compare(key, set[i]) > 0) {
                        // The cursor has passed beyond this key. Check next.
                        ++i;
                        if (i === set.length) {
                            // There is no next. Stop searching.
                            advance(resolve);
                            return false;
                        }
                    }
                    if (compare(key, set[i]) === 0) {
                        // The current cursor value should be included and we should continue a single step in case next item has the same key or possibly our next key in set.
                        return true;
                    }
                    else {
                        // cursor.key not yet at set[i]. Forward cursor to the next key to hunt for.
                        advance(function () { cursor.continue(set[i]); });
                        return false;
                    }
                });
                return c;
            },
            notEqual: function (value) {
                return this.inAnyRange([[minKey, value], [value, maxKey]], { includeLowers: false, includeUppers: false });
            },
            noneOf: function () {
                var set = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
                if (set.length === 0)
                    return new Collection(this); // Return entire collection.
                try {
                    set.sort(ascending);
                }
                catch (e) {
                    return fail(this, INVALID_KEY_ARGUMENT);
                }
                // Transform ["a","b","c"] to a set of ranges for between/above/below: [[minKey,"a"], ["a","b"], ["b","c"], ["c",maxKey]]
                var ranges = set.reduce(function (res, val) { return res ? res.concat([[res[res.length - 1][1], val]]) : [[minKey, val]]; }, null);
                ranges.push([set[set.length - 1], maxKey]);
                return this.inAnyRange(ranges, { includeLowers: false, includeUppers: false });
            },
            /** Filter out values withing given set of ranges.
            * Example, give children and elders a rebate of 50%:
            *
            *   db.friends.where('age').inAnyRange([[0,18],[65,Infinity]]).modify({Rebate: 1/2});
            *
            * @param {(string|number|Date|Array)[][]} ranges
            * @param {{includeLowers: boolean, includeUppers: boolean}} options
            */
            inAnyRange: function (ranges, options) {
                if (ranges.length === 0)
                    return emptyCollection(this);
                if (!ranges.every(function (range) { return range[0] !== undefined && range[1] !== undefined && ascending(range[0], range[1]) <= 0; })) {
                    return fail(this, "First argument to inAnyRange() must be an Array of two-value Arrays [lower,upper] where upper must not be lower than lower", exceptions.InvalidArgument);
                }
                var includeLowers = !options || options.includeLowers !== false; // Default to true
                var includeUppers = options && options.includeUppers === true; // Default to false
                function addRange(ranges, newRange) {
                    for (var i = 0, l = ranges.length; i < l; ++i) {
                        var range = ranges[i];
                        if (cmp(newRange[0], range[1]) < 0 && cmp(newRange[1], range[0]) > 0) {
                            range[0] = min(range[0], newRange[0]);
                            range[1] = max(range[1], newRange[1]);
                            break;
                        }
                    }
                    if (i === l)
                        ranges.push(newRange);
                    return ranges;
                }
                var sortDirection = ascending;
                function rangeSorter(a, b) { return sortDirection(a[0], b[0]); }
                // Join overlapping ranges
                var set;
                try {
                    set = ranges.reduce(addRange, []);
                    set.sort(rangeSorter);
                }
                catch (ex) {
                    return fail(this, INVALID_KEY_ARGUMENT);
                }
                var i = 0;
                var keyIsBeyondCurrentEntry = includeUppers ?
                    function (key) { return ascending(key, set[i][1]) > 0; } :
                    function (key) { return ascending(key, set[i][1]) >= 0; };
                var keyIsBeforeCurrentEntry = includeLowers ?
                    function (key) { return descending(key, set[i][0]) > 0; } :
                    function (key) { return descending(key, set[i][0]) >= 0; };
                function keyWithinCurrentRange(key) {
                    return !keyIsBeyondCurrentEntry(key) && !keyIsBeforeCurrentEntry(key);
                }
                var checkKey = keyIsBeyondCurrentEntry;
                var c = new Collection(this, function () {
                    return IDBKeyRange.bound(set[0][0], set[set.length - 1][1], !includeLowers, !includeUppers);
                });
                c._ondirectionchange = function (direction) {
                    if (direction === "next") {
                        checkKey = keyIsBeyondCurrentEntry;
                        sortDirection = ascending;
                    }
                    else {
                        checkKey = keyIsBeforeCurrentEntry;
                        sortDirection = descending;
                    }
                    set.sort(rangeSorter);
                };
                c._addAlgorithm(function (cursor, advance, resolve) {
                    var key = cursor.key;
                    while (checkKey(key)) {
                        // The cursor has passed beyond this key. Check next.
                        ++i;
                        if (i === set.length) {
                            // There is no next. Stop searching.
                            advance(resolve);
                            return false;
                        }
                    }
                    if (keyWithinCurrentRange(key)) {
                        // The current cursor value should be included and we should continue a single step in case next item has the same key or possibly our next key in set.
                        return true;
                    }
                    else if (cmp(key, set[i][1]) === 0 || cmp(key, set[i][0]) === 0) {
                        // includeUpper or includeLower is false so keyWithinCurrentRange() returns false even though we are at range border.
                        // Continue to next key but don't include this one.
                        return false;
                    }
                    else {
                        // cursor.key not yet at set[i]. Forward cursor to the next key to hunt for.
                        advance(function () {
                            if (sortDirection === ascending)
                                cursor.continue(set[i][0]);
                            else
                                cursor.continue(set[i][1]);
                        });
                        return false;
                    }
                });
                return c;
            },
            startsWithAnyOf: function () {
                var set = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
                if (!set.every(function (s) { return typeof s === 'string'; })) {
                    return fail(this, "startsWithAnyOf() only works with strings");
                }
                if (set.length === 0)
                    return emptyCollection(this);
                return this.inAnyRange(set.map(function (str) {
                    return [str, str + maxString];
                }));
            }
        };
    });
    //
    //
    //
    // Collection Class
    //
    //
    //
    function Collection(whereClause, keyRangeGenerator) {
        /// <summary>
        ///
        /// </summary>
        /// <param name="whereClause" type="WhereClause">Where clause instance</param>
        /// <param name="keyRangeGenerator" value="function(){ return IDBKeyRange.bound(0,1);}" optional="true"></param>
        var keyRange = null, error = null;
        if (keyRangeGenerator)
            try {
                keyRange = keyRangeGenerator();
            }
            catch (ex) {
                error = ex;
            }
        var whereCtx = whereClause._ctx, table = whereCtx.table;
        this._ctx = {
            table: table,
            index: whereCtx.index,
            isPrimKey: (!whereCtx.index || (table.schema.primKey.keyPath && whereCtx.index === table.schema.primKey.name)),
            range: keyRange,
            keysOnly: false,
            dir: "next",
            unique: "",
            algorithm: null,
            filter: null,
            replayFilter: null,
            justLimit: true,
            isMatch: null,
            offset: 0,
            limit: Infinity,
            error: error,
            or: whereCtx.or,
            valueMapper: table.hook.reading.fire
        };
    }
    function isPlainKeyRange(ctx, ignoreLimitFilter) {
        return !(ctx.filter || ctx.algorithm || ctx.or) &&
            (ignoreLimitFilter ? ctx.justLimit : !ctx.replayFilter);
    }
    props(Collection.prototype, function () {
        //
        // Collection Private Functions
        //
        function addFilter(ctx, fn) {
            ctx.filter = combine(ctx.filter, fn);
        }
        function addReplayFilter(ctx, factory, isLimitFilter) {
            var curr = ctx.replayFilter;
            ctx.replayFilter = curr ? function () { return combine(curr(), factory()); } : factory;
            ctx.justLimit = isLimitFilter && !curr;
        }
        function addMatchFilter(ctx, fn) {
            ctx.isMatch = combine(ctx.isMatch, fn);
        }
        /** @param ctx {
         *      isPrimKey: boolean,
         *      table: Table,
         *      index: string
         * }
         * @param store IDBObjectStore
         **/
        function getIndexOrStore(ctx, store) {
            if (ctx.isPrimKey)
                return store;
            var indexSpec = ctx.table.schema.idxByName[ctx.index];
            if (!indexSpec)
                throw new exceptions.Schema("KeyPath " + ctx.index + " on object store " + store.name + " is not indexed");
            return store.index(indexSpec.name);
        }
        /** @param ctx {
         *      isPrimKey: boolean,
         *      table: Table,
         *      index: string,
         *      keysOnly: boolean,
         *      range?: IDBKeyRange,
         *      dir: "next" | "prev"
         * }
         */
        function openCursor(ctx, store) {
            var idxOrStore = getIndexOrStore(ctx, store);
            return ctx.keysOnly && 'openKeyCursor' in idxOrStore ?
                idxOrStore.openKeyCursor(ctx.range || null, ctx.dir + ctx.unique) :
                idxOrStore.openCursor(ctx.range || null, ctx.dir + ctx.unique);
        }
        function iter(ctx, fn, resolve, reject, idbstore) {
            var filter = ctx.replayFilter ? combine(ctx.filter, ctx.replayFilter()) : ctx.filter;
            if (!ctx.or) {
                iterate(openCursor(ctx, idbstore), combine(ctx.algorithm, filter), fn, resolve, reject, !ctx.keysOnly && ctx.valueMapper);
            }
            else
                (function () {
                    var set = {};
                    var resolved = 0;
                    function resolveboth() {
                        if (++resolved === 2)
                            resolve(); // Seems like we just support or btwn max 2 expressions, but there are no limit because we do recursion.
                    }
                    function union(item, cursor, advance) {
                        if (!filter || filter(cursor, advance, resolveboth, reject)) {
                            var primaryKey = cursor.primaryKey;
                            var key = '' + primaryKey;
                            if (key === '[object ArrayBuffer]')
                                key = '' + new Uint8Array(primaryKey);
                            if (!hasOwn(set, key)) {
                                set[key] = true;
                                fn(item, cursor, advance);
                            }
                        }
                    }
                    ctx.or._iterate(union, resolveboth, reject, idbstore);
                    iterate(openCursor(ctx, idbstore), ctx.algorithm, union, resolveboth, reject, !ctx.keysOnly && ctx.valueMapper);
                })();
        }
        return {
            //
            // Collection Protected Functions
            //
            _read: function (fn, cb) {
                var ctx = this._ctx;
                return ctx.error ?
                    ctx.table._trans(null, rejection.bind(null, ctx.error)) :
                    ctx.table._idbstore(READONLY, fn).then(cb);
            },
            _write: function (fn) {
                var ctx = this._ctx;
                return ctx.error ?
                    ctx.table._trans(null, rejection.bind(null, ctx.error)) :
                    ctx.table._idbstore(READWRITE, fn, "locked"); // When doing write operations on collections, always lock the operation so that upcoming operations gets queued.
            },
            _addAlgorithm: function (fn) {
                var ctx = this._ctx;
                ctx.algorithm = combine(ctx.algorithm, fn);
            },
            _iterate: function (fn, resolve, reject, idbstore) {
                return iter(this._ctx, fn, resolve, reject, idbstore);
            },
            clone: function (props$$1) {
                var rv = Object.create(this.constructor.prototype), ctx = Object.create(this._ctx);
                if (props$$1)
                    extend(ctx, props$$1);
                rv._ctx = ctx;
                return rv;
            },
            raw: function () {
                this._ctx.valueMapper = null;
                return this;
            },
            //
            // Collection Public methods
            //
            each: function (fn) {
                var ctx = this._ctx;
                return this._read(function (resolve, reject, idbstore) {
                    iter(ctx, fn, resolve, reject, idbstore);
                });
            },
            count: function (cb) {
                var ctx = this._ctx;
                if (isPlainKeyRange(ctx, true)) {
                    // This is a plain key range. We can use the count() method if the index.
                    return this._read(function (resolve, reject, idbstore) {
                        var idx = getIndexOrStore(ctx, idbstore);
                        var req = (ctx.range ? idx.count(ctx.range) : idx.count());
                        req.onerror = eventRejectHandler(reject);
                        req.onsuccess = function (e) {
                            resolve(Math.min(e.target.result, ctx.limit));
                        };
                    }, cb);
                }
                else {
                    // Algorithms, filters or expressions are applied. Need to count manually.
                    var count = 0;
                    return this._read(function (resolve, reject, idbstore) {
                        iter(ctx, function () { ++count; return false; }, function () { resolve(count); }, reject, idbstore);
                    }, cb);
                }
            },
            sortBy: function (keyPath, cb) {
                /// <param name="keyPath" type="String"></param>
                var parts = keyPath.split('.').reverse(), lastPart = parts[0], lastIndex = parts.length - 1;
                function getval(obj, i) {
                    if (i)
                        return getval(obj[parts[i]], i - 1);
                    return obj[lastPart];
                }
                var order = this._ctx.dir === "next" ? 1 : -1;
                function sorter(a, b) {
                    var aVal = getval(a, lastIndex), bVal = getval(b, lastIndex);
                    return aVal < bVal ? -order : aVal > bVal ? order : 0;
                }
                return this.toArray(function (a) {
                    return a.sort(sorter);
                }).then(cb);
            },
            toArray: function (cb) {
                var ctx = this._ctx;
                return this._read(function (resolve, reject, idbstore) {
                    if (hasGetAll && ctx.dir === 'next' && isPlainKeyRange(ctx, true) && ctx.limit > 0) {
                        // Special optimation if we could use IDBObjectStore.getAll() or
                        // IDBKeyRange.getAll():
                        var readingHook = ctx.table.hook.reading.fire;
                        var idxOrStore = getIndexOrStore(ctx, idbstore);
                        var req = ctx.limit < Infinity ?
                            idxOrStore.getAll(ctx.range, ctx.limit) :
                            idxOrStore.getAll(ctx.range);
                        req.onerror = eventRejectHandler(reject);
                        req.onsuccess = readingHook === mirror ?
                            eventSuccessHandler(resolve) :
                            eventSuccessHandler(function (res) {
                                try {
                                    resolve(res.map(readingHook));
                                }
                                catch (e) {
                                    reject(e);
                                }
                            });
                    }
                    else {
                        // Getting array through a cursor.
                        var a = [];
                        iter(ctx, function (item) { a.push(item); }, function arrayComplete() {
                            resolve(a);
                        }, reject, idbstore);
                    }
                }, cb);
            },
            offset: function (offset) {
                var ctx = this._ctx;
                if (offset <= 0)
                    return this;
                ctx.offset += offset; // For count()
                if (isPlainKeyRange(ctx)) {
                    addReplayFilter(ctx, function () {
                        var offsetLeft = offset;
                        return function (cursor, advance) {
                            if (offsetLeft === 0)
                                return true;
                            if (offsetLeft === 1) {
                                --offsetLeft;
                                return false;
                            }
                            advance(function () {
                                cursor.advance(offsetLeft);
                                offsetLeft = 0;
                            });
                            return false;
                        };
                    });
                }
                else {
                    addReplayFilter(ctx, function () {
                        var offsetLeft = offset;
                        return function () { return (--offsetLeft < 0); };
                    });
                }
                return this;
            },
            limit: function (numRows) {
                this._ctx.limit = Math.min(this._ctx.limit, numRows); // For count()
                addReplayFilter(this._ctx, function () {
                    var rowsLeft = numRows;
                    return function (cursor, advance, resolve) {
                        if (--rowsLeft <= 0)
                            advance(resolve); // Stop after this item has been included
                        return rowsLeft >= 0; // If numRows is already below 0, return false because then 0 was passed to numRows initially. Otherwise we wouldnt come here.
                    };
                }, true);
                return this;
            },
            until: function (filterFunction, bIncludeStopEntry) {
                addFilter(this._ctx, function (cursor, advance, resolve) {
                    if (filterFunction(cursor.value)) {
                        advance(resolve);
                        return bIncludeStopEntry;
                    }
                    else {
                        return true;
                    }
                });
                return this;
            },
            first: function (cb) {
                return this.limit(1).toArray(function (a) { return a[0]; }).then(cb);
            },
            last: function (cb) {
                return this.reverse().first(cb);
            },
            filter: function (filterFunction) {
                /// <param name="jsFunctionFilter" type="Function">function(val){return true/false}</param>
                addFilter(this._ctx, function (cursor) {
                    return filterFunction(cursor.value);
                });
                // match filters not used in Dexie.js but can be used by 3rd part libraries to test a
                // collection for a match without querying DB. Used by Dexie.Observable.
                addMatchFilter(this._ctx, filterFunction);
                return this;
            },
            and: function (filterFunction) {
                return this.filter(filterFunction);
            },
            or: function (indexName) {
                return new WhereClause(this._ctx.table, indexName, this);
            },
            reverse: function () {
                this._ctx.dir = (this._ctx.dir === "prev" ? "next" : "prev");
                if (this._ondirectionchange)
                    this._ondirectionchange(this._ctx.dir);
                return this;
            },
            desc: function () {
                return this.reverse();
            },
            eachKey: function (cb) {
                var ctx = this._ctx;
                ctx.keysOnly = !ctx.isMatch;
                return this.each(function (val, cursor) { cb(cursor.key, cursor); });
            },
            eachUniqueKey: function (cb) {
                this._ctx.unique = "unique";
                return this.eachKey(cb);
            },
            eachPrimaryKey: function (cb) {
                var ctx = this._ctx;
                ctx.keysOnly = !ctx.isMatch;
                return this.each(function (val, cursor) { cb(cursor.primaryKey, cursor); });
            },
            keys: function (cb) {
                var ctx = this._ctx;
                ctx.keysOnly = !ctx.isMatch;
                var a = [];
                return this.each(function (item, cursor) {
                    a.push(cursor.key);
                }).then(function () {
                    return a;
                }).then(cb);
            },
            primaryKeys: function (cb) {
                var ctx = this._ctx;
                if (hasGetAll && ctx.dir === 'next' && isPlainKeyRange(ctx, true) && ctx.limit > 0) {
                    // Special optimation if we could use IDBObjectStore.getAllKeys() or
                    // IDBKeyRange.getAllKeys():
                    return this._read(function (resolve, reject, idbstore) {
                        var idxOrStore = getIndexOrStore(ctx, idbstore);
                        var req = ctx.limit < Infinity ?
                            idxOrStore.getAllKeys(ctx.range, ctx.limit) :
                            idxOrStore.getAllKeys(ctx.range);
                        req.onerror = eventRejectHandler(reject);
                        req.onsuccess = eventSuccessHandler(resolve);
                    }).then(cb);
                }
                ctx.keysOnly = !ctx.isMatch;
                var a = [];
                return this.each(function (item, cursor) {
                    a.push(cursor.primaryKey);
                }).then(function () {
                    return a;
                }).then(cb);
            },
            uniqueKeys: function (cb) {
                this._ctx.unique = "unique";
                return this.keys(cb);
            },
            firstKey: function (cb) {
                return this.limit(1).keys(function (a) { return a[0]; }).then(cb);
            },
            lastKey: function (cb) {
                return this.reverse().firstKey(cb);
            },
            distinct: function () {
                var ctx = this._ctx, idx = ctx.index && ctx.table.schema.idxByName[ctx.index];
                if (!idx || !idx.multi)
                    return this; // distinct() only makes differencies on multiEntry indexes.
                var set = {};
                addFilter(this._ctx, function (cursor) {
                    var strKey = cursor.primaryKey.toString(); // Converts any Date to String, String to String, Number to String and Array to comma-separated string
                    var found = hasOwn(set, strKey);
                    set[strKey] = true;
                    return !found;
                });
                return this;
            },
            //
            // Methods that mutate storage
            //
            modify: function (changes) {
                var self = this, ctx = this._ctx, hook = ctx.table.hook, updatingHook = hook.updating.fire, deletingHook = hook.deleting.fire;
                return this._write(function (resolve, reject, idbstore, trans) {
                    var modifyer;
                    if (typeof changes === 'function') {
                        // Changes is a function that may update, add or delete propterties or even require a deletion the object itself (delete this.item)
                        if (updatingHook === nop && deletingHook === nop) {
                            // Noone cares about what is being changed. Just let the modifier function be the given argument as is.
                            modifyer = changes;
                        }
                        else {
                            // People want to know exactly what is being modified or deleted.
                            // Let modifyer be a proxy function that finds out what changes the caller is actually doing
                            // and call the hooks accordingly!
                            modifyer = function (item) {
                                var origItem = deepClone(item); // Clone the item first so we can compare laters.
                                if (changes.call(this, item, this) === false)
                                    return false; // Call the real modifyer function (If it returns false explicitely, it means it dont want to modify anyting on this object)
                                if (!hasOwn(this, "value")) {
                                    // The real modifyer function requests a deletion of the object. Inform the deletingHook that a deletion is taking place.
                                    deletingHook.call(this, this.primKey, item, trans);
                                }
                                else {
                                    // No deletion. Check what was changed
                                    var objectDiff = getObjectDiff(origItem, this.value);
                                    var additionalChanges = updatingHook.call(this, objectDiff, this.primKey, origItem, trans);
                                    if (additionalChanges) {
                                        // Hook want to apply additional modifications. Make sure to fullfill the will of the hook.
                                        item = this.value;
                                        keys(additionalChanges).forEach(function (keyPath) {
                                            setByKeyPath(item, keyPath, additionalChanges[keyPath]); // Adding {keyPath: undefined} means that the keyPath should be deleted. Handled by setByKeyPath
                                        });
                                    }
                                }
                            };
                        }
                    }
                    else if (updatingHook === nop) {
                        // changes is a set of {keyPath: value} and no one is listening to the updating hook.
                        var keyPaths = keys(changes);
                        var numKeys = keyPaths.length;
                        modifyer = function (item) {
                            var anythingModified = false;
                            for (var i = 0; i < numKeys; ++i) {
                                var keyPath = keyPaths[i], val = changes[keyPath];
                                if (getByKeyPath(item, keyPath) !== val) {
                                    setByKeyPath(item, keyPath, val); // Adding {keyPath: undefined} means that the keyPath should be deleted. Handled by setByKeyPath
                                    anythingModified = true;
                                }
                            }
                            return anythingModified;
                        };
                    }
                    else {
                        // changes is a set of {keyPath: value} and people are listening to the updating hook so we need to call it and
                        // allow it to add additional modifications to make.
                        var origChanges = changes;
                        changes = shallowClone(origChanges); // Let's work with a clone of the changes keyPath/value set so that we can restore it in case a hook extends it.
                        modifyer = function (item) {
                            var anythingModified = false;
                            var additionalChanges = updatingHook.call(this, changes, this.primKey, deepClone(item), trans);
                            if (additionalChanges)
                                extend(changes, additionalChanges);
                            keys(changes).forEach(function (keyPath) {
                                var val = changes[keyPath];
                                if (getByKeyPath(item, keyPath) !== val) {
                                    setByKeyPath(item, keyPath, val);
                                    anythingModified = true;
                                }
                            });
                            if (additionalChanges)
                                changes = shallowClone(origChanges); // Restore original changes for next iteration
                            return anythingModified;
                        };
                    }
                    var count = 0;
                    var successCount = 0;
                    var iterationComplete = false;
                    var failures = [];
                    var failKeys = [];
                    var currentKey = null;
                    function modifyItem(item, cursor) {
                        currentKey = cursor.primaryKey;
                        var thisContext = {
                            primKey: cursor.primaryKey,
                            value: item,
                            onsuccess: null,
                            onerror: null
                        };
                        function onerror(e) {
                            failures.push(e);
                            failKeys.push(thisContext.primKey);
                            checkFinished();
                            return true; // Catch these errors and let a final rejection decide whether or not to abort entire transaction
                        }
                        if (modifyer.call(thisContext, item, thisContext) !== false) {
                            var bDelete = !hasOwn(thisContext, "value");
                            ++count;
                            tryCatch(function () {
                                var req = (bDelete ? cursor.delete() : cursor.update(thisContext.value));
                                req._hookCtx = thisContext;
                                req.onerror = hookedEventRejectHandler(onerror);
                                req.onsuccess = hookedEventSuccessHandler(function () {
                                    ++successCount;
                                    checkFinished();
                                });
                            }, onerror);
                        }
                        else if (thisContext.onsuccess) {
                            // Hook will expect either onerror or onsuccess to always be called!
                            thisContext.onsuccess(thisContext.value);
                        }
                    }
                    function doReject(e) {
                        if (e) {
                            failures.push(e);
                            failKeys.push(currentKey);
                        }
                        return reject(new ModifyError("Error modifying one or more objects", failures, successCount, failKeys));
                    }
                    function checkFinished() {
                        if (iterationComplete && successCount + failures.length === count) {
                            if (failures.length > 0)
                                doReject();
                            else
                                resolve(successCount);
                        }
                    }
                    self.clone().raw()._iterate(modifyItem, function () {
                        iterationComplete = true;
                        checkFinished();
                    }, doReject, idbstore);
                });
            },
            'delete': function () {
                var _this = this;
                var ctx = this._ctx, range = ctx.range, deletingHook = ctx.table.hook.deleting.fire, hasDeleteHook = deletingHook !== nop;
                if (!hasDeleteHook &&
                    isPlainKeyRange(ctx) &&
                    ((ctx.isPrimKey && !hangsOnDeleteLargeKeyRange) || !range)) {
                    // May use IDBObjectStore.delete(IDBKeyRange) in this case (Issue #208)
                    // For chromium, this is the way most optimized version.
                    // For IE/Edge, this could hang the indexedDB engine and make operating system instable
                    // (https://gist.github.com/dfahlander/5a39328f029de18222cf2125d56c38f7)
                    return this._write(function (resolve, reject, idbstore) {
                        // Our API contract is to return a count of deleted items, so we have to count() before delete().
                        var onerror = eventRejectHandler(reject), countReq = (range ? idbstore.count(range) : idbstore.count());
                        countReq.onerror = onerror;
                        countReq.onsuccess = function () {
                            var count = countReq.result;
                            tryCatch(function () {
                                var delReq = (range ? idbstore.delete(range) : idbstore.clear());
                                delReq.onerror = onerror;
                                delReq.onsuccess = function () { return resolve(count); };
                            }, function (err) { return reject(err); });
                        };
                    });
                }
                // Default version to use when collection is not a vanilla IDBKeyRange on the primary key.
                // Divide into chunks to not starve RAM.
                // If has delete hook, we will have to collect not just keys but also objects, so it will use
                // more memory and need lower chunk size.
                var CHUNKSIZE = hasDeleteHook ? 2000 : 10000;
                return this._write(function (resolve, reject, idbstore, trans) {
                    var totalCount = 0;
                    // Clone collection and change its table and set a limit of CHUNKSIZE on the cloned Collection instance.
                    var collection = _this
                        .clone({
                        keysOnly: !ctx.isMatch && !hasDeleteHook
                    }) // load just keys (unless filter() or and() or deleteHook has subscribers)
                        .distinct() // In case multiEntry is used, never delete same key twice because resulting count
                        .limit(CHUNKSIZE)
                        .raw(); // Don't filter through reading-hooks (like mapped classes etc)
                    var keysOrTuples = [];
                    // We're gonna do things on as many chunks that are needed.
                    // Use recursion of nextChunk function:
                    var nextChunk = function () { return collection.each(hasDeleteHook ? function (val, cursor) {
                        // Somebody subscribes to hook('deleting'). Collect all primary keys and their values,
                        // so that the hook can be called with its values in bulkDelete().
                        keysOrTuples.push([cursor.primaryKey, cursor.value]);
                    } : function (val, cursor) {
                        // No one subscribes to hook('deleting'). Collect only primary keys:
                        keysOrTuples.push(cursor.primaryKey);
                    }).then(function () {
                        // Chromium deletes faster when doing it in sort order.
                        hasDeleteHook ?
                            keysOrTuples.sort(function (a, b) { return ascending(a[0], b[0]); }) :
                            keysOrTuples.sort(ascending);
                        return bulkDelete(idbstore, trans, keysOrTuples, hasDeleteHook, deletingHook);
                    }).then(function () {
                        var count = keysOrTuples.length;
                        totalCount += count;
                        keysOrTuples = [];
                        return count < CHUNKSIZE ? totalCount : nextChunk();
                    }); };
                    resolve(nextChunk());
                });
            }
        };
    });
    //
    //
    //
    // ------------------------- Help functions ---------------------------
    //
    //
    //
    function lowerVersionFirst(a, b) {
        return a._cfg.version - b._cfg.version;
    }
    function setApiOnPlace(objs, tableNames, dbschema) {
        tableNames.forEach(function (tableName) {
            var schema = dbschema[tableName];
            objs.forEach(function (obj) {
                if (!(tableName in obj)) {
                    if (obj === Transaction.prototype || obj instanceof Transaction) {
                        // obj is a Transaction prototype (or prototype of a subclass to Transaction)
                        // Make the API a getter that returns this.table(tableName)
                        setProp(obj, tableName, { get: function () { return this.table(tableName); } });
                    }
                    else {
                        // Table will not be bound to a transaction (will use Dexie.currentTransaction)
                        obj[tableName] = new Table(tableName, schema);
                    }
                }
            });
        });
    }
    function removeTablesApi(objs) {
        objs.forEach(function (obj) {
            for (var key in obj) {
                if (obj[key] instanceof Table)
                    delete obj[key];
            }
        });
    }
    function iterate(req, filter, fn, resolve, reject, valueMapper) {
        // Apply valueMapper (hook('reading') or mappped class)
        var mappedFn = valueMapper ? function (x, c, a) { return fn(valueMapper(x), c, a); } : fn;
        // Wrap fn with PSD and microtick stuff from Promise.
        var wrappedFn = wrap(mappedFn, reject);
        if (!req.onerror)
            req.onerror = eventRejectHandler(reject);
        if (filter) {
            req.onsuccess = trycatcher(function filter_record() {
                var cursor = req.result;
                if (cursor) {
                    var c = function () { cursor.continue(); };
                    if (filter(cursor, function (advancer) { c = advancer; }, resolve, reject))
                        wrappedFn(cursor.value, cursor, function (advancer) { c = advancer; });
                    c();
                }
                else {
                    resolve();
                }
            }, reject);
        }
        else {
            req.onsuccess = trycatcher(function filter_record() {
                var cursor = req.result;
                if (cursor) {
                    var c = function () { cursor.continue(); };
                    wrappedFn(cursor.value, cursor, function (advancer) { c = advancer; });
                    c();
                }
                else {
                    resolve();
                }
            }, reject);
        }
    }
    function parseIndexSyntax(indexes) {
        /// <param name="indexes" type="String"></param>
        /// <returns type="Array" elementType="IndexSpec"></returns>
        var rv = [];
        indexes.split(',').forEach(function (index) {
            index = index.trim();
            var name = index.replace(/([&*]|\+\+)/g, ""); // Remove "&", "++" and "*"
            // Let keyPath of "[a+b]" be ["a","b"]:
            var keyPath = /^\[/.test(name) ? name.match(/^\[(.*)\]$/)[1].split('+') : name;
            rv.push(new IndexSpec(name, keyPath || null, /\&/.test(index), /\*/.test(index), /\+\+/.test(index), isArray(keyPath), /\./.test(index)));
        });
        return rv;
    }
    function cmp(key1, key2) {
        return indexedDB.cmp(key1, key2);
    }
    function min(a, b) {
        return cmp(a, b) < 0 ? a : b;
    }
    function max(a, b) {
        return cmp(a, b) > 0 ? a : b;
    }
    function ascending(a, b) {
        return indexedDB.cmp(a, b);
    }
    function descending(a, b) {
        return indexedDB.cmp(b, a);
    }
    function simpleCompare(a, b) {
        return a < b ? -1 : a === b ? 0 : 1;
    }
    function simpleCompareReverse(a, b) {
        return a > b ? -1 : a === b ? 0 : 1;
    }
    function combine(filter1, filter2) {
        return filter1 ?
            filter2 ?
                function () { return filter1.apply(this, arguments) && filter2.apply(this, arguments); } :
                filter1 :
            filter2;
    }
    function readGlobalSchema() {
        db.verno = idbdb.version / 10;
        db._dbSchema = globalSchema = {};
        dbStoreNames = slice(idbdb.objectStoreNames, 0);
        if (dbStoreNames.length === 0)
            return; // Database contains no stores.
        var trans = idbdb.transaction(safariMultiStoreFix(dbStoreNames), 'readonly');
        dbStoreNames.forEach(function (storeName) {
            var store = trans.objectStore(storeName), keyPath = store.keyPath, dotted = keyPath && typeof keyPath === 'string' && keyPath.indexOf('.') !== -1;
            var primKey = new IndexSpec(keyPath, keyPath || "", false, false, !!store.autoIncrement, keyPath && typeof keyPath !== 'string', dotted);
            var indexes = [];
            for (var j = 0; j < store.indexNames.length; ++j) {
                var idbindex = store.index(store.indexNames[j]);
                keyPath = idbindex.keyPath;
                dotted = keyPath && typeof keyPath === 'string' && keyPath.indexOf('.') !== -1;
                var index = new IndexSpec(idbindex.name, keyPath, !!idbindex.unique, !!idbindex.multiEntry, false, keyPath && typeof keyPath !== 'string', dotted);
                indexes.push(index);
            }
            globalSchema[storeName] = new TableSchema(storeName, primKey, indexes, {});
        });
        setApiOnPlace([allTables], keys(globalSchema), globalSchema);
    }
    function adjustToExistingIndexNames(schema, idbtrans) {
        /// <summary>
        /// Issue #30 Problem with existing db - adjust to existing index names when migrating from non-dexie db
        /// </summary>
        /// <param name="schema" type="Object">Map between name and TableSchema</param>
        /// <param name="idbtrans" type="IDBTransaction"></param>
        var storeNames = idbtrans.db.objectStoreNames;
        for (var i = 0; i < storeNames.length; ++i) {
            var storeName = storeNames[i];
            var store = idbtrans.objectStore(storeName);
            hasGetAll = 'getAll' in store;
            for (var j = 0; j < store.indexNames.length; ++j) {
                var indexName = store.indexNames[j];
                var keyPath = store.index(indexName).keyPath;
                var dexieName = typeof keyPath === 'string' ? keyPath : "[" + slice(keyPath).join('+') + "]";
                if (schema[storeName]) {
                    var indexSpec = schema[storeName].idxByName[dexieName];
                    if (indexSpec)
                        indexSpec.name = indexName;
                }
            }
        }
        // Bug with getAll() on Safari ver<604 on Workers only, see discussion following PR #579
        if (/Safari/.test(navigator.userAgent) &&
            !/(Chrome\/|Edge\/)/.test(navigator.userAgent) &&
            _global.WorkerGlobalScope && _global instanceof _global.WorkerGlobalScope &&
            [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604) {
            hasGetAll = false;
        }
    }
    function fireOnBlocked(ev) {
        db.on("blocked").fire(ev);
        // Workaround (not fully*) for missing "versionchange" event in IE,Edge and Safari:
        connections
            .filter(function (c) { return c.name === db.name && c !== db && !c._vcFired; })
            .map(function (c) { return c.on("versionchange").fire(ev); });
    }
    extend(this, {
        Collection: Collection,
        Table: Table,
        Transaction: Transaction,
        Version: Version,
        WhereClause: WhereClause
    });
    init();
    addons.forEach(function (fn) {
        fn(db);
    });
}
function parseType(type) {
    if (typeof type === 'function') {
        return new type();
    }
    else if (isArray(type)) {
        return [parseType(type[0])];
    }
    else if (type && typeof type === 'object') {
        var rv = {};
        applyStructure(rv, type);
        return rv;
    }
    else {
        return type;
    }
}
function applyStructure(obj, structure) {
    keys(structure).forEach(function (member) {
        var value = parseType(structure[member]);
        obj[member] = value;
    });
    return obj;
}
function hookedEventSuccessHandler(resolve) {
    // wrap() is needed when calling hooks because the rare scenario of:
    //  * hook does a db operation that fails immediately (IDB throws exception)
    //    For calling db operations on correct transaction, wrap makes sure to set PSD correctly.
    //    wrap() will also execute in a virtual tick.
    //  * If not wrapped in a virtual tick, direct exception will launch a new physical tick.
    //  * If this was the last event in the bulk, the promise will resolve after a physical tick
    //    and the transaction will have committed already.
    // If no hook, the virtual tick will be executed in the reject()/resolve of the final promise,
    // because it is always marked with _lib = true when created using Transaction._promise().
    return wrap(function (event) {
        var req = event.target, ctx = req._hookCtx, // Contains the hook error handler. Put here instead of closure to boost performance.
        result = ctx.value || req.result, // Pass the object value on updates. The result from IDB is the primary key.
        hookSuccessHandler = ctx && ctx.onsuccess;
        hookSuccessHandler && hookSuccessHandler(result);
        resolve && resolve(result);
    }, resolve);
}
function eventRejectHandler(reject) {
    return wrap(function (event) {
        preventDefault(event);
        reject(event.target.error);
        return false;
    });
}
function eventSuccessHandler(resolve) {
    return wrap(function (event) {
        resolve(event.target.result);
    });
}
function hookedEventRejectHandler(reject) {
    return wrap(function (event) {
        // See comment on hookedEventSuccessHandler() why wrap() is needed only when supporting hooks.
        var req = event.target, err = req.error, ctx = req._hookCtx, // Contains the hook error handler. Put here instead of closure to boost performance.
        hookErrorHandler = ctx && ctx.onerror;
        hookErrorHandler && hookErrorHandler(err);
        preventDefault(event);
        reject(err);
        return false;
    });
}
function preventDefault(event) {
    if (event.stopPropagation)
        event.stopPropagation();
    if (event.preventDefault)
        event.preventDefault();
}
function awaitIterator(iterator) {
    var callNext = function (result) { return iterator.next(result); }, doThrow = function (error) { return iterator.throw(error); }, onSuccess = step(callNext), onError = step(doThrow);
    function step(getNext) {
        return function (val) {
            var next = getNext(val), value = next.value;
            return next.done ? value :
                (!value || typeof value.then !== 'function' ?
                    isArray(value) ? Promise.all(value).then(onSuccess, onError) : onSuccess(value) :
                    value.then(onSuccess, onError));
        };
    }
    return step(callNext)();
}
//
// IndexSpec struct
//
function IndexSpec(name, keyPath, unique, multi, auto, compound, dotted) {
    /// <param name="name" type="String"></param>
    /// <param name="keyPath" type="String"></param>
    /// <param name="unique" type="Boolean"></param>
    /// <param name="multi" type="Boolean"></param>
    /// <param name="auto" type="Boolean"></param>
    /// <param name="compound" type="Boolean"></param>
    /// <param name="dotted" type="Boolean"></param>
    this.name = name;
    this.keyPath = keyPath;
    this.unique = unique;
    this.multi = multi;
    this.auto = auto;
    this.compound = compound;
    this.dotted = dotted;
    var keyPathSrc = typeof keyPath === 'string' ? keyPath : keyPath && ('[' + [].join.call(keyPath, '+') + ']');
    this.src = (unique ? '&' : '') + (multi ? '*' : '') + (auto ? "++" : "") + keyPathSrc;
}
//
// TableSchema struct
//
function TableSchema(name, primKey, indexes, instanceTemplate) {
    /// <param name="name" type="String"></param>
    /// <param name="primKey" type="IndexSpec"></param>
    /// <param name="indexes" type="Array" elementType="IndexSpec"></param>
    /// <param name="instanceTemplate" type="Object"></param>
    this.name = name;
    this.primKey = primKey || new IndexSpec();
    this.indexes = indexes || [new IndexSpec()];
    this.instanceTemplate = instanceTemplate;
    this.mappedClass = null;
    this.idxByName = arrayToObject(indexes, function (index) { return [index.name, index]; });
}
function safariMultiStoreFix(storeNames) {
    return storeNames.length === 1 ? storeNames[0] : storeNames;
}
function getNativeGetDatabaseNamesFn(indexedDB) {
    var fn = indexedDB && (indexedDB.getDatabaseNames || indexedDB.webkitGetDatabaseNames);
    return fn && fn.bind(indexedDB);
}
// Export Error classes
props(Dexie, fullNameExceptions); // Dexie.XXXError = class XXXError {...};
//
// Static methods and properties
// 
props(Dexie, {
    //
    // Static delete() method.
    //
    delete: function (databaseName) {
        var db = new Dexie(databaseName), promise = db.delete();
        promise.onblocked = function (fn) {
            db.on("blocked", fn);
            return this;
        };
        return promise;
    },
    //
    // Static exists() method.
    //
    exists: function (name) {
        return new Dexie(name).open().then(function (db) {
            db.close();
            return true;
        }).catch(Dexie.NoSuchDatabaseError, function () { return false; });
    },
    //
    // Static method for retrieving a list of all existing databases at current host.
    //
    getDatabaseNames: function (cb) {
        var getDatabaseNames = getNativeGetDatabaseNamesFn(Dexie.dependencies.indexedDB);
        return getDatabaseNames ? new Promise(function (resolve, reject) {
            var req = getDatabaseNames();
            req.onsuccess = function (event) {
                resolve(slice(event.target.result, 0)); // Converst DOMStringList to Array<String>
            };
            req.onerror = eventRejectHandler(reject);
        }).then(cb) : dbNamesDB.dbnames.toCollection().primaryKeys(cb);
    },
    defineClass: function () {
        // Default constructor able to copy given properties into this object.
        function Class(properties) {
            /// <param name="properties" type="Object" optional="true">Properties to initialize object with.
            /// </param>
            if (properties)
                extend(this, properties);
        }
        return Class;
    },
    applyStructure: applyStructure,
    ignoreTransaction: function (scopeFunc) {
        // In case caller is within a transaction but needs to create a separate transaction.
        // Example of usage:
        //
        // Let's say we have a logger function in our app. Other application-logic should be unaware of the
        // logger function and not need to include the 'logentries' table in all transaction it performs.
        // The logging should always be done in a separate transaction and not be dependant on the current
        // running transaction context. Then you could use Dexie.ignoreTransaction() to run code that starts a new transaction.
        //
        //     Dexie.ignoreTransaction(function() {
        //         db.logentries.add(newLogEntry);
        //     });
        //
        // Unless using Dexie.ignoreTransaction(), the above example would try to reuse the current transaction
        // in current Promise-scope.
        //
        // An alternative to Dexie.ignoreTransaction() would be setImmediate() or setTimeout(). The reason we still provide an
        // API for this because
        //  1) The intention of writing the statement could be unclear if using setImmediate() or setTimeout().
        //  2) setTimeout() would wait unnescessary until firing. This is however not the case with setImmediate().
        //  3) setImmediate() is not supported in the ES standard.
        //  4) You might want to keep other PSD state that was set in a parent PSD, such as PSD.letThrough.
        return PSD.trans ?
            usePSD(PSD.transless, scopeFunc) : // Use the closest parent that was non-transactional.
            scopeFunc(); // No need to change scope because there is no ongoing transaction.
    },
    vip: function (fn) {
        // To be used by subscribers to the on('ready') event.
        // This will let caller through to access DB even when it is blocked while the db.ready() subscribers are firing.
        // This would have worked automatically if we were certain that the Provider was using Dexie.Promise for all asyncronic operations. The promise PSD
        // from the provider.connect() call would then be derived all the way to when provider would call localDatabase.applyChanges(). But since
        // the provider more likely is using non-promise async APIs or other thenable implementations, we cannot assume that.
        // Note that this method is only useful for on('ready') subscribers that is returning a Promise from the event. If not using vip()
        // the database could deadlock since it wont open until the returned Promise is resolved, and any non-VIPed operation started by
        // the caller will not resolve until database is opened.
        return newScope(function () {
            PSD.letThrough = true; // Make sure we are let through if still blocking db due to onready is firing.
            return fn();
        });
    },
    async: function (generatorFn) {
        return function () {
            try {
                var rv = awaitIterator(generatorFn.apply(this, arguments));
                if (!rv || typeof rv.then !== 'function')
                    return Promise.resolve(rv);
                return rv;
            }
            catch (e) {
                return rejection(e);
            }
        };
    },
    spawn: function (generatorFn, args, thiz) {
        try {
            var rv = awaitIterator(generatorFn.apply(thiz, args || []));
            if (!rv || typeof rv.then !== 'function')
                return Promise.resolve(rv);
            return rv;
        }
        catch (e) {
            return rejection(e);
        }
    },
    // Dexie.currentTransaction property
    currentTransaction: {
        get: function () { return PSD.trans || null; }
    },
    waitFor: function (promiseOrFunction, optionalTimeout) {
        // If a function is provided, invoke it and pass the returning value to Transaction.waitFor()
        var promise = Promise.resolve(typeof promiseOrFunction === 'function' ? Dexie.ignoreTransaction(promiseOrFunction) : promiseOrFunction)
            .timeout(optionalTimeout || 60000); // Default the timeout to one minute. Caller may specify Infinity if required.       
        // Run given promise on current transaction. If no current transaction, just return a Dexie promise based
        // on given value.
        return PSD.trans ? PSD.trans.waitFor(promise) : promise;
    },
    // Export our Promise implementation since it can be handy as a standalone Promise implementation
    Promise: Promise,
    // Dexie.debug proptery:
    // Dexie.debug = false
    // Dexie.debug = true
    // Dexie.debug = "dexie" - don't hide dexie's stack frames.
    debug: {
        get: function () { return debug; },
        set: function (value) {
            setDebug(value, value === 'dexie' ? function () { return true; } : dexieStackFrameFilter);
        }
    },
    // Export our derive/extend/override methodology
    derive: derive,
    extend: extend,
    props: props,
    override: override,
    // Export our Events() function - can be handy as a toolkit
    Events: Events,
    // Utilities
    getByKeyPath: getByKeyPath,
    setByKeyPath: setByKeyPath,
    delByKeyPath: delByKeyPath,
    shallowClone: shallowClone,
    deepClone: deepClone,
    getObjectDiff: getObjectDiff,
    asap: asap,
    maxKey: maxKey,
    minKey: minKey,
    // Addon registry
    addons: [],
    // Global DB connection list
    connections: connections,
    MultiModifyError: exceptions.Modify,
    errnames: errnames,
    // Export other static classes
    IndexSpec: IndexSpec,
    TableSchema: TableSchema,
    //
    // Dependencies
    //
    // These will automatically work in browsers with indexedDB support, or where an indexedDB polyfill has been included.
    //
    // In node.js, however, these properties must be set "manually" before instansiating a new Dexie().
    // For node.js, you need to require indexeddb-js or similar and then set these deps.
    //
    dependencies: (function () {
        try {
            return {
                // Required:
                indexedDB: _global.indexedDB || _global.mozIndexedDB || _global.webkitIndexedDB || _global.msIndexedDB,
                IDBKeyRange: _global.IDBKeyRange || _global.webkitIDBKeyRange
            };
        }
        catch (e) {
            return {
                indexedDB: null,
                IDBKeyRange: null
            };
        }
    })(),
    // API Version Number: Type Number, make sure to always set a version number that can be comparable correctly. Example: 0.9, 0.91, 0.92, 1.0, 1.01, 1.1, 1.2, 1.21, etc.
    semVer: DEXIE_VERSION,
    version: DEXIE_VERSION.split('.')
        .map(function (n) { return parseInt(n); })
        .reduce(function (p, c, i) { return p + (c / Math.pow(10, i * 2)); }),
    // https://github.com/dfahlander/Dexie.js/issues/186
    // typescript compiler tsc in mode ts-->es5 & commonJS, will expect require() to return
    // x.default. Workaround: Set Dexie.default = Dexie.
    default: Dexie,
    // Make it possible to import {Dexie} (non-default import)
    // Reason 1: May switch to that in future.
    // Reason 2: We declare it both default and named exported in d.ts to make it possible
    // to let addons extend the Dexie interface with Typescript 2.1 (works only when explicitely
    // exporting the symbol, not just default exporting)
    Dexie: Dexie
});
// Map DOMErrors and DOMExceptions to corresponding Dexie errors. May change in Dexie v2.0.
Promise.rejectionMapper = mapError;
// Initialize dbNamesDB (won't ever be opened on chromium browsers')
dbNamesDB = new Dexie('__dbnames');
dbNamesDB.version(1).stores({ dbnames: 'name' });
(function () {
    // Migrate from Dexie 1.x database names stored in localStorage:
    var DBNAMES = 'Dexie.DatabaseNames';
    try {
        if (typeof localStorage !== undefined && _global.document !== undefined) {
            // Have localStorage and is not executing in a worker. Lets migrate from Dexie 1.x.
            JSON.parse(localStorage.getItem(DBNAMES) || "[]")
                .forEach(function (name) { return dbNamesDB.dbnames.put({ name: name }).catch(nop); });
            localStorage.removeItem(DBNAMES);
        }
    }
    catch (_e) { }
})();

return Dexie;

})));


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("timers").setImmediate)
},{"timers":16}],10:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],11:[function(require,module,exports){
var JSBloom = {};

JSBloom.filter = function(items, target_prob) {

    if (typeof items !== "number" || typeof target_prob !== "number" || target_prob >= 1) {
        throw Error("Usage: new JSBloom.filter(items, target_probability)");
    };

    var BUFFER_LEN      = (function() {
            var buffer = Math.ceil((items * Math.log(target_prob)) / Math.log(1.0 / (Math.pow(2.0, Math.log(2.0)))));

            if ((buffer % 8) !== 0) {
                buffer += 8 - (buffer % 8);
            };

            return buffer;
        })(),
        HASH_ROUNDS     = Math.round(Math.log(2.0) * BUFFER_LEN / items),
        bVector         = new Uint8Array(BUFFER_LEN/8);

    hashes = {
        djb2: function(str) {
            var hash = 5381;

            for (var len = str.length, count = 0; count < len; count++) {
                hash = hash * 33 ^ str.charCodeAt(count);   
            };

            return (hash >>> 0) % BUFFER_LEN;
        },
        sdbm: function(str) {
            var hash = 0;

            for (var len = str.length, count = 0; count < len; count++) {
                hash = str.charCodeAt(count) + (hash << 6) + (hash << 16) - hash;
            };

            return (hash >>> 0) % BUFFER_LEN;
        }
    }

    addEntry = function(str) {

        var h1 = hashes.djb2(str)
        var h2 = hashes.sdbm(str)
        var added = false
        for (var round = 0; round <= HASH_ROUNDS; round++) {
            var new_hash = round == 0 ? h1
                         : round == 1 ? h2
                         : (h1 + (round * h2) + (round^2)) % BUFFER_LEN;

            var extra_indices = new_hash % 8,
                index = ((new_hash - extra_indices) / 8); 

            if (extra_indices != 0 && (bVector[index] & (128 >> (extra_indices - 1))) == 0) {
                bVector[index] ^= (128 >> extra_indices - 1);
                added = true;
            } else if (extra_indices == 0 && (bVector[index] & 1) == 0) {
                bVector[index] ^= 1;
                added = true;
            }

        };

        return added;
    }

    addEntries = function(arr) {
        for (var i = arr.length - 1; i >= 0; i--) {

            addEntry(arr[i]);

        };

        return true;
    }

    checkEntry = function(str) {
        var index, extra_indices
        var h1 = hashes.djb2(str)

        extra_indices = h1 % 8;
        index = ((h1 - extra_indices) / 8);

        if (extra_indices != 0 && (bVector[index] & (128 >> (extra_indices - 1))) == 0) {
            return false;
        } else if (extra_indices == 0 && (bVector[index] & 1) == 0) {
            return false;
        }

        var h2 = hashes.sdbm(str)
        extra_indices = h2 % 8;
        index = ((h2 - extra_indices) / 8);

        if (extra_indices != 0 && (bVector[index] & (128 >> (extra_indices - 1))) == 0) {
            return false;
        } else if (extra_indices == 0 && (bVector[index] & 1) == 0) {
            return false;
        }

        for (var round = 2; round <= HASH_ROUNDS; round++) {
            var new_hash = round==0?h1:round==1?h2:(h1 + (round * h2) + (round^2)) % BUFFER_LEN;
            var extra_indices = new_hash % 8,
                index = ((new_hash - extra_indices) / 8); 

            if (extra_indices != 0 && (bVector[index] & (128 >> (extra_indices - 1))) == 0) {
                return false;
            } else if (extra_indices == 0 && (bVector[index] & 1) == 0) {
                return false;
            }
        };

        return true;
    }

    importData = function(data) {
        bVector = data
    }

    exportData = function() {
        return bVector
    }

    return {
        info: {
            type: "regular",
            buffer: BUFFER_LEN,
            hashes: HASH_ROUNDS,
            raw_buffer: bVector
        },
        hashes: hashes,
        addEntry: addEntry,
        addEntries: addEntries,
        checkEntry: checkEntry,
        importData: importData,
        exportData: exportData
    };
};

if (typeof exports !== "undefined") {
    exports.filter = JSBloom.filter;
};

},{}],12:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],13:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],14:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],15:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":13,"./encode":14}],16:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":17,"timers":16}],17:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],18:[function(require,module,exports){
'use strict';

// Load rules
var Trie = require('./lib/suffix-trie.js');
var allRules = Trie.fromJson(require('./rules.json'));

// Internals
var extractHostname = require('./lib/clean-host.js');
var getDomain = require('./lib/domain.js');
var getPublicSuffix = require('./lib/public-suffix.js');
var getSubdomain = require('./lib/subdomain.js');
var isValid = require('./lib/is-valid.js');
var tldExists = require('./lib/tld-exists.js');


// Flags representing steps in the `parse` function. They are used to implement
// a early stop mechanism (simulating some form of laziness) to avoid doing more
// work than necessary to perform a given action (e.g.: we don't need to extract
// the domain and subdomain if we are only interested in public suffix).
var TLD_EXISTS = 1;
var PUBLIC_SUFFIX = 2;
var DOMAIN = 3;
var SUB_DOMAIN = 4;
var ALL = 5;


/**
 * Creates a new instance of tldjs
 * @param  {Object.<rules,validHosts>} options [description]
 * @return {tldjs|Object}                      [description]
 */
function factory(options) {
  var rules = options.rules || allRules || {};
  var validHosts = options.validHosts || [];
  var _extractHostname = options.extractHostname || extractHostname;

  /**
   * Process a given url and extract all information. This is a higher level API
   * around private functions of `tld.js`. It allows to remove duplication (only
   * extract hostname from url once for all operations) and implement some early
   * termination mechanism to not pay the price of what we don't need (this
   * simulates laziness at a lower cost).
   *
   * @param {string} url
   * @param {number|undefined} _step - where should we stop processing
   * @return {object}
   */
  function parse(url, _step) {
    var step = _step || ALL;
    var result = {
      hostname: _extractHostname(url),
      isValid: null,
      tldExists: null,
      publicSuffix: null,
      domain: null,
      subdomain: null,
    };

    // Check if `hostname` is valid
    result.isValid = isValid(result.hostname);
    if (result.isValid === false) return result;

    // Check if tld exists
    if (step === ALL || step === TLD_EXISTS) {
      result.tldExists = tldExists(rules, result.hostname);
    }
    if (step === TLD_EXISTS) return result;

    // Extract public suffix
    result.publicSuffix = getPublicSuffix(rules, result.hostname);
    if (step === PUBLIC_SUFFIX) return result;

    // Extract domain
    result.domain = getDomain(validHosts, result.publicSuffix, result.hostname);
    if (step === DOMAIN) return result;

    // Extract subdomain
    result.subdomain = getSubdomain(result.hostname, result.domain);

    return result;
  }


  return {
    extractHostname: _extractHostname,
    isValid: isValid,
    parse: parse,
    tldExists: function (url) {
      return parse(url, TLD_EXISTS).tldExists;
    },
    getPublicSuffix: function (url) {
      return parse(url, PUBLIC_SUFFIX).publicSuffix;
    },
    getDomain: function (url) {
      return parse(url, DOMAIN).domain;
    },
    getSubdomain: function (url) {
      return parse(url, SUB_DOMAIN).subdomain;
    },
    fromUserSettings: factory
  };
}


module.exports = factory({});

},{"./lib/clean-host.js":19,"./lib/domain.js":20,"./lib/is-valid.js":22,"./lib/public-suffix.js":23,"./lib/subdomain.js":24,"./lib/suffix-trie.js":25,"./lib/tld-exists.js":26,"./rules.json":27}],19:[function(require,module,exports){

var URL = require('url');
var isValid = require('./is-valid.js');


/**
 * Utility to cleanup the base host value. Also removes url fragments.
 *
 * Works for:
 * - hostname
 * - //hostname
 * - scheme://hostname
 * - scheme+scheme://hostname
 *
 * @param {string} value
 * @return {String}
 */

// scheme      = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
var hasPrefixRE = /^(([a-z][a-z0-9+.-]*)?:)?\/\//;
var invalidHostnameChars = /[^A-Za-z0-9.-]/;

// @see https://github.com/oncletom/tld.js/issues/95
function rtrim(value) {
  if (value[value.length - 1] === '.') {
    return value.substr(0, value.length - 1);
  }
  return value;
}

module.exports = function extractHostname(value) {
  if (isValid(value)) {
    return rtrim(value);
  }

  var url = ('' + value).toLowerCase().trim();

  if (isValid(url)) {
    return rtrim(url);
  }

  // Proceed with heavier url parsing to extract the hostname.
  var parts = URL.parse(hasPrefixRE.test(url) ? url : '//' + url, null, true);

  if (parts.hostname && !invalidHostnameChars.test(parts.hostname)) {
    return rtrim(parts.hostname);
  }

  return null;
};

},{"./is-valid.js":22,"url":28}],20:[function(require,module,exports){
'use strict';


/**
 * Polyfill for `endsWith`
 *
 * @param {string} str
 * @param {string} pattern
 * @return {boolean}
 */
function endsWith(str, pattern) {
  return (
    str.lastIndexOf(pattern) === (str.length - pattern.length)
  );
}


/**
 * Check if `vhost` is a valid suffix of `hostname` (top-domain)
 *
 * It means that `vhost` needs to be a suffix of `hostname` and we then need to
 * make sure that: either they are equal, or the character preceding `vhost` in
 * `hostname` is a '.' (it should not be a partial label).
 *
 * * hostname = 'not.evil.com' and vhost = 'vil.com'      => not ok
 * * hostname = 'not.evil.com' and vhost = 'evil.com'     => ok
 * * hostname = 'not.evil.com' and vhost = 'not.evil.com' => ok
 *
 * @param {string} hostname
 * @param {string} vhost
 * @return {boolean}
 */
function shareSameDomainSuffix(hostname, vhost) {
  if (endsWith(hostname, vhost)) {
    return (
      hostname.length === vhost.length ||
      hostname[hostname.length - vhost.length - 1] === '.'
    );
  }

  return false;
}


/**
 * Given a hostname and its public suffix, extract the general domain.
 *
 *  @param {string} hostname
 *  @param {string} publicSuffix
 *  @return {string}
 */
function extractDomainWithSuffix(hostname, publicSuffix) {
  // Locate the index of the last '.' in the part of the `hostname` preceding
  // the public suffix.
  //
  // examples:
  //   1. not.evil.co.uk  => evil.co.uk
  //         ^    ^
  //         |    | start of public suffix
  //         | index of the last dot
  //
  //   2. example.co.uk   => example.co.uk
  //     ^       ^
  //     |       | start of public suffix
  //     |
  //     | (-1) no dot found before the public suffix
  var publicSuffixIndex = hostname.length - publicSuffix.length - 2;
  var lastDotBeforeSuffixIndex = hostname.lastIndexOf('.', publicSuffixIndex);

  // No '.' found, then `hostname` is the general domain (no sub-domain)
  if (lastDotBeforeSuffixIndex === -1) {
    return hostname;
  }

  // Extract the part between the last '.'
  return hostname.substr(lastDotBeforeSuffixIndex + 1);
}


/**
 * Detects the domain based on rules and upon and a host string
 *
 * @api
 * @param {string} host
 * @return {String}
 */
module.exports = function getDomain(validHosts, suffix, hostname) {
  // Check if `hostname` ends with a member of `validHosts`.
  for (var i = 0; i < validHosts.length; i += 1) {
    var vhost = validHosts[i];
    if (shareSameDomainSuffix(hostname, vhost)) {
      return vhost;
    }
  }

  // If there is no suffix, there is no hostname
  if (suffix === null) {
    return null;
  }

  // If `hostname` is a valid public suffix, then there is no domain to return.
  // Since we already know that `getPublicSuffix` returns a suffix of `hostname`
  // there is no need to perform a string comparison and we only compare the
  // size.
  if (suffix.length === hostname.length) {
    return null;
  }

  // To extract the general domain, we start by identifying the public suffix
  // (if any), then consider the domain to be the public suffix with one added
  // level of depth. (e.g.: if hostname is `not.evil.co.uk` and public suffix:
  // `co.uk`, then we take one more level: `evil`, giving the final result:
  // `evil.co.uk`).
  return extractDomainWithSuffix(hostname, suffix);
};

},{}],21:[function(require,module,exports){
"use strict";

/**
 * Utility to extract the TLD from a hostname string
 *
 * @param {string} host
 * @return {String}
 */
module.exports = function extractTldFromHost(hostname) {
  var lastDotIndex = hostname.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return null;
  }

  return hostname.substr(lastDotIndex + 1);
};

},{}],22:[function(require,module,exports){
"use strict";


/**
 * Check if the code point is a digit [0-9]
 *
 * @param {number} code
 * @return boolean
 */
function isDigit(code) {
  // 48 == '0'
  // 57 == '9'
  return code >= 48 && code <= 57;
}


/**
 * Check if the code point is a letter [a-zA-Z]
 *
 * @param {number} code
 * @return boolean
 */
function isAlpha(code) {
  // 97 === 'a'
  // 122 == 'z'
  return code >= 97 && code <= 122;
}


/**
 * Check if a hostname string is valid (according to RFC
 * It's usually a preliminary check before trying to use getDomain or anything else
 *
 * Beware: it does not check if the TLD exists.
 *
 * @api
 * @param {string} hostname
 * @return {boolean}
 */
module.exports = function isValid(hostname) {
  if (typeof hostname !== 'string') {
    return false;
  }

  if (hostname.length > 255) {
    return false;
  }

  if (hostname.length === 0) {
    return false;
  }

  // Check first character: [a-zA-Z0-9]
  var firstCharCode = hostname.charCodeAt(0);
  if (!(isAlpha(firstCharCode) || isDigit(firstCharCode))) {
    return false;
  }

  // Validate hostname according to RFC
  var lastDotIndex = -1;
  var lastCharCode;
  var code;
  var len = hostname.length;

  for (var i = 0; i < len; i += 1) {
    code = hostname.charCodeAt(i);

    if (code === 46) { // '.'
      if (
        // Check that previous label is < 63 bytes long (64 = 63 + '.')
        (i - lastDotIndex) > 64 ||
        // Check that previous character was not already a '.'
        lastCharCode === 46 ||
        // Check that the previous label does not end with a '-'
        lastCharCode === 45
      ) {
        return false;
      }

      lastDotIndex = i;
    } else if (!(isAlpha(code) || isDigit(code) || code === 45)) {
      // Check if there is a forbidden character in the label: [^a-zA-Z0-9-]
      return false;
    }

    lastCharCode = code;
  }

  return (
    // Check that last label is shorter than 63 chars
    (len - lastDotIndex - 1) <= 63 &&
    // Check that the last character is an allowed trailing label character.
    // Since we already checked that the char is a valid hostname character,
    // we only need to check that it's different from '-'.
    lastCharCode !== 45
  );
};

},{}],23:[function(require,module,exports){
'use strict';


var extractTldFromHost = require('./from-host.js');


/**
 * Returns the public suffix (including exact matches)
 *
 * @api
 * @since 1.5
 * @param {string} hostname
 * @return {string}
 */
module.exports = function getPublicSuffix(rules, hostname) {
  // First check if `hostname` is already a valid top-level Domain.
  if (rules.hasTld(hostname)) {
    return hostname;
  }

  var candidate = rules.suffixLookup(hostname);
  if (candidate === null) {
    // Prevailing rule is '*' so we consider the top-level domain to be the
    // public suffix of `hostname` (e.g.: 'example.org' => 'org').
    return extractTldFromHost(hostname);
  }

  return candidate;
};

},{"./from-host.js":21}],24:[function(require,module,exports){
'use strict';


/**
 * Returns the subdomain of a hostname string
 *
 * @api
 * @param {string} hostname
 * @param {string} domain - the root domain of the hostname
 * @return {string|null} a subdomain string if any, blank string if subdomain
 *  is empty, otherwise null.
 */
module.exports = function getSubdomain(hostname, domain) {
  // No domain found? Just abort, abort!
  if (domain === null) {
    return null;
  }

  return hostname.substr(0, hostname.length - domain.length - 1);
};

},{}],25:[function(require,module,exports){
"use strict";

var VALID_HOSTNAME_VALUE = 0;


/**
 * Return min(a, b), handling possible `null` values.
 *
 * @param {number|null} a
 * @param {number|null} b
 * @return {number|null}
 */
function minIndex(a, b) {
  if (a === null) {
    return b;
  } else if (b === null) {
    return a;
  }

  return a < b ? a : b;
}


/**
 * Insert a public suffix rule in the `trie`.
 *
 * @param {object} rule
 * @param {object} trie
 * @return {object} trie (updated)
 */
function insertInTrie(rule, trie) {
  var parts = rule.parts;
  var node = trie;

  for (var i = 0; i < parts.length; i += 1) {
    var part = parts[i];
    var nextNode = node[part];
    if (nextNode === undefined) {
      nextNode = Object.create(null);
      node[part] = nextNode;
    }

    node = nextNode;
  }

  node.$ = VALID_HOSTNAME_VALUE;

  return trie;
}


/**
 * Recursive lookup of `parts` (starting at `index`) in the tree.
 *
 * @param {array} parts
 * @param {object} trie
 * @param {number} index - when to start in `parts` (initially: length - 1)
 * @return {number} size of the suffix found (in number of parts matched)
 */
function lookupInTrie(parts, trie, index) {
  var part;
  var nextNode;
  var publicSuffixIndex = null;

  // We have a match!
  if (trie.$ !== undefined) {
    publicSuffixIndex = index + 1;
  }

  // No more `parts` to look for
  if (index === -1) {
    return publicSuffixIndex;
  }

  part = parts[index];

  // Check branch corresponding to next part of hostname
  nextNode = trie[part];
  if (nextNode !== undefined) {
    publicSuffixIndex = minIndex(
      publicSuffixIndex,
      lookupInTrie(parts, nextNode, index - 1)
    );
  }

  // Check wildcard branch
  nextNode = trie['*'];
  if (nextNode !== undefined) {
    publicSuffixIndex = minIndex(
      publicSuffixIndex,
      lookupInTrie(parts, nextNode, index - 1)
    );
  }

  return publicSuffixIndex;
}


/**
 * Contains the public suffix ruleset as a Trie for efficient look-up.
 *
 * @constructor
 */
function SuffixTrie(rules) {
  this.exceptions = Object.create(null);
  this.rules = Object.create(null);

  if (rules) {
    for (var i = 0; i < rules.length; i += 1) {
      var rule = rules[i];
      if (rule.exception) {
        insertInTrie(rule, this.exceptions);
      } else {
        insertInTrie(rule, this.rules);
      }
    }
  }
}


/**
 * Load the trie from JSON (as serialized by JSON.stringify).
 */
SuffixTrie.fromJson = function (json) {
  var trie = new SuffixTrie();

  trie.exceptions = json.exceptions;
  trie.rules = json.rules;

  return trie;
};


/**
 * Check if `value` is a valid TLD.
 */
SuffixTrie.prototype.hasTld = function (value) {
  // All TLDs are at the root of the Trie.
  return this.rules[value] !== undefined;
};


/**
 * Check if `hostname` has a valid public suffix in `trie`.
 *
 * @param {string} hostname
 * @return {string|null} public suffix
 */
SuffixTrie.prototype.suffixLookup = function (hostname) {
  var parts = hostname.split('.');

  // Look for a match in rules
  var publicSuffixIndex = lookupInTrie(
    parts,
    this.rules,
    parts.length - 1
  );

  if (publicSuffixIndex === null) {
    return null;
  }

  // Look for exceptions
  var exceptionIndex = lookupInTrie(
    parts,
    this.exceptions,
    parts.length - 1
  );

  if (exceptionIndex !== null) {
    return parts.slice(exceptionIndex + 1).join('.');
  }

  return parts.slice(publicSuffixIndex).join('.');
};


module.exports = SuffixTrie;

},{}],26:[function(require,module,exports){
'use strict';


var extractTldFromHost = require('./from-host.js');


/**
 * Checks if the TLD exists for a given hostname
 *
 * @api
 * @param {string} rules
 * @param {string} hostname
 * @return {boolean}
 */
module.exports = function tldExists(rules, hostname) {
  // Easy case, it's a TLD
  if (rules.hasTld(hostname)) {
    return true;
  }

  // Popping only the TLD of the hostname
  var hostTld = extractTldFromHost(hostname);
  if (hostTld === null) {
    return false;
  }

  return rules.hasTld(hostTld);
};

},{"./from-host.js":21}],27:[function(require,module,exports){
module.exports={"exceptions":{"ck":{"www":{"$":0}},"jp":{"kawasaki":{"city":{"$":0}},"kitakyushu":{"city":{"$":0}},"kobe":{"city":{"$":0}},"nagoya":{"city":{"$":0}},"sapporo":{"city":{"$":0}},"sendai":{"city":{"$":0}},"yokohama":{"city":{"$":0}}}},"rules":{"ac":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"net":{"$":0},"mil":{"$":0},"org":{"$":0}},"ad":{"$":0,"nom":{"$":0}},"ae":{"$":0,"co":{"$":0},"net":{"$":0},"org":{"$":0},"sch":{"$":0},"ac":{"$":0},"gov":{"$":0},"mil":{"$":0},"blogspot":{"$":0},"nom":{"$":0}},"aero":{"$":0,"accident-investigation":{"$":0},"accident-prevention":{"$":0},"aerobatic":{"$":0},"aeroclub":{"$":0},"aerodrome":{"$":0},"agents":{"$":0},"aircraft":{"$":0},"airline":{"$":0},"airport":{"$":0},"air-surveillance":{"$":0},"airtraffic":{"$":0},"air-traffic-control":{"$":0},"ambulance":{"$":0},"amusement":{"$":0},"association":{"$":0},"author":{"$":0},"ballooning":{"$":0},"broker":{"$":0},"caa":{"$":0},"cargo":{"$":0},"catering":{"$":0},"certification":{"$":0},"championship":{"$":0},"charter":{"$":0},"civilaviation":{"$":0},"club":{"$":0},"conference":{"$":0},"consultant":{"$":0},"consulting":{"$":0},"control":{"$":0},"council":{"$":0},"crew":{"$":0},"design":{"$":0},"dgca":{"$":0},"educator":{"$":0},"emergency":{"$":0},"engine":{"$":0},"engineer":{"$":0},"entertainment":{"$":0},"equipment":{"$":0},"exchange":{"$":0},"express":{"$":0},"federation":{"$":0},"flight":{"$":0},"freight":{"$":0},"fuel":{"$":0},"gliding":{"$":0},"government":{"$":0},"groundhandling":{"$":0},"group":{"$":0},"hanggliding":{"$":0},"homebuilt":{"$":0},"insurance":{"$":0},"journal":{"$":0},"journalist":{"$":0},"leasing":{"$":0},"logistics":{"$":0},"magazine":{"$":0},"maintenance":{"$":0},"media":{"$":0},"microlight":{"$":0},"modelling":{"$":0},"navigation":{"$":0},"parachuting":{"$":0},"paragliding":{"$":0},"passenger-association":{"$":0},"pilot":{"$":0},"press":{"$":0},"production":{"$":0},"recreation":{"$":0},"repbody":{"$":0},"res":{"$":0},"research":{"$":0},"rotorcraft":{"$":0},"safety":{"$":0},"scientist":{"$":0},"services":{"$":0},"show":{"$":0},"skydiving":{"$":0},"software":{"$":0},"student":{"$":0},"trader":{"$":0},"trading":{"$":0},"trainer":{"$":0},"union":{"$":0},"workinggroup":{"$":0},"works":{"$":0}},"af":{"$":0,"gov":{"$":0},"com":{"$":0},"org":{"$":0},"net":{"$":0},"edu":{"$":0}},"ag":{"$":0,"com":{"$":0},"org":{"$":0},"net":{"$":0},"co":{"$":0},"nom":{"$":0}},"ai":{"$":0,"off":{"$":0},"com":{"$":0},"net":{"$":0},"org":{"$":0},"nom":{"$":0}},"al":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"mil":{"$":0},"net":{"$":0},"org":{"$":0},"blogspot":{"$":0},"nom":{"$":0}},"am":{"$":0,"blogspot":{"$":0}},"ao":{"$":0,"ed":{"$":0},"gv":{"$":0},"og":{"$":0},"co":{"$":0},"pb":{"$":0},"it":{"$":0}},"aq":{"$":0},"ar":{"$":0,"com":{"$":0,"blogspot":{"$":0}},"edu":{"$":0},"gob":{"$":0},"gov":{"$":0},"int":{"$":0},"mil":{"$":0},"musica":{"$":0},"net":{"$":0},"org":{"$":0},"tur":{"$":0}},"arpa":{"$":0,"e164":{"$":0},"in-addr":{"$":0},"ip6":{"$":0},"iris":{"$":0},"uri":{"$":0},"urn":{"$":0}},"as":{"$":0,"gov":{"$":0}},"asia":{"$":0,"cloudns":{"$":0}},"at":{"$":0,"ac":{"$":0},"co":{"$":0,"blogspot":{"$":0}},"gv":{"$":0},"or":{"$":0},"futurecms":{"*":{"$":0}},"futurehosting":{"$":0},"futuremailing":{"$":0},"ortsinfo":{"ex":{"*":{"$":0}},"kunden":{"*":{"$":0}}},"biz":{"$":0},"info":{"$":0},"priv":{"$":0},"12hp":{"$":0},"2ix":{"$":0},"4lima":{"$":0},"lima-city":{"$":0}},"au":{"$":0,"com":{"$":0,"blogspot":{"$":0}},"net":{"$":0},"org":{"$":0},"edu":{"$":0,"act":{"$":0},"nsw":{"$":0},"nt":{"$":0},"qld":{"$":0},"sa":{"$":0},"tas":{"$":0},"vic":{"$":0},"wa":{"$":0}},"gov":{"$":0,"qld":{"$":0},"sa":{"$":0},"tas":{"$":0},"vic":{"$":0},"wa":{"$":0}},"asn":{"$":0},"id":{"$":0},"info":{"$":0},"conf":{"$":0},"oz":{"$":0},"act":{"$":0},"nsw":{"$":0},"nt":{"$":0},"qld":{"$":0},"sa":{"$":0},"tas":{"$":0},"vic":{"$":0},"wa":{"$":0}},"aw":{"$":0,"com":{"$":0}},"ax":{"$":0},"az":{"$":0,"com":{"$":0},"net":{"$":0},"int":{"$":0},"gov":{"$":0},"org":{"$":0},"edu":{"$":0},"info":{"$":0},"pp":{"$":0},"mil":{"$":0},"name":{"$":0},"pro":{"$":0},"biz":{"$":0}},"ba":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"mil":{"$":0},"net":{"$":0},"org":{"$":0},"blogspot":{"$":0}},"bb":{"$":0,"biz":{"$":0},"co":{"$":0},"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"info":{"$":0},"net":{"$":0},"org":{"$":0},"store":{"$":0},"tv":{"$":0}},"bd":{"*":{"$":0}},"be":{"$":0,"ac":{"$":0},"blogspot":{"$":0},"transurl":{"*":{"$":0}}},"bf":{"$":0,"gov":{"$":0}},"bg":{"0":{"$":0},"1":{"$":0},"2":{"$":0},"3":{"$":0},"4":{"$":0},"5":{"$":0},"6":{"$":0},"7":{"$":0},"8":{"$":0},"9":{"$":0},"$":0,"a":{"$":0},"b":{"$":0},"c":{"$":0},"d":{"$":0},"e":{"$":0},"f":{"$":0},"g":{"$":0},"h":{"$":0},"i":{"$":0},"j":{"$":0},"k":{"$":0},"l":{"$":0},"m":{"$":0},"n":{"$":0},"o":{"$":0},"p":{"$":0},"q":{"$":0},"r":{"$":0},"s":{"$":0},"t":{"$":0},"u":{"$":0},"v":{"$":0},"w":{"$":0},"x":{"$":0},"y":{"$":0},"z":{"$":0},"blogspot":{"$":0},"barsy":{"$":0}},"bh":{"$":0,"com":{"$":0},"edu":{"$":0},"net":{"$":0},"org":{"$":0},"gov":{"$":0}},"bi":{"$":0,"co":{"$":0},"com":{"$":0},"edu":{"$":0},"or":{"$":0},"org":{"$":0}},"biz":{"$":0,"cloudns":{"$":0},"dyndns":{"$":0},"for-better":{"$":0},"for-more":{"$":0},"for-some":{"$":0},"for-the":{"$":0},"selfip":{"$":0},"webhop":{"$":0},"mmafan":{"$":0},"myftp":{"$":0},"no-ip":{"$":0},"dscloud":{"$":0}},"bj":{"$":0,"asso":{"$":0},"barreau":{"$":0},"gouv":{"$":0},"blogspot":{"$":0}},"bm":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"net":{"$":0},"org":{"$":0}},"bn":{"*":{"$":0}},"bo":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"gob":{"$":0},"int":{"$":0},"org":{"$":0},"net":{"$":0},"mil":{"$":0},"tv":{"$":0}},"br":{"$":0,"adm":{"$":0},"adv":{"$":0},"agr":{"$":0},"am":{"$":0},"arq":{"$":0},"art":{"$":0},"ato":{"$":0},"b":{"$":0},"belem":{"$":0},"bio":{"$":0},"blog":{"$":0},"bmd":{"$":0},"cim":{"$":0},"cng":{"$":0},"cnt":{"$":0},"com":{"$":0,"blogspot":{"$":0}},"coop":{"$":0},"cri":{"$":0},"def":{"$":0},"ecn":{"$":0},"eco":{"$":0},"edu":{"$":0},"emp":{"$":0},"eng":{"$":0},"esp":{"$":0},"etc":{"$":0},"eti":{"$":0},"far":{"$":0},"flog":{"$":0},"floripa":{"$":0},"fm":{"$":0},"fnd":{"$":0},"fot":{"$":0},"fst":{"$":0},"g12":{"$":0},"ggf":{"$":0},"gov":{"$":0,"ac":{"$":0},"al":{"$":0},"am":{"$":0},"ap":{"$":0},"ba":{"$":0},"ce":{"$":0},"df":{"$":0},"es":{"$":0},"go":{"$":0},"ma":{"$":0},"mg":{"$":0},"ms":{"$":0},"mt":{"$":0},"pa":{"$":0},"pb":{"$":0},"pe":{"$":0},"pi":{"$":0},"pr":{"$":0},"rj":{"$":0},"rn":{"$":0},"ro":{"$":0},"rr":{"$":0},"rs":{"$":0},"sc":{"$":0},"se":{"$":0},"sp":{"$":0},"to":{"$":0}},"imb":{"$":0},"ind":{"$":0},"inf":{"$":0},"jampa":{"$":0},"jor":{"$":0},"jus":{"$":0},"leg":{"$":0,"ac":{"$":0},"al":{"$":0},"am":{"$":0},"ap":{"$":0},"ba":{"$":0},"ce":{"$":0},"df":{"$":0},"es":{"$":0},"go":{"$":0},"ma":{"$":0},"mg":{"$":0},"ms":{"$":0},"mt":{"$":0},"pa":{"$":0},"pb":{"$":0},"pe":{"$":0},"pi":{"$":0},"pr":{"$":0},"rj":{"$":0},"rn":{"$":0},"ro":{"$":0},"rr":{"$":0},"rs":{"$":0},"sc":{"$":0},"se":{"$":0},"sp":{"$":0},"to":{"$":0}},"lel":{"$":0},"mat":{"$":0},"med":{"$":0},"mil":{"$":0},"mp":{"$":0},"mus":{"$":0},"net":{"$":0},"nom":{"*":{"$":0}},"not":{"$":0},"ntr":{"$":0},"odo":{"$":0},"org":{"$":0},"poa":{"$":0},"ppg":{"$":0},"pro":{"$":0},"psc":{"$":0},"psi":{"$":0},"qsl":{"$":0},"radio":{"$":0},"rec":{"$":0},"recife":{"$":0},"slg":{"$":0},"srv":{"$":0},"taxi":{"$":0},"teo":{"$":0},"tmp":{"$":0},"trd":{"$":0},"tur":{"$":0},"tv":{"$":0},"vet":{"$":0},"vix":{"$":0},"vlog":{"$":0},"wiki":{"$":0},"zlg":{"$":0}},"bs":{"$":0,"com":{"$":0},"net":{"$":0},"org":{"$":0},"edu":{"$":0},"gov":{"$":0},"we":{"$":0}},"bt":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"net":{"$":0},"org":{"$":0}},"bv":{"$":0},"bw":{"$":0,"co":{"$":0},"org":{"$":0}},"by":{"$":0,"gov":{"$":0},"mil":{"$":0},"com":{"$":0,"blogspot":{"$":0}},"of":{"$":0},"nym":{"$":0}},"bz":{"$":0,"com":{"$":0},"net":{"$":0},"org":{"$":0},"edu":{"$":0},"gov":{"$":0},"za":{"$":0},"nym":{"$":0}},"ca":{"$":0,"ab":{"$":0},"bc":{"$":0},"mb":{"$":0},"nb":{"$":0},"nf":{"$":0},"nl":{"$":0},"ns":{"$":0},"nt":{"$":0},"nu":{"$":0},"on":{"$":0},"pe":{"$":0},"qc":{"$":0},"sk":{"$":0},"yk":{"$":0},"gc":{"$":0},"awdev":{"*":{"$":0}},"co":{"$":0},"blogspot":{"$":0},"no-ip":{"$":0}},"cat":{"$":0},"cc":{"$":0,"cloudns":{"$":0},"ftpaccess":{"$":0},"game-server":{"$":0},"myphotos":{"$":0},"scrapping":{"$":0},"twmail":{"$":0},"fantasyleague":{"$":0}},"cd":{"$":0,"gov":{"$":0}},"cf":{"$":0,"blogspot":{"$":0}},"cg":{"$":0},"ch":{"$":0,"square7":{"$":0},"blogspot":{"$":0},"gotdns":{"$":0},"12hp":{"$":0},"2ix":{"$":0},"4lima":{"$":0},"lima-city":{"$":0}},"ci":{"$":0,"org":{"$":0},"or":{"$":0},"com":{"$":0},"co":{"$":0},"edu":{"$":0},"ed":{"$":0},"ac":{"$":0},"net":{"$":0},"go":{"$":0},"asso":{"$":0},"xn--aroport-bya":{"$":0},"int":{"$":0},"presse":{"$":0},"md":{"$":0},"gouv":{"$":0}},"ck":{"*":{"$":0}},"cl":{"$":0,"gov":{"$":0},"gob":{"$":0},"co":{"$":0},"mil":{"$":0},"blogspot":{"$":0},"nom":{"$":0}},"cm":{"$":0,"co":{"$":0},"com":{"$":0},"gov":{"$":0},"net":{"$":0}},"cn":{"$":0,"ac":{"$":0},"com":{"$":0,"amazonaws":{"compute":{"*":{"$":0}},"eb":{"cn-north-1":{"$":0}},"elb":{"*":{"$":0}},"cn-north-1":{"s3":{"$":0}}}},"edu":{"$":0},"gov":{"$":0},"net":{"$":0},"org":{"$":0},"mil":{"$":0},"xn--55qx5d":{"$":0},"xn--io0a7i":{"$":0},"xn--od0alg":{"$":0},"ah":{"$":0},"bj":{"$":0},"cq":{"$":0},"fj":{"$":0},"gd":{"$":0},"gs":{"$":0},"gz":{"$":0},"gx":{"$":0},"ha":{"$":0},"hb":{"$":0},"he":{"$":0},"hi":{"$":0},"hl":{"$":0},"hn":{"$":0},"jl":{"$":0},"js":{"$":0},"jx":{"$":0},"ln":{"$":0},"nm":{"$":0},"nx":{"$":0},"qh":{"$":0},"sc":{"$":0},"sd":{"$":0},"sh":{"$":0},"sn":{"$":0},"sx":{"$":0},"tj":{"$":0},"xj":{"$":0},"xz":{"$":0},"yn":{"$":0},"zj":{"$":0},"hk":{"$":0},"mo":{"$":0},"tw":{"$":0}},"co":{"$":0,"arts":{"$":0},"com":{"$":0,"blogspot":{"$":0}},"edu":{"$":0},"firm":{"$":0},"gov":{"$":0},"info":{"$":0},"int":{"$":0},"mil":{"$":0},"net":{"$":0},"nom":{"$":0},"org":{"$":0},"rec":{"$":0},"web":{"$":0},"nodum":{"$":0}},"com":{"$":0,"amazonaws":{"compute":{"*":{"$":0}},"compute-1":{"*":{"$":0}},"us-east-1":{"$":0,"dualstack":{"s3":{"$":0}}},"elb":{"*":{"$":0}},"s3":{"$":0},"s3-ap-northeast-1":{"$":0},"s3-ap-northeast-2":{"$":0},"s3-ap-south-1":{"$":0},"s3-ap-southeast-1":{"$":0},"s3-ap-southeast-2":{"$":0},"s3-ca-central-1":{"$":0},"s3-eu-central-1":{"$":0},"s3-eu-west-1":{"$":0},"s3-eu-west-2":{"$":0},"s3-external-1":{"$":0},"s3-fips-us-gov-west-1":{"$":0},"s3-sa-east-1":{"$":0},"s3-us-gov-west-1":{"$":0},"s3-us-east-2":{"$":0},"s3-us-west-1":{"$":0},"s3-us-west-2":{"$":0},"ap-northeast-2":{"s3":{"$":0},"dualstack":{"s3":{"$":0}},"s3-website":{"$":0}},"ap-south-1":{"s3":{"$":0},"dualstack":{"s3":{"$":0}},"s3-website":{"$":0}},"ca-central-1":{"s3":{"$":0},"dualstack":{"s3":{"$":0}},"s3-website":{"$":0}},"eu-central-1":{"s3":{"$":0},"dualstack":{"s3":{"$":0}},"s3-website":{"$":0}},"eu-west-2":{"s3":{"$":0},"dualstack":{"s3":{"$":0}},"s3-website":{"$":0}},"us-east-2":{"s3":{"$":0},"dualstack":{"s3":{"$":0}},"s3-website":{"$":0}},"ap-northeast-1":{"dualstack":{"s3":{"$":0}}},"ap-southeast-1":{"dualstack":{"s3":{"$":0}}},"ap-southeast-2":{"dualstack":{"s3":{"$":0}}},"eu-west-1":{"dualstack":{"s3":{"$":0}}},"sa-east-1":{"dualstack":{"s3":{"$":0}}},"s3-website-us-east-1":{"$":0},"s3-website-us-west-1":{"$":0},"s3-website-us-west-2":{"$":0},"s3-website-ap-northeast-1":{"$":0},"s3-website-ap-southeast-1":{"$":0},"s3-website-ap-southeast-2":{"$":0},"s3-website-eu-west-1":{"$":0},"s3-website-sa-east-1":{"$":0}},"elasticbeanstalk":{"$":0,"ap-northeast-1":{"$":0},"ap-northeast-2":{"$":0},"ap-south-1":{"$":0},"ap-southeast-1":{"$":0},"ap-southeast-2":{"$":0},"ca-central-1":{"$":0},"eu-central-1":{"$":0},"eu-west-1":{"$":0},"eu-west-2":{"$":0},"sa-east-1":{"$":0},"us-east-1":{"$":0},"us-east-2":{"$":0},"us-gov-west-1":{"$":0},"us-west-1":{"$":0},"us-west-2":{"$":0}},"on-aptible":{"$":0},"myasustor":{"$":0},"betainabox":{"$":0},"bplaced":{"$":0},"ar":{"$":0},"br":{"$":0},"cn":{"$":0},"de":{"$":0},"eu":{"$":0},"gb":{"$":0},"hu":{"$":0},"jpn":{"$":0},"kr":{"$":0},"mex":{"$":0},"no":{"$":0},"qc":{"$":0},"ru":{"$":0},"sa":{"$":0},"se":{"$":0},"uk":{"$":0},"us":{"$":0},"uy":{"$":0},"za":{"$":0},"africa":{"$":0},"gr":{"$":0},"co":{"$":0},"xenapponazure":{"$":0},"jdevcloud":{"$":0},"wpdevcloud":{"$":0},"cloudcontrolled":{"$":0},"cloudcontrolapp":{"$":0},"drayddns":{"$":0},"dreamhosters":{"$":0},"mydrobo":{"$":0},"dyndns-at-home":{"$":0},"dyndns-at-work":{"$":0},"dyndns-blog":{"$":0},"dyndns-free":{"$":0},"dyndns-home":{"$":0},"dyndns-ip":{"$":0},"dyndns-mail":{"$":0},"dyndns-office":{"$":0},"dyndns-pics":{"$":0},"dyndns-remote":{"$":0},"dyndns-server":{"$":0},"dyndns-web":{"$":0},"dyndns-wiki":{"$":0},"dyndns-work":{"$":0},"blogdns":{"$":0},"cechire":{"$":0},"dnsalias":{"$":0},"dnsdojo":{"$":0},"doesntexist":{"$":0},"dontexist":{"$":0},"doomdns":{"$":0},"dyn-o-saur":{"$":0},"dynalias":{"$":0},"est-a-la-maison":{"$":0},"est-a-la-masion":{"$":0},"est-le-patron":{"$":0},"est-mon-blogueur":{"$":0},"from-ak":{"$":0},"from-al":{"$":0},"from-ar":{"$":0},"from-ca":{"$":0},"from-ct":{"$":0},"from-dc":{"$":0},"from-de":{"$":0},"from-fl":{"$":0},"from-ga":{"$":0},"from-hi":{"$":0},"from-ia":{"$":0},"from-id":{"$":0},"from-il":{"$":0},"from-in":{"$":0},"from-ks":{"$":0},"from-ky":{"$":0},"from-ma":{"$":0},"from-md":{"$":0},"from-mi":{"$":0},"from-mn":{"$":0},"from-mo":{"$":0},"from-ms":{"$":0},"from-mt":{"$":0},"from-nc":{"$":0},"from-nd":{"$":0},"from-ne":{"$":0},"from-nh":{"$":0},"from-nj":{"$":0},"from-nm":{"$":0},"from-nv":{"$":0},"from-oh":{"$":0},"from-ok":{"$":0},"from-or":{"$":0},"from-pa":{"$":0},"from-pr":{"$":0},"from-ri":{"$":0},"from-sc":{"$":0},"from-sd":{"$":0},"from-tn":{"$":0},"from-tx":{"$":0},"from-ut":{"$":0},"from-va":{"$":0},"from-vt":{"$":0},"from-wa":{"$":0},"from-wi":{"$":0},"from-wv":{"$":0},"from-wy":{"$":0},"getmyip":{"$":0},"gotdns":{"$":0},"hobby-site":{"$":0},"homelinux":{"$":0},"homeunix":{"$":0},"iamallama":{"$":0},"is-a-anarchist":{"$":0},"is-a-blogger":{"$":0},"is-a-bookkeeper":{"$":0},"is-a-bulls-fan":{"$":0},"is-a-caterer":{"$":0},"is-a-chef":{"$":0},"is-a-conservative":{"$":0},"is-a-cpa":{"$":0},"is-a-cubicle-slave":{"$":0},"is-a-democrat":{"$":0},"is-a-designer":{"$":0},"is-a-doctor":{"$":0},"is-a-financialadvisor":{"$":0},"is-a-geek":{"$":0},"is-a-green":{"$":0},"is-a-guru":{"$":0},"is-a-hard-worker":{"$":0},"is-a-hunter":{"$":0},"is-a-landscaper":{"$":0},"is-a-lawyer":{"$":0},"is-a-liberal":{"$":0},"is-a-libertarian":{"$":0},"is-a-llama":{"$":0},"is-a-musician":{"$":0},"is-a-nascarfan":{"$":0},"is-a-nurse":{"$":0},"is-a-painter":{"$":0},"is-a-personaltrainer":{"$":0},"is-a-photographer":{"$":0},"is-a-player":{"$":0},"is-a-republican":{"$":0},"is-a-rockstar":{"$":0},"is-a-socialist":{"$":0},"is-a-student":{"$":0},"is-a-teacher":{"$":0},"is-a-techie":{"$":0},"is-a-therapist":{"$":0},"is-an-accountant":{"$":0},"is-an-actor":{"$":0},"is-an-actress":{"$":0},"is-an-anarchist":{"$":0},"is-an-artist":{"$":0},"is-an-engineer":{"$":0},"is-an-entertainer":{"$":0},"is-certified":{"$":0},"is-gone":{"$":0},"is-into-anime":{"$":0},"is-into-cars":{"$":0},"is-into-cartoons":{"$":0},"is-into-games":{"$":0},"is-leet":{"$":0},"is-not-certified":{"$":0},"is-slick":{"$":0},"is-uberleet":{"$":0},"is-with-theband":{"$":0},"isa-geek":{"$":0},"isa-hockeynut":{"$":0},"issmarterthanyou":{"$":0},"likes-pie":{"$":0},"likescandy":{"$":0},"neat-url":{"$":0},"saves-the-whales":{"$":0},"selfip":{"$":0},"sells-for-less":{"$":0},"sells-for-u":{"$":0},"servebbs":{"$":0},"simple-url":{"$":0},"space-to-rent":{"$":0},"teaches-yoga":{"$":0},"writesthisblog":{"$":0},"ddnsfree":{"$":0},"ddnsgeek":{"$":0},"giize":{"$":0},"gleeze":{"$":0},"kozow":{"$":0},"loseyourip":{"$":0},"ooguy":{"$":0},"theworkpc":{"$":0},"mytuleap":{"$":0},"evennode":{"eu-1":{"$":0},"eu-2":{"$":0},"eu-3":{"$":0},"eu-4":{"$":0},"us-1":{"$":0},"us-2":{"$":0},"us-3":{"$":0},"us-4":{"$":0}},"fbsbx":{"apps":{"$":0}},"firebaseapp":{"$":0},"flynnhub":{"$":0},"freebox-os":{"$":0},"freeboxos":{"$":0},"githubusercontent":{"$":0},"0emm":{"*":{"$":0}},"appspot":{"$":0},"blogspot":{"$":0},"codespot":{"$":0},"googleapis":{"$":0},"googlecode":{"$":0},"pagespeedmobilizer":{"$":0},"publishproxy":{"$":0},"withgoogle":{"$":0},"withyoutube":{"$":0},"herokuapp":{"$":0},"herokussl":{"$":0},"pixolino":{"$":0},"joyent":{"cns":{"*":{"$":0}}},"barsyonline":{"$":0},"meteorapp":{"$":0,"eu":{"$":0}},"bitballoon":{"$":0},"netlify":{"$":0},"4u":{"$":0},"nfshost":{"$":0},"blogsyte":{"$":0},"ciscofreak":{"$":0},"damnserver":{"$":0},"ditchyourip":{"$":0},"dnsiskinky":{"$":0},"dynns":{"$":0},"geekgalaxy":{"$":0},"health-carereform":{"$":0},"homesecuritymac":{"$":0},"homesecuritypc":{"$":0},"myactivedirectory":{"$":0},"mysecuritycamera":{"$":0},"net-freaks":{"$":0},"onthewifi":{"$":0},"point2this":{"$":0},"quicksytes":{"$":0},"securitytactics":{"$":0},"serveexchange":{"$":0},"servehumour":{"$":0},"servep2p":{"$":0},"servesarcasm":{"$":0},"stufftoread":{"$":0},"unusualperson":{"$":0},"workisboring":{"$":0},"3utilities":{"$":0},"ddnsking":{"$":0},"myvnc":{"$":0},"servebeer":{"$":0},"servecounterstrike":{"$":0},"serveftp":{"$":0},"servegame":{"$":0},"servehalflife":{"$":0},"servehttp":{"$":0},"serveirc":{"$":0},"servemp3":{"$":0},"servepics":{"$":0},"servequake":{"$":0},"operaunite":{"$":0},"outsystemscloud":{"$":0},"ownprovider":{"$":0},"pgfog":{"$":0},"pagefrontapp":{"$":0},"gotpantheon":{"$":0},"prgmr":{"xen":{"$":0}},"qa2":{"$":0},"dev-myqnapcloud":{"$":0},"alpha-myqnapcloud":{"$":0},"myqnapcloud":{"$":0},"quipelements":{"*":{"$":0}},"rackmaze":{"$":0},"rhcloud":{"$":0},"logoip":{"$":0},"firewall-gateway":{"$":0},"myshopblocks":{"$":0},"1kapp":{"$":0},"appchizi":{"$":0},"applinzi":{"$":0},"sinaapp":{"$":0},"vipsinaapp":{"$":0},"bounty-full":{"$":0,"alpha":{"$":0},"beta":{"$":0}},"temp-dns":{"$":0},"dsmynas":{"$":0},"familyds":{"$":0},"bloxcms":{"$":0},"townnews-staging":{"$":0},"hk":{"$":0},"remotewd":{"$":0},"yolasite":{"$":0}},"coop":{"$":0},"cr":{"$":0,"ac":{"$":0},"co":{"$":0},"ed":{"$":0},"fi":{"$":0},"go":{"$":0},"or":{"$":0},"sa":{"$":0}},"cu":{"$":0,"com":{"$":0},"edu":{"$":0},"org":{"$":0},"net":{"$":0},"gov":{"$":0},"inf":{"$":0}},"cv":{"$":0,"blogspot":{"$":0}},"cw":{"$":0,"com":{"$":0},"edu":{"$":0},"net":{"$":0},"org":{"$":0}},"cx":{"$":0,"gov":{"$":0},"ath":{"$":0},"info":{"$":0}},"cy":{"$":0,"ac":{"$":0},"biz":{"$":0},"com":{"$":0,"blogspot":{"$":0}},"ekloges":{"$":0},"gov":{"$":0},"ltd":{"$":0},"name":{"$":0},"net":{"$":0},"org":{"$":0},"parliament":{"$":0},"press":{"$":0},"pro":{"$":0},"tm":{"$":0}},"cz":{"$":0,"co":{"$":0},"realm":{"$":0},"e4":{"$":0},"blogspot":{"$":0},"metacentrum":{"cloud":{"$":0},"custom":{"$":0}}},"de":{"$":0,"bplaced":{"$":0},"square7":{"$":0},"com":{"$":0},"cosidns":{"dyn":{"$":0}},"dynamisches-dns":{"$":0},"dnsupdater":{"$":0},"internet-dns":{"$":0},"l-o-g-i-n":{"$":0},"dnshome":{"$":0},"fuettertdasnetz":{"$":0},"isteingeek":{"$":0},"istmein":{"$":0},"lebtimnetz":{"$":0},"leitungsen":{"$":0},"traeumtgerade":{"$":0},"ddnss":{"$":0,"dyn":{"$":0},"dyndns":{"$":0}},"dyndns1":{"$":0},"dyn-ip24":{"$":0},"home-webserver":{"$":0,"dyn":{"$":0}},"myhome-server":{"$":0},"goip":{"$":0},"blogspot":{"$":0},"keymachine":{"$":0},"git-repos":{"$":0},"lcube-server":{"$":0},"svn-repos":{"$":0},"barsy":{"$":0},"logoip":{"$":0},"firewall-gateway":{"$":0},"my-gateway":{"$":0},"my-router":{"$":0},"spdns":{"$":0},"taifun-dns":{"$":0},"12hp":{"$":0},"2ix":{"$":0},"4lima":{"$":0},"lima-city":{"$":0},"dd-dns":{"$":0},"dray-dns":{"$":0},"draydns":{"$":0},"dyn-vpn":{"$":0},"dynvpn":{"$":0},"mein-vigor":{"$":0},"my-vigor":{"$":0},"my-wan":{"$":0},"syno-ds":{"$":0},"synology-diskstation":{"$":0},"synology-ds":{"$":0}},"dj":{"$":0},"dk":{"$":0,"biz":{"$":0},"co":{"$":0},"firm":{"$":0},"reg":{"$":0},"store":{"$":0},"blogspot":{"$":0}},"dm":{"$":0,"com":{"$":0},"net":{"$":0},"org":{"$":0},"edu":{"$":0},"gov":{"$":0}},"do":{"$":0,"art":{"$":0},"com":{"$":0},"edu":{"$":0},"gob":{"$":0},"gov":{"$":0},"mil":{"$":0},"net":{"$":0},"org":{"$":0},"sld":{"$":0},"web":{"$":0}},"dz":{"$":0,"com":{"$":0},"org":{"$":0},"net":{"$":0},"gov":{"$":0},"edu":{"$":0},"asso":{"$":0},"pol":{"$":0},"art":{"$":0}},"ec":{"$":0,"com":{"$":0},"info":{"$":0},"net":{"$":0},"fin":{"$":0},"k12":{"$":0},"med":{"$":0},"pro":{"$":0},"org":{"$":0},"edu":{"$":0},"gov":{"$":0},"gob":{"$":0},"mil":{"$":0}},"edu":{"$":0},"ee":{"$":0,"edu":{"$":0},"gov":{"$":0},"riik":{"$":0},"lib":{"$":0},"med":{"$":0},"com":{"$":0,"blogspot":{"$":0}},"pri":{"$":0},"aip":{"$":0},"org":{"$":0},"fie":{"$":0}},"eg":{"$":0,"com":{"$":0,"blogspot":{"$":0}},"edu":{"$":0},"eun":{"$":0},"gov":{"$":0},"mil":{"$":0},"name":{"$":0},"net":{"$":0},"org":{"$":0},"sci":{"$":0}},"er":{"*":{"$":0}},"es":{"$":0,"com":{"$":0,"blogspot":{"$":0}},"nom":{"$":0},"org":{"$":0},"gob":{"$":0},"edu":{"$":0}},"et":{"$":0,"com":{"$":0},"gov":{"$":0},"org":{"$":0},"edu":{"$":0},"biz":{"$":0},"name":{"$":0},"info":{"$":0},"net":{"$":0}},"eu":{"$":0,"mycd":{"$":0},"cloudns":{"$":0},"barsy":{"$":0},"wellbeingzone":{"$":0},"spdns":{"$":0},"transurl":{"*":{"$":0}},"diskstation":{"$":0}},"fi":{"$":0,"aland":{"$":0},"dy":{"$":0},"blogspot":{"$":0},"iki":{"$":0}},"fj":{"*":{"$":0}},"fk":{"*":{"$":0}},"fm":{"$":0},"fo":{"$":0},"fr":{"$":0,"com":{"$":0},"asso":{"$":0},"nom":{"$":0},"prd":{"$":0},"presse":{"$":0},"tm":{"$":0},"aeroport":{"$":0},"assedic":{"$":0},"avocat":{"$":0},"avoues":{"$":0},"cci":{"$":0},"chambagri":{"$":0},"chirurgiens-dentistes":{"$":0},"experts-comptables":{"$":0},"geometre-expert":{"$":0},"gouv":{"$":0},"greta":{"$":0},"huissier-justice":{"$":0},"medecin":{"$":0},"notaires":{"$":0},"pharmacien":{"$":0},"port":{"$":0},"veterinaire":{"$":0},"fbx-os":{"$":0},"fbxos":{"$":0},"freebox-os":{"$":0},"freeboxos":{"$":0},"blogspot":{"$":0},"on-web":{"$":0},"chirurgiens-dentistes-en-france":{"$":0}},"ga":{"$":0},"gb":{"$":0},"gd":{"$":0,"nom":{"$":0}},"ge":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"org":{"$":0},"mil":{"$":0},"net":{"$":0},"pvt":{"$":0}},"gf":{"$":0},"gg":{"$":0,"co":{"$":0},"net":{"$":0},"org":{"$":0},"cya":{"$":0}},"gh":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"org":{"$":0},"mil":{"$":0}},"gi":{"$":0,"com":{"$":0},"ltd":{"$":0},"gov":{"$":0},"mod":{"$":0},"edu":{"$":0},"org":{"$":0}},"gl":{"$":0,"co":{"$":0},"com":{"$":0},"edu":{"$":0},"net":{"$":0},"org":{"$":0},"nom":{"$":0}},"gm":{"$":0},"gn":{"$":0,"ac":{"$":0},"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"org":{"$":0},"net":{"$":0}},"gov":{"$":0},"gp":{"$":0,"com":{"$":0},"net":{"$":0},"mobi":{"$":0},"edu":{"$":0},"org":{"$":0},"asso":{"$":0}},"gq":{"$":0},"gr":{"$":0,"com":{"$":0},"edu":{"$":0},"net":{"$":0},"org":{"$":0},"gov":{"$":0},"blogspot":{"$":0},"nym":{"$":0}},"gs":{"$":0},"gt":{"$":0,"com":{"$":0},"edu":{"$":0},"gob":{"$":0},"ind":{"$":0},"mil":{"$":0},"net":{"$":0},"org":{"$":0},"nom":{"$":0}},"gu":{"*":{"$":0}},"gw":{"$":0},"gy":{"$":0,"co":{"$":0},"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"net":{"$":0},"org":{"$":0}},"hk":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"idv":{"$":0},"net":{"$":0},"org":{"$":0},"xn--55qx5d":{"$":0},"xn--wcvs22d":{"$":0},"xn--lcvr32d":{"$":0},"xn--mxtq1m":{"$":0},"xn--gmqw5a":{"$":0},"xn--ciqpn":{"$":0},"xn--gmq050i":{"$":0},"xn--zf0avx":{"$":0},"xn--io0a7i":{"$":0},"xn--mk0axi":{"$":0},"xn--od0alg":{"$":0},"xn--od0aq3b":{"$":0},"xn--tn0ag":{"$":0},"xn--uc0atv":{"$":0},"xn--uc0ay4a":{"$":0},"blogspot":{"$":0},"ltd":{"$":0},"inc":{"$":0}},"hm":{"$":0},"hn":{"$":0,"com":{"$":0},"edu":{"$":0},"org":{"$":0},"net":{"$":0},"mil":{"$":0},"gob":{"$":0},"nom":{"$":0}},"hr":{"$":0,"iz":{"$":0},"from":{"$":0},"name":{"$":0},"com":{"$":0},"blogspot":{"$":0}},"ht":{"$":0,"com":{"$":0},"shop":{"$":0},"firm":{"$":0},"info":{"$":0},"adult":{"$":0},"net":{"$":0},"pro":{"$":0},"org":{"$":0},"med":{"$":0},"art":{"$":0},"coop":{"$":0},"pol":{"$":0},"asso":{"$":0},"edu":{"$":0},"rel":{"$":0},"gouv":{"$":0},"perso":{"$":0}},"hu":{"2000":{"$":0},"$":0,"co":{"$":0},"info":{"$":0},"org":{"$":0},"priv":{"$":0},"sport":{"$":0},"tm":{"$":0},"agrar":{"$":0},"bolt":{"$":0},"casino":{"$":0},"city":{"$":0},"erotica":{"$":0},"erotika":{"$":0},"film":{"$":0},"forum":{"$":0},"games":{"$":0},"hotel":{"$":0},"ingatlan":{"$":0},"jogasz":{"$":0},"konyvelo":{"$":0},"lakas":{"$":0},"media":{"$":0},"news":{"$":0},"reklam":{"$":0},"sex":{"$":0},"shop":{"$":0},"suli":{"$":0},"szex":{"$":0},"tozsde":{"$":0},"utazas":{"$":0},"video":{"$":0},"blogspot":{"$":0}},"id":{"$":0,"ac":{"$":0},"biz":{"$":0},"co":{"$":0,"blogspot":{"$":0}},"desa":{"$":0},"go":{"$":0},"mil":{"$":0},"my":{"$":0},"net":{"$":0},"or":{"$":0},"sch":{"$":0},"web":{"$":0}},"ie":{"$":0,"gov":{"$":0},"blogspot":{"$":0}},"il":{"$":0,"ac":{"$":0},"co":{"$":0,"blogspot":{"$":0}},"gov":{"$":0},"idf":{"$":0},"k12":{"$":0},"muni":{"$":0},"net":{"$":0},"org":{"$":0}},"im":{"$":0,"ac":{"$":0},"co":{"$":0,"ltd":{"$":0},"plc":{"$":0}},"com":{"$":0},"net":{"$":0},"org":{"$":0},"tt":{"$":0},"tv":{"$":0},"ro":{"$":0},"nom":{"$":0}},"in":{"$":0,"co":{"$":0},"firm":{"$":0},"net":{"$":0},"org":{"$":0},"gen":{"$":0},"ind":{"$":0},"nic":{"$":0},"ac":{"$":0},"edu":{"$":0},"res":{"$":0},"gov":{"$":0},"mil":{"$":0},"cloudns":{"$":0},"blogspot":{"$":0},"barsy":{"$":0}},"info":{"$":0,"cloudns":{"$":0},"dynamic-dns":{"$":0},"dyndns":{"$":0},"barrel-of-knowledge":{"$":0},"barrell-of-knowledge":{"$":0},"for-our":{"$":0},"groks-the":{"$":0},"groks-this":{"$":0},"here-for-more":{"$":0},"knowsitall":{"$":0},"selfip":{"$":0},"webhop":{"$":0},"nsupdate":{"$":0},"dvrcam":{"$":0},"ilovecollege":{"$":0},"no-ip":{"$":0},"v-info":{"$":0}},"int":{"$":0,"eu":{"$":0}},"io":{"$":0,"com":{"$":0},"backplaneapp":{"$":0},"boxfuse":{"$":0},"browsersafetymark":{"$":0},"dedyn":{"$":0},"drud":{"$":0},"definima":{"$":0},"enonic":{"$":0,"customer":{"$":0}},"github":{"$":0},"gitlab":{"$":0},"hasura-app":{"$":0},"ngrok":{"$":0},"nodeart":{"stage":{"$":0}},"nodum":{"$":0},"nid":{"$":0},"pantheonsite":{"$":0},"protonet":{"$":0},"vaporcloud":{"$":0},"hzc":{"$":0},"sandcats":{"$":0},"shiftedit":{"$":0},"lair":{"apps":{"$":0}},"stolos":{"*":{"$":0}},"spacekit":{"$":0},"thingdust":{"dev":{"cust":{"$":0}},"disrec":{"cust":{"$":0}},"prod":{"cust":{"$":0}},"testing":{"cust":{"$":0}}},"wedeploy":{"$":0}},"iq":{"$":0,"gov":{"$":0},"edu":{"$":0},"mil":{"$":0},"com":{"$":0},"org":{"$":0},"net":{"$":0}},"ir":{"$":0,"ac":{"$":0},"co":{"$":0},"gov":{"$":0},"id":{"$":0},"net":{"$":0},"org":{"$":0},"sch":{"$":0},"xn--mgba3a4f16a":{"$":0},"xn--mgba3a4fra":{"$":0}},"is":{"$":0,"net":{"$":0},"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"org":{"$":0},"int":{"$":0},"cupcake":{"$":0},"blogspot":{"$":0}},"it":{"$":0,"gov":{"$":0},"edu":{"$":0},"abr":{"$":0},"abruzzo":{"$":0},"aosta-valley":{"$":0},"aostavalley":{"$":0},"bas":{"$":0},"basilicata":{"$":0},"cal":{"$":0},"calabria":{"$":0},"cam":{"$":0},"campania":{"$":0},"emilia-romagna":{"$":0},"emiliaromagna":{"$":0},"emr":{"$":0},"friuli-v-giulia":{"$":0},"friuli-ve-giulia":{"$":0},"friuli-vegiulia":{"$":0},"friuli-venezia-giulia":{"$":0},"friuli-veneziagiulia":{"$":0},"friuli-vgiulia":{"$":0},"friuliv-giulia":{"$":0},"friulive-giulia":{"$":0},"friulivegiulia":{"$":0},"friulivenezia-giulia":{"$":0},"friuliveneziagiulia":{"$":0},"friulivgiulia":{"$":0},"fvg":{"$":0},"laz":{"$":0},"lazio":{"$":0},"lig":{"$":0},"liguria":{"$":0},"lom":{"$":0},"lombardia":{"$":0},"lombardy":{"$":0},"lucania":{"$":0},"mar":{"$":0},"marche":{"$":0},"mol":{"$":0},"molise":{"$":0},"piedmont":{"$":0},"piemonte":{"$":0},"pmn":{"$":0},"pug":{"$":0},"puglia":{"$":0},"sar":{"$":0},"sardegna":{"$":0},"sardinia":{"$":0},"sic":{"$":0},"sicilia":{"$":0},"sicily":{"$":0},"taa":{"$":0},"tos":{"$":0},"toscana":{"$":0},"trentino-a-adige":{"$":0},"trentino-aadige":{"$":0},"trentino-alto-adige":{"$":0},"trentino-altoadige":{"$":0},"trentino-s-tirol":{"$":0},"trentino-stirol":{"$":0},"trentino-sud-tirol":{"$":0},"trentino-sudtirol":{"$":0},"trentino-sued-tirol":{"$":0},"trentino-suedtirol":{"$":0},"trentinoa-adige":{"$":0},"trentinoaadige":{"$":0},"trentinoalto-adige":{"$":0},"trentinoaltoadige":{"$":0},"trentinos-tirol":{"$":0},"trentinostirol":{"$":0},"trentinosud-tirol":{"$":0},"trentinosudtirol":{"$":0},"trentinosued-tirol":{"$":0},"trentinosuedtirol":{"$":0},"tuscany":{"$":0},"umb":{"$":0},"umbria":{"$":0},"val-d-aosta":{"$":0},"val-daosta":{"$":0},"vald-aosta":{"$":0},"valdaosta":{"$":0},"valle-aosta":{"$":0},"valle-d-aosta":{"$":0},"valle-daosta":{"$":0},"valleaosta":{"$":0},"valled-aosta":{"$":0},"valledaosta":{"$":0},"vallee-aoste":{"$":0},"valleeaoste":{"$":0},"vao":{"$":0},"vda":{"$":0},"ven":{"$":0},"veneto":{"$":0},"ag":{"$":0},"agrigento":{"$":0},"al":{"$":0},"alessandria":{"$":0},"alto-adige":{"$":0},"altoadige":{"$":0},"an":{"$":0},"ancona":{"$":0},"andria-barletta-trani":{"$":0},"andria-trani-barletta":{"$":0},"andriabarlettatrani":{"$":0},"andriatranibarletta":{"$":0},"ao":{"$":0},"aosta":{"$":0},"aoste":{"$":0},"ap":{"$":0},"aq":{"$":0},"aquila":{"$":0},"ar":{"$":0},"arezzo":{"$":0},"ascoli-piceno":{"$":0},"ascolipiceno":{"$":0},"asti":{"$":0},"at":{"$":0},"av":{"$":0},"avellino":{"$":0},"ba":{"$":0},"balsan":{"$":0},"bari":{"$":0},"barletta-trani-andria":{"$":0},"barlettatraniandria":{"$":0},"belluno":{"$":0},"benevento":{"$":0},"bergamo":{"$":0},"bg":{"$":0},"bi":{"$":0},"biella":{"$":0},"bl":{"$":0},"bn":{"$":0},"bo":{"$":0},"bologna":{"$":0},"bolzano":{"$":0},"bozen":{"$":0},"br":{"$":0},"brescia":{"$":0},"brindisi":{"$":0},"bs":{"$":0},"bt":{"$":0},"bz":{"$":0},"ca":{"$":0},"cagliari":{"$":0},"caltanissetta":{"$":0},"campidano-medio":{"$":0},"campidanomedio":{"$":0},"campobasso":{"$":0},"carbonia-iglesias":{"$":0},"carboniaiglesias":{"$":0},"carrara-massa":{"$":0},"carraramassa":{"$":0},"caserta":{"$":0},"catania":{"$":0},"catanzaro":{"$":0},"cb":{"$":0},"ce":{"$":0},"cesena-forli":{"$":0},"cesenaforli":{"$":0},"ch":{"$":0},"chieti":{"$":0},"ci":{"$":0},"cl":{"$":0},"cn":{"$":0},"co":{"$":0},"como":{"$":0},"cosenza":{"$":0},"cr":{"$":0},"cremona":{"$":0},"crotone":{"$":0},"cs":{"$":0},"ct":{"$":0},"cuneo":{"$":0},"cz":{"$":0},"dell-ogliastra":{"$":0},"dellogliastra":{"$":0},"en":{"$":0},"enna":{"$":0},"fc":{"$":0},"fe":{"$":0},"fermo":{"$":0},"ferrara":{"$":0},"fg":{"$":0},"fi":{"$":0},"firenze":{"$":0},"florence":{"$":0},"fm":{"$":0},"foggia":{"$":0},"forli-cesena":{"$":0},"forlicesena":{"$":0},"fr":{"$":0},"frosinone":{"$":0},"ge":{"$":0},"genoa":{"$":0},"genova":{"$":0},"go":{"$":0},"gorizia":{"$":0},"gr":{"$":0},"grosseto":{"$":0},"iglesias-carbonia":{"$":0},"iglesiascarbonia":{"$":0},"im":{"$":0},"imperia":{"$":0},"is":{"$":0},"isernia":{"$":0},"kr":{"$":0},"la-spezia":{"$":0},"laquila":{"$":0},"laspezia":{"$":0},"latina":{"$":0},"lc":{"$":0},"le":{"$":0},"lecce":{"$":0},"lecco":{"$":0},"li":{"$":0},"livorno":{"$":0},"lo":{"$":0},"lodi":{"$":0},"lt":{"$":0},"lu":{"$":0},"lucca":{"$":0},"macerata":{"$":0},"mantova":{"$":0},"massa-carrara":{"$":0},"massacarrara":{"$":0},"matera":{"$":0},"mb":{"$":0},"mc":{"$":0},"me":{"$":0},"medio-campidano":{"$":0},"mediocampidano":{"$":0},"messina":{"$":0},"mi":{"$":0},"milan":{"$":0},"milano":{"$":0},"mn":{"$":0},"mo":{"$":0},"modena":{"$":0},"monza-brianza":{"$":0},"monza-e-della-brianza":{"$":0},"monza":{"$":0},"monzabrianza":{"$":0},"monzaebrianza":{"$":0},"monzaedellabrianza":{"$":0},"ms":{"$":0},"mt":{"$":0},"na":{"$":0},"naples":{"$":0},"napoli":{"$":0},"no":{"$":0},"novara":{"$":0},"nu":{"$":0},"nuoro":{"$":0},"og":{"$":0},"ogliastra":{"$":0},"olbia-tempio":{"$":0},"olbiatempio":{"$":0},"or":{"$":0},"oristano":{"$":0},"ot":{"$":0},"pa":{"$":0},"padova":{"$":0},"padua":{"$":0},"palermo":{"$":0},"parma":{"$":0},"pavia":{"$":0},"pc":{"$":0},"pd":{"$":0},"pe":{"$":0},"perugia":{"$":0},"pesaro-urbino":{"$":0},"pesarourbino":{"$":0},"pescara":{"$":0},"pg":{"$":0},"pi":{"$":0},"piacenza":{"$":0},"pisa":{"$":0},"pistoia":{"$":0},"pn":{"$":0},"po":{"$":0},"pordenone":{"$":0},"potenza":{"$":0},"pr":{"$":0},"prato":{"$":0},"pt":{"$":0},"pu":{"$":0},"pv":{"$":0},"pz":{"$":0},"ra":{"$":0},"ragusa":{"$":0},"ravenna":{"$":0},"rc":{"$":0},"re":{"$":0},"reggio-calabria":{"$":0},"reggio-emilia":{"$":0},"reggiocalabria":{"$":0},"reggioemilia":{"$":0},"rg":{"$":0},"ri":{"$":0},"rieti":{"$":0},"rimini":{"$":0},"rm":{"$":0},"rn":{"$":0},"ro":{"$":0},"roma":{"$":0},"rome":{"$":0},"rovigo":{"$":0},"sa":{"$":0},"salerno":{"$":0},"sassari":{"$":0},"savona":{"$":0},"si":{"$":0},"siena":{"$":0},"siracusa":{"$":0},"so":{"$":0},"sondrio":{"$":0},"sp":{"$":0},"sr":{"$":0},"ss":{"$":0},"suedtirol":{"$":0},"sv":{"$":0},"ta":{"$":0},"taranto":{"$":0},"te":{"$":0},"tempio-olbia":{"$":0},"tempioolbia":{"$":0},"teramo":{"$":0},"terni":{"$":0},"tn":{"$":0},"to":{"$":0},"torino":{"$":0},"tp":{"$":0},"tr":{"$":0},"trani-andria-barletta":{"$":0},"trani-barletta-andria":{"$":0},"traniandriabarletta":{"$":0},"tranibarlettaandria":{"$":0},"trapani":{"$":0},"trentino":{"$":0},"trento":{"$":0},"treviso":{"$":0},"trieste":{"$":0},"ts":{"$":0},"turin":{"$":0},"tv":{"$":0},"ud":{"$":0},"udine":{"$":0},"urbino-pesaro":{"$":0},"urbinopesaro":{"$":0},"va":{"$":0},"varese":{"$":0},"vb":{"$":0},"vc":{"$":0},"ve":{"$":0},"venezia":{"$":0},"venice":{"$":0},"verbania":{"$":0},"vercelli":{"$":0},"verona":{"$":0},"vi":{"$":0},"vibo-valentia":{"$":0},"vibovalentia":{"$":0},"vicenza":{"$":0},"viterbo":{"$":0},"vr":{"$":0},"vs":{"$":0},"vt":{"$":0},"vv":{"$":0},"blogspot":{"$":0}},"je":{"$":0,"co":{"$":0},"net":{"$":0},"org":{"$":0}},"jm":{"*":{"$":0}},"jo":{"$":0,"com":{"$":0},"org":{"$":0},"net":{"$":0},"edu":{"$":0},"sch":{"$":0},"gov":{"$":0},"mil":{"$":0},"name":{"$":0}},"jobs":{"$":0},"jp":{"$":0,"ac":{"$":0},"ad":{"$":0},"co":{"$":0},"ed":{"$":0},"go":{"$":0},"gr":{"$":0},"lg":{"$":0},"ne":{"$":0},"or":{"$":0},"aichi":{"$":0,"aisai":{"$":0},"ama":{"$":0},"anjo":{"$":0},"asuke":{"$":0},"chiryu":{"$":0},"chita":{"$":0},"fuso":{"$":0},"gamagori":{"$":0},"handa":{"$":0},"hazu":{"$":0},"hekinan":{"$":0},"higashiura":{"$":0},"ichinomiya":{"$":0},"inazawa":{"$":0},"inuyama":{"$":0},"isshiki":{"$":0},"iwakura":{"$":0},"kanie":{"$":0},"kariya":{"$":0},"kasugai":{"$":0},"kira":{"$":0},"kiyosu":{"$":0},"komaki":{"$":0},"konan":{"$":0},"kota":{"$":0},"mihama":{"$":0},"miyoshi":{"$":0},"nishio":{"$":0},"nisshin":{"$":0},"obu":{"$":0},"oguchi":{"$":0},"oharu":{"$":0},"okazaki":{"$":0},"owariasahi":{"$":0},"seto":{"$":0},"shikatsu":{"$":0},"shinshiro":{"$":0},"shitara":{"$":0},"tahara":{"$":0},"takahama":{"$":0},"tobishima":{"$":0},"toei":{"$":0},"togo":{"$":0},"tokai":{"$":0},"tokoname":{"$":0},"toyoake":{"$":0},"toyohashi":{"$":0},"toyokawa":{"$":0},"toyone":{"$":0},"toyota":{"$":0},"tsushima":{"$":0},"yatomi":{"$":0}},"akita":{"$":0,"akita":{"$":0},"daisen":{"$":0},"fujisato":{"$":0},"gojome":{"$":0},"hachirogata":{"$":0},"happou":{"$":0},"higashinaruse":{"$":0},"honjo":{"$":0},"honjyo":{"$":0},"ikawa":{"$":0},"kamikoani":{"$":0},"kamioka":{"$":0},"katagami":{"$":0},"kazuno":{"$":0},"kitaakita":{"$":0},"kosaka":{"$":0},"kyowa":{"$":0},"misato":{"$":0},"mitane":{"$":0},"moriyoshi":{"$":0},"nikaho":{"$":0},"noshiro":{"$":0},"odate":{"$":0},"oga":{"$":0},"ogata":{"$":0},"semboku":{"$":0},"yokote":{"$":0},"yurihonjo":{"$":0}},"aomori":{"$":0,"aomori":{"$":0},"gonohe":{"$":0},"hachinohe":{"$":0},"hashikami":{"$":0},"hiranai":{"$":0},"hirosaki":{"$":0},"itayanagi":{"$":0},"kuroishi":{"$":0},"misawa":{"$":0},"mutsu":{"$":0},"nakadomari":{"$":0},"noheji":{"$":0},"oirase":{"$":0},"owani":{"$":0},"rokunohe":{"$":0},"sannohe":{"$":0},"shichinohe":{"$":0},"shingo":{"$":0},"takko":{"$":0},"towada":{"$":0},"tsugaru":{"$":0},"tsuruta":{"$":0}},"chiba":{"$":0,"abiko":{"$":0},"asahi":{"$":0},"chonan":{"$":0},"chosei":{"$":0},"choshi":{"$":0},"chuo":{"$":0},"funabashi":{"$":0},"futtsu":{"$":0},"hanamigawa":{"$":0},"ichihara":{"$":0},"ichikawa":{"$":0},"ichinomiya":{"$":0},"inzai":{"$":0},"isumi":{"$":0},"kamagaya":{"$":0},"kamogawa":{"$":0},"kashiwa":{"$":0},"katori":{"$":0},"katsuura":{"$":0},"kimitsu":{"$":0},"kisarazu":{"$":0},"kozaki":{"$":0},"kujukuri":{"$":0},"kyonan":{"$":0},"matsudo":{"$":0},"midori":{"$":0},"mihama":{"$":0},"minamiboso":{"$":0},"mobara":{"$":0},"mutsuzawa":{"$":0},"nagara":{"$":0},"nagareyama":{"$":0},"narashino":{"$":0},"narita":{"$":0},"noda":{"$":0},"oamishirasato":{"$":0},"omigawa":{"$":0},"onjuku":{"$":0},"otaki":{"$":0},"sakae":{"$":0},"sakura":{"$":0},"shimofusa":{"$":0},"shirako":{"$":0},"shiroi":{"$":0},"shisui":{"$":0},"sodegaura":{"$":0},"sosa":{"$":0},"tako":{"$":0},"tateyama":{"$":0},"togane":{"$":0},"tohnosho":{"$":0},"tomisato":{"$":0},"urayasu":{"$":0},"yachimata":{"$":0},"yachiyo":{"$":0},"yokaichiba":{"$":0},"yokoshibahikari":{"$":0},"yotsukaido":{"$":0}},"ehime":{"$":0,"ainan":{"$":0},"honai":{"$":0},"ikata":{"$":0},"imabari":{"$":0},"iyo":{"$":0},"kamijima":{"$":0},"kihoku":{"$":0},"kumakogen":{"$":0},"masaki":{"$":0},"matsuno":{"$":0},"matsuyama":{"$":0},"namikata":{"$":0},"niihama":{"$":0},"ozu":{"$":0},"saijo":{"$":0},"seiyo":{"$":0},"shikokuchuo":{"$":0},"tobe":{"$":0},"toon":{"$":0},"uchiko":{"$":0},"uwajima":{"$":0},"yawatahama":{"$":0}},"fukui":{"$":0,"echizen":{"$":0},"eiheiji":{"$":0},"fukui":{"$":0},"ikeda":{"$":0},"katsuyama":{"$":0},"mihama":{"$":0},"minamiechizen":{"$":0},"obama":{"$":0},"ohi":{"$":0},"ono":{"$":0},"sabae":{"$":0},"sakai":{"$":0},"takahama":{"$":0},"tsuruga":{"$":0},"wakasa":{"$":0}},"fukuoka":{"$":0,"ashiya":{"$":0},"buzen":{"$":0},"chikugo":{"$":0},"chikuho":{"$":0},"chikujo":{"$":0},"chikushino":{"$":0},"chikuzen":{"$":0},"chuo":{"$":0},"dazaifu":{"$":0},"fukuchi":{"$":0},"hakata":{"$":0},"higashi":{"$":0},"hirokawa":{"$":0},"hisayama":{"$":0},"iizuka":{"$":0},"inatsuki":{"$":0},"kaho":{"$":0},"kasuga":{"$":0},"kasuya":{"$":0},"kawara":{"$":0},"keisen":{"$":0},"koga":{"$":0},"kurate":{"$":0},"kurogi":{"$":0},"kurume":{"$":0},"minami":{"$":0},"miyako":{"$":0},"miyama":{"$":0},"miyawaka":{"$":0},"mizumaki":{"$":0},"munakata":{"$":0},"nakagawa":{"$":0},"nakama":{"$":0},"nishi":{"$":0},"nogata":{"$":0},"ogori":{"$":0},"okagaki":{"$":0},"okawa":{"$":0},"oki":{"$":0},"omuta":{"$":0},"onga":{"$":0},"onojo":{"$":0},"oto":{"$":0},"saigawa":{"$":0},"sasaguri":{"$":0},"shingu":{"$":0},"shinyoshitomi":{"$":0},"shonai":{"$":0},"soeda":{"$":0},"sue":{"$":0},"tachiarai":{"$":0},"tagawa":{"$":0},"takata":{"$":0},"toho":{"$":0},"toyotsu":{"$":0},"tsuiki":{"$":0},"ukiha":{"$":0},"umi":{"$":0},"usui":{"$":0},"yamada":{"$":0},"yame":{"$":0},"yanagawa":{"$":0},"yukuhashi":{"$":0}},"fukushima":{"$":0,"aizubange":{"$":0},"aizumisato":{"$":0},"aizuwakamatsu":{"$":0},"asakawa":{"$":0},"bandai":{"$":0},"date":{"$":0},"fukushima":{"$":0},"furudono":{"$":0},"futaba":{"$":0},"hanawa":{"$":0},"higashi":{"$":0},"hirata":{"$":0},"hirono":{"$":0},"iitate":{"$":0},"inawashiro":{"$":0},"ishikawa":{"$":0},"iwaki":{"$":0},"izumizaki":{"$":0},"kagamiishi":{"$":0},"kaneyama":{"$":0},"kawamata":{"$":0},"kitakata":{"$":0},"kitashiobara":{"$":0},"koori":{"$":0},"koriyama":{"$":0},"kunimi":{"$":0},"miharu":{"$":0},"mishima":{"$":0},"namie":{"$":0},"nango":{"$":0},"nishiaizu":{"$":0},"nishigo":{"$":0},"okuma":{"$":0},"omotego":{"$":0},"ono":{"$":0},"otama":{"$":0},"samegawa":{"$":0},"shimogo":{"$":0},"shirakawa":{"$":0},"showa":{"$":0},"soma":{"$":0},"sukagawa":{"$":0},"taishin":{"$":0},"tamakawa":{"$":0},"tanagura":{"$":0},"tenei":{"$":0},"yabuki":{"$":0},"yamato":{"$":0},"yamatsuri":{"$":0},"yanaizu":{"$":0},"yugawa":{"$":0}},"gifu":{"$":0,"anpachi":{"$":0},"ena":{"$":0},"gifu":{"$":0},"ginan":{"$":0},"godo":{"$":0},"gujo":{"$":0},"hashima":{"$":0},"hichiso":{"$":0},"hida":{"$":0},"higashishirakawa":{"$":0},"ibigawa":{"$":0},"ikeda":{"$":0},"kakamigahara":{"$":0},"kani":{"$":0},"kasahara":{"$":0},"kasamatsu":{"$":0},"kawaue":{"$":0},"kitagata":{"$":0},"mino":{"$":0},"minokamo":{"$":0},"mitake":{"$":0},"mizunami":{"$":0},"motosu":{"$":0},"nakatsugawa":{"$":0},"ogaki":{"$":0},"sakahogi":{"$":0},"seki":{"$":0},"sekigahara":{"$":0},"shirakawa":{"$":0},"tajimi":{"$":0},"takayama":{"$":0},"tarui":{"$":0},"toki":{"$":0},"tomika":{"$":0},"wanouchi":{"$":0},"yamagata":{"$":0},"yaotsu":{"$":0},"yoro":{"$":0}},"gunma":{"$":0,"annaka":{"$":0},"chiyoda":{"$":0},"fujioka":{"$":0},"higashiagatsuma":{"$":0},"isesaki":{"$":0},"itakura":{"$":0},"kanna":{"$":0},"kanra":{"$":0},"katashina":{"$":0},"kawaba":{"$":0},"kiryu":{"$":0},"kusatsu":{"$":0},"maebashi":{"$":0},"meiwa":{"$":0},"midori":{"$":0},"minakami":{"$":0},"naganohara":{"$":0},"nakanojo":{"$":0},"nanmoku":{"$":0},"numata":{"$":0},"oizumi":{"$":0},"ora":{"$":0},"ota":{"$":0},"shibukawa":{"$":0},"shimonita":{"$":0},"shinto":{"$":0},"showa":{"$":0},"takasaki":{"$":0},"takayama":{"$":0},"tamamura":{"$":0},"tatebayashi":{"$":0},"tomioka":{"$":0},"tsukiyono":{"$":0},"tsumagoi":{"$":0},"ueno":{"$":0},"yoshioka":{"$":0}},"hiroshima":{"$":0,"asaminami":{"$":0},"daiwa":{"$":0},"etajima":{"$":0},"fuchu":{"$":0},"fukuyama":{"$":0},"hatsukaichi":{"$":0},"higashihiroshima":{"$":0},"hongo":{"$":0},"jinsekikogen":{"$":0},"kaita":{"$":0},"kui":{"$":0},"kumano":{"$":0},"kure":{"$":0},"mihara":{"$":0},"miyoshi":{"$":0},"naka":{"$":0},"onomichi":{"$":0},"osakikamijima":{"$":0},"otake":{"$":0},"saka":{"$":0},"sera":{"$":0},"seranishi":{"$":0},"shinichi":{"$":0},"shobara":{"$":0},"takehara":{"$":0}},"hokkaido":{"$":0,"abashiri":{"$":0},"abira":{"$":0},"aibetsu":{"$":0},"akabira":{"$":0},"akkeshi":{"$":0},"asahikawa":{"$":0},"ashibetsu":{"$":0},"ashoro":{"$":0},"assabu":{"$":0},"atsuma":{"$":0},"bibai":{"$":0},"biei":{"$":0},"bifuka":{"$":0},"bihoro":{"$":0},"biratori":{"$":0},"chippubetsu":{"$":0},"chitose":{"$":0},"date":{"$":0},"ebetsu":{"$":0},"embetsu":{"$":0},"eniwa":{"$":0},"erimo":{"$":0},"esan":{"$":0},"esashi":{"$":0},"fukagawa":{"$":0},"fukushima":{"$":0},"furano":{"$":0},"furubira":{"$":0},"haboro":{"$":0},"hakodate":{"$":0},"hamatonbetsu":{"$":0},"hidaka":{"$":0},"higashikagura":{"$":0},"higashikawa":{"$":0},"hiroo":{"$":0},"hokuryu":{"$":0},"hokuto":{"$":0},"honbetsu":{"$":0},"horokanai":{"$":0},"horonobe":{"$":0},"ikeda":{"$":0},"imakane":{"$":0},"ishikari":{"$":0},"iwamizawa":{"$":0},"iwanai":{"$":0},"kamifurano":{"$":0},"kamikawa":{"$":0},"kamishihoro":{"$":0},"kamisunagawa":{"$":0},"kamoenai":{"$":0},"kayabe":{"$":0},"kembuchi":{"$":0},"kikonai":{"$":0},"kimobetsu":{"$":0},"kitahiroshima":{"$":0},"kitami":{"$":0},"kiyosato":{"$":0},"koshimizu":{"$":0},"kunneppu":{"$":0},"kuriyama":{"$":0},"kuromatsunai":{"$":0},"kushiro":{"$":0},"kutchan":{"$":0},"kyowa":{"$":0},"mashike":{"$":0},"matsumae":{"$":0},"mikasa":{"$":0},"minamifurano":{"$":0},"mombetsu":{"$":0},"moseushi":{"$":0},"mukawa":{"$":0},"muroran":{"$":0},"naie":{"$":0},"nakagawa":{"$":0},"nakasatsunai":{"$":0},"nakatombetsu":{"$":0},"nanae":{"$":0},"nanporo":{"$":0},"nayoro":{"$":0},"nemuro":{"$":0},"niikappu":{"$":0},"niki":{"$":0},"nishiokoppe":{"$":0},"noboribetsu":{"$":0},"numata":{"$":0},"obihiro":{"$":0},"obira":{"$":0},"oketo":{"$":0},"okoppe":{"$":0},"otaru":{"$":0},"otobe":{"$":0},"otofuke":{"$":0},"otoineppu":{"$":0},"oumu":{"$":0},"ozora":{"$":0},"pippu":{"$":0},"rankoshi":{"$":0},"rebun":{"$":0},"rikubetsu":{"$":0},"rishiri":{"$":0},"rishirifuji":{"$":0},"saroma":{"$":0},"sarufutsu":{"$":0},"shakotan":{"$":0},"shari":{"$":0},"shibecha":{"$":0},"shibetsu":{"$":0},"shikabe":{"$":0},"shikaoi":{"$":0},"shimamaki":{"$":0},"shimizu":{"$":0},"shimokawa":{"$":0},"shinshinotsu":{"$":0},"shintoku":{"$":0},"shiranuka":{"$":0},"shiraoi":{"$":0},"shiriuchi":{"$":0},"sobetsu":{"$":0},"sunagawa":{"$":0},"taiki":{"$":0},"takasu":{"$":0},"takikawa":{"$":0},"takinoue":{"$":0},"teshikaga":{"$":0},"tobetsu":{"$":0},"tohma":{"$":0},"tomakomai":{"$":0},"tomari":{"$":0},"toya":{"$":0},"toyako":{"$":0},"toyotomi":{"$":0},"toyoura":{"$":0},"tsubetsu":{"$":0},"tsukigata":{"$":0},"urakawa":{"$":0},"urausu":{"$":0},"uryu":{"$":0},"utashinai":{"$":0},"wakkanai":{"$":0},"wassamu":{"$":0},"yakumo":{"$":0},"yoichi":{"$":0}},"hyogo":{"$":0,"aioi":{"$":0},"akashi":{"$":0},"ako":{"$":0},"amagasaki":{"$":0},"aogaki":{"$":0},"asago":{"$":0},"ashiya":{"$":0},"awaji":{"$":0},"fukusaki":{"$":0},"goshiki":{"$":0},"harima":{"$":0},"himeji":{"$":0},"ichikawa":{"$":0},"inagawa":{"$":0},"itami":{"$":0},"kakogawa":{"$":0},"kamigori":{"$":0},"kamikawa":{"$":0},"kasai":{"$":0},"kasuga":{"$":0},"kawanishi":{"$":0},"miki":{"$":0},"minamiawaji":{"$":0},"nishinomiya":{"$":0},"nishiwaki":{"$":0},"ono":{"$":0},"sanda":{"$":0},"sannan":{"$":0},"sasayama":{"$":0},"sayo":{"$":0},"shingu":{"$":0},"shinonsen":{"$":0},"shiso":{"$":0},"sumoto":{"$":0},"taishi":{"$":0},"taka":{"$":0},"takarazuka":{"$":0},"takasago":{"$":0},"takino":{"$":0},"tamba":{"$":0},"tatsuno":{"$":0},"toyooka":{"$":0},"yabu":{"$":0},"yashiro":{"$":0},"yoka":{"$":0},"yokawa":{"$":0}},"ibaraki":{"$":0,"ami":{"$":0},"asahi":{"$":0},"bando":{"$":0},"chikusei":{"$":0},"daigo":{"$":0},"fujishiro":{"$":0},"hitachi":{"$":0},"hitachinaka":{"$":0},"hitachiomiya":{"$":0},"hitachiota":{"$":0},"ibaraki":{"$":0},"ina":{"$":0},"inashiki":{"$":0},"itako":{"$":0},"iwama":{"$":0},"joso":{"$":0},"kamisu":{"$":0},"kasama":{"$":0},"kashima":{"$":0},"kasumigaura":{"$":0},"koga":{"$":0},"miho":{"$":0},"mito":{"$":0},"moriya":{"$":0},"naka":{"$":0},"namegata":{"$":0},"oarai":{"$":0},"ogawa":{"$":0},"omitama":{"$":0},"ryugasaki":{"$":0},"sakai":{"$":0},"sakuragawa":{"$":0},"shimodate":{"$":0},"shimotsuma":{"$":0},"shirosato":{"$":0},"sowa":{"$":0},"suifu":{"$":0},"takahagi":{"$":0},"tamatsukuri":{"$":0},"tokai":{"$":0},"tomobe":{"$":0},"tone":{"$":0},"toride":{"$":0},"tsuchiura":{"$":0},"tsukuba":{"$":0},"uchihara":{"$":0},"ushiku":{"$":0},"yachiyo":{"$":0},"yamagata":{"$":0},"yawara":{"$":0},"yuki":{"$":0}},"ishikawa":{"$":0,"anamizu":{"$":0},"hakui":{"$":0},"hakusan":{"$":0},"kaga":{"$":0},"kahoku":{"$":0},"kanazawa":{"$":0},"kawakita":{"$":0},"komatsu":{"$":0},"nakanoto":{"$":0},"nanao":{"$":0},"nomi":{"$":0},"nonoichi":{"$":0},"noto":{"$":0},"shika":{"$":0},"suzu":{"$":0},"tsubata":{"$":0},"tsurugi":{"$":0},"uchinada":{"$":0},"wajima":{"$":0}},"iwate":{"$":0,"fudai":{"$":0},"fujisawa":{"$":0},"hanamaki":{"$":0},"hiraizumi":{"$":0},"hirono":{"$":0},"ichinohe":{"$":0},"ichinoseki":{"$":0},"iwaizumi":{"$":0},"iwate":{"$":0},"joboji":{"$":0},"kamaishi":{"$":0},"kanegasaki":{"$":0},"karumai":{"$":0},"kawai":{"$":0},"kitakami":{"$":0},"kuji":{"$":0},"kunohe":{"$":0},"kuzumaki":{"$":0},"miyako":{"$":0},"mizusawa":{"$":0},"morioka":{"$":0},"ninohe":{"$":0},"noda":{"$":0},"ofunato":{"$":0},"oshu":{"$":0},"otsuchi":{"$":0},"rikuzentakata":{"$":0},"shiwa":{"$":0},"shizukuishi":{"$":0},"sumita":{"$":0},"tanohata":{"$":0},"tono":{"$":0},"yahaba":{"$":0},"yamada":{"$":0}},"kagawa":{"$":0,"ayagawa":{"$":0},"higashikagawa":{"$":0},"kanonji":{"$":0},"kotohira":{"$":0},"manno":{"$":0},"marugame":{"$":0},"mitoyo":{"$":0},"naoshima":{"$":0},"sanuki":{"$":0},"tadotsu":{"$":0},"takamatsu":{"$":0},"tonosho":{"$":0},"uchinomi":{"$":0},"utazu":{"$":0},"zentsuji":{"$":0}},"kagoshima":{"$":0,"akune":{"$":0},"amami":{"$":0},"hioki":{"$":0},"isa":{"$":0},"isen":{"$":0},"izumi":{"$":0},"kagoshima":{"$":0},"kanoya":{"$":0},"kawanabe":{"$":0},"kinko":{"$":0},"kouyama":{"$":0},"makurazaki":{"$":0},"matsumoto":{"$":0},"minamitane":{"$":0},"nakatane":{"$":0},"nishinoomote":{"$":0},"satsumasendai":{"$":0},"soo":{"$":0},"tarumizu":{"$":0},"yusui":{"$":0}},"kanagawa":{"$":0,"aikawa":{"$":0},"atsugi":{"$":0},"ayase":{"$":0},"chigasaki":{"$":0},"ebina":{"$":0},"fujisawa":{"$":0},"hadano":{"$":0},"hakone":{"$":0},"hiratsuka":{"$":0},"isehara":{"$":0},"kaisei":{"$":0},"kamakura":{"$":0},"kiyokawa":{"$":0},"matsuda":{"$":0},"minamiashigara":{"$":0},"miura":{"$":0},"nakai":{"$":0},"ninomiya":{"$":0},"odawara":{"$":0},"oi":{"$":0},"oiso":{"$":0},"sagamihara":{"$":0},"samukawa":{"$":0},"tsukui":{"$":0},"yamakita":{"$":0},"yamato":{"$":0},"yokosuka":{"$":0},"yugawara":{"$":0},"zama":{"$":0},"zushi":{"$":0}},"kochi":{"$":0,"aki":{"$":0},"geisei":{"$":0},"hidaka":{"$":0},"higashitsuno":{"$":0},"ino":{"$":0},"kagami":{"$":0},"kami":{"$":0},"kitagawa":{"$":0},"kochi":{"$":0},"mihara":{"$":0},"motoyama":{"$":0},"muroto":{"$":0},"nahari":{"$":0},"nakamura":{"$":0},"nankoku":{"$":0},"nishitosa":{"$":0},"niyodogawa":{"$":0},"ochi":{"$":0},"okawa":{"$":0},"otoyo":{"$":0},"otsuki":{"$":0},"sakawa":{"$":0},"sukumo":{"$":0},"susaki":{"$":0},"tosa":{"$":0},"tosashimizu":{"$":0},"toyo":{"$":0},"tsuno":{"$":0},"umaji":{"$":0},"yasuda":{"$":0},"yusuhara":{"$":0}},"kumamoto":{"$":0,"amakusa":{"$":0},"arao":{"$":0},"aso":{"$":0},"choyo":{"$":0},"gyokuto":{"$":0},"kamiamakusa":{"$":0},"kikuchi":{"$":0},"kumamoto":{"$":0},"mashiki":{"$":0},"mifune":{"$":0},"minamata":{"$":0},"minamioguni":{"$":0},"nagasu":{"$":0},"nishihara":{"$":0},"oguni":{"$":0},"ozu":{"$":0},"sumoto":{"$":0},"takamori":{"$":0},"uki":{"$":0},"uto":{"$":0},"yamaga":{"$":0},"yamato":{"$":0},"yatsushiro":{"$":0}},"kyoto":{"$":0,"ayabe":{"$":0},"fukuchiyama":{"$":0},"higashiyama":{"$":0},"ide":{"$":0},"ine":{"$":0},"joyo":{"$":0},"kameoka":{"$":0},"kamo":{"$":0},"kita":{"$":0},"kizu":{"$":0},"kumiyama":{"$":0},"kyotamba":{"$":0},"kyotanabe":{"$":0},"kyotango":{"$":0},"maizuru":{"$":0},"minami":{"$":0},"minamiyamashiro":{"$":0},"miyazu":{"$":0},"muko":{"$":0},"nagaokakyo":{"$":0},"nakagyo":{"$":0},"nantan":{"$":0},"oyamazaki":{"$":0},"sakyo":{"$":0},"seika":{"$":0},"tanabe":{"$":0},"uji":{"$":0},"ujitawara":{"$":0},"wazuka":{"$":0},"yamashina":{"$":0},"yawata":{"$":0}},"mie":{"$":0,"asahi":{"$":0},"inabe":{"$":0},"ise":{"$":0},"kameyama":{"$":0},"kawagoe":{"$":0},"kiho":{"$":0},"kisosaki":{"$":0},"kiwa":{"$":0},"komono":{"$":0},"kumano":{"$":0},"kuwana":{"$":0},"matsusaka":{"$":0},"meiwa":{"$":0},"mihama":{"$":0},"minamiise":{"$":0},"misugi":{"$":0},"miyama":{"$":0},"nabari":{"$":0},"shima":{"$":0},"suzuka":{"$":0},"tado":{"$":0},"taiki":{"$":0},"taki":{"$":0},"tamaki":{"$":0},"toba":{"$":0},"tsu":{"$":0},"udono":{"$":0},"ureshino":{"$":0},"watarai":{"$":0},"yokkaichi":{"$":0}},"miyagi":{"$":0,"furukawa":{"$":0},"higashimatsushima":{"$":0},"ishinomaki":{"$":0},"iwanuma":{"$":0},"kakuda":{"$":0},"kami":{"$":0},"kawasaki":{"$":0},"marumori":{"$":0},"matsushima":{"$":0},"minamisanriku":{"$":0},"misato":{"$":0},"murata":{"$":0},"natori":{"$":0},"ogawara":{"$":0},"ohira":{"$":0},"onagawa":{"$":0},"osaki":{"$":0},"rifu":{"$":0},"semine":{"$":0},"shibata":{"$":0},"shichikashuku":{"$":0},"shikama":{"$":0},"shiogama":{"$":0},"shiroishi":{"$":0},"tagajo":{"$":0},"taiwa":{"$":0},"tome":{"$":0},"tomiya":{"$":0},"wakuya":{"$":0},"watari":{"$":0},"yamamoto":{"$":0},"zao":{"$":0}},"miyazaki":{"$":0,"aya":{"$":0},"ebino":{"$":0},"gokase":{"$":0},"hyuga":{"$":0},"kadogawa":{"$":0},"kawaminami":{"$":0},"kijo":{"$":0},"kitagawa":{"$":0},"kitakata":{"$":0},"kitaura":{"$":0},"kobayashi":{"$":0},"kunitomi":{"$":0},"kushima":{"$":0},"mimata":{"$":0},"miyakonojo":{"$":0},"miyazaki":{"$":0},"morotsuka":{"$":0},"nichinan":{"$":0},"nishimera":{"$":0},"nobeoka":{"$":0},"saito":{"$":0},"shiiba":{"$":0},"shintomi":{"$":0},"takaharu":{"$":0},"takanabe":{"$":0},"takazaki":{"$":0},"tsuno":{"$":0}},"nagano":{"$":0,"achi":{"$":0},"agematsu":{"$":0},"anan":{"$":0},"aoki":{"$":0},"asahi":{"$":0},"azumino":{"$":0},"chikuhoku":{"$":0},"chikuma":{"$":0},"chino":{"$":0},"fujimi":{"$":0},"hakuba":{"$":0},"hara":{"$":0},"hiraya":{"$":0},"iida":{"$":0},"iijima":{"$":0},"iiyama":{"$":0},"iizuna":{"$":0},"ikeda":{"$":0},"ikusaka":{"$":0},"ina":{"$":0},"karuizawa":{"$":0},"kawakami":{"$":0},"kiso":{"$":0},"kisofukushima":{"$":0},"kitaaiki":{"$":0},"komagane":{"$":0},"komoro":{"$":0},"matsukawa":{"$":0},"matsumoto":{"$":0},"miasa":{"$":0},"minamiaiki":{"$":0},"minamimaki":{"$":0},"minamiminowa":{"$":0},"minowa":{"$":0},"miyada":{"$":0},"miyota":{"$":0},"mochizuki":{"$":0},"nagano":{"$":0},"nagawa":{"$":0},"nagiso":{"$":0},"nakagawa":{"$":0},"nakano":{"$":0},"nozawaonsen":{"$":0},"obuse":{"$":0},"ogawa":{"$":0},"okaya":{"$":0},"omachi":{"$":0},"omi":{"$":0},"ookuwa":{"$":0},"ooshika":{"$":0},"otaki":{"$":0},"otari":{"$":0},"sakae":{"$":0},"sakaki":{"$":0},"saku":{"$":0},"sakuho":{"$":0},"shimosuwa":{"$":0},"shinanomachi":{"$":0},"shiojiri":{"$":0},"suwa":{"$":0},"suzaka":{"$":0},"takagi":{"$":0},"takamori":{"$":0},"takayama":{"$":0},"tateshina":{"$":0},"tatsuno":{"$":0},"togakushi":{"$":0},"togura":{"$":0},"tomi":{"$":0},"ueda":{"$":0},"wada":{"$":0},"yamagata":{"$":0},"yamanouchi":{"$":0},"yasaka":{"$":0},"yasuoka":{"$":0}},"nagasaki":{"$":0,"chijiwa":{"$":0},"futsu":{"$":0},"goto":{"$":0},"hasami":{"$":0},"hirado":{"$":0},"iki":{"$":0},"isahaya":{"$":0},"kawatana":{"$":0},"kuchinotsu":{"$":0},"matsuura":{"$":0},"nagasaki":{"$":0},"obama":{"$":0},"omura":{"$":0},"oseto":{"$":0},"saikai":{"$":0},"sasebo":{"$":0},"seihi":{"$":0},"shimabara":{"$":0},"shinkamigoto":{"$":0},"togitsu":{"$":0},"tsushima":{"$":0},"unzen":{"$":0}},"nara":{"$":0,"ando":{"$":0},"gose":{"$":0},"heguri":{"$":0},"higashiyoshino":{"$":0},"ikaruga":{"$":0},"ikoma":{"$":0},"kamikitayama":{"$":0},"kanmaki":{"$":0},"kashiba":{"$":0},"kashihara":{"$":0},"katsuragi":{"$":0},"kawai":{"$":0},"kawakami":{"$":0},"kawanishi":{"$":0},"koryo":{"$":0},"kurotaki":{"$":0},"mitsue":{"$":0},"miyake":{"$":0},"nara":{"$":0},"nosegawa":{"$":0},"oji":{"$":0},"ouda":{"$":0},"oyodo":{"$":0},"sakurai":{"$":0},"sango":{"$":0},"shimoichi":{"$":0},"shimokitayama":{"$":0},"shinjo":{"$":0},"soni":{"$":0},"takatori":{"$":0},"tawaramoto":{"$":0},"tenkawa":{"$":0},"tenri":{"$":0},"uda":{"$":0},"yamatokoriyama":{"$":0},"yamatotakada":{"$":0},"yamazoe":{"$":0},"yoshino":{"$":0}},"niigata":{"$":0,"aga":{"$":0},"agano":{"$":0},"gosen":{"$":0},"itoigawa":{"$":0},"izumozaki":{"$":0},"joetsu":{"$":0},"kamo":{"$":0},"kariwa":{"$":0},"kashiwazaki":{"$":0},"minamiuonuma":{"$":0},"mitsuke":{"$":0},"muika":{"$":0},"murakami":{"$":0},"myoko":{"$":0},"nagaoka":{"$":0},"niigata":{"$":0},"ojiya":{"$":0},"omi":{"$":0},"sado":{"$":0},"sanjo":{"$":0},"seiro":{"$":0},"seirou":{"$":0},"sekikawa":{"$":0},"shibata":{"$":0},"tagami":{"$":0},"tainai":{"$":0},"tochio":{"$":0},"tokamachi":{"$":0},"tsubame":{"$":0},"tsunan":{"$":0},"uonuma":{"$":0},"yahiko":{"$":0},"yoita":{"$":0},"yuzawa":{"$":0}},"oita":{"$":0,"beppu":{"$":0},"bungoono":{"$":0},"bungotakada":{"$":0},"hasama":{"$":0},"hiji":{"$":0},"himeshima":{"$":0},"hita":{"$":0},"kamitsue":{"$":0},"kokonoe":{"$":0},"kuju":{"$":0},"kunisaki":{"$":0},"kusu":{"$":0},"oita":{"$":0},"saiki":{"$":0},"taketa":{"$":0},"tsukumi":{"$":0},"usa":{"$":0},"usuki":{"$":0},"yufu":{"$":0}},"okayama":{"$":0,"akaiwa":{"$":0},"asakuchi":{"$":0},"bizen":{"$":0},"hayashima":{"$":0},"ibara":{"$":0},"kagamino":{"$":0},"kasaoka":{"$":0},"kibichuo":{"$":0},"kumenan":{"$":0},"kurashiki":{"$":0},"maniwa":{"$":0},"misaki":{"$":0},"nagi":{"$":0},"niimi":{"$":0},"nishiawakura":{"$":0},"okayama":{"$":0},"satosho":{"$":0},"setouchi":{"$":0},"shinjo":{"$":0},"shoo":{"$":0},"soja":{"$":0},"takahashi":{"$":0},"tamano":{"$":0},"tsuyama":{"$":0},"wake":{"$":0},"yakage":{"$":0}},"okinawa":{"$":0,"aguni":{"$":0},"ginowan":{"$":0},"ginoza":{"$":0},"gushikami":{"$":0},"haebaru":{"$":0},"higashi":{"$":0},"hirara":{"$":0},"iheya":{"$":0},"ishigaki":{"$":0},"ishikawa":{"$":0},"itoman":{"$":0},"izena":{"$":0},"kadena":{"$":0},"kin":{"$":0},"kitadaito":{"$":0},"kitanakagusuku":{"$":0},"kumejima":{"$":0},"kunigami":{"$":0},"minamidaito":{"$":0},"motobu":{"$":0},"nago":{"$":0},"naha":{"$":0},"nakagusuku":{"$":0},"nakijin":{"$":0},"nanjo":{"$":0},"nishihara":{"$":0},"ogimi":{"$":0},"okinawa":{"$":0},"onna":{"$":0},"shimoji":{"$":0},"taketomi":{"$":0},"tarama":{"$":0},"tokashiki":{"$":0},"tomigusuku":{"$":0},"tonaki":{"$":0},"urasoe":{"$":0},"uruma":{"$":0},"yaese":{"$":0},"yomitan":{"$":0},"yonabaru":{"$":0},"yonaguni":{"$":0},"zamami":{"$":0}},"osaka":{"$":0,"abeno":{"$":0},"chihayaakasaka":{"$":0},"chuo":{"$":0},"daito":{"$":0},"fujiidera":{"$":0},"habikino":{"$":0},"hannan":{"$":0},"higashiosaka":{"$":0},"higashisumiyoshi":{"$":0},"higashiyodogawa":{"$":0},"hirakata":{"$":0},"ibaraki":{"$":0},"ikeda":{"$":0},"izumi":{"$":0},"izumiotsu":{"$":0},"izumisano":{"$":0},"kadoma":{"$":0},"kaizuka":{"$":0},"kanan":{"$":0},"kashiwara":{"$":0},"katano":{"$":0},"kawachinagano":{"$":0},"kishiwada":{"$":0},"kita":{"$":0},"kumatori":{"$":0},"matsubara":{"$":0},"minato":{"$":0},"minoh":{"$":0},"misaki":{"$":0},"moriguchi":{"$":0},"neyagawa":{"$":0},"nishi":{"$":0},"nose":{"$":0},"osakasayama":{"$":0},"sakai":{"$":0},"sayama":{"$":0},"sennan":{"$":0},"settsu":{"$":0},"shijonawate":{"$":0},"shimamoto":{"$":0},"suita":{"$":0},"tadaoka":{"$":0},"taishi":{"$":0},"tajiri":{"$":0},"takaishi":{"$":0},"takatsuki":{"$":0},"tondabayashi":{"$":0},"toyonaka":{"$":0},"toyono":{"$":0},"yao":{"$":0}},"saga":{"$":0,"ariake":{"$":0},"arita":{"$":0},"fukudomi":{"$":0},"genkai":{"$":0},"hamatama":{"$":0},"hizen":{"$":0},"imari":{"$":0},"kamimine":{"$":0},"kanzaki":{"$":0},"karatsu":{"$":0},"kashima":{"$":0},"kitagata":{"$":0},"kitahata":{"$":0},"kiyama":{"$":0},"kouhoku":{"$":0},"kyuragi":{"$":0},"nishiarita":{"$":0},"ogi":{"$":0},"omachi":{"$":0},"ouchi":{"$":0},"saga":{"$":0},"shiroishi":{"$":0},"taku":{"$":0},"tara":{"$":0},"tosu":{"$":0},"yoshinogari":{"$":0}},"saitama":{"$":0,"arakawa":{"$":0},"asaka":{"$":0},"chichibu":{"$":0},"fujimi":{"$":0},"fujimino":{"$":0},"fukaya":{"$":0},"hanno":{"$":0},"hanyu":{"$":0},"hasuda":{"$":0},"hatogaya":{"$":0},"hatoyama":{"$":0},"hidaka":{"$":0},"higashichichibu":{"$":0},"higashimatsuyama":{"$":0},"honjo":{"$":0},"ina":{"$":0},"iruma":{"$":0},"iwatsuki":{"$":0},"kamiizumi":{"$":0},"kamikawa":{"$":0},"kamisato":{"$":0},"kasukabe":{"$":0},"kawagoe":{"$":0},"kawaguchi":{"$":0},"kawajima":{"$":0},"kazo":{"$":0},"kitamoto":{"$":0},"koshigaya":{"$":0},"kounosu":{"$":0},"kuki":{"$":0},"kumagaya":{"$":0},"matsubushi":{"$":0},"minano":{"$":0},"misato":{"$":0},"miyashiro":{"$":0},"miyoshi":{"$":0},"moroyama":{"$":0},"nagatoro":{"$":0},"namegawa":{"$":0},"niiza":{"$":0},"ogano":{"$":0},"ogawa":{"$":0},"ogose":{"$":0},"okegawa":{"$":0},"omiya":{"$":0},"otaki":{"$":0},"ranzan":{"$":0},"ryokami":{"$":0},"saitama":{"$":0},"sakado":{"$":0},"satte":{"$":0},"sayama":{"$":0},"shiki":{"$":0},"shiraoka":{"$":0},"soka":{"$":0},"sugito":{"$":0},"toda":{"$":0},"tokigawa":{"$":0},"tokorozawa":{"$":0},"tsurugashima":{"$":0},"urawa":{"$":0},"warabi":{"$":0},"yashio":{"$":0},"yokoze":{"$":0},"yono":{"$":0},"yorii":{"$":0},"yoshida":{"$":0},"yoshikawa":{"$":0},"yoshimi":{"$":0}},"shiga":{"$":0,"aisho":{"$":0},"gamo":{"$":0},"higashiomi":{"$":0},"hikone":{"$":0},"koka":{"$":0},"konan":{"$":0},"kosei":{"$":0},"koto":{"$":0},"kusatsu":{"$":0},"maibara":{"$":0},"moriyama":{"$":0},"nagahama":{"$":0},"nishiazai":{"$":0},"notogawa":{"$":0},"omihachiman":{"$":0},"otsu":{"$":0},"ritto":{"$":0},"ryuoh":{"$":0},"takashima":{"$":0},"takatsuki":{"$":0},"torahime":{"$":0},"toyosato":{"$":0},"yasu":{"$":0}},"shimane":{"$":0,"akagi":{"$":0},"ama":{"$":0},"gotsu":{"$":0},"hamada":{"$":0},"higashiizumo":{"$":0},"hikawa":{"$":0},"hikimi":{"$":0},"izumo":{"$":0},"kakinoki":{"$":0},"masuda":{"$":0},"matsue":{"$":0},"misato":{"$":0},"nishinoshima":{"$":0},"ohda":{"$":0},"okinoshima":{"$":0},"okuizumo":{"$":0},"shimane":{"$":0},"tamayu":{"$":0},"tsuwano":{"$":0},"unnan":{"$":0},"yakumo":{"$":0},"yasugi":{"$":0},"yatsuka":{"$":0}},"shizuoka":{"$":0,"arai":{"$":0},"atami":{"$":0},"fuji":{"$":0},"fujieda":{"$":0},"fujikawa":{"$":0},"fujinomiya":{"$":0},"fukuroi":{"$":0},"gotemba":{"$":0},"haibara":{"$":0},"hamamatsu":{"$":0},"higashiizu":{"$":0},"ito":{"$":0},"iwata":{"$":0},"izu":{"$":0},"izunokuni":{"$":0},"kakegawa":{"$":0},"kannami":{"$":0},"kawanehon":{"$":0},"kawazu":{"$":0},"kikugawa":{"$":0},"kosai":{"$":0},"makinohara":{"$":0},"matsuzaki":{"$":0},"minamiizu":{"$":0},"mishima":{"$":0},"morimachi":{"$":0},"nishiizu":{"$":0},"numazu":{"$":0},"omaezaki":{"$":0},"shimada":{"$":0},"shimizu":{"$":0},"shimoda":{"$":0},"shizuoka":{"$":0},"susono":{"$":0},"yaizu":{"$":0},"yoshida":{"$":0}},"tochigi":{"$":0,"ashikaga":{"$":0},"bato":{"$":0},"haga":{"$":0},"ichikai":{"$":0},"iwafune":{"$":0},"kaminokawa":{"$":0},"kanuma":{"$":0},"karasuyama":{"$":0},"kuroiso":{"$":0},"mashiko":{"$":0},"mibu":{"$":0},"moka":{"$":0},"motegi":{"$":0},"nasu":{"$":0},"nasushiobara":{"$":0},"nikko":{"$":0},"nishikata":{"$":0},"nogi":{"$":0},"ohira":{"$":0},"ohtawara":{"$":0},"oyama":{"$":0},"sakura":{"$":0},"sano":{"$":0},"shimotsuke":{"$":0},"shioya":{"$":0},"takanezawa":{"$":0},"tochigi":{"$":0},"tsuga":{"$":0},"ujiie":{"$":0},"utsunomiya":{"$":0},"yaita":{"$":0}},"tokushima":{"$":0,"aizumi":{"$":0},"anan":{"$":0},"ichiba":{"$":0},"itano":{"$":0},"kainan":{"$":0},"komatsushima":{"$":0},"matsushige":{"$":0},"mima":{"$":0},"minami":{"$":0},"miyoshi":{"$":0},"mugi":{"$":0},"nakagawa":{"$":0},"naruto":{"$":0},"sanagochi":{"$":0},"shishikui":{"$":0},"tokushima":{"$":0},"wajiki":{"$":0}},"tokyo":{"$":0,"adachi":{"$":0},"akiruno":{"$":0},"akishima":{"$":0},"aogashima":{"$":0},"arakawa":{"$":0},"bunkyo":{"$":0},"chiyoda":{"$":0},"chofu":{"$":0},"chuo":{"$":0},"edogawa":{"$":0},"fuchu":{"$":0},"fussa":{"$":0},"hachijo":{"$":0},"hachioji":{"$":0},"hamura":{"$":0},"higashikurume":{"$":0},"higashimurayama":{"$":0},"higashiyamato":{"$":0},"hino":{"$":0},"hinode":{"$":0},"hinohara":{"$":0},"inagi":{"$":0},"itabashi":{"$":0},"katsushika":{"$":0},"kita":{"$":0},"kiyose":{"$":0},"kodaira":{"$":0},"koganei":{"$":0},"kokubunji":{"$":0},"komae":{"$":0},"koto":{"$":0},"kouzushima":{"$":0},"kunitachi":{"$":0},"machida":{"$":0},"meguro":{"$":0},"minato":{"$":0},"mitaka":{"$":0},"mizuho":{"$":0},"musashimurayama":{"$":0},"musashino":{"$":0},"nakano":{"$":0},"nerima":{"$":0},"ogasawara":{"$":0},"okutama":{"$":0},"ome":{"$":0},"oshima":{"$":0},"ota":{"$":0},"setagaya":{"$":0},"shibuya":{"$":0},"shinagawa":{"$":0},"shinjuku":{"$":0},"suginami":{"$":0},"sumida":{"$":0},"tachikawa":{"$":0},"taito":{"$":0},"tama":{"$":0},"toshima":{"$":0}},"tottori":{"$":0,"chizu":{"$":0},"hino":{"$":0},"kawahara":{"$":0},"koge":{"$":0},"kotoura":{"$":0},"misasa":{"$":0},"nanbu":{"$":0},"nichinan":{"$":0},"sakaiminato":{"$":0},"tottori":{"$":0},"wakasa":{"$":0},"yazu":{"$":0},"yonago":{"$":0}},"toyama":{"$":0,"asahi":{"$":0},"fuchu":{"$":0},"fukumitsu":{"$":0},"funahashi":{"$":0},"himi":{"$":0},"imizu":{"$":0},"inami":{"$":0},"johana":{"$":0},"kamiichi":{"$":0},"kurobe":{"$":0},"nakaniikawa":{"$":0},"namerikawa":{"$":0},"nanto":{"$":0},"nyuzen":{"$":0},"oyabe":{"$":0},"taira":{"$":0},"takaoka":{"$":0},"tateyama":{"$":0},"toga":{"$":0},"tonami":{"$":0},"toyama":{"$":0},"unazuki":{"$":0},"uozu":{"$":0},"yamada":{"$":0}},"wakayama":{"$":0,"arida":{"$":0},"aridagawa":{"$":0},"gobo":{"$":0},"hashimoto":{"$":0},"hidaka":{"$":0},"hirogawa":{"$":0},"inami":{"$":0},"iwade":{"$":0},"kainan":{"$":0},"kamitonda":{"$":0},"katsuragi":{"$":0},"kimino":{"$":0},"kinokawa":{"$":0},"kitayama":{"$":0},"koya":{"$":0},"koza":{"$":0},"kozagawa":{"$":0},"kudoyama":{"$":0},"kushimoto":{"$":0},"mihama":{"$":0},"misato":{"$":0},"nachikatsuura":{"$":0},"shingu":{"$":0},"shirahama":{"$":0},"taiji":{"$":0},"tanabe":{"$":0},"wakayama":{"$":0},"yuasa":{"$":0},"yura":{"$":0}},"yamagata":{"$":0,"asahi":{"$":0},"funagata":{"$":0},"higashine":{"$":0},"iide":{"$":0},"kahoku":{"$":0},"kaminoyama":{"$":0},"kaneyama":{"$":0},"kawanishi":{"$":0},"mamurogawa":{"$":0},"mikawa":{"$":0},"murayama":{"$":0},"nagai":{"$":0},"nakayama":{"$":0},"nanyo":{"$":0},"nishikawa":{"$":0},"obanazawa":{"$":0},"oe":{"$":0},"oguni":{"$":0},"ohkura":{"$":0},"oishida":{"$":0},"sagae":{"$":0},"sakata":{"$":0},"sakegawa":{"$":0},"shinjo":{"$":0},"shirataka":{"$":0},"shonai":{"$":0},"takahata":{"$":0},"tendo":{"$":0},"tozawa":{"$":0},"tsuruoka":{"$":0},"yamagata":{"$":0},"yamanobe":{"$":0},"yonezawa":{"$":0},"yuza":{"$":0}},"yamaguchi":{"$":0,"abu":{"$":0},"hagi":{"$":0},"hikari":{"$":0},"hofu":{"$":0},"iwakuni":{"$":0},"kudamatsu":{"$":0},"mitou":{"$":0},"nagato":{"$":0},"oshima":{"$":0},"shimonoseki":{"$":0},"shunan":{"$":0},"tabuse":{"$":0},"tokuyama":{"$":0},"toyota":{"$":0},"ube":{"$":0},"yuu":{"$":0}},"yamanashi":{"$":0,"chuo":{"$":0},"doshi":{"$":0},"fuefuki":{"$":0},"fujikawa":{"$":0},"fujikawaguchiko":{"$":0},"fujiyoshida":{"$":0},"hayakawa":{"$":0},"hokuto":{"$":0},"ichikawamisato":{"$":0},"kai":{"$":0},"kofu":{"$":0},"koshu":{"$":0},"kosuge":{"$":0},"minami-alps":{"$":0},"minobu":{"$":0},"nakamichi":{"$":0},"nanbu":{"$":0},"narusawa":{"$":0},"nirasaki":{"$":0},"nishikatsura":{"$":0},"oshino":{"$":0},"otsuki":{"$":0},"showa":{"$":0},"tabayama":{"$":0},"tsuru":{"$":0},"uenohara":{"$":0},"yamanakako":{"$":0},"yamanashi":{"$":0}},"xn--4pvxs":{"$":0},"xn--vgu402c":{"$":0},"xn--c3s14m":{"$":0},"xn--f6qx53a":{"$":0},"xn--8pvr4u":{"$":0},"xn--uist22h":{"$":0},"xn--djrs72d6uy":{"$":0},"xn--mkru45i":{"$":0},"xn--0trq7p7nn":{"$":0},"xn--8ltr62k":{"$":0},"xn--2m4a15e":{"$":0},"xn--efvn9s":{"$":0},"xn--32vp30h":{"$":0},"xn--4it797k":{"$":0},"xn--1lqs71d":{"$":0},"xn--5rtp49c":{"$":0},"xn--5js045d":{"$":0},"xn--ehqz56n":{"$":0},"xn--1lqs03n":{"$":0},"xn--qqqt11m":{"$":0},"xn--kbrq7o":{"$":0},"xn--pssu33l":{"$":0},"xn--ntsq17g":{"$":0},"xn--uisz3g":{"$":0},"xn--6btw5a":{"$":0},"xn--1ctwo":{"$":0},"xn--6orx2r":{"$":0},"xn--rht61e":{"$":0},"xn--rht27z":{"$":0},"xn--djty4k":{"$":0},"xn--nit225k":{"$":0},"xn--rht3d":{"$":0},"xn--klty5x":{"$":0},"xn--kltx9a":{"$":0},"xn--kltp7d":{"$":0},"xn--uuwu58a":{"$":0},"xn--zbx025d":{"$":0},"xn--ntso0iqx3a":{"$":0},"xn--elqq16h":{"$":0},"xn--4it168d":{"$":0},"xn--klt787d":{"$":0},"xn--rny31h":{"$":0},"xn--7t0a264c":{"$":0},"xn--5rtq34k":{"$":0},"xn--k7yn95e":{"$":0},"xn--tor131o":{"$":0},"xn--d5qv7z876c":{"$":0},"kawasaki":{"*":{"$":0}},"kitakyushu":{"*":{"$":0}},"kobe":{"*":{"$":0}},"nagoya":{"*":{"$":0}},"sapporo":{"*":{"$":0}},"sendai":{"*":{"$":0}},"yokohama":{"*":{"$":0}},"blogspot":{"$":0}},"ke":{"*":{"$":0},"co":{"blogspot":{"$":0}}},"kg":{"$":0,"org":{"$":0},"net":{"$":0},"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"mil":{"$":0}},"kh":{"*":{"$":0}},"ki":{"$":0,"edu":{"$":0},"biz":{"$":0},"net":{"$":0},"org":{"$":0},"gov":{"$":0},"info":{"$":0},"com":{"$":0}},"km":{"$":0,"org":{"$":0},"nom":{"$":0},"gov":{"$":0},"prd":{"$":0},"tm":{"$":0},"edu":{"$":0},"mil":{"$":0},"ass":{"$":0},"com":{"$":0},"coop":{"$":0},"asso":{"$":0},"presse":{"$":0},"medecin":{"$":0},"notaires":{"$":0},"pharmaciens":{"$":0},"veterinaire":{"$":0},"gouv":{"$":0}},"kn":{"$":0,"net":{"$":0},"org":{"$":0},"edu":{"$":0},"gov":{"$":0}},"kp":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"org":{"$":0},"rep":{"$":0},"tra":{"$":0}},"kr":{"$":0,"ac":{"$":0},"co":{"$":0},"es":{"$":0},"go":{"$":0},"hs":{"$":0},"kg":{"$":0},"mil":{"$":0},"ms":{"$":0},"ne":{"$":0},"or":{"$":0},"pe":{"$":0},"re":{"$":0},"sc":{"$":0},"busan":{"$":0},"chungbuk":{"$":0},"chungnam":{"$":0},"daegu":{"$":0},"daejeon":{"$":0},"gangwon":{"$":0},"gwangju":{"$":0},"gyeongbuk":{"$":0},"gyeonggi":{"$":0},"gyeongnam":{"$":0},"incheon":{"$":0},"jeju":{"$":0},"jeonbuk":{"$":0},"jeonnam":{"$":0},"seoul":{"$":0},"ulsan":{"$":0},"blogspot":{"$":0}},"kw":{"*":{"$":0}},"ky":{"$":0,"edu":{"$":0},"gov":{"$":0},"com":{"$":0},"org":{"$":0},"net":{"$":0}},"kz":{"$":0,"org":{"$":0},"edu":{"$":0},"net":{"$":0},"gov":{"$":0},"mil":{"$":0},"com":{"$":0},"nym":{"$":0}},"la":{"$":0,"int":{"$":0},"net":{"$":0},"info":{"$":0},"edu":{"$":0},"gov":{"$":0},"per":{"$":0},"com":{"$":0},"org":{"$":0},"bnr":{"$":0},"c":{"$":0},"nym":{"$":0}},"lb":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"net":{"$":0},"org":{"$":0}},"lc":{"$":0,"com":{"$":0},"net":{"$":0},"co":{"$":0},"org":{"$":0},"edu":{"$":0},"gov":{"$":0},"oy":{"$":0}},"li":{"$":0,"blogspot":{"$":0},"nom":{"$":0},"nym":{"$":0}},"lk":{"$":0,"gov":{"$":0},"sch":{"$":0},"net":{"$":0},"int":{"$":0},"com":{"$":0},"org":{"$":0},"edu":{"$":0},"ngo":{"$":0},"soc":{"$":0},"web":{"$":0},"ltd":{"$":0},"assn":{"$":0},"grp":{"$":0},"hotel":{"$":0},"ac":{"$":0}},"lr":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"org":{"$":0},"net":{"$":0}},"ls":{"$":0,"co":{"$":0},"org":{"$":0}},"lt":{"$":0,"gov":{"$":0},"blogspot":{"$":0},"nym":{"$":0}},"lu":{"$":0,"blogspot":{"$":0},"nym":{"$":0}},"lv":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"org":{"$":0},"mil":{"$":0},"id":{"$":0},"net":{"$":0},"asn":{"$":0},"conf":{"$":0}},"ly":{"$":0,"com":{"$":0},"net":{"$":0},"gov":{"$":0},"plc":{"$":0},"edu":{"$":0},"sch":{"$":0},"med":{"$":0},"org":{"$":0},"id":{"$":0}},"ma":{"$":0,"co":{"$":0},"net":{"$":0},"gov":{"$":0},"org":{"$":0},"ac":{"$":0},"press":{"$":0}},"mc":{"$":0,"tm":{"$":0},"asso":{"$":0}},"md":{"$":0,"blogspot":{"$":0}},"me":{"$":0,"co":{"$":0},"net":{"$":0},"org":{"$":0},"edu":{"$":0},"ac":{"$":0},"gov":{"$":0},"its":{"$":0},"priv":{"$":0},"c66":{"$":0},"daplie":{"$":0,"localhost":{"$":0}},"filegear":{"$":0},"brasilia":{"$":0},"ddns":{"$":0},"dnsfor":{"$":0},"hopto":{"$":0},"loginto":{"$":0},"noip":{"$":0},"webhop":{"$":0},"nym":{"$":0},"diskstation":{"$":0},"dscloud":{"$":0},"i234":{"$":0},"myds":{"$":0},"synology":{"$":0},"wedeploy":{"$":0},"yombo":{"$":0}},"mg":{"$":0,"org":{"$":0},"nom":{"$":0},"gov":{"$":0},"prd":{"$":0},"tm":{"$":0},"edu":{"$":0},"mil":{"$":0},"com":{"$":0},"co":{"$":0}},"mh":{"$":0},"mil":{"$":0},"mk":{"$":0,"com":{"$":0},"org":{"$":0},"net":{"$":0},"edu":{"$":0},"gov":{"$":0},"inf":{"$":0},"name":{"$":0},"blogspot":{"$":0},"nom":{"$":0}},"ml":{"$":0,"com":{"$":0},"edu":{"$":0},"gouv":{"$":0},"gov":{"$":0},"net":{"$":0},"org":{"$":0},"presse":{"$":0}},"mm":{"*":{"$":0}},"mn":{"$":0,"gov":{"$":0},"edu":{"$":0},"org":{"$":0},"nyc":{"$":0}},"mo":{"$":0,"com":{"$":0},"net":{"$":0},"org":{"$":0},"edu":{"$":0},"gov":{"$":0}},"mobi":{"$":0,"dscloud":{"$":0}},"mp":{"$":0},"mq":{"$":0},"mr":{"$":0,"gov":{"$":0},"blogspot":{"$":0}},"ms":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"net":{"$":0},"org":{"$":0}},"mt":{"$":0,"com":{"$":0,"blogspot":{"$":0}},"edu":{"$":0},"net":{"$":0},"org":{"$":0}},"mu":{"$":0,"com":{"$":0},"net":{"$":0},"org":{"$":0},"gov":{"$":0},"ac":{"$":0},"co":{"$":0},"or":{"$":0}},"museum":{"$":0,"academy":{"$":0},"agriculture":{"$":0},"air":{"$":0},"airguard":{"$":0},"alabama":{"$":0},"alaska":{"$":0},"amber":{"$":0},"ambulance":{"$":0},"american":{"$":0},"americana":{"$":0},"americanantiques":{"$":0},"americanart":{"$":0},"amsterdam":{"$":0},"and":{"$":0},"annefrank":{"$":0},"anthro":{"$":0},"anthropology":{"$":0},"antiques":{"$":0},"aquarium":{"$":0},"arboretum":{"$":0},"archaeological":{"$":0},"archaeology":{"$":0},"architecture":{"$":0},"art":{"$":0},"artanddesign":{"$":0},"artcenter":{"$":0},"artdeco":{"$":0},"arteducation":{"$":0},"artgallery":{"$":0},"arts":{"$":0},"artsandcrafts":{"$":0},"asmatart":{"$":0},"assassination":{"$":0},"assisi":{"$":0},"association":{"$":0},"astronomy":{"$":0},"atlanta":{"$":0},"austin":{"$":0},"australia":{"$":0},"automotive":{"$":0},"aviation":{"$":0},"axis":{"$":0},"badajoz":{"$":0},"baghdad":{"$":0},"bahn":{"$":0},"bale":{"$":0},"baltimore":{"$":0},"barcelona":{"$":0},"baseball":{"$":0},"basel":{"$":0},"baths":{"$":0},"bauern":{"$":0},"beauxarts":{"$":0},"beeldengeluid":{"$":0},"bellevue":{"$":0},"bergbau":{"$":0},"berkeley":{"$":0},"berlin":{"$":0},"bern":{"$":0},"bible":{"$":0},"bilbao":{"$":0},"bill":{"$":0},"birdart":{"$":0},"birthplace":{"$":0},"bonn":{"$":0},"boston":{"$":0},"botanical":{"$":0},"botanicalgarden":{"$":0},"botanicgarden":{"$":0},"botany":{"$":0},"brandywinevalley":{"$":0},"brasil":{"$":0},"bristol":{"$":0},"british":{"$":0},"britishcolumbia":{"$":0},"broadcast":{"$":0},"brunel":{"$":0},"brussel":{"$":0},"brussels":{"$":0},"bruxelles":{"$":0},"building":{"$":0},"burghof":{"$":0},"bus":{"$":0},"bushey":{"$":0},"cadaques":{"$":0},"california":{"$":0},"cambridge":{"$":0},"can":{"$":0},"canada":{"$":0},"capebreton":{"$":0},"carrier":{"$":0},"cartoonart":{"$":0},"casadelamoneda":{"$":0},"castle":{"$":0},"castres":{"$":0},"celtic":{"$":0},"center":{"$":0},"chattanooga":{"$":0},"cheltenham":{"$":0},"chesapeakebay":{"$":0},"chicago":{"$":0},"children":{"$":0},"childrens":{"$":0},"childrensgarden":{"$":0},"chiropractic":{"$":0},"chocolate":{"$":0},"christiansburg":{"$":0},"cincinnati":{"$":0},"cinema":{"$":0},"circus":{"$":0},"civilisation":{"$":0},"civilization":{"$":0},"civilwar":{"$":0},"clinton":{"$":0},"clock":{"$":0},"coal":{"$":0},"coastaldefence":{"$":0},"cody":{"$":0},"coldwar":{"$":0},"collection":{"$":0},"colonialwilliamsburg":{"$":0},"coloradoplateau":{"$":0},"columbia":{"$":0},"columbus":{"$":0},"communication":{"$":0},"communications":{"$":0},"community":{"$":0},"computer":{"$":0},"computerhistory":{"$":0},"xn--comunicaes-v6a2o":{"$":0},"contemporary":{"$":0},"contemporaryart":{"$":0},"convent":{"$":0},"copenhagen":{"$":0},"corporation":{"$":0},"xn--correios-e-telecomunicaes-ghc29a":{"$":0},"corvette":{"$":0},"costume":{"$":0},"countryestate":{"$":0},"county":{"$":0},"crafts":{"$":0},"cranbrook":{"$":0},"creation":{"$":0},"cultural":{"$":0},"culturalcenter":{"$":0},"culture":{"$":0},"cyber":{"$":0},"cymru":{"$":0},"dali":{"$":0},"dallas":{"$":0},"database":{"$":0},"ddr":{"$":0},"decorativearts":{"$":0},"delaware":{"$":0},"delmenhorst":{"$":0},"denmark":{"$":0},"depot":{"$":0},"design":{"$":0},"detroit":{"$":0},"dinosaur":{"$":0},"discovery":{"$":0},"dolls":{"$":0},"donostia":{"$":0},"durham":{"$":0},"eastafrica":{"$":0},"eastcoast":{"$":0},"education":{"$":0},"educational":{"$":0},"egyptian":{"$":0},"eisenbahn":{"$":0},"elburg":{"$":0},"elvendrell":{"$":0},"embroidery":{"$":0},"encyclopedic":{"$":0},"england":{"$":0},"entomology":{"$":0},"environment":{"$":0},"environmentalconservation":{"$":0},"epilepsy":{"$":0},"essex":{"$":0},"estate":{"$":0},"ethnology":{"$":0},"exeter":{"$":0},"exhibition":{"$":0},"family":{"$":0},"farm":{"$":0},"farmequipment":{"$":0},"farmers":{"$":0},"farmstead":{"$":0},"field":{"$":0},"figueres":{"$":0},"filatelia":{"$":0},"film":{"$":0},"fineart":{"$":0},"finearts":{"$":0},"finland":{"$":0},"flanders":{"$":0},"florida":{"$":0},"force":{"$":0},"fortmissoula":{"$":0},"fortworth":{"$":0},"foundation":{"$":0},"francaise":{"$":0},"frankfurt":{"$":0},"franziskaner":{"$":0},"freemasonry":{"$":0},"freiburg":{"$":0},"fribourg":{"$":0},"frog":{"$":0},"fundacio":{"$":0},"furniture":{"$":0},"gallery":{"$":0},"garden":{"$":0},"gateway":{"$":0},"geelvinck":{"$":0},"gemological":{"$":0},"geology":{"$":0},"georgia":{"$":0},"giessen":{"$":0},"glas":{"$":0},"glass":{"$":0},"gorge":{"$":0},"grandrapids":{"$":0},"graz":{"$":0},"guernsey":{"$":0},"halloffame":{"$":0},"hamburg":{"$":0},"handson":{"$":0},"harvestcelebration":{"$":0},"hawaii":{"$":0},"health":{"$":0},"heimatunduhren":{"$":0},"hellas":{"$":0},"helsinki":{"$":0},"hembygdsforbund":{"$":0},"heritage":{"$":0},"histoire":{"$":0},"historical":{"$":0},"historicalsociety":{"$":0},"historichouses":{"$":0},"historisch":{"$":0},"historisches":{"$":0},"history":{"$":0},"historyofscience":{"$":0},"horology":{"$":0},"house":{"$":0},"humanities":{"$":0},"illustration":{"$":0},"imageandsound":{"$":0},"indian":{"$":0},"indiana":{"$":0},"indianapolis":{"$":0},"indianmarket":{"$":0},"intelligence":{"$":0},"interactive":{"$":0},"iraq":{"$":0},"iron":{"$":0},"isleofman":{"$":0},"jamison":{"$":0},"jefferson":{"$":0},"jerusalem":{"$":0},"jewelry":{"$":0},"jewish":{"$":0},"jewishart":{"$":0},"jfk":{"$":0},"journalism":{"$":0},"judaica":{"$":0},"judygarland":{"$":0},"juedisches":{"$":0},"juif":{"$":0},"karate":{"$":0},"karikatur":{"$":0},"kids":{"$":0},"koebenhavn":{"$":0},"koeln":{"$":0},"kunst":{"$":0},"kunstsammlung":{"$":0},"kunstunddesign":{"$":0},"labor":{"$":0},"labour":{"$":0},"lajolla":{"$":0},"lancashire":{"$":0},"landes":{"$":0},"lans":{"$":0},"xn--lns-qla":{"$":0},"larsson":{"$":0},"lewismiller":{"$":0},"lincoln":{"$":0},"linz":{"$":0},"living":{"$":0},"livinghistory":{"$":0},"localhistory":{"$":0},"london":{"$":0},"losangeles":{"$":0},"louvre":{"$":0},"loyalist":{"$":0},"lucerne":{"$":0},"luxembourg":{"$":0},"luzern":{"$":0},"mad":{"$":0},"madrid":{"$":0},"mallorca":{"$":0},"manchester":{"$":0},"mansion":{"$":0},"mansions":{"$":0},"manx":{"$":0},"marburg":{"$":0},"maritime":{"$":0},"maritimo":{"$":0},"maryland":{"$":0},"marylhurst":{"$":0},"media":{"$":0},"medical":{"$":0},"medizinhistorisches":{"$":0},"meeres":{"$":0},"memorial":{"$":0},"mesaverde":{"$":0},"michigan":{"$":0},"midatlantic":{"$":0},"military":{"$":0},"mill":{"$":0},"miners":{"$":0},"mining":{"$":0},"minnesota":{"$":0},"missile":{"$":0},"missoula":{"$":0},"modern":{"$":0},"moma":{"$":0},"money":{"$":0},"monmouth":{"$":0},"monticello":{"$":0},"montreal":{"$":0},"moscow":{"$":0},"motorcycle":{"$":0},"muenchen":{"$":0},"muenster":{"$":0},"mulhouse":{"$":0},"muncie":{"$":0},"museet":{"$":0},"museumcenter":{"$":0},"museumvereniging":{"$":0},"music":{"$":0},"national":{"$":0},"nationalfirearms":{"$":0},"nationalheritage":{"$":0},"nativeamerican":{"$":0},"naturalhistory":{"$":0},"naturalhistorymuseum":{"$":0},"naturalsciences":{"$":0},"nature":{"$":0},"naturhistorisches":{"$":0},"natuurwetenschappen":{"$":0},"naumburg":{"$":0},"naval":{"$":0},"nebraska":{"$":0},"neues":{"$":0},"newhampshire":{"$":0},"newjersey":{"$":0},"newmexico":{"$":0},"newport":{"$":0},"newspaper":{"$":0},"newyork":{"$":0},"niepce":{"$":0},"norfolk":{"$":0},"north":{"$":0},"nrw":{"$":0},"nuernberg":{"$":0},"nuremberg":{"$":0},"nyc":{"$":0},"nyny":{"$":0},"oceanographic":{"$":0},"oceanographique":{"$":0},"omaha":{"$":0},"online":{"$":0},"ontario":{"$":0},"openair":{"$":0},"oregon":{"$":0},"oregontrail":{"$":0},"otago":{"$":0},"oxford":{"$":0},"pacific":{"$":0},"paderborn":{"$":0},"palace":{"$":0},"paleo":{"$":0},"palmsprings":{"$":0},"panama":{"$":0},"paris":{"$":0},"pasadena":{"$":0},"pharmacy":{"$":0},"philadelphia":{"$":0},"philadelphiaarea":{"$":0},"philately":{"$":0},"phoenix":{"$":0},"photography":{"$":0},"pilots":{"$":0},"pittsburgh":{"$":0},"planetarium":{"$":0},"plantation":{"$":0},"plants":{"$":0},"plaza":{"$":0},"portal":{"$":0},"portland":{"$":0},"portlligat":{"$":0},"posts-and-telecommunications":{"$":0},"preservation":{"$":0},"presidio":{"$":0},"press":{"$":0},"project":{"$":0},"public":{"$":0},"pubol":{"$":0},"quebec":{"$":0},"railroad":{"$":0},"railway":{"$":0},"research":{"$":0},"resistance":{"$":0},"riodejaneiro":{"$":0},"rochester":{"$":0},"rockart":{"$":0},"roma":{"$":0},"russia":{"$":0},"saintlouis":{"$":0},"salem":{"$":0},"salvadordali":{"$":0},"salzburg":{"$":0},"sandiego":{"$":0},"sanfrancisco":{"$":0},"santabarbara":{"$":0},"santacruz":{"$":0},"santafe":{"$":0},"saskatchewan":{"$":0},"satx":{"$":0},"savannahga":{"$":0},"schlesisches":{"$":0},"schoenbrunn":{"$":0},"schokoladen":{"$":0},"school":{"$":0},"schweiz":{"$":0},"science":{"$":0},"scienceandhistory":{"$":0},"scienceandindustry":{"$":0},"sciencecenter":{"$":0},"sciencecenters":{"$":0},"science-fiction":{"$":0},"sciencehistory":{"$":0},"sciences":{"$":0},"sciencesnaturelles":{"$":0},"scotland":{"$":0},"seaport":{"$":0},"settlement":{"$":0},"settlers":{"$":0},"shell":{"$":0},"sherbrooke":{"$":0},"sibenik":{"$":0},"silk":{"$":0},"ski":{"$":0},"skole":{"$":0},"society":{"$":0},"sologne":{"$":0},"soundandvision":{"$":0},"southcarolina":{"$":0},"southwest":{"$":0},"space":{"$":0},"spy":{"$":0},"square":{"$":0},"stadt":{"$":0},"stalbans":{"$":0},"starnberg":{"$":0},"state":{"$":0},"stateofdelaware":{"$":0},"station":{"$":0},"steam":{"$":0},"steiermark":{"$":0},"stjohn":{"$":0},"stockholm":{"$":0},"stpetersburg":{"$":0},"stuttgart":{"$":0},"suisse":{"$":0},"surgeonshall":{"$":0},"surrey":{"$":0},"svizzera":{"$":0},"sweden":{"$":0},"sydney":{"$":0},"tank":{"$":0},"tcm":{"$":0},"technology":{"$":0},"telekommunikation":{"$":0},"television":{"$":0},"texas":{"$":0},"textile":{"$":0},"theater":{"$":0},"time":{"$":0},"timekeeping":{"$":0},"topology":{"$":0},"torino":{"$":0},"touch":{"$":0},"town":{"$":0},"transport":{"$":0},"tree":{"$":0},"trolley":{"$":0},"trust":{"$":0},"trustee":{"$":0},"uhren":{"$":0},"ulm":{"$":0},"undersea":{"$":0},"university":{"$":0},"usa":{"$":0},"usantiques":{"$":0},"usarts":{"$":0},"uscountryestate":{"$":0},"usculture":{"$":0},"usdecorativearts":{"$":0},"usgarden":{"$":0},"ushistory":{"$":0},"ushuaia":{"$":0},"uslivinghistory":{"$":0},"utah":{"$":0},"uvic":{"$":0},"valley":{"$":0},"vantaa":{"$":0},"versailles":{"$":0},"viking":{"$":0},"village":{"$":0},"virginia":{"$":0},"virtual":{"$":0},"virtuel":{"$":0},"vlaanderen":{"$":0},"volkenkunde":{"$":0},"wales":{"$":0},"wallonie":{"$":0},"war":{"$":0},"washingtondc":{"$":0},"watchandclock":{"$":0},"watch-and-clock":{"$":0},"western":{"$":0},"westfalen":{"$":0},"whaling":{"$":0},"wildlife":{"$":0},"williamsburg":{"$":0},"windmill":{"$":0},"workshop":{"$":0},"york":{"$":0},"yorkshire":{"$":0},"yosemite":{"$":0},"youth":{"$":0},"zoological":{"$":0},"zoology":{"$":0},"xn--9dbhblg6di":{"$":0},"xn--h1aegh":{"$":0}},"mv":{"$":0,"aero":{"$":0},"biz":{"$":0},"com":{"$":0},"coop":{"$":0},"edu":{"$":0},"gov":{"$":0},"info":{"$":0},"int":{"$":0},"mil":{"$":0},"museum":{"$":0},"name":{"$":0},"net":{"$":0},"org":{"$":0},"pro":{"$":0}},"mw":{"$":0,"ac":{"$":0},"biz":{"$":0},"co":{"$":0},"com":{"$":0},"coop":{"$":0},"edu":{"$":0},"gov":{"$":0},"int":{"$":0},"museum":{"$":0},"net":{"$":0},"org":{"$":0}},"mx":{"$":0,"com":{"$":0},"org":{"$":0},"gob":{"$":0},"edu":{"$":0},"net":{"$":0},"blogspot":{"$":0},"nym":{"$":0}},"my":{"$":0,"com":{"$":0},"net":{"$":0},"org":{"$":0},"gov":{"$":0},"edu":{"$":0},"mil":{"$":0},"name":{"$":0},"blogspot":{"$":0}},"mz":{"$":0,"ac":{"$":0},"adv":{"$":0},"co":{"$":0},"edu":{"$":0},"gov":{"$":0},"mil":{"$":0},"net":{"$":0},"org":{"$":0}},"na":{"$":0,"info":{"$":0},"pro":{"$":0},"name":{"$":0},"school":{"$":0},"or":{"$":0},"dr":{"$":0},"us":{"$":0},"mx":{"$":0},"ca":{"$":0},"in":{"$":0},"cc":{"$":0},"tv":{"$":0},"ws":{"$":0},"mobi":{"$":0},"co":{"$":0},"com":{"$":0},"org":{"$":0}},"name":{"$":0,"her":{"forgot":{"$":0}},"his":{"forgot":{"$":0}}},"nc":{"$":0,"asso":{"$":0},"nom":{"$":0}},"ne":{"$":0},"net":{"$":0,"alwaysdata":{"*":{"$":0}},"cloudfront":{"$":0},"t3l3p0rt":{"$":0},"myfritz":{"$":0},"boomla":{"$":0},"bplaced":{"$":0},"square7":{"$":0},"gb":{"$":0},"hu":{"$":0},"jp":{"$":0},"se":{"$":0},"uk":{"$":0},"in":{"$":0},"cloudaccess":{"$":0},"cdn77-ssl":{"$":0},"cdn77":{"r":{"$":0}},"feste-ip":{"$":0},"knx-server":{"$":0},"static-access":{"$":0},"cryptonomic":{"*":{"$":0}},"debian":{"$":0},"at-band-camp":{"$":0},"blogdns":{"$":0},"broke-it":{"$":0},"buyshouses":{"$":0},"dnsalias":{"$":0},"dnsdojo":{"$":0},"does-it":{"$":0},"dontexist":{"$":0},"dynalias":{"$":0},"dynathome":{"$":0},"endofinternet":{"$":0},"from-az":{"$":0},"from-co":{"$":0},"from-la":{"$":0},"from-ny":{"$":0},"gets-it":{"$":0},"ham-radio-op":{"$":0},"homeftp":{"$":0},"homeip":{"$":0},"homelinux":{"$":0},"homeunix":{"$":0},"in-the-band":{"$":0},"is-a-chef":{"$":0},"is-a-geek":{"$":0},"isa-geek":{"$":0},"kicks-ass":{"$":0},"office-on-the":{"$":0},"podzone":{"$":0},"scrapper-site":{"$":0},"selfip":{"$":0},"sells-it":{"$":0},"servebbs":{"$":0},"serveftp":{"$":0},"thruhere":{"$":0},"webhop":{"$":0},"definima":{"$":0},"casacam":{"$":0},"dynu":{"$":0},"dynv6":{"$":0},"twmail":{"$":0},"ru":{"$":0},"channelsdvr":{"$":0},"fastlylb":{"$":0,"map":{"$":0}},"fastly":{"freetls":{"$":0},"map":{"$":0},"prod":{"a":{"$":0},"global":{"$":0}},"ssl":{"a":{"$":0},"b":{"$":0},"global":{"$":0}}},"flynnhosting":{"$":0},"cloudfunctions":{"$":0},"moonscale":{"$":0},"ipifony":{"$":0},"barsy":{"$":0},"azurewebsites":{"$":0},"azure-mobile":{"$":0},"cloudapp":{"$":0},"eating-organic":{"$":0},"mydissent":{"$":0},"myeffect":{"$":0},"mymediapc":{"$":0},"mypsx":{"$":0},"mysecuritycamera":{"$":0},"nhlfan":{"$":0},"no-ip":{"$":0},"pgafan":{"$":0},"privatizehealthinsurance":{"$":0},"bounceme":{"$":0},"ddns":{"$":0},"redirectme":{"$":0},"serveblog":{"$":0},"serveminecraft":{"$":0},"sytes":{"$":0},"rackmaze":{"$":0},"firewall-gateway":{"$":0},"dsmynas":{"$":0},"familyds":{"$":0},"za":{"$":0}},"nf":{"$":0,"com":{"$":0},"net":{"$":0},"per":{"$":0},"rec":{"$":0},"web":{"$":0},"arts":{"$":0},"firm":{"$":0},"info":{"$":0},"other":{"$":0},"store":{"$":0}},"ng":{"$":0,"com":{"$":0,"blogspot":{"$":0}},"edu":{"$":0},"gov":{"$":0},"i":{"$":0},"mil":{"$":0},"mobi":{"$":0},"name":{"$":0},"net":{"$":0},"org":{"$":0},"sch":{"$":0}},"ni":{"$":0,"ac":{"$":0},"biz":{"$":0},"co":{"$":0},"com":{"$":0},"edu":{"$":0},"gob":{"$":0},"in":{"$":0},"info":{"$":0},"int":{"$":0},"mil":{"$":0},"net":{"$":0},"nom":{"$":0},"org":{"$":0},"web":{"$":0}},"nl":{"$":0,"bv":{"$":0},"virtueeldomein":{"$":0},"co":{"$":0},"blogspot":{"$":0},"transurl":{"*":{"$":0}},"cistron":{"$":0},"demon":{"$":0}},"no":{"$":0,"fhs":{"$":0},"vgs":{"$":0},"fylkesbibl":{"$":0},"folkebibl":{"$":0},"museum":{"$":0},"idrett":{"$":0},"priv":{"$":0},"mil":{"$":0},"stat":{"$":0},"dep":{"$":0},"kommune":{"$":0},"herad":{"$":0},"aa":{"$":0,"gs":{"$":0}},"ah":{"$":0,"gs":{"$":0}},"bu":{"$":0,"gs":{"$":0}},"fm":{"$":0,"gs":{"$":0}},"hl":{"$":0,"gs":{"$":0}},"hm":{"$":0,"gs":{"$":0}},"jan-mayen":{"$":0,"gs":{"$":0}},"mr":{"$":0,"gs":{"$":0}},"nl":{"$":0,"gs":{"$":0}},"nt":{"$":0,"gs":{"$":0}},"of":{"$":0,"gs":{"$":0}},"ol":{"$":0,"gs":{"$":0}},"oslo":{"$":0,"gs":{"$":0}},"rl":{"$":0,"gs":{"$":0}},"sf":{"$":0,"gs":{"$":0}},"st":{"$":0,"gs":{"$":0}},"svalbard":{"$":0,"gs":{"$":0}},"tm":{"$":0,"gs":{"$":0}},"tr":{"$":0,"gs":{"$":0}},"va":{"$":0,"gs":{"$":0}},"vf":{"$":0,"gs":{"$":0}},"akrehamn":{"$":0},"xn--krehamn-dxa":{"$":0},"algard":{"$":0},"xn--lgrd-poac":{"$":0},"arna":{"$":0},"brumunddal":{"$":0},"bryne":{"$":0},"bronnoysund":{"$":0},"xn--brnnysund-m8ac":{"$":0},"drobak":{"$":0},"xn--drbak-wua":{"$":0},"egersund":{"$":0},"fetsund":{"$":0},"floro":{"$":0},"xn--flor-jra":{"$":0},"fredrikstad":{"$":0},"hokksund":{"$":0},"honefoss":{"$":0},"xn--hnefoss-q1a":{"$":0},"jessheim":{"$":0},"jorpeland":{"$":0},"xn--jrpeland-54a":{"$":0},"kirkenes":{"$":0},"kopervik":{"$":0},"krokstadelva":{"$":0},"langevag":{"$":0},"xn--langevg-jxa":{"$":0},"leirvik":{"$":0},"mjondalen":{"$":0},"xn--mjndalen-64a":{"$":0},"mo-i-rana":{"$":0},"mosjoen":{"$":0},"xn--mosjen-eya":{"$":0},"nesoddtangen":{"$":0},"orkanger":{"$":0},"osoyro":{"$":0},"xn--osyro-wua":{"$":0},"raholt":{"$":0},"xn--rholt-mra":{"$":0},"sandnessjoen":{"$":0},"xn--sandnessjen-ogb":{"$":0},"skedsmokorset":{"$":0},"slattum":{"$":0},"spjelkavik":{"$":0},"stathelle":{"$":0},"stavern":{"$":0},"stjordalshalsen":{"$":0},"xn--stjrdalshalsen-sqb":{"$":0},"tananger":{"$":0},"tranby":{"$":0},"vossevangen":{"$":0},"afjord":{"$":0},"xn--fjord-lra":{"$":0},"agdenes":{"$":0},"al":{"$":0},"xn--l-1fa":{"$":0},"alesund":{"$":0},"xn--lesund-hua":{"$":0},"alstahaug":{"$":0},"alta":{"$":0},"xn--lt-liac":{"$":0},"alaheadju":{"$":0},"xn--laheadju-7ya":{"$":0},"alvdal":{"$":0},"amli":{"$":0},"xn--mli-tla":{"$":0},"amot":{"$":0},"xn--mot-tla":{"$":0},"andebu":{"$":0},"andoy":{"$":0},"xn--andy-ira":{"$":0},"andasuolo":{"$":0},"ardal":{"$":0},"xn--rdal-poa":{"$":0},"aremark":{"$":0},"arendal":{"$":0},"xn--s-1fa":{"$":0},"aseral":{"$":0},"xn--seral-lra":{"$":0},"asker":{"$":0},"askim":{"$":0},"askvoll":{"$":0},"askoy":{"$":0},"xn--asky-ira":{"$":0},"asnes":{"$":0},"xn--snes-poa":{"$":0},"audnedaln":{"$":0},"aukra":{"$":0},"aure":{"$":0},"aurland":{"$":0},"aurskog-holand":{"$":0},"xn--aurskog-hland-jnb":{"$":0},"austevoll":{"$":0},"austrheim":{"$":0},"averoy":{"$":0},"xn--avery-yua":{"$":0},"balestrand":{"$":0},"ballangen":{"$":0},"balat":{"$":0},"xn--blt-elab":{"$":0},"balsfjord":{"$":0},"bahccavuotna":{"$":0},"xn--bhccavuotna-k7a":{"$":0},"bamble":{"$":0},"bardu":{"$":0},"beardu":{"$":0},"beiarn":{"$":0},"bajddar":{"$":0},"xn--bjddar-pta":{"$":0},"baidar":{"$":0},"xn--bidr-5nac":{"$":0},"berg":{"$":0},"bergen":{"$":0},"berlevag":{"$":0},"xn--berlevg-jxa":{"$":0},"bearalvahki":{"$":0},"xn--bearalvhki-y4a":{"$":0},"bindal":{"$":0},"birkenes":{"$":0},"bjarkoy":{"$":0},"xn--bjarky-fya":{"$":0},"bjerkreim":{"$":0},"bjugn":{"$":0},"bodo":{"$":0},"xn--bod-2na":{"$":0},"badaddja":{"$":0},"xn--bdddj-mrabd":{"$":0},"budejju":{"$":0},"bokn":{"$":0},"bremanger":{"$":0},"bronnoy":{"$":0},"xn--brnny-wuac":{"$":0},"bygland":{"$":0},"bykle":{"$":0},"barum":{"$":0},"xn--brum-voa":{"$":0},"telemark":{"bo":{"$":0},"xn--b-5ga":{"$":0}},"nordland":{"bo":{"$":0},"xn--b-5ga":{"$":0},"heroy":{"$":0},"xn--hery-ira":{"$":0}},"bievat":{"$":0},"xn--bievt-0qa":{"$":0},"bomlo":{"$":0},"xn--bmlo-gra":{"$":0},"batsfjord":{"$":0},"xn--btsfjord-9za":{"$":0},"bahcavuotna":{"$":0},"xn--bhcavuotna-s4a":{"$":0},"dovre":{"$":0},"drammen":{"$":0},"drangedal":{"$":0},"dyroy":{"$":0},"xn--dyry-ira":{"$":0},"donna":{"$":0},"xn--dnna-gra":{"$":0},"eid":{"$":0},"eidfjord":{"$":0},"eidsberg":{"$":0},"eidskog":{"$":0},"eidsvoll":{"$":0},"eigersund":{"$":0},"elverum":{"$":0},"enebakk":{"$":0},"engerdal":{"$":0},"etne":{"$":0},"etnedal":{"$":0},"evenes":{"$":0},"evenassi":{"$":0},"xn--eveni-0qa01ga":{"$":0},"evje-og-hornnes":{"$":0},"farsund":{"$":0},"fauske":{"$":0},"fuossko":{"$":0},"fuoisku":{"$":0},"fedje":{"$":0},"fet":{"$":0},"finnoy":{"$":0},"xn--finny-yua":{"$":0},"fitjar":{"$":0},"fjaler":{"$":0},"fjell":{"$":0},"flakstad":{"$":0},"flatanger":{"$":0},"flekkefjord":{"$":0},"flesberg":{"$":0},"flora":{"$":0},"fla":{"$":0},"xn--fl-zia":{"$":0},"folldal":{"$":0},"forsand":{"$":0},"fosnes":{"$":0},"frei":{"$":0},"frogn":{"$":0},"froland":{"$":0},"frosta":{"$":0},"frana":{"$":0},"xn--frna-woa":{"$":0},"froya":{"$":0},"xn--frya-hra":{"$":0},"fusa":{"$":0},"fyresdal":{"$":0},"forde":{"$":0},"xn--frde-gra":{"$":0},"gamvik":{"$":0},"gangaviika":{"$":0},"xn--ggaviika-8ya47h":{"$":0},"gaular":{"$":0},"gausdal":{"$":0},"gildeskal":{"$":0},"xn--gildeskl-g0a":{"$":0},"giske":{"$":0},"gjemnes":{"$":0},"gjerdrum":{"$":0},"gjerstad":{"$":0},"gjesdal":{"$":0},"gjovik":{"$":0},"xn--gjvik-wua":{"$":0},"gloppen":{"$":0},"gol":{"$":0},"gran":{"$":0},"grane":{"$":0},"granvin":{"$":0},"gratangen":{"$":0},"grimstad":{"$":0},"grong":{"$":0},"kraanghke":{"$":0},"xn--kranghke-b0a":{"$":0},"grue":{"$":0},"gulen":{"$":0},"hadsel":{"$":0},"halden":{"$":0},"halsa":{"$":0},"hamar":{"$":0},"hamaroy":{"$":0},"habmer":{"$":0},"xn--hbmer-xqa":{"$":0},"hapmir":{"$":0},"xn--hpmir-xqa":{"$":0},"hammerfest":{"$":0},"hammarfeasta":{"$":0},"xn--hmmrfeasta-s4ac":{"$":0},"haram":{"$":0},"hareid":{"$":0},"harstad":{"$":0},"hasvik":{"$":0},"aknoluokta":{"$":0},"xn--koluokta-7ya57h":{"$":0},"hattfjelldal":{"$":0},"aarborte":{"$":0},"haugesund":{"$":0},"hemne":{"$":0},"hemnes":{"$":0},"hemsedal":{"$":0},"more-og-romsdal":{"heroy":{"$":0},"sande":{"$":0}},"xn--mre-og-romsdal-qqb":{"xn--hery-ira":{"$":0},"sande":{"$":0}},"hitra":{"$":0},"hjartdal":{"$":0},"hjelmeland":{"$":0},"hobol":{"$":0},"xn--hobl-ira":{"$":0},"hof":{"$":0},"hol":{"$":0},"hole":{"$":0},"holmestrand":{"$":0},"holtalen":{"$":0},"xn--holtlen-hxa":{"$":0},"hornindal":{"$":0},"horten":{"$":0},"hurdal":{"$":0},"hurum":{"$":0},"hvaler":{"$":0},"hyllestad":{"$":0},"hagebostad":{"$":0},"xn--hgebostad-g3a":{"$":0},"hoyanger":{"$":0},"xn--hyanger-q1a":{"$":0},"hoylandet":{"$":0},"xn--hylandet-54a":{"$":0},"ha":{"$":0},"xn--h-2fa":{"$":0},"ibestad":{"$":0},"inderoy":{"$":0},"xn--indery-fya":{"$":0},"iveland":{"$":0},"jevnaker":{"$":0},"jondal":{"$":0},"jolster":{"$":0},"xn--jlster-bya":{"$":0},"karasjok":{"$":0},"karasjohka":{"$":0},"xn--krjohka-hwab49j":{"$":0},"karlsoy":{"$":0},"galsa":{"$":0},"xn--gls-elac":{"$":0},"karmoy":{"$":0},"xn--karmy-yua":{"$":0},"kautokeino":{"$":0},"guovdageaidnu":{"$":0},"klepp":{"$":0},"klabu":{"$":0},"xn--klbu-woa":{"$":0},"kongsberg":{"$":0},"kongsvinger":{"$":0},"kragero":{"$":0},"xn--krager-gya":{"$":0},"kristiansand":{"$":0},"kristiansund":{"$":0},"krodsherad":{"$":0},"xn--krdsherad-m8a":{"$":0},"kvalsund":{"$":0},"rahkkeravju":{"$":0},"xn--rhkkervju-01af":{"$":0},"kvam":{"$":0},"kvinesdal":{"$":0},"kvinnherad":{"$":0},"kviteseid":{"$":0},"kvitsoy":{"$":0},"xn--kvitsy-fya":{"$":0},"kvafjord":{"$":0},"xn--kvfjord-nxa":{"$":0},"giehtavuoatna":{"$":0},"kvanangen":{"$":0},"xn--kvnangen-k0a":{"$":0},"navuotna":{"$":0},"xn--nvuotna-hwa":{"$":0},"kafjord":{"$":0},"xn--kfjord-iua":{"$":0},"gaivuotna":{"$":0},"xn--givuotna-8ya":{"$":0},"larvik":{"$":0},"lavangen":{"$":0},"lavagis":{"$":0},"loabat":{"$":0},"xn--loabt-0qa":{"$":0},"lebesby":{"$":0},"davvesiida":{"$":0},"leikanger":{"$":0},"leirfjord":{"$":0},"leka":{"$":0},"leksvik":{"$":0},"lenvik":{"$":0},"leangaviika":{"$":0},"xn--leagaviika-52b":{"$":0},"lesja":{"$":0},"levanger":{"$":0},"lier":{"$":0},"lierne":{"$":0},"lillehammer":{"$":0},"lillesand":{"$":0},"lindesnes":{"$":0},"lindas":{"$":0},"xn--linds-pra":{"$":0},"lom":{"$":0},"loppa":{"$":0},"lahppi":{"$":0},"xn--lhppi-xqa":{"$":0},"lund":{"$":0},"lunner":{"$":0},"luroy":{"$":0},"xn--lury-ira":{"$":0},"luster":{"$":0},"lyngdal":{"$":0},"lyngen":{"$":0},"ivgu":{"$":0},"lardal":{"$":0},"lerdal":{"$":0},"xn--lrdal-sra":{"$":0},"lodingen":{"$":0},"xn--ldingen-q1a":{"$":0},"lorenskog":{"$":0},"xn--lrenskog-54a":{"$":0},"loten":{"$":0},"xn--lten-gra":{"$":0},"malvik":{"$":0},"masoy":{"$":0},"xn--msy-ula0h":{"$":0},"muosat":{"$":0},"xn--muost-0qa":{"$":0},"mandal":{"$":0},"marker":{"$":0},"marnardal":{"$":0},"masfjorden":{"$":0},"meland":{"$":0},"meldal":{"$":0},"melhus":{"$":0},"meloy":{"$":0},"xn--mely-ira":{"$":0},"meraker":{"$":0},"xn--merker-kua":{"$":0},"moareke":{"$":0},"xn--moreke-jua":{"$":0},"midsund":{"$":0},"midtre-gauldal":{"$":0},"modalen":{"$":0},"modum":{"$":0},"molde":{"$":0},"moskenes":{"$":0},"moss":{"$":0},"mosvik":{"$":0},"malselv":{"$":0},"xn--mlselv-iua":{"$":0},"malatvuopmi":{"$":0},"xn--mlatvuopmi-s4a":{"$":0},"namdalseid":{"$":0},"aejrie":{"$":0},"namsos":{"$":0},"namsskogan":{"$":0},"naamesjevuemie":{"$":0},"xn--nmesjevuemie-tcba":{"$":0},"laakesvuemie":{"$":0},"nannestad":{"$":0},"narvik":{"$":0},"narviika":{"$":0},"naustdal":{"$":0},"nedre-eiker":{"$":0},"akershus":{"nes":{"$":0}},"buskerud":{"nes":{"$":0}},"nesna":{"$":0},"nesodden":{"$":0},"nesseby":{"$":0},"unjarga":{"$":0},"xn--unjrga-rta":{"$":0},"nesset":{"$":0},"nissedal":{"$":0},"nittedal":{"$":0},"nord-aurdal":{"$":0},"nord-fron":{"$":0},"nord-odal":{"$":0},"norddal":{"$":0},"nordkapp":{"$":0},"davvenjarga":{"$":0},"xn--davvenjrga-y4a":{"$":0},"nordre-land":{"$":0},"nordreisa":{"$":0},"raisa":{"$":0},"xn--risa-5na":{"$":0},"nore-og-uvdal":{"$":0},"notodden":{"$":0},"naroy":{"$":0},"xn--nry-yla5g":{"$":0},"notteroy":{"$":0},"xn--nttery-byae":{"$":0},"odda":{"$":0},"oksnes":{"$":0},"xn--ksnes-uua":{"$":0},"oppdal":{"$":0},"oppegard":{"$":0},"xn--oppegrd-ixa":{"$":0},"orkdal":{"$":0},"orland":{"$":0},"xn--rland-uua":{"$":0},"orskog":{"$":0},"xn--rskog-uua":{"$":0},"orsta":{"$":0},"xn--rsta-fra":{"$":0},"hedmark":{"os":{"$":0},"valer":{"$":0},"xn--vler-qoa":{"$":0}},"hordaland":{"os":{"$":0}},"osen":{"$":0},"osteroy":{"$":0},"xn--ostery-fya":{"$":0},"ostre-toten":{"$":0},"xn--stre-toten-zcb":{"$":0},"overhalla":{"$":0},"ovre-eiker":{"$":0},"xn--vre-eiker-k8a":{"$":0},"oyer":{"$":0},"xn--yer-zna":{"$":0},"oygarden":{"$":0},"xn--ygarden-p1a":{"$":0},"oystre-slidre":{"$":0},"xn--ystre-slidre-ujb":{"$":0},"porsanger":{"$":0},"porsangu":{"$":0},"xn--porsgu-sta26f":{"$":0},"porsgrunn":{"$":0},"radoy":{"$":0},"xn--rady-ira":{"$":0},"rakkestad":{"$":0},"rana":{"$":0},"ruovat":{"$":0},"randaberg":{"$":0},"rauma":{"$":0},"rendalen":{"$":0},"rennebu":{"$":0},"rennesoy":{"$":0},"xn--rennesy-v1a":{"$":0},"rindal":{"$":0},"ringebu":{"$":0},"ringerike":{"$":0},"ringsaker":{"$":0},"rissa":{"$":0},"risor":{"$":0},"xn--risr-ira":{"$":0},"roan":{"$":0},"rollag":{"$":0},"rygge":{"$":0},"ralingen":{"$":0},"xn--rlingen-mxa":{"$":0},"rodoy":{"$":0},"xn--rdy-0nab":{"$":0},"romskog":{"$":0},"xn--rmskog-bya":{"$":0},"roros":{"$":0},"xn--rros-gra":{"$":0},"rost":{"$":0},"xn--rst-0na":{"$":0},"royken":{"$":0},"xn--ryken-vua":{"$":0},"royrvik":{"$":0},"xn--ryrvik-bya":{"$":0},"rade":{"$":0},"xn--rde-ula":{"$":0},"salangen":{"$":0},"siellak":{"$":0},"saltdal":{"$":0},"salat":{"$":0},"xn--slt-elab":{"$":0},"xn--slat-5na":{"$":0},"samnanger":{"$":0},"vestfold":{"sande":{"$":0}},"sandefjord":{"$":0},"sandnes":{"$":0},"sandoy":{"$":0},"xn--sandy-yua":{"$":0},"sarpsborg":{"$":0},"sauda":{"$":0},"sauherad":{"$":0},"sel":{"$":0},"selbu":{"$":0},"selje":{"$":0},"seljord":{"$":0},"sigdal":{"$":0},"siljan":{"$":0},"sirdal":{"$":0},"skaun":{"$":0},"skedsmo":{"$":0},"ski":{"$":0},"skien":{"$":0},"skiptvet":{"$":0},"skjervoy":{"$":0},"xn--skjervy-v1a":{"$":0},"skierva":{"$":0},"xn--skierv-uta":{"$":0},"skjak":{"$":0},"xn--skjk-soa":{"$":0},"skodje":{"$":0},"skanland":{"$":0},"xn--sknland-fxa":{"$":0},"skanit":{"$":0},"xn--sknit-yqa":{"$":0},"smola":{"$":0},"xn--smla-hra":{"$":0},"snillfjord":{"$":0},"snasa":{"$":0},"xn--snsa-roa":{"$":0},"snoasa":{"$":0},"snaase":{"$":0},"xn--snase-nra":{"$":0},"sogndal":{"$":0},"sokndal":{"$":0},"sola":{"$":0},"solund":{"$":0},"songdalen":{"$":0},"sortland":{"$":0},"spydeberg":{"$":0},"stange":{"$":0},"stavanger":{"$":0},"steigen":{"$":0},"steinkjer":{"$":0},"stjordal":{"$":0},"xn--stjrdal-s1a":{"$":0},"stokke":{"$":0},"stor-elvdal":{"$":0},"stord":{"$":0},"stordal":{"$":0},"storfjord":{"$":0},"omasvuotna":{"$":0},"strand":{"$":0},"stranda":{"$":0},"stryn":{"$":0},"sula":{"$":0},"suldal":{"$":0},"sund":{"$":0},"sunndal":{"$":0},"surnadal":{"$":0},"sveio":{"$":0},"svelvik":{"$":0},"sykkylven":{"$":0},"sogne":{"$":0},"xn--sgne-gra":{"$":0},"somna":{"$":0},"xn--smna-gra":{"$":0},"sondre-land":{"$":0},"xn--sndre-land-0cb":{"$":0},"sor-aurdal":{"$":0},"xn--sr-aurdal-l8a":{"$":0},"sor-fron":{"$":0},"xn--sr-fron-q1a":{"$":0},"sor-odal":{"$":0},"xn--sr-odal-q1a":{"$":0},"sor-varanger":{"$":0},"xn--sr-varanger-ggb":{"$":0},"matta-varjjat":{"$":0},"xn--mtta-vrjjat-k7af":{"$":0},"sorfold":{"$":0},"xn--srfold-bya":{"$":0},"sorreisa":{"$":0},"xn--srreisa-q1a":{"$":0},"sorum":{"$":0},"xn--srum-gra":{"$":0},"tana":{"$":0},"deatnu":{"$":0},"time":{"$":0},"tingvoll":{"$":0},"tinn":{"$":0},"tjeldsund":{"$":0},"dielddanuorri":{"$":0},"tjome":{"$":0},"xn--tjme-hra":{"$":0},"tokke":{"$":0},"tolga":{"$":0},"torsken":{"$":0},"tranoy":{"$":0},"xn--trany-yua":{"$":0},"tromso":{"$":0},"xn--troms-zua":{"$":0},"tromsa":{"$":0},"romsa":{"$":0},"trondheim":{"$":0},"troandin":{"$":0},"trysil":{"$":0},"trana":{"$":0},"xn--trna-woa":{"$":0},"trogstad":{"$":0},"xn--trgstad-r1a":{"$":0},"tvedestrand":{"$":0},"tydal":{"$":0},"tynset":{"$":0},"tysfjord":{"$":0},"divtasvuodna":{"$":0},"divttasvuotna":{"$":0},"tysnes":{"$":0},"tysvar":{"$":0},"xn--tysvr-vra":{"$":0},"tonsberg":{"$":0},"xn--tnsberg-q1a":{"$":0},"ullensaker":{"$":0},"ullensvang":{"$":0},"ulvik":{"$":0},"utsira":{"$":0},"vadso":{"$":0},"xn--vads-jra":{"$":0},"cahcesuolo":{"$":0},"xn--hcesuolo-7ya35b":{"$":0},"vaksdal":{"$":0},"valle":{"$":0},"vang":{"$":0},"vanylven":{"$":0},"vardo":{"$":0},"xn--vard-jra":{"$":0},"varggat":{"$":0},"xn--vrggt-xqad":{"$":0},"vefsn":{"$":0},"vaapste":{"$":0},"vega":{"$":0},"vegarshei":{"$":0},"xn--vegrshei-c0a":{"$":0},"vennesla":{"$":0},"verdal":{"$":0},"verran":{"$":0},"vestby":{"$":0},"vestnes":{"$":0},"vestre-slidre":{"$":0},"vestre-toten":{"$":0},"vestvagoy":{"$":0},"xn--vestvgy-ixa6o":{"$":0},"vevelstad":{"$":0},"vik":{"$":0},"vikna":{"$":0},"vindafjord":{"$":0},"volda":{"$":0},"voss":{"$":0},"varoy":{"$":0},"xn--vry-yla5g":{"$":0},"vagan":{"$":0},"xn--vgan-qoa":{"$":0},"voagat":{"$":0},"vagsoy":{"$":0},"xn--vgsy-qoa0j":{"$":0},"vaga":{"$":0},"xn--vg-yiab":{"$":0},"ostfold":{"valer":{"$":0}},"xn--stfold-9xa":{"xn--vler-qoa":{"$":0}},"co":{"$":0},"blogspot":{"$":0}},"np":{"*":{"$":0}},"nr":{"$":0,"biz":{"$":0},"info":{"$":0},"gov":{"$":0},"edu":{"$":0},"org":{"$":0},"net":{"$":0},"com":{"$":0}},"nu":{"$":0,"merseine":{"$":0},"mine":{"$":0},"shacknet":{"$":0},"nom":{"$":0}},"nz":{"$":0,"ac":{"$":0},"co":{"$":0,"blogspot":{"$":0}},"cri":{"$":0},"geek":{"$":0},"gen":{"$":0},"govt":{"$":0},"health":{"$":0},"iwi":{"$":0},"kiwi":{"$":0},"maori":{"$":0},"mil":{"$":0},"xn--mori-qsa":{"$":0},"net":{"$":0},"org":{"$":0},"parliament":{"$":0},"school":{"$":0},"nym":{"$":0}},"om":{"$":0,"co":{"$":0},"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"med":{"$":0},"museum":{"$":0},"net":{"$":0},"org":{"$":0},"pro":{"$":0}},"onion":{"$":0},"org":{"$":0,"amune":{"tele":{"$":0}},"pimienta":{"$":0},"poivron":{"$":0},"potager":{"$":0},"sweetpepper":{"$":0},"ae":{"$":0},"us":{"$":0},"certmgr":{"$":0},"cdn77":{"c":{"$":0},"rsc":{"$":0}},"cdn77-secure":{"origin":{"ssl":{"$":0}}},"cloudns":{"$":0},"duckdns":{"$":0},"tunk":{"$":0},"dyndns":{"$":0,"go":{"$":0},"home":{"$":0}},"blogdns":{"$":0},"blogsite":{"$":0},"boldlygoingnowhere":{"$":0},"dnsalias":{"$":0},"dnsdojo":{"$":0},"doesntexist":{"$":0},"dontexist":{"$":0},"doomdns":{"$":0},"dvrdns":{"$":0},"dynalias":{"$":0},"endofinternet":{"$":0},"endoftheinternet":{"$":0},"from-me":{"$":0},"game-host":{"$":0},"gotdns":{"$":0},"hobby-site":{"$":0},"homedns":{"$":0},"homeftp":{"$":0},"homelinux":{"$":0},"homeunix":{"$":0},"is-a-bruinsfan":{"$":0},"is-a-candidate":{"$":0},"is-a-celticsfan":{"$":0},"is-a-chef":{"$":0},"is-a-geek":{"$":0},"is-a-knight":{"$":0},"is-a-linux-user":{"$":0},"is-a-patsfan":{"$":0},"is-a-soxfan":{"$":0},"is-found":{"$":0},"is-lost":{"$":0},"is-saved":{"$":0},"is-very-bad":{"$":0},"is-very-evil":{"$":0},"is-very-good":{"$":0},"is-very-nice":{"$":0},"is-very-sweet":{"$":0},"isa-geek":{"$":0},"kicks-ass":{"$":0},"misconfused":{"$":0},"podzone":{"$":0},"readmyblog":{"$":0},"selfip":{"$":0},"sellsyourhome":{"$":0},"servebbs":{"$":0},"serveftp":{"$":0},"servegame":{"$":0},"stuff-4-sale":{"$":0},"webhop":{"$":0},"ddnss":{"$":0},"accesscam":{"$":0},"camdvr":{"$":0},"freeddns":{"$":0},"mywire":{"$":0},"webredirect":{"$":0},"eu":{"$":0,"al":{"$":0},"asso":{"$":0},"at":{"$":0},"au":{"$":0},"be":{"$":0},"bg":{"$":0},"ca":{"$":0},"cd":{"$":0},"ch":{"$":0},"cn":{"$":0},"cy":{"$":0},"cz":{"$":0},"de":{"$":0},"dk":{"$":0},"edu":{"$":0},"ee":{"$":0},"es":{"$":0},"fi":{"$":0},"fr":{"$":0},"gr":{"$":0},"hr":{"$":0},"hu":{"$":0},"ie":{"$":0},"il":{"$":0},"in":{"$":0},"int":{"$":0},"is":{"$":0},"it":{"$":0},"jp":{"$":0},"kr":{"$":0},"lt":{"$":0},"lu":{"$":0},"lv":{"$":0},"mc":{"$":0},"me":{"$":0},"mk":{"$":0},"mt":{"$":0},"my":{"$":0},"net":{"$":0},"ng":{"$":0},"nl":{"$":0},"no":{"$":0},"nz":{"$":0},"paris":{"$":0},"pl":{"$":0},"pt":{"$":0},"q-a":{"$":0},"ro":{"$":0},"ru":{"$":0},"se":{"$":0},"si":{"$":0},"sk":{"$":0},"tr":{"$":0},"uk":{"$":0},"us":{"$":0}},"twmail":{"$":0},"fedorainfracloud":{"$":0},"fedorapeople":{"$":0},"fedoraproject":{"cloud":{"$":0}},"hepforge":{"$":0},"js":{"$":0},"bmoattachments":{"$":0},"cable-modem":{"$":0},"collegefan":{"$":0},"couchpotatofries":{"$":0},"mlbfan":{"$":0},"mysecuritycamera":{"$":0},"nflfan":{"$":0},"read-books":{"$":0},"ufcfan":{"$":0},"hopto":{"$":0},"myftp":{"$":0},"no-ip":{"$":0},"zapto":{"$":0},"my-firewall":{"$":0},"myfirewall":{"$":0},"spdns":{"$":0},"dsmynas":{"$":0},"familyds":{"$":0},"tuxfamily":{"$":0},"diskstation":{"$":0},"hk":{"$":0},"wmflabs":{"$":0},"za":{"$":0}},"pa":{"$":0,"ac":{"$":0},"gob":{"$":0},"com":{"$":0},"org":{"$":0},"sld":{"$":0},"edu":{"$":0},"net":{"$":0},"ing":{"$":0},"abo":{"$":0},"med":{"$":0},"nom":{"$":0}},"pe":{"$":0,"edu":{"$":0},"gob":{"$":0},"nom":{"$":0},"mil":{"$":0},"org":{"$":0},"com":{"$":0},"net":{"$":0},"blogspot":{"$":0},"nym":{"$":0}},"pf":{"$":0,"com":{"$":0},"org":{"$":0},"edu":{"$":0}},"pg":{"*":{"$":0}},"ph":{"$":0,"com":{"$":0},"net":{"$":0},"org":{"$":0},"gov":{"$":0},"edu":{"$":0},"ngo":{"$":0},"mil":{"$":0},"i":{"$":0}},"pk":{"$":0,"com":{"$":0},"net":{"$":0},"edu":{"$":0},"org":{"$":0},"fam":{"$":0},"biz":{"$":0},"web":{"$":0},"gov":{"$":0},"gob":{"$":0},"gok":{"$":0},"gon":{"$":0},"gop":{"$":0},"gos":{"$":0},"info":{"$":0}},"pl":{"$":0,"com":{"$":0},"net":{"$":0},"org":{"$":0},"aid":{"$":0},"agro":{"$":0},"atm":{"$":0},"auto":{"$":0},"biz":{"$":0},"edu":{"$":0},"gmina":{"$":0},"gsm":{"$":0},"info":{"$":0},"mail":{"$":0},"miasta":{"$":0},"media":{"$":0},"mil":{"$":0},"nieruchomosci":{"$":0},"nom":{"$":0},"pc":{"$":0},"powiat":{"$":0},"priv":{"$":0},"realestate":{"$":0},"rel":{"$":0},"sex":{"$":0},"shop":{"$":0},"sklep":{"$":0},"sos":{"$":0},"szkola":{"$":0},"targi":{"$":0},"tm":{"$":0},"tourism":{"$":0},"travel":{"$":0},"turystyka":{"$":0},"gov":{"$":0,"ap":{"$":0},"ic":{"$":0},"is":{"$":0},"us":{"$":0},"kmpsp":{"$":0},"kppsp":{"$":0},"kwpsp":{"$":0},"psp":{"$":0},"wskr":{"$":0},"kwp":{"$":0},"mw":{"$":0},"ug":{"$":0},"um":{"$":0},"umig":{"$":0},"ugim":{"$":0},"upow":{"$":0},"uw":{"$":0},"starostwo":{"$":0},"pa":{"$":0},"po":{"$":0},"psse":{"$":0},"pup":{"$":0},"rzgw":{"$":0},"sa":{"$":0},"so":{"$":0},"sr":{"$":0},"wsa":{"$":0},"sko":{"$":0},"uzs":{"$":0},"wiih":{"$":0},"winb":{"$":0},"pinb":{"$":0},"wios":{"$":0},"witd":{"$":0},"wzmiuw":{"$":0},"piw":{"$":0},"wiw":{"$":0},"griw":{"$":0},"wif":{"$":0},"oum":{"$":0},"sdn":{"$":0},"zp":{"$":0},"uppo":{"$":0},"mup":{"$":0},"wuoz":{"$":0},"konsulat":{"$":0},"oirm":{"$":0}},"augustow":{"$":0},"babia-gora":{"$":0},"bedzin":{"$":0},"beskidy":{"$":0},"bialowieza":{"$":0},"bialystok":{"$":0},"bielawa":{"$":0},"bieszczady":{"$":0},"boleslawiec":{"$":0},"bydgoszcz":{"$":0},"bytom":{"$":0},"cieszyn":{"$":0},"czeladz":{"$":0},"czest":{"$":0},"dlugoleka":{"$":0},"elblag":{"$":0},"elk":{"$":0},"glogow":{"$":0},"gniezno":{"$":0},"gorlice":{"$":0},"grajewo":{"$":0},"ilawa":{"$":0},"jaworzno":{"$":0},"jelenia-gora":{"$":0},"jgora":{"$":0},"kalisz":{"$":0},"kazimierz-dolny":{"$":0},"karpacz":{"$":0},"kartuzy":{"$":0},"kaszuby":{"$":0},"katowice":{"$":0},"kepno":{"$":0},"ketrzyn":{"$":0},"klodzko":{"$":0},"kobierzyce":{"$":0},"kolobrzeg":{"$":0},"konin":{"$":0},"konskowola":{"$":0},"kutno":{"$":0},"lapy":{"$":0},"lebork":{"$":0},"legnica":{"$":0},"lezajsk":{"$":0},"limanowa":{"$":0},"lomza":{"$":0},"lowicz":{"$":0},"lubin":{"$":0},"lukow":{"$":0},"malbork":{"$":0},"malopolska":{"$":0},"mazowsze":{"$":0},"mazury":{"$":0},"mielec":{"$":0},"mielno":{"$":0},"mragowo":{"$":0},"naklo":{"$":0},"nowaruda":{"$":0},"nysa":{"$":0},"olawa":{"$":0},"olecko":{"$":0},"olkusz":{"$":0},"olsztyn":{"$":0},"opoczno":{"$":0},"opole":{"$":0},"ostroda":{"$":0},"ostroleka":{"$":0},"ostrowiec":{"$":0},"ostrowwlkp":{"$":0},"pila":{"$":0},"pisz":{"$":0},"podhale":{"$":0},"podlasie":{"$":0},"polkowice":{"$":0},"pomorze":{"$":0},"pomorskie":{"$":0},"prochowice":{"$":0},"pruszkow":{"$":0},"przeworsk":{"$":0},"pulawy":{"$":0},"radom":{"$":0},"rawa-maz":{"$":0},"rybnik":{"$":0},"rzeszow":{"$":0},"sanok":{"$":0},"sejny":{"$":0},"slask":{"$":0},"slupsk":{"$":0},"sosnowiec":{"$":0},"stalowa-wola":{"$":0},"skoczow":{"$":0},"starachowice":{"$":0},"stargard":{"$":0},"suwalki":{"$":0},"swidnica":{"$":0},"swiebodzin":{"$":0},"swinoujscie":{"$":0},"szczecin":{"$":0},"szczytno":{"$":0},"tarnobrzeg":{"$":0},"tgory":{"$":0},"turek":{"$":0},"tychy":{"$":0},"ustka":{"$":0},"walbrzych":{"$":0},"warmia":{"$":0},"warszawa":{"$":0},"waw":{"$":0},"wegrow":{"$":0},"wielun":{"$":0},"wlocl":{"$":0},"wloclawek":{"$":0},"wodzislaw":{"$":0},"wolomin":{"$":0},"wroclaw":{"$":0},"zachpomor":{"$":0},"zagan":{"$":0},"zarow":{"$":0},"zgora":{"$":0},"zgorzelec":{"$":0},"beep":{"$":0},"co":{"$":0},"art":{"$":0},"gliwice":{"$":0},"krakow":{"$":0},"poznan":{"$":0},"wroc":{"$":0},"zakopane":{"$":0},"gda":{"$":0},"gdansk":{"$":0},"gdynia":{"$":0},"med":{"$":0},"sopot":{"$":0}},"pm":{"$":0},"pn":{"$":0,"gov":{"$":0},"co":{"$":0},"org":{"$":0},"edu":{"$":0},"net":{"$":0}},"post":{"$":0},"pr":{"$":0,"com":{"$":0},"net":{"$":0},"org":{"$":0},"gov":{"$":0},"edu":{"$":0},"isla":{"$":0},"pro":{"$":0},"biz":{"$":0},"info":{"$":0},"name":{"$":0},"est":{"$":0},"prof":{"$":0},"ac":{"$":0}},"pro":{"$":0,"aaa":{"$":0},"aca":{"$":0},"acct":{"$":0},"avocat":{"$":0},"bar":{"$":0},"cpa":{"$":0},"eng":{"$":0},"jur":{"$":0},"law":{"$":0},"med":{"$":0},"recht":{"$":0},"cloudns":{"$":0}},"ps":{"$":0,"edu":{"$":0},"gov":{"$":0},"sec":{"$":0},"plo":{"$":0},"com":{"$":0},"org":{"$":0},"net":{"$":0}},"pt":{"$":0,"net":{"$":0},"gov":{"$":0},"org":{"$":0},"edu":{"$":0},"int":{"$":0},"publ":{"$":0},"com":{"$":0},"nome":{"$":0},"blogspot":{"$":0},"nym":{"$":0}},"pw":{"$":0,"co":{"$":0},"ne":{"$":0},"or":{"$":0},"ed":{"$":0},"go":{"$":0},"belau":{"$":0},"cloudns":{"$":0},"nom":{"$":0}},"py":{"$":0,"com":{"$":0},"coop":{"$":0},"edu":{"$":0},"gov":{"$":0},"mil":{"$":0},"net":{"$":0},"org":{"$":0}},"qa":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"mil":{"$":0},"name":{"$":0},"net":{"$":0},"org":{"$":0},"sch":{"$":0},"blogspot":{"$":0},"nom":{"$":0}},"re":{"$":0,"asso":{"$":0},"com":{"$":0},"nom":{"$":0},"blogspot":{"$":0}},"ro":{"$":0,"arts":{"$":0},"com":{"$":0},"firm":{"$":0},"info":{"$":0},"nom":{"$":0},"nt":{"$":0},"org":{"$":0},"rec":{"$":0},"store":{"$":0},"tm":{"$":0},"www":{"$":0},"shop":{"$":0},"blogspot":{"$":0}},"rs":{"$":0,"ac":{"$":0},"co":{"$":0},"edu":{"$":0},"gov":{"$":0},"in":{"$":0},"org":{"$":0},"blogspot":{"$":0},"nom":{"$":0}},"ru":{"$":0,"ac":{"$":0},"edu":{"$":0},"gov":{"$":0},"int":{"$":0},"mil":{"$":0},"test":{"$":0},"adygeya":{"$":0},"bashkiria":{"$":0},"bir":{"$":0},"cbg":{"$":0},"com":{"$":0},"dagestan":{"$":0},"grozny":{"$":0},"kalmykia":{"$":0},"kustanai":{"$":0},"marine":{"$":0},"mordovia":{"$":0},"msk":{"$":0},"mytis":{"$":0},"nalchik":{"$":0},"nov":{"$":0},"pyatigorsk":{"$":0},"spb":{"$":0},"vladikavkaz":{"$":0},"vladimir":{"$":0},"blogspot":{"$":0},"cldmail":{"hb":{"$":0}},"net":{"$":0},"org":{"$":0},"pp":{"$":0}},"rw":{"$":0,"gov":{"$":0},"net":{"$":0},"edu":{"$":0},"ac":{"$":0},"com":{"$":0},"co":{"$":0},"int":{"$":0},"mil":{"$":0},"gouv":{"$":0}},"sa":{"$":0,"com":{"$":0},"net":{"$":0},"org":{"$":0},"gov":{"$":0},"med":{"$":0},"pub":{"$":0},"edu":{"$":0},"sch":{"$":0}},"sb":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"net":{"$":0},"org":{"$":0}},"sc":{"$":0,"com":{"$":0},"gov":{"$":0},"net":{"$":0},"org":{"$":0},"edu":{"$":0}},"sd":{"$":0,"com":{"$":0},"net":{"$":0},"org":{"$":0},"edu":{"$":0},"med":{"$":0},"tv":{"$":0},"gov":{"$":0},"info":{"$":0}},"se":{"$":0,"a":{"$":0},"ac":{"$":0},"b":{"$":0},"bd":{"$":0},"brand":{"$":0},"c":{"$":0},"d":{"$":0},"e":{"$":0},"f":{"$":0},"fh":{"$":0},"fhsk":{"$":0},"fhv":{"$":0},"g":{"$":0},"h":{"$":0},"i":{"$":0},"k":{"$":0},"komforb":{"$":0},"kommunalforbund":{"$":0},"komvux":{"$":0},"l":{"$":0},"lanbib":{"$":0},"m":{"$":0},"n":{"$":0},"naturbruksgymn":{"$":0},"o":{"$":0},"org":{"$":0},"p":{"$":0},"parti":{"$":0},"pp":{"$":0},"press":{"$":0},"r":{"$":0},"s":{"$":0},"t":{"$":0},"tm":{"$":0},"u":{"$":0},"w":{"$":0},"x":{"$":0},"y":{"$":0},"z":{"$":0},"com":{"$":0},"blogspot":{"$":0}},"sg":{"$":0,"com":{"$":0},"net":{"$":0},"org":{"$":0},"gov":{"$":0},"edu":{"$":0},"per":{"$":0},"blogspot":{"$":0}},"sh":{"$":0,"com":{"$":0},"net":{"$":0},"gov":{"$":0},"org":{"$":0},"mil":{"$":0},"hashbang":{"$":0},"platform":{"*":{"$":0}},"wedeploy":{"$":0},"now":{"$":0}},"si":{"$":0,"blogspot":{"$":0},"nom":{"$":0}},"sj":{"$":0},"sk":{"$":0,"blogspot":{"$":0},"nym":{"$":0}},"sl":{"$":0,"com":{"$":0},"net":{"$":0},"edu":{"$":0},"gov":{"$":0},"org":{"$":0}},"sm":{"$":0},"sn":{"$":0,"art":{"$":0},"com":{"$":0},"edu":{"$":0},"gouv":{"$":0},"org":{"$":0},"perso":{"$":0},"univ":{"$":0},"blogspot":{"$":0}},"so":{"$":0,"com":{"$":0},"net":{"$":0},"org":{"$":0}},"sr":{"$":0},"st":{"$":0,"co":{"$":0},"com":{"$":0},"consulado":{"$":0},"edu":{"$":0},"embaixada":{"$":0},"gov":{"$":0},"mil":{"$":0},"net":{"$":0},"org":{"$":0},"principe":{"$":0},"saotome":{"$":0},"store":{"$":0}},"su":{"$":0,"abkhazia":{"$":0},"adygeya":{"$":0},"aktyubinsk":{"$":0},"arkhangelsk":{"$":0},"armenia":{"$":0},"ashgabad":{"$":0},"azerbaijan":{"$":0},"balashov":{"$":0},"bashkiria":{"$":0},"bryansk":{"$":0},"bukhara":{"$":0},"chimkent":{"$":0},"dagestan":{"$":0},"east-kazakhstan":{"$":0},"exnet":{"$":0},"georgia":{"$":0},"grozny":{"$":0},"ivanovo":{"$":0},"jambyl":{"$":0},"kalmykia":{"$":0},"kaluga":{"$":0},"karacol":{"$":0},"karaganda":{"$":0},"karelia":{"$":0},"khakassia":{"$":0},"krasnodar":{"$":0},"kurgan":{"$":0},"kustanai":{"$":0},"lenug":{"$":0},"mangyshlak":{"$":0},"mordovia":{"$":0},"msk":{"$":0},"murmansk":{"$":0},"nalchik":{"$":0},"navoi":{"$":0},"north-kazakhstan":{"$":0},"nov":{"$":0},"obninsk":{"$":0},"penza":{"$":0},"pokrovsk":{"$":0},"sochi":{"$":0},"spb":{"$":0},"tashkent":{"$":0},"termez":{"$":0},"togliatti":{"$":0},"troitsk":{"$":0},"tselinograd":{"$":0},"tula":{"$":0},"tuva":{"$":0},"vladikavkaz":{"$":0},"vladimir":{"$":0},"vologda":{"$":0},"nym":{"$":0}},"sv":{"$":0,"com":{"$":0},"edu":{"$":0},"gob":{"$":0},"org":{"$":0},"red":{"$":0}},"sx":{"$":0,"gov":{"$":0},"nym":{"$":0}},"sy":{"$":0,"edu":{"$":0},"gov":{"$":0},"net":{"$":0},"mil":{"$":0},"com":{"$":0},"org":{"$":0}},"sz":{"$":0,"co":{"$":0},"ac":{"$":0},"org":{"$":0}},"tc":{"$":0},"td":{"$":0,"blogspot":{"$":0}},"tel":{"$":0},"tf":{"$":0},"tg":{"$":0},"th":{"$":0,"ac":{"$":0},"co":{"$":0},"go":{"$":0},"in":{"$":0},"mi":{"$":0},"net":{"$":0},"or":{"$":0}},"tj":{"$":0,"ac":{"$":0},"biz":{"$":0},"co":{"$":0},"com":{"$":0},"edu":{"$":0},"go":{"$":0},"gov":{"$":0},"int":{"$":0},"mil":{"$":0},"name":{"$":0},"net":{"$":0},"nic":{"$":0},"org":{"$":0},"test":{"$":0},"web":{"$":0}},"tk":{"$":0},"tl":{"$":0,"gov":{"$":0}},"tm":{"$":0,"com":{"$":0},"co":{"$":0},"org":{"$":0},"net":{"$":0},"nom":{"$":0},"gov":{"$":0},"mil":{"$":0},"edu":{"$":0}},"tn":{"$":0,"com":{"$":0},"ens":{"$":0},"fin":{"$":0},"gov":{"$":0},"ind":{"$":0},"intl":{"$":0},"nat":{"$":0},"net":{"$":0},"org":{"$":0},"info":{"$":0},"perso":{"$":0},"tourism":{"$":0},"edunet":{"$":0},"rnrt":{"$":0},"rns":{"$":0},"rnu":{"$":0},"mincom":{"$":0},"agrinet":{"$":0},"defense":{"$":0},"turen":{"$":0}},"to":{"$":0,"com":{"$":0},"gov":{"$":0},"net":{"$":0},"org":{"$":0},"edu":{"$":0},"mil":{"$":0},"vpnplus":{"$":0}},"tr":{"$":0,"com":{"$":0,"blogspot":{"$":0}},"info":{"$":0},"biz":{"$":0},"net":{"$":0},"org":{"$":0},"web":{"$":0},"gen":{"$":0},"tv":{"$":0},"av":{"$":0},"dr":{"$":0},"bbs":{"$":0},"name":{"$":0},"tel":{"$":0},"gov":{"$":0},"bel":{"$":0},"pol":{"$":0},"mil":{"$":0},"k12":{"$":0},"edu":{"$":0},"kep":{"$":0},"nc":{"$":0,"gov":{"$":0}}},"travel":{"$":0},"tt":{"$":0,"co":{"$":0},"com":{"$":0},"org":{"$":0},"net":{"$":0},"biz":{"$":0},"info":{"$":0},"pro":{"$":0},"int":{"$":0},"coop":{"$":0},"jobs":{"$":0},"mobi":{"$":0},"travel":{"$":0},"museum":{"$":0},"aero":{"$":0},"name":{"$":0},"gov":{"$":0},"edu":{"$":0}},"tv":{"$":0,"dyndns":{"$":0},"better-than":{"$":0},"on-the-web":{"$":0},"worse-than":{"$":0}},"tw":{"$":0,"edu":{"$":0},"gov":{"$":0},"mil":{"$":0},"com":{"$":0,"mymailer":{"$":0}},"net":{"$":0},"org":{"$":0},"idv":{"$":0},"game":{"$":0},"ebiz":{"$":0},"club":{"$":0},"xn--zf0ao64a":{"$":0},"xn--uc0atv":{"$":0},"xn--czrw28b":{"$":0},"url":{"$":0},"blogspot":{"$":0},"nym":{"$":0}},"tz":{"$":0,"ac":{"$":0},"co":{"$":0},"go":{"$":0},"hotel":{"$":0},"info":{"$":0},"me":{"$":0},"mil":{"$":0},"mobi":{"$":0},"ne":{"$":0},"or":{"$":0},"sc":{"$":0},"tv":{"$":0}},"ua":{"$":0,"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"in":{"$":0},"net":{"$":0},"org":{"$":0},"cherkassy":{"$":0},"cherkasy":{"$":0},"chernigov":{"$":0},"chernihiv":{"$":0},"chernivtsi":{"$":0},"chernovtsy":{"$":0},"ck":{"$":0},"cn":{"$":0},"cr":{"$":0},"crimea":{"$":0},"cv":{"$":0},"dn":{"$":0},"dnepropetrovsk":{"$":0},"dnipropetrovsk":{"$":0},"dominic":{"$":0},"donetsk":{"$":0},"dp":{"$":0},"if":{"$":0},"ivano-frankivsk":{"$":0},"kh":{"$":0},"kharkiv":{"$":0},"kharkov":{"$":0},"kherson":{"$":0},"khmelnitskiy":{"$":0},"khmelnytskyi":{"$":0},"kiev":{"$":0},"kirovograd":{"$":0},"km":{"$":0},"kr":{"$":0},"krym":{"$":0},"ks":{"$":0},"kv":{"$":0},"kyiv":{"$":0},"lg":{"$":0},"lt":{"$":0},"lugansk":{"$":0},"lutsk":{"$":0},"lv":{"$":0},"lviv":{"$":0},"mk":{"$":0},"mykolaiv":{"$":0},"nikolaev":{"$":0},"od":{"$":0},"odesa":{"$":0},"odessa":{"$":0},"pl":{"$":0},"poltava":{"$":0},"rivne":{"$":0},"rovno":{"$":0},"rv":{"$":0},"sb":{"$":0},"sebastopol":{"$":0},"sevastopol":{"$":0},"sm":{"$":0},"sumy":{"$":0},"te":{"$":0},"ternopil":{"$":0},"uz":{"$":0},"uzhgorod":{"$":0},"vinnica":{"$":0},"vinnytsia":{"$":0},"vn":{"$":0},"volyn":{"$":0},"yalta":{"$":0},"zaporizhzhe":{"$":0},"zaporizhzhia":{"$":0},"zhitomir":{"$":0},"zhytomyr":{"$":0},"zp":{"$":0},"zt":{"$":0},"cc":{"$":0},"inf":{"$":0},"ltd":{"$":0},"biz":{"$":0},"co":{"$":0},"pp":{"$":0}},"ug":{"$":0,"co":{"$":0},"or":{"$":0},"ac":{"$":0},"sc":{"$":0},"go":{"$":0},"ne":{"$":0},"com":{"$":0},"org":{"$":0},"blogspot":{"$":0},"nom":{"$":0}},"uk":{"$":0,"ac":{"$":0},"co":{"$":0,"blogspot":{"$":0},"no-ip":{"$":0},"wellbeingzone":{"$":0}},"gov":{"$":0,"service":{"$":0},"homeoffice":{"$":0}},"ltd":{"$":0},"me":{"$":0},"net":{"$":0},"nhs":{"$":0},"org":{"$":0},"plc":{"$":0},"police":{"$":0},"sch":{"*":{"$":0}}},"us":{"$":0,"dni":{"$":0},"fed":{"$":0},"isa":{"$":0},"kids":{"$":0},"nsn":{"$":0},"ak":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"al":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"ar":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"as":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"az":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"ca":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"co":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"ct":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"dc":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"de":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"fl":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"ga":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"gu":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"hi":{"$":0,"cc":{"$":0},"lib":{"$":0}},"ia":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"id":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"il":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"in":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"ks":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"ky":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"la":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"ma":{"$":0,"k12":{"$":0,"pvt":{"$":0},"chtr":{"$":0},"paroch":{"$":0}},"cc":{"$":0},"lib":{"$":0}},"md":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"me":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"mi":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0},"ann-arbor":{"$":0},"cog":{"$":0},"dst":{"$":0},"eaton":{"$":0},"gen":{"$":0},"mus":{"$":0},"tec":{"$":0},"washtenaw":{"$":0}},"mn":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"mo":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"ms":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"mt":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"nc":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"nd":{"$":0,"cc":{"$":0},"lib":{"$":0}},"ne":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"nh":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"nj":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"nm":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"nv":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"ny":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"oh":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"ok":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"or":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"pa":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"pr":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"ri":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"sc":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"sd":{"$":0,"cc":{"$":0},"lib":{"$":0}},"tn":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"tx":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"ut":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"vi":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"vt":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"va":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"wa":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"wi":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"wv":{"$":0,"cc":{"$":0}},"wy":{"$":0,"k12":{"$":0},"cc":{"$":0},"lib":{"$":0}},"cloudns":{"$":0},"drud":{"$":0},"is-by":{"$":0},"land-4-sale":{"$":0},"stuff-4-sale":{"$":0},"golffan":{"$":0},"noip":{"$":0},"pointto":{"$":0}},"uy":{"$":0,"com":{"$":0,"blogspot":{"$":0}},"edu":{"$":0},"gub":{"$":0},"mil":{"$":0},"net":{"$":0},"org":{"$":0},"nom":{"$":0}},"uz":{"$":0,"co":{"$":0},"com":{"$":0},"net":{"$":0},"org":{"$":0}},"va":{"$":0},"vc":{"$":0,"com":{"$":0},"net":{"$":0},"org":{"$":0},"gov":{"$":0},"mil":{"$":0},"edu":{"$":0},"nom":{"$":0}},"ve":{"$":0,"arts":{"$":0},"co":{"$":0},"com":{"$":0},"e12":{"$":0},"edu":{"$":0},"firm":{"$":0},"gob":{"$":0},"gov":{"$":0},"info":{"$":0},"int":{"$":0},"mil":{"$":0},"net":{"$":0},"org":{"$":0},"rec":{"$":0},"store":{"$":0},"tec":{"$":0},"web":{"$":0}},"vg":{"$":0,"nom":{"$":0}},"vi":{"$":0,"co":{"$":0},"com":{"$":0},"k12":{"$":0},"net":{"$":0},"org":{"$":0}},"vn":{"$":0,"com":{"$":0},"net":{"$":0},"org":{"$":0},"edu":{"$":0},"gov":{"$":0},"int":{"$":0},"ac":{"$":0},"biz":{"$":0},"info":{"$":0},"name":{"$":0},"pro":{"$":0},"health":{"$":0},"blogspot":{"$":0}},"vu":{"$":0,"com":{"$":0},"edu":{"$":0},"net":{"$":0},"org":{"$":0}},"wf":{"$":0},"ws":{"$":0,"com":{"$":0},"net":{"$":0},"org":{"$":0},"gov":{"$":0},"edu":{"$":0},"advisor":{"*":{"$":0}},"dyndns":{"$":0},"mypets":{"$":0}},"yt":{"$":0},"xn--mgbaam7a8h":{"$":0},"xn--y9a3aq":{"$":0},"xn--54b7fta0cc":{"$":0},"xn--90ae":{"$":0},"xn--90ais":{"$":0},"xn--fiqs8s":{"$":0},"xn--fiqz9s":{"$":0},"xn--lgbbat1ad8j":{"$":0},"xn--wgbh1c":{"$":0},"xn--e1a4c":{"$":0},"xn--node":{"$":0},"xn--qxam":{"$":0},"xn--j6w193g":{"$":0},"xn--2scrj9c":{"$":0},"xn--3hcrj9c":{"$":0},"xn--45br5cyl":{"$":0},"xn--h2breg3eve":{"$":0},"xn--h2brj9c8c":{"$":0},"xn--mgbgu82a":{"$":0},"xn--rvc1e0am3e":{"$":0},"xn--h2brj9c":{"$":0},"xn--mgbbh1a71e":{"$":0},"xn--fpcrj9c3d":{"$":0},"xn--gecrj9c":{"$":0},"xn--s9brj9c":{"$":0},"xn--45brj9c":{"$":0},"xn--xkc2dl3a5ee0h":{"$":0},"xn--mgba3a4f16a":{"$":0},"xn--mgba3a4fra":{"$":0},"xn--mgbtx2b":{"$":0},"xn--mgbayh7gpa":{"$":0},"xn--3e0b707e":{"$":0},"xn--80ao21a":{"$":0},"xn--fzc2c9e2c":{"$":0},"xn--xkc2al3hye2a":{"$":0},"xn--mgbc0a9azcg":{"$":0},"xn--d1alf":{"$":0},"xn--l1acc":{"$":0},"xn--mix891f":{"$":0},"xn--mix082f":{"$":0},"xn--mgbx4cd0ab":{"$":0},"xn--mgb9awbf":{"$":0},"xn--mgbai9azgqp6j":{"$":0},"xn--mgbai9a5eva00b":{"$":0},"xn--ygbi2ammx":{"$":0},"xn--90a3ac":{"$":0,"xn--o1ac":{"$":0},"xn--c1avg":{"$":0},"xn--90azh":{"$":0},"xn--d1at":{"$":0},"xn--o1ach":{"$":0},"xn--80au":{"$":0}},"xn--p1ai":{"$":0},"xn--wgbl6a":{"$":0},"xn--mgberp4a5d4ar":{"$":0},"xn--mgberp4a5d4a87g":{"$":0},"xn--mgbqly7c0a67fbc":{"$":0},"xn--mgbqly7cvafr":{"$":0},"xn--mgbpl2fh":{"$":0},"xn--yfro4i67o":{"$":0},"xn--clchc0ea0b2g2a9gcd":{"$":0},"xn--ogbpf8fl":{"$":0},"xn--mgbtf8fl":{"$":0},"xn--o3cw4h":{"$":0,"xn--12c1fe0br":{"$":0},"xn--12co0c3b4eva":{"$":0},"xn--h3cuzk1di":{"$":0},"xn--o3cyx2a":{"$":0},"xn--m3ch0j3a":{"$":0},"xn--12cfi8ixb8l":{"$":0}},"xn--pgbs0dh":{"$":0},"xn--kpry57d":{"$":0},"xn--kprw13d":{"$":0},"xn--nnx388a":{"$":0},"xn--j1amh":{"$":0},"xn--mgb2ddes":{"$":0},"xxx":{"$":0},"ye":{"*":{"$":0}},"za":{"ac":{"$":0},"agric":{"$":0},"alt":{"$":0},"co":{"$":0,"blogspot":{"$":0}},"edu":{"$":0},"gov":{"$":0},"grondar":{"$":0},"law":{"$":0},"mil":{"$":0},"net":{"$":0},"ngo":{"$":0},"nis":{"$":0},"nom":{"$":0},"org":{"$":0},"school":{"$":0},"tm":{"$":0},"web":{"$":0}},"zm":{"$":0,"ac":{"$":0},"biz":{"$":0},"co":{"$":0},"com":{"$":0},"edu":{"$":0},"gov":{"$":0},"info":{"$":0},"mil":{"$":0},"net":{"$":0},"org":{"$":0},"sch":{"$":0}},"zw":{"$":0,"ac":{"$":0},"co":{"$":0},"gov":{"$":0},"mil":{"$":0},"org":{"$":0}},"aaa":{"$":0},"aarp":{"$":0},"abarth":{"$":0},"abb":{"$":0},"abbott":{"$":0},"abbvie":{"$":0},"abc":{"$":0},"able":{"$":0},"abogado":{"$":0},"abudhabi":{"$":0},"academy":{"$":0},"accenture":{"$":0},"accountant":{"$":0},"accountants":{"$":0},"aco":{"$":0},"active":{"$":0},"actor":{"$":0},"adac":{"$":0},"ads":{"$":0},"adult":{"$":0},"aeg":{"$":0},"aetna":{"$":0},"afamilycompany":{"$":0},"afl":{"$":0},"africa":{"$":0},"agakhan":{"$":0},"agency":{"$":0},"aig":{"$":0},"aigo":{"$":0},"airbus":{"$":0},"airforce":{"$":0},"airtel":{"$":0},"akdn":{"$":0},"alfaromeo":{"$":0},"alibaba":{"$":0},"alipay":{"$":0},"allfinanz":{"$":0},"allstate":{"$":0},"ally":{"$":0},"alsace":{"$":0},"alstom":{"$":0},"americanexpress":{"$":0},"americanfamily":{"$":0},"amex":{"$":0},"amfam":{"$":0},"amica":{"$":0},"amsterdam":{"$":0},"analytics":{"$":0},"android":{"$":0},"anquan":{"$":0},"anz":{"$":0},"aol":{"$":0},"apartments":{"$":0},"app":{"$":0},"apple":{"$":0},"aquarelle":{"$":0},"arab":{"$":0},"aramco":{"$":0},"archi":{"$":0},"army":{"$":0},"art":{"$":0},"arte":{"$":0},"asda":{"$":0},"associates":{"$":0},"athleta":{"$":0},"attorney":{"$":0},"auction":{"$":0},"audi":{"$":0},"audible":{"$":0},"audio":{"$":0},"auspost":{"$":0},"author":{"$":0},"auto":{"$":0},"autos":{"$":0},"avianca":{"$":0},"aws":{"$":0},"axa":{"$":0},"azure":{"$":0},"baby":{"$":0},"baidu":{"$":0},"banamex":{"$":0},"bananarepublic":{"$":0},"band":{"$":0},"bank":{"$":0},"bar":{"$":0},"barcelona":{"$":0},"barclaycard":{"$":0},"barclays":{"$":0},"barefoot":{"$":0},"bargains":{"$":0},"baseball":{"$":0},"basketball":{"$":0},"bauhaus":{"$":0},"bayern":{"$":0},"bbc":{"$":0},"bbt":{"$":0},"bbva":{"$":0},"bcg":{"$":0},"bcn":{"$":0},"beats":{"$":0},"beauty":{"$":0},"beer":{"$":0},"bentley":{"$":0},"berlin":{"$":0},"best":{"$":0},"bestbuy":{"$":0},"bet":{"$":0},"bharti":{"$":0},"bible":{"$":0},"bid":{"$":0},"bike":{"$":0},"bing":{"$":0},"bingo":{"$":0},"bio":{"$":0},"black":{"$":0},"blackfriday":{"$":0},"blanco":{"$":0},"blockbuster":{"$":0},"blog":{"$":0},"bloomberg":{"$":0},"blue":{"$":0},"bms":{"$":0},"bmw":{"$":0},"bnl":{"$":0},"bnpparibas":{"$":0},"boats":{"$":0},"boehringer":{"$":0},"bofa":{"$":0},"bom":{"$":0},"bond":{"$":0},"boo":{"$":0},"book":{"$":0},"booking":{"$":0},"boots":{"$":0},"bosch":{"$":0},"bostik":{"$":0},"boston":{"$":0},"bot":{"$":0},"boutique":{"$":0},"box":{"$":0},"bradesco":{"$":0},"bridgestone":{"$":0},"broadway":{"$":0},"broker":{"$":0},"brother":{"$":0},"brussels":{"$":0},"budapest":{"$":0},"bugatti":{"$":0},"build":{"$":0},"builders":{"$":0},"business":{"$":0},"buy":{"$":0},"buzz":{"$":0},"bzh":{"$":0},"cab":{"$":0},"cafe":{"$":0},"cal":{"$":0},"call":{"$":0},"calvinklein":{"$":0},"cam":{"$":0},"camera":{"$":0},"camp":{"$":0},"cancerresearch":{"$":0},"canon":{"$":0},"capetown":{"$":0},"capital":{"$":0},"capitalone":{"$":0},"car":{"$":0},"caravan":{"$":0},"cards":{"$":0},"care":{"$":0},"career":{"$":0},"careers":{"$":0},"cars":{"$":0},"cartier":{"$":0},"casa":{"$":0},"case":{"$":0},"caseih":{"$":0},"cash":{"$":0},"casino":{"$":0},"catering":{"$":0},"catholic":{"$":0},"cba":{"$":0},"cbn":{"$":0},"cbre":{"$":0},"cbs":{"$":0},"ceb":{"$":0},"center":{"$":0},"ceo":{"$":0},"cern":{"$":0},"cfa":{"$":0},"cfd":{"$":0},"chanel":{"$":0},"channel":{"$":0},"chase":{"$":0},"chat":{"$":0},"cheap":{"$":0},"chintai":{"$":0},"chloe":{"$":0},"christmas":{"$":0},"chrome":{"$":0},"chrysler":{"$":0},"church":{"$":0},"cipriani":{"$":0},"circle":{"$":0},"cisco":{"$":0},"citadel":{"$":0},"citi":{"$":0},"citic":{"$":0},"city":{"$":0},"cityeats":{"$":0},"claims":{"$":0},"cleaning":{"$":0},"click":{"$":0},"clinic":{"$":0},"clinique":{"$":0},"clothing":{"$":0},"cloud":{"$":0,"myfusion":{"$":0},"statics":{"*":{"$":0}},"magentosite":{"*":{"$":0}},"vapor":{"$":0},"sensiosite":{"*":{"$":0}},"trafficplex":{"$":0}},"club":{"$":0,"cloudns":{"$":0}},"clubmed":{"$":0},"coach":{"$":0},"codes":{"$":0},"coffee":{"$":0},"college":{"$":0},"cologne":{"$":0},"comcast":{"$":0},"commbank":{"$":0},"community":{"$":0},"company":{"$":0},"compare":{"$":0},"computer":{"$":0},"comsec":{"$":0},"condos":{"$":0},"construction":{"$":0},"consulting":{"$":0},"contact":{"$":0},"contractors":{"$":0},"cooking":{"$":0},"cookingchannel":{"$":0},"cool":{"$":0,"de":{"$":0}},"corsica":{"$":0},"country":{"$":0},"coupon":{"$":0},"coupons":{"$":0},"courses":{"$":0},"credit":{"$":0},"creditcard":{"$":0},"creditunion":{"$":0},"cricket":{"$":0},"crown":{"$":0},"crs":{"$":0},"cruise":{"$":0},"cruises":{"$":0},"csc":{"$":0},"cuisinella":{"$":0},"cymru":{"$":0},"cyou":{"$":0},"dabur":{"$":0},"dad":{"$":0},"dance":{"$":0},"data":{"$":0},"date":{"$":0},"dating":{"$":0},"datsun":{"$":0},"day":{"$":0},"dclk":{"$":0},"dds":{"$":0},"deal":{"$":0},"dealer":{"$":0},"deals":{"$":0},"degree":{"$":0},"delivery":{"$":0},"dell":{"$":0},"deloitte":{"$":0},"delta":{"$":0},"democrat":{"$":0},"dental":{"$":0},"dentist":{"$":0},"desi":{"$":0},"design":{"$":0},"dev":{"$":0},"dhl":{"$":0},"diamonds":{"$":0},"diet":{"$":0},"digital":{"$":0},"direct":{"$":0},"directory":{"$":0},"discount":{"$":0},"discover":{"$":0},"dish":{"$":0},"diy":{"$":0},"dnp":{"$":0},"docs":{"$":0},"doctor":{"$":0},"dodge":{"$":0},"dog":{"$":0},"doha":{"$":0},"domains":{"$":0},"dot":{"$":0},"download":{"$":0},"drive":{"$":0},"dtv":{"$":0},"dubai":{"$":0},"duck":{"$":0},"dunlop":{"$":0},"duns":{"$":0},"dupont":{"$":0},"durban":{"$":0},"dvag":{"$":0},"dvr":{"$":0},"earth":{"$":0},"eat":{"$":0},"eco":{"$":0},"edeka":{"$":0},"education":{"$":0},"email":{"$":0},"emerck":{"$":0},"energy":{"$":0},"engineer":{"$":0},"engineering":{"$":0},"enterprises":{"$":0},"epost":{"$":0},"epson":{"$":0},"equipment":{"$":0},"ericsson":{"$":0},"erni":{"$":0},"esq":{"$":0},"estate":{"$":0,"compute":{"*":{"$":0}}},"esurance":{"$":0},"etisalat":{"$":0},"eurovision":{"$":0},"eus":{"$":0,"party":{"user":{"$":0}}},"events":{"$":0},"everbank":{"$":0},"exchange":{"$":0},"expert":{"$":0},"exposed":{"$":0},"express":{"$":0},"extraspace":{"$":0},"fage":{"$":0},"fail":{"$":0},"fairwinds":{"$":0},"faith":{"$":0,"ybo":{"$":0}},"family":{"$":0},"fan":{"$":0},"fans":{"$":0},"farm":{"$":0,"storj":{"$":0}},"farmers":{"$":0},"fashion":{"$":0},"fast":{"$":0},"fedex":{"$":0},"feedback":{"$":0},"ferrari":{"$":0},"ferrero":{"$":0},"fiat":{"$":0},"fidelity":{"$":0},"fido":{"$":0},"film":{"$":0},"final":{"$":0},"finance":{"$":0},"financial":{"$":0},"fire":{"$":0},"firestone":{"$":0},"firmdale":{"$":0},"fish":{"$":0},"fishing":{"$":0},"fit":{"$":0,"ptplus":{"$":0}},"fitness":{"$":0},"flickr":{"$":0},"flights":{"$":0},"flir":{"$":0},"florist":{"$":0},"flowers":{"$":0},"fly":{"$":0},"foo":{"$":0},"food":{"$":0},"foodnetwork":{"$":0},"football":{"$":0},"ford":{"$":0},"forex":{"$":0},"forsale":{"$":0},"forum":{"$":0},"foundation":{"$":0},"fox":{"$":0},"free":{"$":0},"fresenius":{"$":0},"frl":{"$":0},"frogans":{"$":0},"frontdoor":{"$":0},"frontier":{"$":0},"ftr":{"$":0},"fujitsu":{"$":0},"fujixerox":{"$":0},"fun":{"$":0},"fund":{"$":0},"furniture":{"$":0},"futbol":{"$":0},"fyi":{"$":0},"gal":{"$":0},"gallery":{"$":0},"gallo":{"$":0},"gallup":{"$":0},"game":{"$":0},"games":{"$":0},"gap":{"$":0},"garden":{"$":0},"gbiz":{"$":0},"gdn":{"$":0},"gea":{"$":0},"gent":{"$":0},"genting":{"$":0},"george":{"$":0},"ggee":{"$":0},"gift":{"$":0},"gifts":{"$":0},"gives":{"$":0},"giving":{"$":0},"glade":{"$":0},"glass":{"$":0},"gle":{"$":0},"global":{"$":0},"globo":{"$":0},"gmail":{"$":0},"gmbh":{"$":0},"gmo":{"$":0},"gmx":{"$":0},"godaddy":{"$":0},"gold":{"$":0},"goldpoint":{"$":0},"golf":{"$":0},"goo":{"$":0},"goodhands":{"$":0},"goodyear":{"$":0},"goog":{"$":0,"cloud":{"$":0}},"google":{"$":0},"gop":{"$":0},"got":{"$":0},"grainger":{"$":0},"graphics":{"$":0},"gratis":{"$":0},"green":{"$":0},"gripe":{"$":0},"grocery":{"$":0},"group":{"$":0},"guardian":{"$":0},"gucci":{"$":0},"guge":{"$":0},"guide":{"$":0},"guitars":{"$":0},"guru":{"$":0},"hair":{"$":0},"hamburg":{"$":0},"hangout":{"$":0},"haus":{"$":0},"hbo":{"$":0},"hdfc":{"$":0},"hdfcbank":{"$":0},"health":{"$":0},"healthcare":{"$":0},"help":{"$":0},"helsinki":{"$":0},"here":{"$":0},"hermes":{"$":0},"hgtv":{"$":0},"hiphop":{"$":0},"hisamitsu":{"$":0},"hitachi":{"$":0},"hiv":{"$":0},"hkt":{"$":0},"hockey":{"$":0},"holdings":{"$":0},"holiday":{"$":0},"homedepot":{"$":0},"homegoods":{"$":0},"homes":{"$":0},"homesense":{"$":0},"honda":{"$":0},"honeywell":{"$":0},"horse":{"$":0},"hospital":{"$":0},"host":{"$":0,"cloudaccess":{"$":0},"freesite":{"$":0}},"hosting":{"$":0,"opencraft":{"$":0}},"hot":{"$":0},"hoteles":{"$":0},"hotels":{"$":0},"hotmail":{"$":0},"house":{"$":0},"how":{"$":0},"hsbc":{"$":0},"htc":{"$":0},"hughes":{"$":0},"hyatt":{"$":0},"hyundai":{"$":0},"ibm":{"$":0},"icbc":{"$":0},"ice":{"$":0},"icu":{"$":0},"ieee":{"$":0},"ifm":{"$":0},"ikano":{"$":0},"imamat":{"$":0},"imdb":{"$":0},"immo":{"$":0},"immobilien":{"$":0},"industries":{"$":0},"infiniti":{"$":0},"ing":{"$":0},"ink":{"$":0},"institute":{"$":0},"insurance":{"$":0},"insure":{"$":0},"intel":{"$":0},"international":{"$":0},"intuit":{"$":0},"investments":{"$":0},"ipiranga":{"$":0},"irish":{"$":0},"iselect":{"$":0},"ismaili":{"$":0},"ist":{"$":0},"istanbul":{"$":0},"itau":{"$":0},"itv":{"$":0},"iveco":{"$":0},"iwc":{"$":0},"jaguar":{"$":0},"java":{"$":0},"jcb":{"$":0},"jcp":{"$":0},"jeep":{"$":0},"jetzt":{"$":0},"jewelry":{"$":0},"jio":{"$":0},"jlc":{"$":0},"jll":{"$":0},"jmp":{"$":0},"jnj":{"$":0},"joburg":{"$":0},"jot":{"$":0},"joy":{"$":0},"jpmorgan":{"$":0},"jprs":{"$":0},"juegos":{"$":0},"juniper":{"$":0},"kaufen":{"$":0},"kddi":{"$":0},"kerryhotels":{"$":0},"kerrylogistics":{"$":0},"kerryproperties":{"$":0},"kfh":{"$":0},"kia":{"$":0},"kim":{"$":0},"kinder":{"$":0},"kindle":{"$":0},"kitchen":{"$":0},"kiwi":{"$":0},"koeln":{"$":0},"komatsu":{"$":0},"kosher":{"$":0},"kpmg":{"$":0},"kpn":{"$":0},"krd":{"$":0,"co":{"$":0},"edu":{"$":0}},"kred":{"$":0},"kuokgroup":{"$":0},"kyoto":{"$":0},"lacaixa":{"$":0},"ladbrokes":{"$":0},"lamborghini":{"$":0},"lamer":{"$":0},"lancaster":{"$":0},"lancia":{"$":0},"lancome":{"$":0},"land":{"$":0,"static":{"$":0,"dev":{"$":0},"sites":{"$":0}}},"landrover":{"$":0},"lanxess":{"$":0},"lasalle":{"$":0},"lat":{"$":0},"latino":{"$":0},"latrobe":{"$":0},"law":{"$":0},"lawyer":{"$":0},"lds":{"$":0},"lease":{"$":0},"leclerc":{"$":0},"lefrak":{"$":0},"legal":{"$":0},"lego":{"$":0},"lexus":{"$":0},"lgbt":{"$":0},"liaison":{"$":0},"lidl":{"$":0},"life":{"$":0},"lifeinsurance":{"$":0},"lifestyle":{"$":0},"lighting":{"$":0},"like":{"$":0},"lilly":{"$":0},"limited":{"$":0},"limo":{"$":0},"lincoln":{"$":0},"linde":{"$":0},"link":{"$":0,"cyon":{"$":0},"mypep":{"$":0}},"lipsy":{"$":0},"live":{"$":0},"living":{"$":0},"lixil":{"$":0},"loan":{"$":0},"loans":{"$":0},"locker":{"$":0},"locus":{"$":0},"loft":{"$":0},"lol":{"$":0},"london":{"$":0},"lotte":{"$":0},"lotto":{"$":0},"love":{"$":0},"lpl":{"$":0},"lplfinancial":{"$":0},"ltd":{"$":0},"ltda":{"$":0},"lundbeck":{"$":0},"lupin":{"$":0},"luxe":{"$":0},"luxury":{"$":0},"macys":{"$":0},"madrid":{"$":0},"maif":{"$":0},"maison":{"$":0},"makeup":{"$":0},"man":{"$":0},"management":{"$":0,"router":{"$":0}},"mango":{"$":0},"map":{"$":0},"market":{"$":0},"marketing":{"$":0},"markets":{"$":0},"marriott":{"$":0},"marshalls":{"$":0},"maserati":{"$":0},"mattel":{"$":0},"mba":{"$":0},"mcd":{"$":0},"mcdonalds":{"$":0},"mckinsey":{"$":0},"med":{"$":0},"media":{"$":0},"meet":{"$":0},"melbourne":{"$":0},"meme":{"$":0},"memorial":{"$":0},"men":{"$":0},"menu":{"$":0},"meo":{"$":0},"merckmsd":{"$":0},"metlife":{"$":0},"miami":{"$":0},"microsoft":{"$":0},"mini":{"$":0},"mint":{"$":0},"mit":{"$":0},"mitsubishi":{"$":0},"mlb":{"$":0},"mls":{"$":0},"mma":{"$":0},"mobile":{"$":0},"mobily":{"$":0},"moda":{"$":0},"moe":{"$":0},"moi":{"$":0},"mom":{"$":0},"monash":{"$":0},"money":{"$":0},"monster":{"$":0},"montblanc":{"$":0},"mopar":{"$":0},"mormon":{"$":0},"mortgage":{"$":0},"moscow":{"$":0},"moto":{"$":0},"motorcycles":{"$":0},"mov":{"$":0},"movie":{"$":0},"movistar":{"$":0},"msd":{"$":0},"mtn":{"$":0},"mtpc":{"$":0},"mtr":{"$":0},"mutual":{"$":0},"nab":{"$":0},"nadex":{"$":0},"nagoya":{"$":0},"nationwide":{"$":0},"natura":{"$":0},"navy":{"$":0},"nba":{"$":0},"nec":{"$":0},"netbank":{"$":0},"netflix":{"$":0},"network":{"$":0,"alces":{"*":{"$":0}}},"neustar":{"$":0},"new":{"$":0},"newholland":{"$":0},"news":{"$":0},"next":{"$":0},"nextdirect":{"$":0},"nexus":{"$":0},"nfl":{"$":0},"ngo":{"$":0},"nhk":{"$":0},"nico":{"$":0},"nike":{"$":0},"nikon":{"$":0},"ninja":{"$":0},"nissan":{"$":0},"nissay":{"$":0},"nokia":{"$":0},"northwesternmutual":{"$":0},"norton":{"$":0},"now":{"$":0},"nowruz":{"$":0},"nowtv":{"$":0},"nra":{"$":0},"nrw":{"$":0},"ntt":{"$":0},"nyc":{"$":0},"obi":{"$":0},"observer":{"$":0},"off":{"$":0},"office":{"$":0},"okinawa":{"$":0},"olayan":{"$":0},"olayangroup":{"$":0},"oldnavy":{"$":0},"ollo":{"$":0},"omega":{"$":0},"one":{"$":0,"homelink":{"$":0}},"ong":{"$":0},"onl":{"$":0},"online":{"$":0,"barsy":{"$":0}},"onyourside":{"$":0},"ooo":{"$":0},"open":{"$":0},"oracle":{"$":0},"orange":{"$":0},"organic":{"$":0},"origins":{"$":0},"osaka":{"$":0},"otsuka":{"$":0},"ott":{"$":0},"ovh":{"$":0,"nerdpol":{"$":0}},"page":{"$":0},"pamperedchef":{"$":0},"panasonic":{"$":0},"panerai":{"$":0},"paris":{"$":0},"pars":{"$":0},"partners":{"$":0},"parts":{"$":0},"party":{"$":0,"ybo":{"$":0}},"passagens":{"$":0},"pay":{"$":0},"pccw":{"$":0},"pet":{"$":0},"pfizer":{"$":0},"pharmacy":{"$":0},"phd":{"$":0},"philips":{"$":0},"phone":{"$":0},"photo":{"$":0},"photography":{"$":0},"photos":{"$":0},"physio":{"$":0},"piaget":{"$":0},"pics":{"$":0},"pictet":{"$":0},"pictures":{"1337":{"$":0},"$":0},"pid":{"$":0},"pin":{"$":0},"ping":{"$":0},"pink":{"$":0},"pioneer":{"$":0},"pizza":{"$":0},"place":{"$":0},"play":{"$":0},"playstation":{"$":0},"plumbing":{"$":0},"plus":{"$":0},"pnc":{"$":0},"pohl":{"$":0},"poker":{"$":0},"politie":{"$":0},"porn":{"$":0},"pramerica":{"$":0},"praxi":{"$":0},"press":{"$":0},"prime":{"$":0},"prod":{"$":0},"productions":{"$":0},"prof":{"$":0},"progressive":{"$":0},"promo":{"$":0},"properties":{"$":0},"property":{"$":0},"protection":{"$":0},"pru":{"$":0},"prudential":{"$":0},"pub":{"$":0},"pwc":{"$":0},"qpon":{"$":0},"quebec":{"$":0},"quest":{"$":0},"qvc":{"$":0},"racing":{"$":0},"radio":{"$":0},"raid":{"$":0},"read":{"$":0},"realestate":{"$":0},"realtor":{"$":0},"realty":{"$":0},"recipes":{"$":0},"red":{"$":0},"redstone":{"$":0},"redumbrella":{"$":0},"rehab":{"$":0},"reise":{"$":0},"reisen":{"$":0},"reit":{"$":0},"reliance":{"$":0},"ren":{"$":0},"rent":{"$":0},"rentals":{"$":0},"repair":{"$":0},"report":{"$":0},"republican":{"$":0},"rest":{"$":0},"restaurant":{"$":0},"review":{"$":0,"ybo":{"$":0}},"reviews":{"$":0},"rexroth":{"$":0},"rich":{"$":0},"richardli":{"$":0},"ricoh":{"$":0},"rightathome":{"$":0},"ril":{"$":0},"rio":{"$":0},"rip":{"$":0,"clan":{"$":0}},"rmit":{"$":0},"rocher":{"$":0},"rocks":{"$":0,"myddns":{"$":0},"lima-city":{"$":0},"webspace":{"$":0}},"rodeo":{"$":0},"rogers":{"$":0},"room":{"$":0},"rsvp":{"$":0},"rugby":{"$":0},"ruhr":{"$":0},"run":{"$":0},"rwe":{"$":0},"ryukyu":{"$":0},"saarland":{"$":0},"safe":{"$":0},"safety":{"$":0},"sakura":{"$":0},"sale":{"$":0},"salon":{"$":0},"samsclub":{"$":0},"samsung":{"$":0},"sandvik":{"$":0},"sandvikcoromant":{"$":0},"sanofi":{"$":0},"sap":{"$":0},"sapo":{"$":0},"sarl":{"$":0},"sas":{"$":0},"save":{"$":0},"saxo":{"$":0},"sbi":{"$":0},"sbs":{"$":0},"sca":{"$":0},"scb":{"$":0},"schaeffler":{"$":0},"schmidt":{"$":0},"scholarships":{"$":0},"school":{"$":0},"schule":{"$":0},"schwarz":{"$":0},"science":{"$":0,"ybo":{"$":0}},"scjohnson":{"$":0},"scor":{"$":0},"scot":{"$":0},"search":{"$":0},"seat":{"$":0},"secure":{"$":0},"security":{"$":0},"seek":{"$":0},"select":{"$":0},"sener":{"$":0},"services":{"$":0},"ses":{"$":0},"seven":{"$":0},"sew":{"$":0},"sex":{"$":0},"sexy":{"$":0},"sfr":{"$":0},"shangrila":{"$":0},"sharp":{"$":0},"shaw":{"$":0},"shell":{"$":0},"shia":{"$":0},"shiksha":{"$":0},"shoes":{"$":0},"shop":{"$":0},"shopping":{"$":0},"shouji":{"$":0},"show":{"$":0},"showtime":{"$":0},"shriram":{"$":0},"silk":{"$":0},"sina":{"$":0},"singles":{"$":0},"site":{"$":0,"cyon":{"$":0},"platformsh":{"*":{"$":0}},"byen":{"$":0}},"ski":{"$":0},"skin":{"$":0},"sky":{"$":0},"skype":{"$":0},"sling":{"$":0},"smart":{"$":0},"smile":{"$":0},"sncf":{"$":0},"soccer":{"$":0},"social":{"$":0},"softbank":{"$":0},"software":{"$":0},"sohu":{"$":0},"solar":{"$":0},"solutions":{"$":0},"song":{"$":0},"sony":{"$":0},"soy":{"$":0},"space":{"$":0,"stackspace":{"$":0},"uber":{"$":0},"xs4all":{"$":0}},"spiegel":{"$":0},"spot":{"$":0},"spreadbetting":{"$":0},"srl":{"$":0},"srt":{"$":0},"stada":{"$":0},"staples":{"$":0},"star":{"$":0},"starhub":{"$":0},"statebank":{"$":0},"statefarm":{"$":0},"statoil":{"$":0},"stc":{"$":0},"stcgroup":{"$":0},"stockholm":{"$":0},"storage":{"$":0},"store":{"$":0},"stream":{"$":0},"studio":{"$":0},"study":{"$":0},"style":{"$":0},"sucks":{"$":0},"supplies":{"$":0},"supply":{"$":0},"support":{"$":0,"barsy":{"$":0}},"surf":{"$":0},"surgery":{"$":0},"suzuki":{"$":0},"swatch":{"$":0},"swiftcover":{"$":0},"swiss":{"$":0},"sydney":{"$":0},"symantec":{"$":0},"systems":{"$":0,"knightpoint":{"$":0}},"tab":{"$":0},"taipei":{"$":0},"talk":{"$":0},"taobao":{"$":0},"target":{"$":0},"tatamotors":{"$":0},"tatar":{"$":0},"tattoo":{"$":0},"tax":{"$":0},"taxi":{"$":0},"tci":{"$":0},"tdk":{"$":0},"team":{"$":0},"tech":{"$":0},"technology":{"$":0},"telecity":{"$":0},"telefonica":{"$":0},"temasek":{"$":0},"tennis":{"$":0},"teva":{"$":0},"thd":{"$":0},"theater":{"$":0},"theatre":{"$":0},"tiaa":{"$":0},"tickets":{"$":0},"tienda":{"$":0},"tiffany":{"$":0},"tips":{"$":0},"tires":{"$":0},"tirol":{"$":0},"tjmaxx":{"$":0},"tjx":{"$":0},"tkmaxx":{"$":0},"tmall":{"$":0},"today":{"$":0},"tokyo":{"$":0},"tools":{"$":0},"top":{"$":0},"toray":{"$":0},"toshiba":{"$":0},"total":{"$":0},"tours":{"$":0},"town":{"$":0},"toyota":{"$":0},"toys":{"$":0},"trade":{"$":0,"ybo":{"$":0}},"trading":{"$":0},"training":{"$":0},"travelchannel":{"$":0},"travelers":{"$":0},"travelersinsurance":{"$":0},"trust":{"$":0},"trv":{"$":0},"tube":{"$":0},"tui":{"$":0},"tunes":{"$":0},"tushu":{"$":0},"tvs":{"$":0},"ubank":{"$":0},"ubs":{"$":0},"uconnect":{"$":0},"unicom":{"$":0},"university":{"$":0},"uno":{"$":0},"uol":{"$":0},"ups":{"$":0},"vacations":{"$":0},"vana":{"$":0},"vanguard":{"$":0},"vegas":{"$":0},"ventures":{"$":0},"verisign":{"$":0},"versicherung":{"$":0},"vet":{"$":0},"viajes":{"$":0},"video":{"$":0},"vig":{"$":0},"viking":{"$":0},"villas":{"$":0},"vin":{"$":0},"vip":{"$":0},"virgin":{"$":0},"visa":{"$":0},"vision":{"$":0},"vista":{"$":0},"vistaprint":{"$":0},"viva":{"$":0},"vivo":{"$":0},"vlaanderen":{"$":0},"vodka":{"$":0},"volkswagen":{"$":0},"volvo":{"$":0},"vote":{"$":0},"voting":{"$":0},"voto":{"$":0},"voyage":{"$":0},"vuelos":{"$":0},"wales":{"$":0},"walmart":{"$":0},"walter":{"$":0},"wang":{"$":0},"wanggou":{"$":0},"warman":{"$":0},"watch":{"$":0},"watches":{"$":0},"weather":{"$":0},"weatherchannel":{"$":0},"webcam":{"$":0},"weber":{"$":0},"website":{"$":0},"wed":{"$":0},"wedding":{"$":0},"weibo":{"$":0},"weir":{"$":0},"whoswho":{"$":0},"wien":{"$":0},"wiki":{"$":0},"williamhill":{"$":0},"win":{"$":0},"windows":{"$":0},"wine":{"$":0},"winners":{"$":0},"wme":{"$":0},"wolterskluwer":{"$":0},"woodside":{"$":0},"work":{"$":0},"works":{"$":0},"world":{"$":0},"wow":{"$":0},"wtc":{"$":0},"wtf":{"$":0},"xbox":{"$":0},"xerox":{"$":0},"xfinity":{"$":0},"xihuan":{"$":0},"xin":{"$":0},"xn--11b4c3d":{"$":0},"xn--1ck2e1b":{"$":0},"xn--1qqw23a":{"$":0},"xn--30rr7y":{"$":0},"xn--3bst00m":{"$":0},"xn--3ds443g":{"$":0},"xn--3oq18vl8pn36a":{"$":0},"xn--3pxu8k":{"$":0},"xn--42c2d9a":{"$":0},"xn--45q11c":{"$":0},"xn--4gbrim":{"$":0},"xn--55qw42g":{"$":0},"xn--55qx5d":{"$":0},"xn--5su34j936bgsg":{"$":0},"xn--5tzm5g":{"$":0},"xn--6frz82g":{"$":0},"xn--6qq986b3xl":{"$":0},"xn--80adxhks":{"$":0},"xn--80aqecdr1a":{"$":0},"xn--80asehdb":{"$":0},"xn--80aswg":{"$":0},"xn--8y0a063a":{"$":0},"xn--9dbq2a":{"$":0},"xn--9et52u":{"$":0},"xn--9krt00a":{"$":0},"xn--b4w605ferd":{"$":0},"xn--bck1b9a5dre4c":{"$":0},"xn--c1avg":{"$":0},"xn--c2br7g":{"$":0},"xn--cck2b3b":{"$":0},"xn--cg4bki":{"$":0},"xn--czr694b":{"$":0},"xn--czrs0t":{"$":0},"xn--czru2d":{"$":0},"xn--d1acj3b":{"$":0},"xn--eckvdtc9d":{"$":0},"xn--efvy88h":{"$":0},"xn--estv75g":{"$":0},"xn--fct429k":{"$":0},"xn--fhbei":{"$":0},"xn--fiq228c5hs":{"$":0},"xn--fiq64b":{"$":0},"xn--fjq720a":{"$":0},"xn--flw351e":{"$":0},"xn--fzys8d69uvgm":{"$":0},"xn--g2xx48c":{"$":0},"xn--gckr3f0f":{"$":0},"xn--gk3at1e":{"$":0},"xn--hxt814e":{"$":0},"xn--i1b6b1a6a2e":{"$":0},"xn--imr513n":{"$":0},"xn--io0a7i":{"$":0},"xn--j1aef":{"$":0},"xn--jlq61u9w7b":{"$":0},"xn--jvr189m":{"$":0},"xn--kcrx77d1x4a":{"$":0},"xn--kpu716f":{"$":0},"xn--kput3i":{"$":0},"xn--mgba3a3ejt":{"$":0},"xn--mgba7c0bbn0a":{"$":0},"xn--mgbaakc7dvf":{"$":0},"xn--mgbab2bd":{"$":0},"xn--mgbb9fbpob":{"$":0},"xn--mgbca7dzdo":{"$":0},"xn--mgbi4ecexp":{"$":0},"xn--mgbt3dhd":{"$":0},"xn--mk1bu44c":{"$":0},"xn--mxtq1m":{"$":0},"xn--ngbc5azd":{"$":0},"xn--ngbe9e0a":{"$":0},"xn--ngbrx":{"$":0},"xn--nqv7f":{"$":0},"xn--nqv7fs00ema":{"$":0},"xn--nyqy26a":{"$":0},"xn--p1acf":{"$":0},"xn--pbt977c":{"$":0},"xn--pssy2u":{"$":0},"xn--q9jyb4c":{"$":0},"xn--qcka1pmc":{"$":0},"xn--rhqv96g":{"$":0},"xn--rovu88b":{"$":0},"xn--ses554g":{"$":0},"xn--t60b56a":{"$":0},"xn--tckwe":{"$":0},"xn--tiq49xqyj":{"$":0},"xn--unup4y":{"$":0},"xn--vermgensberater-ctb":{"$":0},"xn--vermgensberatung-pwb":{"$":0},"xn--vhquv":{"$":0},"xn--vuq861b":{"$":0},"xn--w4r85el8fhu5dnra":{"$":0},"xn--w4rs40l":{"$":0},"xn--xhq521b":{"$":0},"xn--zfr164b":{"$":0},"xperia":{"$":0},"xyz":{"$":0,"blogsite":{"$":0},"fhapp":{"$":0}},"yachts":{"$":0},"yahoo":{"$":0},"yamaxun":{"$":0},"yandex":{"$":0},"yodobashi":{"$":0},"yoga":{"$":0},"yokohama":{"$":0},"you":{"$":0},"youtube":{"$":0},"yun":{"$":0},"zappos":{"$":0},"zara":{"$":0},"zero":{"$":0},"zip":{"$":0},"zippo":{"$":0},"zone":{"$":0,"triton":{"*":{"$":0}},"lima":{"$":0}},"zuerich":{"$":0}}}
},{}],28:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":29,"punycode":12,"querystring":15}],29:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],30:[function(require,module,exports){
"use strict";

module.exports = {
    "trackerListLoc": "data/tracker_lists",
    "blockLists": ["trackersWithParentCompany.json"],
    "entityList": "https://duckduckgo.com/contentblocking.js?l=entitylist2",
    "entityMap": "data/tracker_lists/entityMap.json",
    "blocking": ["Advertising", "Analytics", "Social"],
    "requestListenerTypes": ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"],
    "trackersWhitelistTemporary": "https://duckduckgo.com/contentblocking/trackers-whitelist-temporary.txt",
    "trackersWhitelist": "https://duckduckgo.com/contentblocking/trackers-whitelist.txt",
    "surrogateList": "https://duckduckgo.com/contentblocking.js?l=surrogates",
    "feedbackUrl": "https://duckduckgo.com/feedback.js?type=extension-feedback",
    "tosdrMessages": {
        "A": "Good",
        "B": "Mixed",
        "C": "Bad",
        "D": "Bad",
        "E": "Bad",
        "good": "Good",
        "bad": "Bad",
        "unknown": "Unknown",
        "mixed": "Mixed"
    },
    "httpsMessages": {
        "secure": "Encrypted Connection",
        "upgraded": "Forced Encryption",
        "none": "Unencrypted Connection"
    },
    /**
     * Major tracking networks data:
     * percent of the top 1 million sites a tracking network has been seen on.
     * see: https://webtransparency.cs.princeton.edu/webcensus/
     */
    "majorTrackingNetworks": {
        "google": 84,
        "facebook": 36,
        "twitter": 16,
        "amazon": 14,
        "appnexus": 10,
        "oracle": 10,
        "mediamath": 9,
        "oath": 9,
        "maxcdn": 7,
        "automattic": 7
    },
    "httpsDBName": "https",
    "httpsLists": [{
        "type": "upgrade list",
        "name": "httpsUpgradeList",
        "url": "https://staticcdn.duckduckgo.com/https/https-bloom.json"
    }, {
        "type": "whitelist",
        "name": "httpsWhitelist",
        "url": "https://staticcdn.duckduckgo.com/https/https-whitelist.json"
    }],
    "httpsErrorCodes": {
        "net::ERR_CONNECTION_REFUSED": 1,
        "net::ERR_ABORTED": 2,
        "net::ERR_SSL_PROTOCOL_ERROR": 3,
        "net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH": 4,
        "net::ERR_NAME_NOT_RESOLVED": 5,
        "NS_ERROR_CONNECTION_REFUSED": 6,
        "NS_ERROR_UNKNOWN_HOST": 7,
        "An additional policy constraint failed when validating this certificate.": 8,
        "Unable to communicate securely with peer: requested domain name does not match the server’s certificate.": 9,
        "Cannot communicate securely with peer: no common encryption algorithm(s).": 10,
        "SSL received a record that exceeded the maximum permissible length.": 11,
        "The certificate is not trusted because it is self-signed.": 12,
        "downgrade_redirect_loop": 13
    }
};

},{}],31:[function(require,module,exports){
"use strict";

module.exports = {
    "extensionIsEnabled": true,
    "socialBlockingIsEnabled": false,
    "trackerBlockingEnabled": true,
    "httpsEverywhereEnabled": true,
    "embeddedTweetsEnabled": false,
    "meanings": true,
    "advanced_options": true,
    "last_search": "",
    "lastsearch_enabled": true,
    "safesearch": true,
    "use_post": false,
    "ducky": false,
    "dev": false,
    "zeroclick_google_right": false,
    "version": null,
    "atb": null,
    "set_atb": null,
    "trackersWhitelistTemporary-etag": null,
    "trackersWhitelist-etag": null,
    "surrogateList-etag": null,
    "httpsWhitelist-etag": null,
    "httpsUpgradeList-etag": null,
    "hasSeenPostInstall": false,
    "extiSent": false,
    "failedUpgrades": 0,
    "totalUpgrades": 0
};

},{}],32:[function(require,module,exports){
module.exports={
    "zoosk.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "youtube.com": {
        "score": 0,
        "all": {
            "bad": [
                "broader than necessary",
                "reduction of legal period for cause of action",
                "user needs to check tosback.org",
                "device fingerprinting"
            ],
            "good": [
                "help you deal with take-down notices"
            ]
        },
        "match": {
            "bad": [
                "broader than necessary",
                "reduction of legal period for cause of action",
                "user needs to check tosback.org",
                "device fingerprinting"
            ],
            "good": [
                "help you deal with take-down notices"
            ]
        },
        "class": "D"
    },
    "yahoo.com": {
        "score": 0,
        "all": {
            "bad": [
                "pseudonym not allowed (not because of user-to-user trust)",
                "user needs to check tosback.org",
                "device fingerprinting"
            ],
            "good": [
                "limited for purpose of same service",
                "limited for purpose of same service"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "xing.com": {
        "score": 0,
        "all": {
            "bad": [
                "pseudonym not allowed (not because of user-to-user trust)"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "xfire.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "worldofwarcraft.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "wordpress.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org",
                "device fingerprinting"
            ],
            "good": [
                "limited for purpose of same service"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "wordfeud.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "wikipedia.org": {
        "score": 0,
        "all": {
            "bad": [],
            "good": [
                "only temporary session cookies",
                "user feedback is invited",
                "suspension will be fair and proportionate",
                "you publish under a free license, not a bilateral one"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "whatsapp.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "videobb.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "vbulletin.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "twitter.com": {
        "score": 0,
        "all": {
            "bad": [
                "little involvement",
                "very broad",
                "your content stays licensed",
                "sets third-party cookies and/or ads"
            ],
            "good": [
                "archives provided",
                "tracking data deleted after 10 days and opt-out",
                "you can get your data back"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "twitpic.com": {
        "score": 85,
        "all": {
            "bad": [
                "responsible and indemnify",
                "reduction of legal period for cause of action",
                "they can license to third parties"
            ],
            "good": []
        },
        "match": {
            "bad": [
                "they can license to third parties"
            ],
            "good": []
        },
        "class": false
    },
    "tumblr.com": {
        "score": 0,
        "all": {
            "bad": [
                "keep a license even after you close your account",
                "sets third-party cookies and/or ads"
            ],
            "good": [
                "they state that you own your data",
                "third parties are bound by confidentiality obligations",
                "archives provided"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "steampowered.com": {
        "score": -65,
        "all": {
            "bad": [
                "defend, indemnify, hold harmless; survives termination",
                "personal data is given to third parties",
                "they can delete your account without prior notice and without a reason",
                "class action waiver"
            ],
            "good": [
                "personal data is not sold",
                "pseudonyms allowed",
                "you can request access and deletion of personal data",
                "user is notified a month or more in advance",
                "you can leave at any time"
            ]
        },
        "match": {
            "bad": [
                "personal data is given to third parties"
            ],
            "good": [
                "personal data is not sold",
                "you can request access and deletion of personal data"
            ]
        },
        "class": false
    },
    "store.steampowered.com": {
        "score": -65,
        "all": {
            "bad": [
                "defend, indemnify, hold harmless; survives termination",
                "personal data is given to third parties",
                "they can delete your account without prior notice and without a reason",
                "class action waiver"
            ],
            "good": [
                "personal data is not sold",
                "pseudonyms allowed",
                "you can request access and deletion of personal data",
                "user is notified a month or more in advance",
                "you can leave at any time"
            ]
        },
        "match": {
            "bad": [
                "personal data is given to third parties"
            ],
            "good": [
                "personal data is not sold",
                "you can request access and deletion of personal data"
            ]
        },
        "class": false
    },
    "spotify.com": {
        "score": 10,
        "all": {
            "bad": [
                "you grant perpetual license to anything you publish-bad-80",
                "spotify may transfer and process your data to somewhere outside of your country-bad-50",
                "personal data is given to third parties",
                "they can delete your account without prior notice and without a reason",
                "no promise to inform/notify",
                "no quality guarantee",
                "third parties may be involved in operating the service",
                "no quality guarantee"
            ],
            "good": [
                "info given about risk of publishing your info online",
                "you can leave at any time",
                "they educate you about the risks",
                "info given about what personal data they collect",
                "info given about intended use of your information"
            ]
        },
        "match": {
            "bad": [
                "personal data is given to third parties"
            ],
            "good": []
        },
        "class": false
    },
    "soundcloud.com": {
        "score": 20,
        "all": {
            "bad": [
                "responsible and indemnify",
                "may sell your data in merger",
                "third-party cookies, but with opt-out instructions"
            ],
            "good": [
                "user is notified a month or more in advance",
                "easy to read",
                "you have control over licensing options",
                "your personal data is used for limited purposes",
                "pseudonyms allowed",
                "you can leave at any time"
            ]
        },
        "match": {
            "bad": [
                "may sell your data in merger"
            ],
            "good": []
        },
        "class": "B"
    },
    "sonic.net": {
        "score": 0,
        "all": {
            "bad": [],
            "good": [
                "logs are deleted after two weeks"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "skype.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org",
                "you may not express negative opinions about them"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "seenthis.net": {
        "score": 0,
        "all": {
            "bad": [],
            "good": [
                "you can get your data back",
                "you can leave at any time",
                "you have control over licensing options"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "you can get your data back",
                "you can leave at any time",
                "you have control over licensing options"
            ]
        },
        "class": "A"
    },
    "runescape.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "rapidshare.com": {
        "score": -50,
        "all": {
            "bad": [],
            "good": [
                "no third-party access without a warrant",
                "they do not index or open files",
                "your personal data is used for limited purposes",
                "99.x% availability",
                "user is notified a month or more in advance"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no third-party access without a warrant"
            ]
        },
        "class": false
    },
    "quora.com": {
        "score": 0,
        "all": {
            "bad": [
                "device fingerprinting"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "phpbb.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "packagetrackr.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "owncube.com": {
        "score": -25,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": [
                "personal data is not sold"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "personal data is not sold"
            ]
        },
        "class": false
    },
    "olx.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "netflix.com": {
        "score": -20,
        "all": {
            "bad": [
                "class action waiver",
                "sets third-party cookies and/or ads",
                "they can delete your account without prior notice and without a reason",
                "no liability for unauthorized access",
                "user needs to check tosback.org",
                "targeted third-party advertising",
                "no promise to inform/notify"
            ],
            "good": [
                "easy to read",
                "you can request access and deletion of personal data"
            ]
        },
        "match": {
            "bad": [
                "targeted third-party advertising"
            ],
            "good": [
                "you can request access and deletion of personal data"
            ]
        },
        "class": false
    },
    "nabble.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "mint.com": {
        "score": 20,
        "all": {
            "bad": [
                "may sell your data in merger",
                "user needs to rely on tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [
                "may sell your data in merger"
            ],
            "good": []
        },
        "class": false
    },
    "microsoft.com": {
        "score": 60,
        "all": {
            "bad": [
                "class action waiver",
                "tracks you on other websites",
                "no promise to inform/notify",
                "user needs to check tosback.org",
                "your data may be stored anywhere in the world"
            ],
            "good": [
                "personalized ads are opt-out"
            ]
        },
        "match": {
            "bad": [
                "tracks you on other websites"
            ],
            "good": []
        },
        "class": false
    },
    "lastpass.com": {
        "score": -50,
        "all": {
            "bad": [
                "they can delete your account without prior notice and without a reason",
                "no quality guarantee",
                "no quality guarantee",
                "they become the owner of ideas you give them",
                "user needs to check tosback.org",
                "promotional communications are not opt-out",
                "responsible and indemnify"
            ],
            "good": [
                "legal documents published under reusable license",
                "pseudonyms allowed",
                "info given about security practices",
                "only necessary logs are kept",
                "only temporary session cookies",
                "no third-party access without a warrant"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no third-party access without a warrant"
            ]
        },
        "class": "B"
    },
    "kolabnow.com": {
        "score": -75,
        "all": {
            "bad": [],
            "good": [
                "no third-party access without a warrant",
                "4 weeks to review changes and possibility to negotiate-good-60",
                "no tracking cookies and web analytics opt-out-good-20",
                "suspension will be fair and proportionate",
                "only necessary logs are kept",
                "no third-party access without a warrant",
                "free software; you can run your own instance",
                "personal data is not sold"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no third-party access without a warrant",
                "personal data is not sold"
            ]
        },
        "class": "A"
    },
    "kolab.org": {
        "score": -75,
        "all": {
            "bad": [],
            "good": [
                "no third-party access without a warrant",
                "4 weeks to review changes and possibility to negotiate-good-60",
                "no tracking cookies and web analytics opt-out-good-20",
                "suspension will be fair and proportionate",
                "only necessary logs are kept",
                "no third-party access without a warrant",
                "free software; you can run your own instance",
                "personal data is not sold"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no third-party access without a warrant",
                "personal data is not sold"
            ]
        },
        "class": "A"
    },
    "kippt.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to rely on tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "jagex.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": [
                "user is notified a week or more in advance"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "instagram.com": {
        "score": 0,
        "all": {
            "bad": [
                "class action waiver",
                "very broad"
            ],
            "good": [
                "user is notified a week or more in advance"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "informe.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "imgur.com": {
        "score": 0,
        "all": {
            "bad": [
                "device fingerprinting"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "ifttt.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "identi.ca": {
        "score": 0,
        "all": {
            "bad": [],
            "good": [
                "you publish under a free license, not a bilateral one"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "hypster.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "habbo.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "gravatar.com": {
        "score": 0,
        "all": {
            "bad": [
                "broader than necessary"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "grammarly.com": {
        "score": 20,
        "all": {
            "bad": [
                "no promise to inform/notify",
                "your use is throttled",
                "no pricing info given before you sign up",
                "may sell your data in merger"
            ],
            "good": []
        },
        "match": {
            "bad": [
                "may sell your data in merger"
            ],
            "good": []
        },
        "class": false
    },
    "google.com": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.in": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.jp": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.de": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.uk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.br": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.fr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ru": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.it": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.hk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.es": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ca": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.mx": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.tr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.au": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.tw": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.pl": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.id": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ar": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ua": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.pk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.th": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.sa": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.eg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.nl": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.ve": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.za": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.gr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ph": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.se": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.sg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.be": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.az": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.ao": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.co": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.kr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.at": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.vn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ng": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cz": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ch": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.no": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ro": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.pe": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.pt": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cl": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ae": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ie": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.dk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.dz": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.hu": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.fi": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.il": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.sk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.kz": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.kw": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.nz": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.lk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.bg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.by": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.do": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ly": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.rs": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.mm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.hr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ec": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.tn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.my": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.lt": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.tm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.iq": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.si": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.af": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.gt": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.lv": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.pr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.gh": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.bd": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.cu": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.jo": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.lb": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.sv": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ee": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.bh": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ba": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.uy": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.ma": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.tt": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.kh": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.py": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.np": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.cy": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ni": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.et": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cd": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.hn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ge": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.am": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.lu": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.qa": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.mz": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.bw": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.mg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.sn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.pg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.bn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.tj": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ht": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.zm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.ke": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.al": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.bf": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.mu": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.cr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.la": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.mn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.bo": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.org": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.jm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.tz": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.na": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ml": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.mt": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.is": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.bj": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.ug": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.rw": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.om": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ci": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.bs": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.td": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ps": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.gi": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.pa": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.sl": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.uz": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.md": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.bi": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.sr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cat": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.so": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.bt": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.je": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.gy": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.me": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.zw": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.gp": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.tg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.ls": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.as": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.bz": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cf": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.mv": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ad": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.li": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cv": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.mk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.vc": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ag": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.gl": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ne": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.mw": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ws": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.kg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.gm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.to": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.sb": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.tn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ga": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.tl": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.im": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.fj": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.dj": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ac": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.iq": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.vg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.dm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.sc": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.pt": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.cn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.st": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ng": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ai": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ki": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.vu": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.sm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.jp": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.om": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.vi": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.gg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.fm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.hk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.ck": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.tk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.in": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.je": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ve": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.tw": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.us": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ua": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.de.com": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ms": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.by": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.nr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.br.com": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.sh": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.hk.com": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.kr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "github.com": {
        "score": 0,
        "all": {
            "bad": [
                "they can delete your account without prior notice and without a reason",
                "user needs to check tosback.org",
                "pseudonym not allowed (not because of user-to-user trust)",
                "defend, indemnify, hold harmless"
            ],
            "good": [
                "info given about security practices",
                "you publish under a free license, not a bilateral one",
                "will notify before merger",
                "your personal data is used for limited purposes"
            ]
        },
        "match": {
            "bad": [
                "they can delete your account without prior notice and without a reason",
                "user needs to check tosback.org",
                "pseudonym not allowed (not because of user-to-user trust)",
                "defend, indemnify, hold harmless"
            ],
            "good": [
                "info given about security practices",
                "you publish under a free license, not a bilateral one",
                "will notify before merger",
                "your personal data is used for limited purposes"
            ]
        },
        "class": "B"
    },
    "freeforums.org": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "foxnews.com": {
        "score": 0,
        "all": {
            "bad": [
                "device fingerprinting"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "flickr.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": [
                "you can choose with whom you share content",
                "limited for purpose of same service",
                "you can choose the copyright license"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "flattr.com": {
        "score": 0,
        "all": {
            "bad": [
                "sets third-party cookies and/or ads"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "facebook.com": {
        "score": 100,
        "all": {
            "bad": [
                "pseudonym not allowed (not because of user-to-user trust)",
                "tracks you on other websites",
                "many third parties are involved in operating the service",
                "very broad",
                "your data is used for many purposes"
            ],
            "good": [
                "they state that you own your data",
                "user feedback is invited"
            ]
        },
        "match": {
            "bad": [
                "tracks you on other websites",
                "your data is used for many purposes"
            ],
            "good": []
        },
        "class": false
    },
    "evernote.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "envato.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "ebuddy.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "duckduckgo.com": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "donttrack.us": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "privacyheroes.io": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "spreadprivacy.com": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "duckduckhack.com": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "privatebrowsingmyths.com": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "duck.co": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "cispaletter.org": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "dropbox.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "disqus.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": [
                "they will help you react to others infringing on your copyright"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "dictionary.com": {
        "score": 0,
        "all": {
            "bad": [
                "device fingerprinting"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "delicious.com": {
        "score": 20,
        "all": {
            "bad": [
                "broad license including right to distribute through any media",
                "sets third-party cookies and/or ads",
                "may sell your data in merger",
                "only for your individual and non-commercial use"
            ],
            "good": [
                "third parties are bound by confidentiality obligations"
            ]
        },
        "match": {
            "bad": [
                "may sell your data in merger"
            ],
            "good": []
        },
        "class": "D"
    },
    "delicious.com.au": {
        "score": 20,
        "all": {
            "bad": [
                "broad license including right to distribute through any media",
                "sets third-party cookies and/or ads",
                "may sell your data in merger",
                "only for your individual and non-commercial use"
            ],
            "good": [
                "third parties are bound by confidentiality obligations"
            ]
        },
        "match": {
            "bad": [
                "may sell your data in merger"
            ],
            "good": []
        },
        "class": "D"
    },
    "coursera.org": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to rely on tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "couchsurfing.org": {
        "score": 20,
        "all": {
            "bad": [
                "your content stays licensed",
                "they can delete your account without prior notice and without a reason",
                "they become the owner of ideas you give them",
                "keep a license even after you close your account",
                "broader than necessary",
                "user needs to check tosback.org",
                "may sell your data in merger",
                "third-party cookies, but with opt-out instructions"
            ],
            "good": []
        },
        "match": {
            "bad": [
                "may sell your data in merger"
            ],
            "good": []
        },
        "class": false
    },
    "cnn.com": {
        "score": 0,
        "all": {
            "bad": [
                "device fingerprinting"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "cnet.com": {
        "score": 0,
        "all": {
            "bad": [
                "device fingerprinting"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "cloudant.com": {
        "score": 20,
        "all": {
            "bad": [
                "defend, indemnify, hold harmless",
                "user needs to check tosback.org",
                "no liability for unauthorized access",
                "may sell your data in merger",
                "sets third-party cookies and/or ads"
            ],
            "good": [
                "limited for purpose of same service",
                "they provide a way to export your data",
                "refund policy",
                "you publish under a free license, not a bilateral one",
                "they give 30 days notice before closing your account",
                "will warn about maintenance"
            ]
        },
        "match": {
            "bad": [
                "may sell your data in merger"
            ],
            "good": []
        },
        "class": "B"
    },
    "null": {
        "score": 0,
        "all": {
            "bad": [
                "device fingerprinting"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "bitly.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "bearshare.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "bbc.com": {
        "score": 0,
        "all": {
            "bad": [
                "device fingerprinting"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "icloud.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "apple.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "app.net": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to rely on tosback.org",
                "you may not scrape",
                "defend, indemnify, hold harmless"
            ],
            "good": [
                "user feedback is invited",
                "archives provided",
                "you can delete your content",
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "amazon.com": {
        "score": 110,
        "all": {
            "bad": [
                "may sell your data in merger",
                "targeted third-party advertising",
                "tracks you on other websites",
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [
                "may sell your data in merger",
                "targeted third-party advertising",
                "tracks you on other websites"
            ],
            "good": []
        },
        "class": false
    },
    "allrecipes.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "500px.com": {
        "score": 0,
        "all": {
            "bad": [
                "class action waiver",
                "responsible and indemnify",
                "they can delete your account without prior notice and without a reason",
                "broader than necessary"
            ],
            "good": [
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "match": {
            "bad": [
                "class action waiver",
                "responsible and indemnify",
                "they can delete your account without prior notice and without a reason",
                "broader than necessary"
            ],
            "good": [
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "class": "D"
    },
    "500px.me": {
        "score": 0,
        "all": {
            "bad": [
                "class action waiver",
                "responsible and indemnify",
                "they can delete your account without prior notice and without a reason",
                "broader than necessary"
            ],
            "good": [
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "match": {
            "bad": [
                "class action waiver",
                "responsible and indemnify",
                "they can delete your account without prior notice and without a reason",
                "broader than necessary"
            ],
            "good": [
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "class": "D"
    },
    "500px.org": {
        "score": 0,
        "all": {
            "bad": [
                "class action waiver",
                "responsible and indemnify",
                "they can delete your account without prior notice and without a reason",
                "broader than necessary"
            ],
            "good": [
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "match": {
            "bad": [
                "class action waiver",
                "responsible and indemnify",
                "they can delete your account without prior notice and without a reason",
                "broader than necessary"
            ],
            "good": [
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "class": "D"
    },
    "500px.net": {
        "score": 0,
        "all": {
            "bad": [
                "class action waiver",
                "responsible and indemnify",
                "they can delete your account without prior notice and without a reason",
                "broader than necessary"
            ],
            "good": [
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "match": {
            "bad": [
                "class action waiver",
                "responsible and indemnify",
                "they can delete your account without prior notice and without a reason",
                "broader than necessary"
            ],
            "good": [
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "class": "D"
    }
}

},{}],33:[function(require,module,exports){
module.exports={"aggregateintelligence.com":"365Media","365dm.com":"365Media","365media.com":"365Media","4mads.com":"4mads","adkernel.com":"AdKernel","adality.de":"Adality","adrtx.net":"Adality","adforgeinc.com":"Adforge","adlucent.com":"Adlucent","admixer.co.kr":"Admixer","adscience.nl":"Adscience","adx1.com":"Adsty","adsty.com":"Adsty","4dsply.com":"Adsupply","adsupply.com":"Adsupply","adversal.com":"Adversal.com","adv-adserver.com":"Adversal.com","adventive.com":"Adventive","affinity.com":"Affinity","andbeyond.media":"AndBeyond","answers.com":"Answers.com","dsply.com":"Answers.com","appsflyer.com":"AppsFlyer","applovin.com":"Applovin","appier.com":"Appier","allstarmediagroup.com":"Allstarmediagroup","aloodo.com":"Aloodo","augur.io":"Augur","digitaltarget.ru":"Digital Target","directadvert.ru":"DirectAdvert","fluct.jp":"Fluct","adingo.jp":"Fluct","place":"Placeholder","adhigh.net":"GetIntent","getintent.com":"GetIntent","goldbachgroup.com":"Goldbach","goldbach.com":"Goldbach","lowermybills.com":"Lower My Bills","ppjol.net":"MyPressPlus","mypressplus.com":"MyPressPlus","postrelease.com":"Nativo","nativo.com":"Nativo","pagefair.com":"PageFair","pagefair.net":"PageFair","politads.com":"Politads","mediavoice.com":"Polar Mobile","polarmobile.com":"Polar Mobile","popunder.net":"Popunder","adotsolution.com":"Syrup Ad","adternal.com":"Tisoomi","tisoomi.com":"Tisoomi","triplelift.com":"TripleLift","3lift.com":"TripleLift","veeseo.com":"Veeseo","wishabi.com":"Wishabi","flipp.com":"Wishabi","wishabi.net":"Wishabi","yieldmo.com":"Yieldmo","adloox.com":"Adloox","adlooxtracking.com":"Adloox","adleave.com":"AdLeave","hotjar.com":"Hotjar","protected.media":"Protected Media","ad-score.com":"Protected Media","go-mpulse.net":"Soasta","facebook.com":"Facebook","facebook.de":"Facebook","facebook.fr":"Facebook","facebook.net":"Facebook","fb.com":"Facebook","fb.me":"Facebook","friendfeed.com":"Facebook","instagram.com":"Facebook","fbcdn.net":"Facebook","messenger.com":"Facebook","atlassolutions.com":"Facebook","akamaihd.net":"Facebook","abc.xyz":"Google","google.com":"Google","ingress.com":"Google","admeld.com":"Google","blogger.com":"Google","google-melange.com":"Google","google.ad":"Google","google.ae":"Google","google.com.af":"Google","google.com.ag":"Google","google.com.ai":"Google","google.al":"Google","google.am":"Google","google.co.ao":"Google","google.com.ar":"Google","google.as":"Google","google.at":"Google","google.com.au":"Google","google.az":"Google","google.ba":"Google","google.com.bd":"Google","google.be":"Google","google.bf":"Google","google.bg":"Google","google.com.bh":"Google","google.bi":"Google","google.bj":"Google","google.com.bn":"Google","google.com.bo":"Google","google.com.br":"Google","google.bs":"Google","google.bt":"Google","google.co.bw":"Google","google.by":"Google","google.com.bz":"Google","google.ca":"Google","google.cd":"Google","google.cf":"Google","google.cg":"Google","google.ch":"Google","google.ci":"Google","google.co.ck":"Google","google.cl":"Google","google.cm":"Google","google.cn":"Google","google.com.co":"Google","google.co.cr":"Google","google.com.cu":"Google","google.cv":"Google","google.com.cy":"Google","google.cz":"Google","google.de":"Google","google.dj":"Google","google.dk":"Google","google.dm":"Google","google.com.do":"Google","google.dz":"Google","google.com.ec":"Google","google.ee":"Google","google.com.eg":"Google","google.es":"Google","google.com.et":"Google","google.fi":"Google","google.com.fj":"Google","google.fm":"Google","google.fr":"Google","google.ga":"Google","google.ge":"Google","google.gg":"Google","google.com.gh":"Google","google.com.gi":"Google","google.gl":"Google","google.gm":"Google","google.gp":"Google","google.gr":"Google","google.com.gt":"Google","google.gy":"Google","google.com.hk":"Google","google.hn":"Google","google.hr":"Google","google.ht":"Google","google.hu":"Google","google.co.id":"Google","google.ie":"Google","google.co.il":"Google","google.im":"Google","google.co.in":"Google","google.iq":"Google","google.is":"Google","google.it":"Google","google.je":"Google","google.com.jm":"Google","google.jo":"Google","google.co.jp":"Google","google.co.ke":"Google","google.com.kh":"Google","google.ki":"Google","google.kg":"Google","google.co.kr":"Google","google.com.kw":"Google","google.kz":"Google","google.la":"Google","google.com.lb":"Google","google.li":"Google","google.lk":"Google","google.co.ls":"Google","google.lt":"Google","google.lu":"Google","google.lv":"Google","google.com.ly":"Google","google.co.ma":"Google","google.md":"Google","google.me":"Google","google.mg":"Google","google.mk":"Google","google.ml":"Google","google.com.mm":"Google","google.mn":"Google","google.ms":"Google","google.com.mt":"Google","google.mu":"Google","google.mv":"Google","google.mw":"Google","google.com.mx":"Google","google.com.my":"Google","google.co.mz":"Google","google.com.na":"Google","google.com.nf":"Google","google.com.ng":"Google","google.com.ni":"Google","google.ne":"Google","google.nl":"Google","google.no":"Google","google.com.np":"Google","google.nr":"Google","google.nu":"Google","google.co.nz":"Google","google.com.om":"Google","google.com.pa":"Google","google.com.pe":"Google","google.com.pg":"Google","google.com.ph":"Google","google.com.pk":"Google","google.pl":"Google","google.pn":"Google","google.com.pr":"Google","google.ps":"Google","google.pt":"Google","google.com.py":"Google","google.com.qa":"Google","google.ro":"Google","google.ru":"Google","google.rw":"Google","google.com.sa":"Google","google.com.sb":"Google","google.sc":"Google","google.se":"Google","google.com.sg":"Google","google.sh":"Google","google.si":"Google","google.sk":"Google","google.com.sl":"Google","google.sn":"Google","google.so":"Google","google.sm":"Google","google.st":"Google","google.com.sv":"Google","google.td":"Google","google.tg":"Google","google.co.th":"Google","google.com.tj":"Google","google.tk":"Google","google.tl":"Google","google.tm":"Google","google.tn":"Google","google.to":"Google","google.com.tr":"Google","google.tt":"Google","google.com.tw":"Google","google.co.tz":"Google","google.com.ua":"Google","google.co.ug":"Google","google.co.uk":"Google","google.com.uy":"Google","google.co.uz":"Google","google.com.vc":"Google","google.co.ve":"Google","google.vg":"Google","google.co.vi":"Google","google.com.vn":"Google","google.vu":"Google","google.ws":"Google","google.rs":"Google","google.co.za":"Google","google.co.zm":"Google","google.co.zw":"Google","google.cat":"Google","panoramio.com":"Google","youtube.com":"Google","gmail.com":"Google","googlemail.com":"Google","2mdn.net":"Google","admob.com":"Google","cc-dt.com":"Google","destinationurl.com":"Google","doubleclick.net":"Google","google-analytics.com":"Google","googleadservices.com":"Google","googlesyndication.com":"Google","googlevideo.com":"Google","googletagservices.com":"Google","invitemedia.com":"Google","postrank.com":"Google","smtad.net":"Google","apture.com":"Google","ggpht.com":"Google","gmodules.com":"Google","googleapis.com":"Google","googleusercontent.com":"Google","gstatic.com":"Google","recaptcha.net":"Google","googletagmanager.com":"Google","twitter.com":"Twitter","crashlytics.com":"Twitter","tweetdeck.com":"Twitter","twitter.jp":"Twitter","digits.com":"Twitter","fabric.io":"Twitter","backtype.com":"Twitter","twimg.com":"Twitter","ads-twitter.com":"Twitter","zypmedia.com":"ZypMedia","2leep.com":"2leep.com","33across.com":"33Across","tynt.com":"33Across","4info.com":"4INFO","adhaven.com":"4INFO","abaxinteractive.com":"Abax Interactive","accelia.net":"Accelia","durasite.net":"Accelia","accordantmedia.com":"Accordant Media","acquisio.com":"Acquisio","clickequations.net":"Acquisio","act-on.com":"Act-On","actonsoftware.com":"Act-On","actisens.com":"Actisens","gestionpub.com":"Actisens","activeconversion.com":"ActiveConversion","activemeter.com":"ActiveConversion","acuity.com":"Acuity","acuityads.com":"Acuity","acuityplatform.com":"Acuity","addecisive.com":"Ad Decisive","a2dfp.net":"Ad Decisive","addynamo.com":"Ad Dynamo","addynamo.net":"Ad Dynamo","adeurope.com":"AD Europe","adknife.com":"Ad Knife","admagnet.com":"Ad Magnet","admagnet.net":"Ad Magnet","adpepper.us":"ad pepper media","adpepper.com":"ad pepper media","ad2onegroup.com":"AD2ONE","ad4game.com":"Ad4Game","ad6media.fr":"ad6media","adaptiveads.com":"AdaptiveAds","adaptly.com":"Adaptly","adaramedia.com":"Adara Media","opinmind.com":"Adara Media","yieldoptimizer.com":"Adara Media","adatus.com":"Adatus","adbrain.com":"AdBrain","adbrn.com":"AdBrain","adbrite.com":"adBrite","adchemy.com":"Adchemy","adcirrus.com":"AdCirrus","addgloo.com":"addGloo","addvantagemedia.com":"Addvantage Media","adengage.com":"AdEngage","adextent.com":"AdExtent","adf.ly":"AdF.ly","adfonic.com":"Adfonic","adform.com":"Adform","adform.net":"Adform","adformdsp.net":"Adform","adfox.ru":"AdFox","adfrontiers.com":"AdFrontiers","adfunky.com":"Adfunky","adfunkyserver.com":"Adfunky","adfusion.com":"Adfusion","adgentdigital.com":"AdGent Digital","shorttailmedia.com":"AdGent Digital","adgibbon.com":"AdGibbon","adglare.net":"AdGlare","adglare.com":"AdGlare","adhood.com":"adhood","adiant.com":"Adiant","adblade.com":"Adiant","responsetap.com":"AdInsight","adinsight.com":"AdInsight","adinsight.eu":"AdInsight","adiquity.com":"AdIQuity","adition.com":"ADITION","adjug.com":"AdJug","adjuggler.com":"AdJuggler","adjuggler.net":"AdJuggler","keep.com":"AdKeeper","adkeeper.com":"AdKeeper","akncdn.com":"AdKeeper","adknowledge.com":"Adknowledge","adparlor.com":"Adknowledge","bidsystem.com":"Adknowledge","cubics.com":"Adknowledge","lookery.com":"Adknowledge","www.adlantis.jp":"AdLantis","adimg.net":"AdLantis","adlantis.jp":"AdLantis","adlibrium.com":"Adlibrium","admarketplace.com":"adMarketplace","admarketplace.net":"adMarketplace","ampxchange.com":"adMarketplace","admarvel.com":"AdMarvel","admaximizer.com":"AdMaximizer Network","admedia.com":"AdMedia","admeta.com":"Admeta","atemda.com":"Admeta","admicro.vn":"Admicro","vcmedia.vn":"Admicro","admized.com":"Admized","admotion.com":"Admotion","nspmotion.com":"Admotion","wtp101.com":"Adnetik","adnetik.com":"Adnetik","adnetwork.net":"AdNetwork.net","adnologies.com":"adnologies","heias.com":"adnologies","adobe.com":"Adobe","typekit.com":"Adobe","2o7.net":"Adobe","auditude.com":"Adobe","demdex.com":"Adobe","demdex.net":"Adobe","dmtracker.com":"Adobe","efrontier.com":"Adobe","everestads.net":"Adobe","everestjs.net":"Adobe","everesttech.net":"Adobe","fyre.co":"Adobe","hitbox.com":"Adobe","omniture.com":"Adobe","omtrdc.net":"Adobe","touchclarity.com":"Adobe","adobedtm.com":"Adobe","livefyre.com":"Adobe","adobetag.com":"Adobe","adocean-global.com":"AdOcean","adocean.pl":"AdOcean","adometry.com":"Adometry","dmtry.com":"Adometry","adonion.com":"AdOnion","clickotmedia.com":"Adorika","cdkglobal.com":"ADP Dealer Services","adpdealerservices.com":"ADP Dealer Services","admission.net":"ADP Dealer Services","cobalt.com":"ADP Dealer Services","adperfect.com":"AdPerfect","adotmob.com":"Adotmob","adperium.com":"Adperium","adpersia.com":"Adpersia","adprecision.net":"adPrecision","adprs.net":"adPrecision","aprecision.net":"adPrecision","adpredictive.com":"AdPredictive","adreactor.com":"AdReactor","digitalremedy.com":"AdReady","digitalremedy":"AdReady","adready.com":"AdReady","adreadytractions.com":"AdReady","adrevolution.com":"AdRevolution","adriver.ru":"AdRiver","contactimpact.de":"adrolays","adrolays.com":"adrolays","adrolays.de":"adrolays","adroll.com":"AdRoll","adsafemedia.com":"AdSafe Media","adsafeprotected.com":"AdSafe Media","stroeer.de":"adscale","adscale.de":"adscale","adserverpub.com":"AdServerPub","adshuffle.com":"AdShuffle","adside.com":"AdSide","doclix.com":"AdSide","adspeed.com":"AdSpeed","adspeed.net":"AdSpeed","adspirit.de":"AdSpirit","adspirit.com":"AdSpirit","adspirit.net":"AdSpirit","adstours.com":"AdsTours","clickintext.net":"AdsTours","adtech.com":"ADTECH","adtech.de":"ADTECH","adtechus.com":"ADTECH","adsperity.com":"Adsperity","adsrevenue.net":"Adsrevenue","adswizz.com":"Adswizz","adtegrity.com":"Adtegrity.com","adtegrity.net":"Adtegrity.com","adtelligence.de":"ADTELLIGENCE","adtiger.de":"AdTiger","adtruth.com":"AdTruth","adultadworld.com":"Adult AdWorld","adultmoda.com":"Adultmoda","adverline.com":"Adverline","adnext.fr":"Adverline","advertstream.com":"Advert Stream","advertise.com":"Advertise.com","advertisespace.com":"AdvertiseSpace","adsmart.com":"Adverticum","adverticum.com":"Adverticum","adverticum.net":"Adverticum","advisormedia.cz":"Advisormedia","adworx.at":"Adworx","adworx.be":"Adworx","adworx.nl":"Adworx","adxpansion.com":"AdXpansion","adyard.de":"adyard","adzcentral.com":"ADZ","adzly.com":"adzly","adzerk.com":"Adzerk","adzerk.net":"Adzerk","dentsuaegisnetwork.com":"Aegis Group","aemedia.com":"Aegis Group","bluestreak.com":"Aegis Group","aerifymedia.com":"AERIFY MEDIA","anonymous-media.com":"AERIFY MEDIA","affectv.co.uk":"Affectv","affili.net":"affilinet","affilinet-inside.de":"affilinet","banner-rotation.com":"affilinet","successfultogether.co.uk":"affilinet","affine.tv":"Affine","affinesystems.com":"Affine","afterdownload.com":"AfterDownload","afdads.com":"AfterDownload","aggregateknowledge.com":"AK","agkn.com":"AK","airpush.com":"Airpush","akamai.com":"Akamai","imiclk.com":"Akamai","abmr.net":"Akamai","edgesuite.net":"Akamai","amazon.com":"Amazon.com","amazon.ca":"Amazon.com","amazon.co.jp":"Amazon.com","amazon.co.uk":"Amazon.com","amazon.de":"Amazon.com","amazon.es":"Amazon.com","amazon.fr":"Amazon.com","amazon.it":"Amazon.com","amazon.in":"Amazon.com","amazon.com.au":"Amazon.com","amazon.com.mx":"Amazon.com","assoc-amazon.com":"Amazon.com","alexa.com":"Amazon.com","amazonaws.com":"Amazon.com","imdb.com":"Amazon.com","audible.com":"Amazon.com","audible.co.uk":"Amazon.com","audible.de":"Amazon.com","primevideo.com":"Amazon.com","shopbop.com":"Amazon.com","twitch.tv":"Amazon.com","zappos.com":"Amazon.com","amazon-adsystem.com":"Amazon.com","alexametrics.com":"Amazon.com","cloudfront.net":"Amazon.com","media-amazon.com":"Amazon.com","ssl-images-amazon.com":"Amazon.com","ambientdigital.com.vn":"Ambient Digital","adnetwork.vn":"Ambient Digital","amobee.com":"Amobee","smartclip.com":"Amobee","adconion.com":"Amobee","amgdgt.com":"Amobee","euroclick.com":"Amobee","turn.com":"Amobee","appenda.com":"Appenda","applifier.com":"Applifier","appnexus.com":"AppNexus","adlantic.nl":"AppNexus","adnxs.com":"AppNexus","adrdgt.com":"AppNexus","appssavvy.com":"appssavvy","whiskyandwines.com":"Arkwrights Homebrew","arkwrightshomebrew.com":"Arkwrights Homebrew","ctasnet.com":"Arkwrights Homebrew","atinternet.com":"AT Internet","hit-parade.com":"AT Internet","xiti.com":"AT Internet","att.com":"AT&T","yp.com":"AT&T","directv.com":"AT&T","atoomic.com":"Atoomic.com","atrinsic.com":"Atrinsic","audienceadnetwork.com":"Audience Ad Network","audience2media.com":"Audience2Media","audiencescience.com":"AudienceScience","revsci.net":"AudienceScience","targetingmarketplace.com":"AudienceScience","wunderloop.net":"AudienceScience","hipcricket.com":"Augme","augme.com":"Augme","autocentre.ua":"AUTOCENTRE.UA","am.ua":"AUTOCENTRE.UA","avalanchers.com":"Avalanchers","avantlink.com":"AvantLink","aweber.com":"AWeber","backbeatmedia.com":"BackBeat Media","bannerconnect.net":"Bannerconnect","barilliance.com":"Barilliance","baronsoffers.com":"BaronsNetworks","vix.com":"Batanga Network","corp.vix.com":"Batanga Network","batanga.com":"Batanga Network","batanganetwork.com":"Batanga Network","beanstockmedia.com":"Beanstock Media","beencounter.com":"beencounter","begun.ru":"Begun","belboon.com":"belboon","adbutler.de":"belboon","betgenius.com":"Betgenius","connextra.com":"Betgenius","bidswitch.net":"Bidswitch","bidswitch.com":"Bidswitch","bidvertiser.com":"BidVertiser","bigmir.net":"bigmir)net","binlayer.com":"BinLayer","bitcoinplus.com":"Bitcoin Plus","bittads.com":"BittAds","bizo.com":"Bizo","bizographics.com":"Bizo","blacklabelads.com":"Black Label Ads","blogcatalog.com":"BlogCatalog","theblogfrog.com":"BlogFrog","blogher.com":"BlogHer","blogherads.com":"BlogHer","blogrollr.com":"BlogRollr","bloom-hq.com":"BLOOM Digital Platforms","adgear.com":"BLOOM Digital Platforms","adgrx.com":"BLOOM Digital Platforms","bloomreach.com":"BloomReach","brcdn.com":"BloomReach","brsrvr.com":"BloomReach","blutrumpet.com":"Blu Trumpet","bluecava.com":"BlueCava","bluekai.com":"BlueKai","tracksimple.com":"BlueKai","bkrtx.com":"BlueKai","brainient.com":"Brainient","brandaffinity.net":"Brand Affinity Technologies","brand.net":"Brand.net","brandscreen.com":"Brandscreen","rtbidder.net":"Brandscreen","brighttag.com":"BrightTag","btstatic.com":"BrightTag","thebrighttag.com":"BrightTag","brilig.com":"Brilig","burstmedia.com":"Burst Media","burstbeacon.com":"Burst Media","burstdirectads.com":"Burst Media","burstnet.com":"Burst Media","giantrealm.com":"Burst Media","burstly.com":"Burstly","businessol.com":"BusinessOnline","buysellads.com":"BuySellAds","beaconads.com":"BuySellAds","buysight.com":"Buysight","permuto.com":"Buysight","pulsemgr.com":"Buysight","buzzparadise.com":"BuzzParadise","buzzcity.com":"BV! MEDIA","branchez-vous.com":"BV! MEDIA","bvmedia.ca":"BV! MEDIA","networldmedia.com":"BV! MEDIA","networldmedia.net":"BV! MEDIA","cadreon.com":"Cadreon","campaigngrid.com":"CampaignGrid","capitaldata.fr":"CAPITALDATA","www.caraytech.com.ar":"Caraytech","caraytech.com.ar":"Caraytech","e-planning.net":"Caraytech","casalemedia.com":"Casale Media","medianet.com":"Casale Media","cbproads.com":"CBproADS","chango.com":"Chango","chango.ca":"Chango","channelintelligence.com":"Channel Intelligence","channeladvisor.com":"ChannelAdvisor","searchmarketing.com":"ChannelAdvisor","cart.ro":"Cart.ro","statistics.ro":"Cart.ro","chartboost.com":"Chartboost","checkm8.com":"CheckM8","chitika.com":"Chitika","chitika.net":"Chitika","choicestream.com":"ChoiceStream","clearsaleing.com":"ClearSaleing","csdata1.com":"ClearSaleing","csdata2.com":"ClearSaleing","csdata3.com":"ClearSaleing","pathinteractive.com":"Clearsearch Media","clearsearchmedia.com":"Clearsearch Media","csm-secure.com":"Clearsearch Media","clearsightinteractive.com":"ClearSight Interactive","csi-tracking.com":"ClearSight Interactive","clickbooth.com":"Clickbooth","adtoll.com":"Clickbooth","clickaider.com":"ClickAider","clickdimensions.com":"ClickDimensions","clickdistrict.com":"ClickDistrict","creative-serving.com":"ClickDistrict","clickfuel.com":"ClickFuel","myconversionlab.com":"ClickFuel","conversiondashboard.com":"ClickFuel","clickinc.com":"ClickInc","clicksor.com":"Clicksor","clicksor.net":"Clicksor","clickwinks.com":"Clickwinks","clicmanager.fr":"ClicManager","clovenetwork.com":"Clove Network","cognitivematch.com":"Cognitive Match","cmads.com.tw":"Cognitive Match","cmadsasia.com":"Cognitive Match","cmadseu.com":"Cognitive Match","cmmeglobal.com":"Cognitive Match","coinhive.com":"CoinHive","coin-hive.com":"CoinHive","collective.com":"Collective","collective-media.net":"Collective","oggifinogi.com":"Collective","tumri.com":"Collective","tumri.net":"Collective","yt1187.net":"Collective","cj.com":"Commission Junction","apmebf.com":"Commission Junction","awltovhc.com":"Commission Junction","ftjcfx.com":"Commission Junction","kcdwa.com":"Commission Junction","qksz.com":"Commission Junction","qksz.net":"Commission Junction","tqlkg.com":"Commission Junction","yceml.net":"Commission Junction","compasslabs.com":"Compass Labs","comscore.com":"comScore","adxpose.com":"comScore","scorecardresearch.com":"comScore","sitestat.com":"comScore","voicefive.com":"comScore","certifica.com":"comScore","mdotlabs.com":"comScore","proximic.com":"comScore","proxilinks.com":"comScore","proximic.net":"comScore","communicatorcorp.com":"Communicator Corp","complexmedianetwork.com":"Complex Media","complex.com":"Complex Media","collider.com":"Complex Media","solecollector.com":"Complex Media","pigeonsandplanes.com":"Complex Media","theridechannel.com":"Complex Media","firstwefeast.com":"Complex Media","consiliummedia.com":"Consilium Media","contaxe.com":"CONTAXE","contextin.com":"CONTEXTin","admailtiser.com":"CONTEXTin","contextuads.com":"ContextuAds","agencytradingdesk.net":"ContextuAds","contextweb.com":"CONTEXTWEB","convergedirect.com":"ConvergeDirect","convergetrack.com":"ConvergeDirect","conversionruler.com":"ConversionRuler","conversive.nl":"Conversive","coremotives.com":"CoreMotives","novomotus.com":"Cox Digital Solutions","coxdigitalsolutions.com":"Cox Digital Solutions","adify.com":"Cox Digital Solutions","afy11.net":"Cox Digital Solutions","cpmstar.com":"CPMStar","cpxadroit.com":"CPX Interactive","cpx.to":"CPX Interactive","cpxinteractive.com":"CPX Interactive","adreadypixels.com":"CPX Interactive","creafi.com":"Creafi","crimtan.com":"Crimtan","crispmedia.com":"Crisp Media","criteo.com":"Criteo","criteo.net":"Criteo","hooklogic.com":"Criteo","hlserve.com":"Criteo","crosspixel.net":"Cross Pixel","crosspixelmedia.com":"Cross Pixel","crsspxl.com":"Cross Pixel","crypto-loot.com":"CryptoLoot","cxense.com":"cXense","emediate.com":"cXense","emediate.biz":"cXense","emediate.dk":"cXense","emediate.eu":"cXense","cya2.net":"Cya2.net","cyberplex.com":"Cyberplex","dada.eu":"Dada","dada.pro":"Dada","simply.com":"Dada","datalogix.com":"Datalogix","nexac.com":"Datalogix","nextaction.net":"Datalogix","dataxu.com":"DataXu","mexad.com":"DataXu","w55c.net":"DataXu","dataxu.net":"DataXu","datonics.com":"Datonics","pro-market.net":"Datonics","datranmedia.com":"Datran Media","displaymarketplace.com":"Datran Media","datvantage.com":"Datvantage","dc-storm.com":"DC Storm","stormiq.com":"DC Storm","dedicatedmedia.com":"Dedicated Media","dedicatednetworks.com":"Dedicated Media","delivr.com":"Delivr","percentmobile.com":"Delivr","leafgroup.com":"Demand Media","demandmedia.com":"Demand Media","indieclick.com":"Demand Media","deltaprojects.com":"Delta Projects","deltaprojects.se":"Delta Projects","adaction.se":"Delta Projects","de17a.com":"Delta Projects","dpdhl.com":"Deutsche Post DHL","dp-dhl.com":"Deutsche Post DHL","adcloud.com":"Deutsche Post DHL","adcloud.net":"Deutsche Post DHL","developermedia.com":"Developer Media","lqcdn.com":"Developer Media","dianomi.com":"dianomi","didit.com":"Didit","did-it.com":"Didit","digitalriver.com":"Digital River","keywordmax.com":"Digital River","netflame.cc":"Digital River","awin.com":"Digital Window","digitalwindow.com":"Digital Window","perfiliate.com":"Digital Window","digitize.ie":"Digitize","directresponsegroup.com":"Direct Response Group","ppctracking.net":"Direct Response Group","doublepimp.com":"DoublePimp","doublepositive.com":"DoublePositive","bid-tag.com":"DoublePositive","doubleverify.com":"DoubleVerify","drawbridge.com":"Drawbridge","drawbrid.ge":"Drawbridge","adsymptotic.com":"Drawbridge","ds-iq.com":"DS-IQ","dsnrmg.com":"DSNR Group","dsnrgroup.com":"DSNR Group","traffiliate.com":"DSNR Group","z5x.net":"DSNR Group","z5x.com":"DSNR Group","dynamicoxygen.com":"DynamicOxygen","exitjunction.com":"DynamicOxygen","dynamicyield.com":"DynamicYield","ebay.com":"eBay","ebay.at":"eBay","ebay.ba":"eBay","ebay.be":"eBay","ebay.com.au":"eBay","ebay.ca":"eBay","ebay.ch":"eBay","ebay.cn":"eBay","ebay.de":"eBay","ebay.es":"eBay","ebay.fr":"eBay","ebay.com.hk":"eBay","ebay.ie":"eBay","ebay.in":"eBay","ebay.it":"eBay","ebay.co.jp":"eBay","ebay.co.kr":"eBay","ebay.com.my":"eBay","ebay.nl":"eBay","ebay.com.ph":"eBay","ebay.pl":"eBay","ebay.com.sg":"eBay","ebay.com.tw":"eBay","ebay.co.uk":"eBay","gopjn.com":"eBay","eff.org":"EFF","trackersimulator.org":"EFF","eviltracker.net":"EFF","do-not-tracker.org":"EFF","effectivemeasure.com":"Effective Measure","effectivemeasure.net":"Effective Measure","earnify.com":"Earnify","hurriyet.com.tr":"ekolay","ekolay.net":"ekolay","e-kolay.net":"ekolay","eleavers.com":"Eleavers","usemax.de":"Emego","enecto.com":"Enecto","engagebdr.com":"engage:BDR","bnmla.com":"engage:BDR","engago.com":"Engago Technology","appmetrx.com":"Engago Technology","ensighten.com":"Ensighten","entireweb.com":"Entireweb","theepicmediagroup.com":"Epic Media Group","epicadvertising.com":"Epic Media Group","epicmarketplace.com":"Epic Media Group","epicmobileads.com":"Epic Media Group","trafficmp.com":"Epic Media Group","epsilon.com":"Epsilon","eqads.com":"EQ Ads","ero-advertising.com":"EroAdvertising","etineria.com":"Etineria","adwitserver.com":"Etineria","etargetnet.com":"Etarget","etarget.net":"Etarget","etrigue.com":"eTrigue","everydayhealth.com":"Everyday Health","waterfrontmedia.com":"Everyday Health","evidon.com":"Evidon","betrad.com":"Evidon","evisionsmarketing.com":"Evisions Marketing","engineseeker.com":"Evisions Marketing","evolvemediacorp.com":"Evolve","gorillanation.com":"Evolve","evolvemediametrics.com":"Evolve","ewaydirect.com":"eWayDirect","ixs1.net":"eWayDirect","ewebse.com":"ewebse","777seo.com":"ewebse","excitad.com":"excitad","exelate.com":"eXelate","exelator.com":"eXelate","exoclick.com":"ExoClick","experian.com":"Experian","pricegrabber.com":"Experian","audienceiq.com":"Experian","exponential.com":"Exponential Interactive","fulltango.com":"Exponential Interactive","adotube.com":"Exponential Interactive","tribalfusion.com":"Exponential Interactive","expo-max.com":"expo-MAX","extensionfactory.com":"Extension Factory","extensions.ru":"EXTENSIONS.RU","eyeconomy.co.uk":"Eyeconomy","www.eyeconomy.co.uk":"Eyeconomy","eyeconomy.com":"Eyeconomy","sublimemedia.net":"Eyeconomy","eyereturnmarketing.com":"eyeReturn Marketing","eyereturn.com":"eyeReturn Marketing","eyeviewdigital.com":"Eyeviewdigital","eyeviewads.com":"Eyeviewdigital","facilitatedigital.com":"Facilitate Digital","adsfac.eu":"Facilitate Digital","adsfac.net":"Facilitate Digital","adsfac.us":"Facilitate Digital","adsfac.info":"Facilitate Digital","adsfac.sg":"Facilitate Digital","www.fxj.com.au":"Fairfax Media","fairfax.com.au":"Fairfax Media","fxj.com.au":"Fairfax Media","faithadnet.com":"faithadnet","fathomdelivers.com":"Fathom","fathomseo.com":"Fathom","hyfn.com":"Federated Media","sovrn":"Federated Media","lijit.com":"Federated Media","federatedmedia.net":"Federated Media","fmpub.net":"Federated Media","fetchback.com":"FetchBack","fiksu.com":"Fiksu","financialcontent.com":"FinancialContent","fizzbuzzmedia.com":"Fizz-Buzz Media","fizzbuzzmedia.net":"Fizz-Buzz Media","flashtalking.com":"Flashtalking","encoremetrics.com":"Flashtalking","sitecompass.com":"Flashtalking","flite.com":"Flite","widgetserver.com":"Flite","flytxt.com":"Flytxt","forbes.com":"Forbes","brandsideplatform.com":"Forbes","foxonestop.com":"Fox One Stop Media","fimserve.com":"Fox One Stop Media","foxnetworks.com":"Fox One Stop Media","mobsmith.com":"Fox One Stop Media","myads.com":"Fox One Stop Media","othersonline.com":"Fox One Stop Media","rubiconproject.com":"Fox One Stop Media","isocket.com":"Fox One Stop Media","adsbyisocket.com":"Fox One Stop Media","fout.jp":"FreakOut","freedom.com":"Freedom Communications","ffn.com":"FriendFinder Networks","adultfriendfinder.com":"FriendFinder Networks","pop6.com":"FriendFinder Networks","frogsex.com":"Frog Sex","double-check.com":"Frog Sex","fullstory.com":"FullStory","futureads.com":"Future Ads","resultlinks.com":"Future Ads","game-advertising-online.com":"Game Advertising Online","games2win.com":"Games2win","inviziads.com":"Games2win","gamned.com":"Gamned","gannett.com":"Gannett","pointroll.com":"Gannett","gb-world.net":"GB-World","gemius.com":"Gemius","gemius.pl":"Gemius","www.geniegroupltd.co.uk":"GENIE GROUP","geniegroupltd.co.uk":"GENIE GROUP","genius.com":"Genius.com","rsvpgenius.com":"Genius.com","genesismedia.com":"Genesis Media","genesismediaus.com":"Genesis Media","geoads.com":"GeoAds","elfie.com":"GetGlue","smrtlnks.com":"GetGlue","getglue.com":"GetGlue","getsitecontrol.com":"GetSiteControl","glammedia.com":"Glam Media","glam.com":"Glam Media","globe7.com":"Globe7","godatafeed.com":"GoDataFeed","goldspotmedia.com":"GoldSpot Media","www.grapeshot.co.uk":"Grapeshot","grapeshot.co.uk":"Grapeshot","groceryshopping.net":"Grocery Shopping Network","groovinads.com":"GroovinAds","guj.de":"Gruner + Jahr","ligatus.com":"Gruner + Jahr","www.gismads.jp":"GISMAds","gismads.jp":"GISMAds","pepperjam.com":"GSI Commerce","gsicommerce.com":"GSI Commerce","gsimedia.net":"GSI Commerce","pjatr.com":"GSI Commerce","pjtra.com":"GSI Commerce","pntra.com":"GSI Commerce","pntrac.com":"GSI Commerce","pntrs.com":"GSI Commerce","gumgum.com":"GumGum","gunggo.com":"Gunggo","www.hands.com.br":"Hands Mobile","hands.com.br":"Hands Mobile","harrenmedia.com":"Harrenmedia","harrenmedianetwork.com":"Harrenmedia","healthpricer.com":"HealthPricer","adacado.com":"HealthPricer","hearst.com":"Hearst","ic-live.com":"Hearst","iclive.com":"Hearst","icrossing.com":"Hearst","raasnet.com":"Hearst","sptag.com":"Hearst","sptag1.com":"Hearst","sptag2.com":"Hearst","sptag3.com":"Hearst","redaril.com":"Hearst","himediagroup.com":"Hi-media","hi-media.com":"Hi-media","comclick.com":"Hi-media","horyzon-media.com":"Horyzon Media","meetic-partners.com":"Horyzon Media","smartadserver.com":"Horyzon Media","hotwords.com":"HOTWords","hotwords.es":"HOTWords","hp.com":"HP","opentext.com":"HP","optimost.com":"HP","hpconnected.com":"HP","httpool.com":"Httpool","huntmads.com":"HUNT Mobile Ads","hurra.com":"Hurra.com","i-behavior.com":"I-Behavior","ib-ibi.com":"I-Behavior","i.ua":"I.UA","iac.com":"IAC","iacadvertising.com":"IAC","ibm.com":"IBM","unica.com":"IBM","cmcore.com":"IBM","coremetrics.com":"IBM","xtify.com":"IBM","idg.com":"IDG","idgtechnetwork.com":"IDG","ientry.com":"iEntry","600z.com":"iEntry","ignitad.com":"IgnitAd","ignitionone.com":"IgnitionOne","ignitionone.net":"IgnitionOne","searchignite.com":"IgnitionOne","improvedigital.com":"Improve Digital","360yield.com":"Improve Digital","inadco.com":"Inadco","anadcoads.com":"Inadco","inadcoads.com":"Inadco","infectiousmedia.com":"Infectious Media","impressiondesk.com":"Infectious Media","inflectionpointmedia.com":"Inflection Point Media","infogroup.com":"Infogroup","infolinks.com":"Infolinks","infra-ad.com":"Infra-Ad","inmobi.com":"InMobi","sproutinc.com":"InMobi","inner-active.com":"inneractive","innity.com":"Innity","inskinmedia.com":"InSkin Media","instinctive.io":"Instinctive","instinctiveads.com":"Instinctive","intentmedia.com":"Intent Media","intentmedia.net":"Intent Media","intergi.com":"Intergi","intermarkets.net":"Intermarkets","intermundomedia.com":"Intermundo Media","internetbrands.com":"Internet Brands","ibpxl.com":"Internet Brands","interpolls.com":"Interpolls","inuvo.com":"Inuvo","investingchannel.com":"InvestingChannel","iprom.si":"iPROM","centraliprom.com":"iPROM","iprom.net":"iPROM","mediaiprom.com":"iPROM","ipromote.com":"iPromote","iprospect.com":"iProspect","clickmanage.com":"iProspect","digbro.com":"ISI Technologies","adversalservers.com":"ISI Technologies","jaroop.com":"Jaroop","jasperlabs.com":"JasperLabs","jemmgroup.com":"Jemm","jink.de":"Jink","jinkads.com":"Jink","adcolony.com":"Jirbo","jirbo.com":"Jirbo","jivox.com":"Jivox","jobthread.com":"JobThread","juicyads.com":"JuicyAds","jumptap.com":"Jumptap","kenshoo.com":"Kenshoo","xg4ken.com":"Kenshoo","keyade.com":"Keyade","kissmyads.com":"KissMyAds","kitd.com":"KIT digital","keewurd.com":"KIT digital","peerset.com":"KIT digital","kitaramedia.com":"Kitara Media","103092804.com":"Kitara Media","kokteyl.com":"Kokteyl","admost.com":"Kokteyl","komli.com":"Komli","kontera.com":"Kontera","korrelate.com":"Korrelate","adsummos.com":"Korrelate","adsummos.net":"Korrelate","krux.com":"Krux","kruxdigital.com":"Krux","krxd.net":"Krux","layer-ad.org":"Layer-Ad.org","layer-ads.net":"Layer-ads.net","leadbolt.com":"LeadBolt","calliduscloud.com":"LeadFormix","leadformix.com":"LeadFormix","leadforce1.com":"LeadFormix","leadlander.com":"LeadLander","trackalyzer.com":"LeadLander","legolas-media.com":"Legolas Media","levexis.com":"Levexis","lexosmedia.com":"Lexos Media","adbull.com":"Lexos Media","lifestreetmedia.com":"LifeStreet","lfstmedia.com":"LifeStreet","liveintent.com":"LiveIntent","liadm.com":"LiveIntent","liveinternet.ru":"LiveInternet","yadro.ru":"LiveInternet","linkconnector.com":"LinkConnector","rakutenmarketing.com":"LinkShare","linkshare.com":"LinkShare","linksynergy.com":"LinkShare","linkz.net":"Linkz","listrak.com":"Listrak","listrakbi.com":"Listrak","localyokelmedia.com":"Local Yokel Media","longboardmedia.com":"Longboard Media","loomia.com":"Loomia","loopfuse.net":"LoopFuse","lfov.net":"LoopFuse","lucidmedia.com":"LucidMedia","dstillery.com":"m6d","m6d.com":"m6d","media6degrees.com":"m6d","madhouse.cn":"Madhouse","madisonlogic.com":"Madison Logic","dinclinx.com":"Madison Logic","madvertise.com":"madvertise","magnetic.com":"Magnetic","domdex.net":"Magnetic","domdex.com":"Magnetic","mybuys.com":"Magnetic","veruta.com":"Magnetic","qjex.net":"Magnetic","magnify360.com":"Magnify360","dialogmgr.com":"Magnify360","mailchimp.com":"MailChimp","campaign-archive1.com":"MailChimp","mailchi.mp":"MailChimp","list-manage.com":"MailChimp","manifest.ru":"Manifest","bannerbank.ru":"Manifest","marchex.com":"Marchex","industrybrains.com":"Marchex","marimedia.net":"Marimedia","marketgid.com":"MarketGid","dt00.net":"MarketGid","dt07.net":"MarketGid","marketo.com":"Marketo","marketo.net":"Marketo","martiniadnetwork.com":"Martini Media","martinimedianetwork.com":"Martini Media","mashero.com":"mashero","match.com":"Match.com","chemistry.com":"Match.com","matomy.com":"Matomy","matomymarket.com":"Matomy","matomymedia.com":"Matomy","xtendmedia.com":"Matomy","mediawhiz.com":"Matomy","adnetinteractive.com":"Matomy","maxbounty.com":"MaxBounty","mb01.com":"MaxBounty","maxpointinteractive.com":"MaxPoint","maxusglobal.com":"MaxPoint","mxptint.net":"MaxPoint","mdotm.com":"MdotM","media.net":"media.net","mediabrix.com":"MediaBrix","mediacom.com":"MediaCom","mediaforge.com":"mediaFORGE","medialets.com":"Medialets","mediamath.com":"MediaMath","adroitinteractive.com":"MediaMath","designbloxlive.com":"MediaMath","mathtag.com":"MediaMath","mediaocean.com":"Mediaocean","adbuyer.com":"Mediaocean","mediashakers.com":"MediaShakers","media-servers.net":"MediaShakers","mediatrust.com":"MediaTrust","medicxmedia.com":"Medicx Media Solutions","mercent.com":"Mercent","merchantadvantage.com":"MerchantAdvantage","merchenta.com":"Merchenta","megaindex.ru":"MegaIndex","metanetwork.com":"Meta Network","meteorsolutions.com":"Meteor","www.microad.jp":"MicroAd","microad.jp":"MicroAd","microsoft.com":"Microsoft","atdmt.com":"Microsoft","bing.com":"Microsoft","gamesforwindows.com":"Microsoft","getgamesmart.com":"Microsoft","healthvault.com":"Microsoft","ieaddons.com":"Microsoft","iegallery.com":"Microsoft","live.com":"Microsoft","microsoftalumni.com":"Microsoft","microsoftalumni.org":"Microsoft","microsoftstore.com":"Microsoft","msn.com":"Microsoft","msnbc.com":"Microsoft","nbcnews.com":"Microsoft","office.com":"Microsoft","officelive.com":"Microsoft","outlook.com":"Microsoft","s-msn.com":"Microsoft","skype.com":"Microsoft","windowsphone.com":"Microsoft","worldwidetelescope.org":"Microsoft","xbox.com":"Microsoft","adbureau.net":"Microsoft","adecn.com":"Microsoft","aquantive.com":"Microsoft","msads.net":"Microsoft","netconversions.com":"Microsoft","roiservice.com":"Microsoft","msndirect.com":"Microsoft","millennialmedia.com":"Millennial Media","decktrade.com":"Millennial Media","mydas.mobi":"Millennial Media","mindset-media.com":"Mindset Media","mmismm.com":"Mindset Media","mirando.de":"Mirando","mixpo.com":"Mixpo","moat.com":"Moat","moatads.com":"Moat","mobfox.com":"MobFox","mobilemeteor.com":"Mobile Meteor","showmeinn.com":"Mobile Meteor","admoda.com":"MobVision","mobvision.com":"MobVision","moceanmobile.com":"Mocean Mobile","mochila.com":"Mochila","mojiva.com":"Mojiva","monetate.com":"Monetate","monetate.net":"Monetate","cpalead.com":"MONETIZEdigital","monoloop.com":"Monoloop","moolahmedia.com":"Moolah Media","moolah-media.com":"Moolah Media","monster.com":"Monster","mopub.com":"MoPub","movielush.com":"MovieLush.com","affbuzzads.com":"MovieLush.com","mozilla.com":"Mozilla","mozilla.org":"Mozilla","firefox.com":"Mozilla","mozaws.net":"Mozilla","multiplestreammktg.com":"Multiple Stream Media","adclickmedia.com":"Multiple Stream Media","mundomedia.com":"MUNDO Media","silver-path.com":"MUNDO Media","mycounter.com.ua":"MyCounter","mythings.com":"myThings","mythingsmedia.com":"myThings","mywebgrocer.com":"MyWebGrocer","nanigans.com":"Nanigans","navegg.com":"Navegg","navdmp.com":"Navegg","net-results.com":"Net-Results","nr7.us":"Net-Results","cdnma.com":"Net-Results","netaffiliation.com":"NetAffiliation","netbina.com":"NetBina","netelixir.com":"NetElixir","adelixir.com":"NetElixir","netmining.com":"Netmining","netmng.com":"Netmining","netseer.com":"NetSeer","ziffdavistech.com":"NetShelter","netshelter.com":"NetShelter","netshelter.net":"NetShelter","neustar.biz":"Neustar","adadvisor.net":"Neustar","newtention.de":"newtention","newtention.net":"newtention","newtentionassets.net":"newtention","nexage.com":"Nexage","nextag.com":"Nextag","nextperf.com":"NextPerformance","nextperformance.com":"NextPerformance","nxtck.com":"NextPerformance","nielsen.com":"Nielsen","imrworldwide.com":"Nielsen","imrworldwide.net":"Nielsen","glanceguide.com":"Nielsen","ninua.com":"Ninua","networkedblogs.com":"Ninua","noktamedya.com":"Nokta","virgul.com":"Nokta","nowspots.com":"NowSpots","nrelate.com":"nrelate","www.nuffnang.com.my":"Nuffnang","nuffnang.com":"Nuffnang","nuffnang.com.my":"Nuffnang","nugg.ad":"nugg.ad","nuggad.net":"nugg.ad","ohana-media.com":"Ohana Media","adohana.com":"Ohana Media","ohanaqb.com":"Ohana Media","omnicomgroup.com":"Omnicom Group","accuenmedia.com":"Omnicom Group","p-td.com":"Omnicom Group","onad.eu":"onAd","itsoneiota.com":"One iota","oneiota.co.uk":"One iota","oneupweb.com":"Oneupweb","sodoit.com":"Oneupweb","onm.de":"Open New Media","openx.com":"OpenX","openx.net":"OpenX","liftdna.com":"OpenX","openx.org":"OpenX","openxenterprise.com":"OpenX","servedbyopenx.com":"OpenX","opera.com":"Opera","mobiletheory.com":"Opera","www.opt.ne.jp":"OPT","advg.jp":"OPT","opt.ne.jp":"OPT","p-advg.com":"OPT","optify.net":"Optify","bn.co":"Optimal","optim.al":"Optimal","cpmadvisors.com":"Optimal","cpmatic.com":"Optimal","nprove.com":"Optimal","orbengine.com":"Optimal","xa.net":"Optimal","optimumresponse.com":"OptimumResponse","optmd.com":"OptMD","optnmstr.com":"OptinMonster","optinmonster.com":"OptinMonster","oracle.com":"Oracle","estara.com":"Oracle","atgsvcs.com":"Oracle","instantservice.com":"Oracle","istrack.com":"Oracle","eloqua.com":"Oracle","maxymiser.com":"Oracle","orangesoda.com":"OrangeSoda","otracking.com":"OrangeSoda","out-there-media.com":"Out There Media","outbrain.com":"Outbrain","sphere.com":"Outbrain","visualrevenue.com":"Outbrain","oversee.net":"Oversee.net","dsnextgen.com":"Oversee.net","owneriq.com":"OwnerIQ","owneriq.net":"OwnerIQ","oxamedia.com":"OxaMedia","adconnexa.com":"OxaMedia","adsbwm.com":"OxaMedia","paid-to-promote.net":"Paid-To-Promote.net","pardot.com":"Pardot","payhit.com":"PayHit","paypopup.com":"Paypopup.com","lzjl.com":"Paypopup.com","peer39.com":"Peer39","peer39.net":"Peer39","peerfly.com":"PeerFly","performancing.com":"Performancing","pheedo.com":"Pheedo","pictela.com":"Pictela","pictela.net":"Pictela","pixel.sg":"Pixel.sg","piximedia.com":"Piximedia","www.platform-one.co.jp":"PLATFORM ONE","platform-one.co.jp":"PLATFORM ONE","plista.com":"plista","po.st":"Po.st","pocketcents.com":"PocketCents","getpolymorph.com":"Polymorph","adsnative.com":"Polymorph","pontiflex.com":"Pontiflex","popads.net":"PopAds","popadscdn.net":"PopAds","poprule.com":"PopRule","gocampaignlive.com":"PopRule","precisionclick.com":"PrecisionClick","predictad.com":"PredictAd","pressflex.com":"Pressflex","blogads.com":"Pressflex","proclivitysystems.com":"Proclivity","pswec.com":"Proclivity","proclivitymedia.com":"Proclivity","projectwonderful.com":"Project Wonderful","prosperent.com":"Prosperent","publicidees.com":"Public-Idées","pch.com":"Publishers Clearing House","pubmatic.com":"PubMatic","revinet.com":"PubMatic","primevisibility.com":"Prime Visibility","adcde.com":"Prime Visibility","addlvr.com":"Prime Visibility","adonnetwork.com":"Prime Visibility","adonnetwork.net":"Prime Visibility","adtrgt.com":"Prime Visibility","bannertgt.com":"Prime Visibility","cptgt.com":"Prime Visibility","cpvfeed.com":"Prime Visibility","cpvtgt.com":"Prime Visibility","popcde.com":"Prime Visibility","sdfje.com":"Prime Visibility","urtbk.com":"Prime Visibility","quadrantone.com":"quadrantOne","quantcast.com":"Quantcast","quantserve.com":"Quantcast","quinstreet.com":"QuinStreet","thecounter.com":"QuinStreet","qnsr.com":"QuinStreet","qsstats.com":"QuinStreet","quisma.com":"QUISMA","iaded.com":"QUISMA","quismatch.com":"QUISMA","xaded.com":"QUISMA","xmladed.com":"QUISMA","solesolution.com":"Radiate Media","gtnetwork.com.au":"Radiate Media","radiatemedia.com":"Radiate Media","matchbin.com":"Radiate Media","radiumone.com":"RadiumOne","gwallet.com":"RadiumOne","radiusmarketing.com":"Radius Marketing","rambler.ru":"Rambler","rapleaf.com":"Rapleaf","liveramp.com":"Rapleaf","rlcdn.com":"Rapleaf","reachlocal.com":"ReachLocal","rlcdn.net":"ReachLocal","react2media.com":"React2Media","reduxmedia.com":"Redux Media","rekko.com":"Rekko","convertglobal.com":"Rekko","reklamstore.com":"Reklam Store","reklamport.com":"Reklamport","reklamz.com":"Reklamz","relevad.com":"Relevad","relestar.com":"Relevad","renegadeinternet.com":"Renegade Internet","advertserve.com":"Renegade Internet","resolutionmedia.com":"Resolution Media","resonateinsights.com":"Resonate","resonatenetworks.com":"Resonate","responsys.com":"Responsys","retargeter.com":"ReTargeter","retirement-living.com":"Retirement Living","blvdstatus.com":"Retirement Living","revenuemax.de":"RevenueMax","rhythmone.com":"Rhythm","rhythmnewmedia.com":"Rhythm","rnmd.net":"Rhythm","rhythmxchange.com":"Rhythm","1rx.io":"Rhythm","richrelevance.com":"RichRelevance","rightaction.com":"RightAction","traforet.com":"RMBN","rmbn.net":"RMBN","rmbn.ru":"RMBN","rmmonline.com":"RMM","rocketfuel.com":"Rocket Fuel","rfihub.com":"Rocket Fuel","rfihub.net":"Rocket Fuel","ru4.com":"Rocket Fuel","xplusone.com":"Rocket Fuel","rovion.com":"Rovion","rutarget.ru":"RuTarget","sabre.com":"Sabre","reztrack.com":"Sabre","sabrehospitality.com":"Sabre","salesforce.com":"Salesforce.com","force.com":"Salesforce.com","salesforceliveagent.com":"Salesforce.com","samurai-factory.jp":"Samurai Factory","shinobi.jp":"Samurai Factory","sapient.com":"Sapient","bridgetrack.com":"Sapient","sas.com":"SAS","aimatch.com":"SAS","scandinavianadnetworks.com":"Scandinavian AdNetworks","scribol.com":"Scribol","searchforce.com":"SearchForce","searchforce.net":"SearchForce","kanoodle.com":"Seevast","seevast.com":"Seevast","pulse360.com":"Seevast","syndigonetworks.com":"Seevast","selectablemedia.com":"Selectable Media","nabbr.com":"Selectable Media","sevenads.net":"SevenAds","sexinyourcity.com":"SexInYourCity","shareasale.com":"ShareASale","shopzilla.com":"Shopzilla","silverpop.com":"Silverpop","mkt51.net":"Silverpop","pages05.net":"Silverpop","vtrenz.net":"Silverpop","simpli.fi":"Simpli.fi","sitescout.com":"SiteScout","skimlinks.com":"Skimlinks","skimresources.com":"Skimlinks","skupenet.com":"Skupe Net","adcentriconline.com":"Skupe Net","smaato.com":"Smaato","smartlook.com":"SmartLook","smileymedia.com":"Smiley Media","smowtion.com":"Smowtion","snap.com":"Snap","socialchorus.com":"SocialChorus","halogenmediagroup.com":"SocialChorus","halogennetwork.com":"SocialChorus","socialinterface.com":"SocialInterface","ratevoice.com":"SocialInterface","socialtwist.com":"SocialTwist","sociomantic.com":"sociomantic labs","sophus3.com":"sophus3","sophus3.co.uk":"sophus3","spacechimpmedia.com":"Space Chimp Media","sparkstudios.com":"Spark Studios","sparklit.com":"Sparklit","adbutler.com":"Sparklit","specificmedia.com":"Specific Media","sitemeter.com":"Specific Media","adviva.co.uk":"Specific Media","adviva.net":"Specific Media","specificclick.net":"Specific Media","spectate.com":"Spectate","spongegroup.com":"Sponge","spongecell.com":"Spongecell","sponsorads.de":"SponsorAds","spot200.com":"Spot200","spotxchange.com":"SpotXchange","spotxcdn.com":"SpotXchange","stargames.net":"StarGames","stargamesaffiliate.com":"StarGames","steelhouse.com":"SteelHouse","steelhousemedia.com":"SteelHouse","streamray.com":"Streamray","cams.com":"Streamray","strikead.com":"StrikeAd","strongmail.com":"StrongMail","popularmedia.com":"StrongMail","struq.com":"Struq","suite66.com":"Suite 66","www.summit.co.uk":"Summit","summitmedia.co.uk":"Summit","supersonicads.com":"SupersonicAds","switchconcepts.com":"Switch","switchadhub.com":"Switch","switchconcepts.co.uk":"Switch","switchads.com":"Switch","swoop.com":"Swoop","factortg.com":"SymphonyAM","syncapse.com":"Syncapse","clickable.net":"Syncapse","taboola.com":"Taboola","perfectmarket.com":"Taboola","tailsweep.com":"Tailsweep","tap.me":"Tap.me","tapad.com":"Tapad","tapgage.com":"Tapgage","bizmey.com":"Tapgage","tapit.com":"TapIt!","tattomedia.com":"Tatto Media","quicknoodles.com":"Tatto Media","targetix.net":"Targetix","teadma.com":"Teadma","teads.tv":"Teads.tv","technorati.com":"Technorati","technoratimedia.com":"Technorati","tellapart.com":"TellApart","tellapt.com":"TellApart","telstra.com.au":"Telstra","sensis.com.au":"Telstra","sensisdata.com.au":"Telstra","sensisdigitalmedia.com.au":"Telstra","www.terra.com.br":"Terra","eztargetmedia.com":"Terra","terra.com.br":"Terra","thenumagroup.com":"The Numa Group","hittail.com":"The Numa Group","merkleinc.com":"The Rimm-Kaufman Group","rkdms.com":"The Rimm-Kaufman Group","rimmkaufman.com":"The Rimm-Kaufman Group","thesearchagency.com":"The Search Agency","thesearchagency.net":"The Search Agency","thetradedesk.com":"The Trade Desk","adsrvr.org":"The Trade Desk","thinkrealtime.com":"Think Realtime","echosearch.com":"Think Realtime","esm1.net":"Think Realtime","tinder.com":"Tinder","carbonads.com":"Tinder","tiqiq.com":"TiqIQ","tlvmedia.com":"TLVMedia","todacell.com":"Todacell","tonefuse.com":"ToneFuse","clickfuse.com":"ToneMedia","tonemedia.com":"ToneMedia","nuance.com":"TouchCommerce","touchcommerce.com":"TouchCommerce","inq.com":"TouchCommerce","trackingsoft.com":"TrackingSoft","roia.biz":"TrackingSoft","tradedoubler.com":"Tradedoubler","tradetracker.com":"TradeTracker","tradetracker.net":"TradeTracker","traffichaus.com":"TrafficHaus","traffichouse.com":"TrafficHaus","trafficrevenue.net":"TrafficRevenue","traffiq.com":"Traffiq","travoramedia.com":"Travora Media","traveladnetwork.com":"Travora Media","traveladvertising.com":"Travora Media","tremorvideo.com":"Tremor Video","scanscout.com":"Tremor Video","tmnetads.com":"Tremor Video","tremormedia.com":"Tremor Video","tremorhub.com":"Tremor Video","triggit.com":"Triggit","trueffect.com":"TruEffect","adlegend.com":"TruEffect","truste.com":"TRUSTe","tubemogul.com":"TubeMogul","tmogul.com":"TubeMogul","twelvefold.com":"Twelvefold","buzzlogic.com":"Twelvefold","twyn.com":"Twyn Group","twyn-group.com":"Twyn Group","tyroo.com":"Tyroo","ucoz.com":"uCoz","ucoz.ae":"uCoz","ucoz.fr":"uCoz","ucoz.net":"uCoz","ucoz.ru":"uCoz","ucoz.br":"uCoz","ucoz.du":"uCoz","www.unanimis.co.uk":"Unanimis","unanimis.co.uk":"Unanimis","underdogmedia.com":"Underdog Media","udmserve.net":"Underdog Media","undertone.com":"Undertone","undertonevideo.com":"Undertone","undertonenetworks.com":"Undertone","uniqlick.com":"UniQlick","51network.com":"UniQlick","wanmo.com":"UniQlick","unrulymedia.com":"Unruly","up-value.de":"up-value","usitechnologies.com":"USI Technologies","upsellit.com":"USI Technologies","conversantmedia.com":"ValueClick","valueclick.com":"ValueClick","adserver.com":"ValueClick","dotomi.com":"ValueClick","dtmpub.com":"ValueClick","emjcd.com":"ValueClick","fastclick.com":"ValueClick","fastclick.net":"ValueClick","greystripe.com":"ValueClick","lduhtrp.net":"ValueClick","mediaplex.com":"ValueClick","valueclick.net":"ValueClick","valueclickmedia.com":"ValueClick","zmedia.com":"ValueClick","various.com":"Various","amigos.com":"Various","getiton.com":"Various","medley.com":"Various","nostringsattached.com":"Various","vdopia.com":"Vdopia","ivdopia.com":"Vdopia","adsvelocity.com":"Velocity Media","velti.com":"Velti","mobclix.com":"Velti","vemba.com":"Vemba","vendio.com":"Vendio","singlefeed.com":"Vendio","veoxa.com":"Veoxa","veremedia.com":"Veremedia","verticalresponse.com":"VerticalResponse","vresp.com":"VerticalResponse","vibrantmedia.com":"Vibrant Media","intellitxt.com":"Vibrant Media","picadmedia.com":"Vibrant Media","viglink.com":"VigLink","visiblemeasures.com":"Visible Measures","viewablemedia.net":"Visible Measures","visbrands.com":"VisibleBrands","visualdna.com":"VisualDNA","vdna-assets.com":"VisualDNA","visualdna-stats.com":"VisualDNA","vizu.com":"Vizu","vizury.com":"Vizury","vserv.com":"Vserv","vserv.mobi":"Vserv","wahoha.com":"Wahoha","contentwidgets.net":"Wahoha","web.com":"Web.com","feedperfect.com":"Web.com","www.webads.co.uk":"WebAds","webads.co.uk":"WebAds","webgozar.com":"WebGozar.com","webgozar.ir":"WebGozar.com","revanadigital.com":"WebMetro","dsmmadvantage.com":"WebMetro","webmetro.com":"WebMetro","weborama.com":"Weborama","weborama.fr":"Weborama","webtraffic.se":"Webtraffic","webtraffic.no":"Webtraffic","wiredminds.de":"WiredMinds","wiredminds.com":"WiredMinds","wp.pl":"Wirtualna Polska","adtotal.pl":"Wirtualna Polska","wordstream.com":"WordStream","wpp.com":"WPP","decdna.net":"WPP","groupm.com":"WPP","kantarmedia.com":"WPP","mecglobal.com":"WPP","mindshareworld.com":"WPP","themig.com":"WPP","xaxis.com":"WPP","compete.com":"WPP","247realmedia.com":"WPP","accelerator-media.com":"WPP","acceleratorusa.com":"WPP","decideinteractive.com":"WPP","gmads.net":"WPP","mindshare.nl":"WPP","mookie1.com":"WPP","pm14.com":"WPP","realmedia.com":"WPP","targ.ad":"WPP","xad.com":"xAd","xertivemedia.com":"Xertive Media","admanager-xertive.com":"Xertive Media","xplosion.de":"xplosion interactive","adplan-ds.com":"Xrost DS","yabuka.com":"Yabuka","yadi.sk":"Yandex","yandex.com":"Yandex","moikrug.ru":"Yandex","yandex.ru":"Yandex","yandex.st":"Yandex","yandex.ua":"Yandex","yandex.com.tr":"Yandex","yandex.by":"Yandex","api-maps.yandex.ru":"Yandex","web-visor.com":"Yandex","brightcom.com":"Ybrant Digital","addynamix.com":"Ybrant Digital","luj.sdsjweb.com":"Ybrant Digital","ybrantdigital.com":"Ybrant Digital","adserverplus.com":"Ybrant Digital","oridian.com":"Ybrant Digital","ydworld.com":"YD","yieldivision.com":"YD","yhmg.com":"YellowHammer","attracto.com":"YellowHammer","clickhype.com":"YellowHammer","yellowhammermg.com":"YellowHammer","yieldads.com":"YieldAds","ybx.io":"YieldBids","yieldbuild.com":"YieldBuild","yieldlab.de":"Yieldlab","yieldlab.net":"Yieldlab","yoc.com":"YOC","youknowbest.com":"youknowbest","yume.com":"YuMe","yumenetworks.com":"YuMe","zango.com":"Zango","metricsdirect.com":"Zango","zanox.com":"zanox","buy.at":"zanox","zanox-affiliate.de":"zanox","zapunited.com":"zapunited","zaparena.com":"zapunited","zedo.com":"ZEDO","zincx.com":"ZEDO","zemanta.com":"Zemanta","zestad.com":"ZestAd","zetaemailsolutions.com":"Zeta Email Solutions","insightgrit.com":"Zeta Email Solutions","zumobi.com":"Zumobi","63labs.com":"63 Squares","63squares.com":"63 Squares","i-stats.com":"63 Squares","acxiom.com":"Acxiom","mm7.net":"Acxiom","acxiomapac.com":"Acxiom","addfreestats.com":"AddFreeStats","3dstats.com":"AddFreeStats","adventori.com":"Adventori","amadesa.com":"Amadesa","primawebtools.de":"anormal-media.de","anormal-media.de":"anormal-media.de","anormal-tracker.de":"anormal-media.de","attracta.com":"Attracta","automattic.com":"Automattic","polldaddy.com":"Automattic","gravatar.com":"Automattic","intensedebate.com":"Automattic","awio.com":"Awio","w3counter.com":"Awio","w3roi.com":"Awio","belstat.com":"Belstat","belstat.be":"Belstat","belstat.de":"Belstat","belstat.fr":"Belstat","belstat.nl":"Belstat","blogcounter.de":"BlogCounter.com","bluemetrix.com":"Bluemetrix","bmmetrix.com":"Bluemetrix","branica.com":"Branica","brightedge.com":"BrightEdge","bubblestat.com":"Bubblestat","c3metrics.com":"C3 Metrics","attributionmodel.com":"C3 Metrics","c3tag.com":"C3 Metrics","chartbeat.com":"Chartbeat","chartbeat.net":"Chartbeat","clickdensity.com":"Clickdensity","clicktale.com":"ClickTale","clicktale.net":"ClickTale","pantherssl.com":"ClickTale","clixmetrix.com":"ClixMetrix","clixpy.com":"Clixpy","clustrmaps.com":"ClustrMaps","cnzz.com":"CNZZ","compuware.com":"Compuware","axf8.net":"Compuware","dynatrace.com":"Compuware","gomez.com":"Compuware","connexity.com":"Connexity","connexity.net":"Connexity","convert.com":"Convert Insights","reedge.com":"Convert Insights","crazyegg.com":"Crazy Egg","cetrk.com":"Crazy Egg","crowdscience.com":"Crowd Science","ihs.com":"Dataium","collserve.com":"Dataium","dataium.com":"Dataium","deepintent.com":"Deep Intent","demandbase.com":"Demandbase","directcorp.de":"DirectCORP","ipcounter.de":"DirectCORP","dwstat.cn":"dwstat.com","eproof.com":"eProof.com","etracker.com":"etracker","etracker.de":"etracker","sedotracker.com":"etracker","sedotracker.de":"etracker","eulerian.com":"Eulerian Technologies","eulerian.net":"Eulerian Technologies","extremetracking.com":"eXTReMe digital","extreme-dm.com":"eXTReMe digital","feedjit.com":"Feedjit","footprintlive.com":"Footprint","freeonlineusers.com":"Free Online Users","free-pagerank.com":"Free-PageRank.com","gfk.com":"GfK Group","daphnecm.com":"GfK Group","gfkdaphne.com":"GfK Group","github.com":"GitHub","gaug.es":"GitHub","godaddy.com":"Go Daddy","trafficfacts.com":"Go Daddy","gosquared.com":"GoSquared","gostats.com":"GoStats","arenaweb.ro":"GTop","gtop.ro":"GTop","gtopstats.com":"GTop","histats.com":"Histats","hitsniffer.com":"Hit Sniffer","hitslink.com":"HitsLink","inboundwriter.com":"InboundWriter","enquisite.com":"InboundWriter","infonline.de":"INFOnline","ioam.de":"INFOnline","ivwbox.de":"INFOnline","infostars.ru":"InfoStars","hotlog.ru":"InfoStars","inspectlet.com":"Inspectlet","intelligencefocus.com":"IntelligenceFocus","leadchampion.com":"IntelligenceFocus","domodomain.com":"IntelligenceFocus","intercom.io":"Intercom","iperceptions.com":"iPerceptions","keymetric.net":"KeyMetric","kissmetrics.com":"KISSmetrics","linezing.com":"LineZing","liveperson.com":"LivePerson","nuconomy.com":"LivePerson","liveperson.net":"LivePerson","logdy.com":"Logdy","lotame.com":"Lotame","crwdcntrl.net":"Lotame","lynchpin.com":"Lynchpin","lypn.com":"Lynchpin","aurea.com":"Lyris","lyris.com":"Lyris","clicktracks.com":"Lyris","lytiks.com":"Lytiks","markmonitor.com":"MarkMonitor","9c9media.ca":"MarkMonitor","marktest.com":"Marktest","marktest.pt":"Marktest","mediametrie-estat.com":"Médiamétrie-eStat","estat.com":"Médiamétrie-eStat","meetrics.com":"Meetrics","de.com":"Meetrics","meetrics.de":"Meetrics","meetrics.net":"Meetrics","metrixlab.com":"MetrixLab","crm-metrix.com":"MetrixLab","customerconversio.com":"MetrixLab","opinionbar.com":"MetrixLab","adoftheyear.com":"MetrixLab","mixpanel.com":"Mixpanel","mxpnl.com":"Mixpanel","mongoosemetrics.com":"Mongoose Metrics","monitus.net":"Monitus","motigo.com":"motigo","nedstatbasic.net":"motigo","mouseflow.com":"Mouseflow","mypagerank.net":"MyPagerank.Net","netapplications.com":"Net Applications","hitsprocessor.com":"Net Applications","newrelic.com":"New Relic","nr-data.net":"New Relic","newsright.com":"NewsRight","apnewsregistry.com":"NewsRight","nextstat.com":"NextSTAT","sensic.net":"nurago","nurago.com":"nurago","nurago.de":"nurago","observerapp.com":"Observer","onestat.com":"OneStat","openstat.com":"Openstat","openstat.ru":"Openstat","spylog.com":"Openstat","opentracker.net":"Opentracker","oewa.at":"ÖWA","oewabox.at":"ÖWA","persianstat.com":"PersianStat.com","phonalytics.com":"Phonalytics","phpmyvisites.us":"phpMyVisites","piwik.org":"Piwik","pronunciator.com":"Pronunciator","visitorville.com":"Pronunciator","qualaroo.com":"Qualaroo","kissinsights.com":"Qualaroo","quintelligence.com":"Quintelligence","radarurl.com":"RadarURL","researchnow.com":"Research Now","valuedopinions.co.uk":"Research Now","roxr.net":"Roxr","clicky.com":"Roxr","getclicky.com":"Roxr","staticstuff.net":"Roxr","safecount.net":"Kantar Millward Brown","millwardbrowndigital.com":"Kantar Millward Brown","insightexpress.com":"Kantar Millward Brown","insightexpressai.com":"Kantar Millward Brown","dl-rms.com":"Kantar Millward Brown","dlqm.net":"Kantar Millward Brown","questionmarket.com":"Kantar Millward Brown","sagemetrics.com":"SageMetrics","sageanalyst.net":"SageMetrics","segment.io":"Segment.io","seevolution.com":"SeeVolution","svlu.net":"SeeVolution","sessioncam.com":"SessionCam","shinystat.com":"ShinyStat","snoobi.fi":"Snoobi","snoobi.com":"Snoobi","statcounter.com":"StatCounter","statisfy.net":"Statisfy","statsit.com":"STATSIT","stratigent.com":"Stratigent","4u.pl":"stat4u","tealium.com":"Tealium","tiqcdn.com":"Tealium","tensquare.com":"TENSQUARE","marinsm.com":"The Heron Partnership","marinsoftware.com":"The Heron Partnership","heronpartners.com.au":"The Heron Partnership","tnsglobal.com":"TNS","statistik-gallup.net":"TNS","tns-counter.ru":"TNS","tns-cs.net":"TNS","sesamestats.com":"TNS","umbel.com":"Umbel","nakanohito.jp":"User Local","vertster.com":"Vertster","id.kickfire.com":"VisiStat","sa-as.com":"VisiStat","d.kickfire.com":"VisiStat","visistat.com":"VisiStat","visitstreamer.com":"Visit Streamer","vistrac.com":"vistrac","vizisense.com":"ViziSense","vizisense.net":"ViziSense","onlinewebstats.com":"Web Stats","webtrackingservices.com":"Web Tracking Services","web-stat.com":"Web Tracking Services","webtraxs.com":"Web Traxs","webclicktracker.com":"Webclicktracker","webtrekk.com":"Webtrekk","webtrekk.net":"Webtrekk","webtrends.com":"Webtrends","reinvigorate.net":"Webtrends","webtrendslive.com":"Webtrends","amung.us":"whos.amung.us","adzmath.com":"White Ops","whiteops.com":"White Ops","woopra.com":"Woopra","woopra-ns.com":"Woopra","wowanalytics.co.uk":"WOW Analytics","wysistat.net":"Wysistat","wysistat.com":"Wysistat","yellowtracker.com":"YellowTracker","activengage.com":"ActivEngage","adap.tv":"Adap.tv","akqa.com":"AKQA","srtk.net":"AKQA","cookieq.com":"Baycloud Systems","baynote.com":"Baynote","baynote.net":"Baynote","bazaarvoice.com":"Bazaarvoice","bigdoor.com":"BigDoor","onetruefan.com":"BigDoor","brightcove.com":"Brightcove","browser-update.org":"Browser-Update.org","btbuckets.com":"BTBuckets","bufferapp.com":"Buffer","bunchball.com":"Bunchball","buysafe.com":"buySAFE","buzzfeed.com":"BuzzFeed","buzzfed.com":"BuzzFeed","cbox.ws":"Cbox","cbsinteractive.com":"CBS Interactive","com.com":"CBS Interactive","cedexis.com":"Cedexis","cedexis.net":"Cedexis","certona.com":"Certona","res-x.com":"Certona","certona.net":"Certona","clipsyndicate.com":"ClipSyndicate","collarity.com":"Collarity","conduit.com":"Conduit","conduit-banners.com":"Conduit","conduit-services.com":"Conduit","wibiya.com":"Conduit","congoo.com":"Congoo","contactatonce.com":"Contact At Once!","conviva.com":"Conviva","dailyme.com":"DailyMe","newstogram.com":"DailyMe","datasift.com":"DataSift","tweetmeme.com":"DataSift","dgit.com":"DG","sizmek.com":"DG","eyeblaster.com":"DG","eyewonder.com":"DG","mdadx.com":"DG","serving-sys.com":"DG","unicast.com":"DG","disqus.com":"Disqus","aboutecho.com":"Echo","haloscan.com":"Echo","js-kit.com":"Echo","flattr.com":"Flattr","freewheel.tv":"FreeWheel","fwmrm.net":"FreeWheel","getsatisfaction.com":"Get Satisfaction","gigya.com":"Gigya","gigcount.com":"Gigya","globaltakeoff.com":"Global Takeoff","globaltakeoff.net":"Global Takeoff","datapipe.com":"GoGrid","formalyzer.com":"GoGrid","gogrid.com":"GoGrid","komli.net":"GoGrid","gravity.com":"Gravity","grvcdn.com":"Gravity","heyzap.com":"Heyzap","hubspot.com":"HubSpot","hs-analytics.net":"HubSpot","iovation.com":"iovation","iesnare.com":"iovation","kaltura.com":"Kaltura","kikin.com":"kikin","limelight.com":"Limelight Networks","uplandsoftware.com":"Limelight Networks","clickability.com":"Limelight Networks","llnwd.net":"Limelight Networks","liverail.com":"LiveRail","jwplayer.com":"LongTail Video","longtailvideo.com":"LongTail Video","ltassrv.com":"LongTail Video","markit.com":"Markit","wsod.com":"Markit","mashlogic.com":"MashLogic","mcafee.com":"McAfee","mcafeesecure.com":"McAfee","scanalert.com":"McAfee","newsinc.com":"NDN","iwin.com":"Oberon Media","oberon-media.com":"Oberon Media","blaze.com":"Oberon Media","olark.com":"Olark","ooyala.com":"Ooyala","oo4.com":"Ooyala","optimizely.com":"Optimizely","parsely.com":"Parse.ly","peerius.com":"Peerius","pinterest.com":"Pinterest","pinterest.de":"Pinterest","pinterest.pt":"Pinterest","pinterest.se":"Pinterest","pinterest.jp":"Pinterest","pinterest.co.kr":"Pinterest","pinterest.dk":"Pinterest","pinterest.com.mx":"Pinterest","pinterest.at":"Pinterest","pinterest.co.uk":"Pinterest","pinterest.ie":"Pinterest","pinterest.fr":"Pinterest","pinterest.ca":"Pinterest","pinterest.ch":"Pinterest","pinterest.es":"Pinterest","pinterest.cl":"Pinterest","pinterest.nz":"Pinterest","pinterest.com.au":"Pinterest","punchtab.com":"PunchTab","global.blackberry.com":"RIM","laptopverge.com":"RIM","rim.com":"RIM","scoreloop.com":"RIM","saymedia.com":"SAY","typepad.com":"SAY","videoegg.com":"SAY","scribefire.com":"ScribeFire","movabletype.com":"Six Apart","sixapart.com":"Six Apart","paulstamatiou.com":"Skribit","skribit.com":"Skribit","snapengage.com":"SnapEngage","springmetrics.com":"Spring Metrics","superfish.com":"Superfish","synacor.com":"Synacor","thinglink.com":"ThingLink","thismoment.com":"Thismoment","thummit.com":"Thummit","topsy.com":"Topsy","tracemyip.org":"TraceMyIP.org","trackset.com":"Trackset","www.trovus.co.uk":"Trovus","trovus.co.uk":"Trovus","trumba.com":"Trumba","turntonetworks.com":"TurnTo","turnto.com":"TurnTo","tweetboard.com":"Tweetboard","twittercounter.com":"Twitter Counter","ubermedia.com":"UberMedia","tweetup.com":"UberMedia","ubertags.com":"UberTags","unbounce.com":"Unbounce","uptrends.com":"Uptrends","usabilitysciences.com":"Usability Sciences","webiqonline.com":"Usability Sciences","uservoice.com":"UserVoice","verticalacuity.com":"Vertical Acuity","vgwort.de":"VG WORT","videologygroup.com":"Videology","tidaltv.com":"Videology","viewbix.com":"Viewbix","qoof.com":"Viewbix","vimeo.com":"Vimeo","vimeocdn.com":"Vimeo","vindicogroup.com":"VINDICO","vindicosuite.com":"VINDICO","voice2page.com":"Voice2Page","websitealive.com":"WebsiteAlive","websitealive0.com":"WebsiteAlive","websitealive1.com":"WebsiteAlive","websitealive2.com":"WebsiteAlive","websitealive3.com":"WebsiteAlive","websitealive4.com":"WebsiteAlive","websitealive5.com":"WebsiteAlive","websitealive6.com":"WebsiteAlive","websitealive7.com":"WebsiteAlive","websitealive8.com":"WebsiteAlive","websitealive9.com":"WebsiteAlive","wingify.com":"Wingify","vwo.com":"Wingify","visualwebsiteoptimizer.com":"Wingify","zendesk.com":"Zendesk","zopim.com":"Zopim","addthis.com":"AddThis","addthiscdn.com":"AddThis","addthisedge.com":"AddThis","clearspring.com":"AddThis","connectedads.net":"AddThis","xgraph.com":"AddThis","xgraph.net":"AddThis","causes.com":"Causes","digg.com":"Digg","linkedin.com":"LinkedIn","licdn.com":"LinkedIn","addtoany.com":"Lockerz","lockerz.com":"Lockerz","mail.ru":"Mail.Ru","list.ru":"Mail.Ru","meebo.com":"Meebo","meebocdn.net":"Meebo","papayamobile.com":"Papaya","reddit.com":"reddit","redditmedia.com":"reddit","redditstatic.com":"reddit","sharethis.com":"ShareThis","shareaholic.com":"Shareaholic","buzzster.com":"Shareaholic","stumbleupon.com":"StumbleUpon","stumble-upon.com":"StumbleUpon","vk.com":"VKontakte","userapi.com":"VKontakte","vkontakte.ru":"VKontakte","brightroll.com":"Oath","buildseries.com":"Oath","yuilibrary.com":"Oath","tumblr.com":"Oath","yahoo.com":"Oath","yahoostudios.com":"Oath","aol.com":"Oath","adsonar.com":"Oath","advertising.com":"Oath","atwola.com":"Oath","leadback.com":"Oath","tacoda.net":"Oath","5min.com":"Oath","aim.com":"Oath","aolcdn.com":"Oath","aoltechguru.com":"Oath","autoblog.com":"Oath","cambio.com":"Oath","dailyfinance.com":"Oath","editions.com":"Oath","engadget.com":"Oath","games.com":"Oath","homesessive.com":"Oath","huffingtonpost.com":"Oath","makers.com":"Oath","mandatory.com":"Oath","mapquest.com":"Oath","moviefone.com":"Oath","noisecreep.com":"Oath","patch.com":"Oath","pawnation.com":"Oath","shortcuts.com":"Oath","shoutcast.com":"Oath","spinner.com":"Oath","stylelist.com":"Oath","stylemepretty.com":"Oath","surphace.com":"Oath","techcrunch.com":"Oath","theboombox.com":"Oath","theboot.com":"Oath","userplane.com":"Oath","winamp.com":"Oath","oath.com":"Oath","compuserve.com":"Oath","convertro.com":"Oath","ryot.org":"Oath","rivals.com":"Oath","vidible.tv":"Oath","analytics.yahoo.com":"Oath","fc.yahoo.com":"Oath","btrll.com":"Oath","adinterax.com":"Oath","adrevolver.com":"Oath","bluelithium.com":"Oath","interclick.com":"Oath","mybloglog.com":"Oath","overture.com":"Oath","rightmedia.com":"Oath","rmxads.com":"Oath","rocketmail.com":"Oath","secure-adserver.com":"Oath","staticflickr.com":"Oath","yahooapis.com":"Oath","yahoofs.com":"Oath","yieldmanager.com":"Oath","yieldmanager.net":"Oath","yimg.com":"Oath","yldmgrimg.net":"Oath","ymail.com":"Oath","zenfs.com":"Oath","yimg.jp":"Oath","yahooapis.jp":"Oath","flurry.com":"Oath","dapper.net":"Oath","luminate.com":"Oath","pixazza.com":"Oath","b.aol.com":"Oath","o.sa.aol.com":"Oath","o.aolcdn.com":"Oath","adtechjp.com":"Oath"}
},{}],34:[function(require,module,exports){
module.exports={"Google":83.513,"Taboola":3.027,"Facebook":16.092,"Twitter":6.715,"AddThis":3.77,"whos.amung.us":0.651,"Amazon.com":12.609,"Criteo":7.373,"nugg.ad":1.092,"AT Internet":0.855,"Médiamétrie-eStat":0.244,"PageFair":0.653,"Moat":0.569,"Horyzon Media":1.285,"AdSafe Media":0.529,"AppNexus":11.908,"Fox One Stop Media":4.833,"TripleLift":0.615,"Yandex":2.966,"PopAds":0.536,"Webtrends":0.363,"LiveInternet":2.273,"New Relic":8.7,"eXTReMe digital":0.174,"ADITION":0.628,"INFOnline":1.584,"WPP":1.029,"adscale":0.584,"ADTECH":1.372,"Casale Media":4.001,"OpenX":4.739,"Oath":6.054,"Adobe":9.557,"ValueClick":1.334,"Rhythm":1.311,"Federated Media":3.073,"CONTEXTWEB":2.829,"SiteScout":2.046,"EQ Ads":0.931,"ShareThis":0.676,"Rambler":0.386,"comScore":10.54,"Skimlinks":1.069,"Cross Pixel":0.191,"AK":1.391,"BlueKai":2.663,"MediaMath":4.619,"The Trade Desk":5.682,"Rocket Fuel":1.374,"Quantcast":6.814,"TNS":0.317,"AdFox":0.206,"Go Daddy":0.149,"unknown":4.092,"DoubleVerify":0.076,"SpotXchange":0.76,"DataXu":1.391,"Improve Digital":0.29,"Tapad":1.401,"Drawbridge":0.781,"Krux":2.945,"Rapleaf":1.796,"PubMatic":3.023,"StatCounter":1.363,"bigmir)net":0.059,"OptinMonster":0.386,"KISSmetrics":0.151,"Crazy Egg":1.796,"VigLink":0.916,"Weborama":0.378,"Chartbeat":3.176,"Wishabi":0.376,"Outbrain":1.344,"Lotame":3.413,"LinkedIn":0.823,"Histats":1.199,"Roxr":0.622,"Mixpanel":1.033,"Commission Junction":0.092,"Adverline":0.053,"m6d":1.559,"Meetrics":0.193,"Yieldlab":0.452,"xplosion interactive":0.498,"Gemius":0.878,"Demandbase":0.38,"ClickTale":0.349,"HP":0.034,"Ensighten":0.91,"Hotjar":2.867,"VKontakte":0.384,"reddit":0.193,"TubeMogul":0.523,"AdXpansion":0.05,"Adality":0.05,"Yieldmo":0.26,"media.net":0.83,"BuySellAds":0.334,"Simpli.fi":0.83,"GoStats":0.011,"Adform":1.433,"ExoClick":1.888,"Attracta":0.002,"EroAdvertising":0.376,"Soasta":0.781,"Exponential Interactive":0.466,"BloomReach":0.168,"eXelate":1.029,"Teads.tv":0.452,"LinkShare":0.229,"DC Storm":0.17,"cXense":0.519,"OwnerIQ":0.693,"Nativo":1.092,"Monetate":0.51,"Listrak":0.334,"Project Wonderful":0.032,"Gruner + Jahr":0.279,"Vibrant Media":0.258,"MarketGid":0.176,"Mouseflow":0.311,"Intercom":0.265,"sociomantic labs":0.099,"Specific Media":0.04,"ActiveConversion":0.002,"Nielsen":1.739,"Belstat":0.006,"Lockerz":0.336,"FriendFinder Networks":0.067,"Adverticum":0.057,"Flashtalking":0.204,"LiveIntent":0.271,"AdOcean":0.141,"Zemanta":0.355,"RadiumOne":0.235,"Netmining":0.281,"Microsoft":0.536,"AdRoll":1.021,"AWeber":0.256,"AdRiver":0.313,"RevContent":0.284,"AvantLink":0.08,"CPMStar":0.08,"JuicyAds":0.603,"BrightTag":0.536,"Datalogix":0.935,"Pictela":0.214,"Swoop":0.258,"Segment.io":0.626,"Inspectlet":0.284,"Bizo":0.206,"Oracle":0.624,"Certona":0.218,"Magnetic":0.403,"InvestingChannel":0.027,"Wysistat":0.021,"Amobee":0.042,"AdKernel":0.3,"AdGlare":0.023,"SessionCam":0.143,"SteelHouse":0.168,"Veeseo":0.013,"4shared.com":0.002,"OPT":0.021,"GetSiteControl":0.183,"HubSpot":0.559,"QuinStreet":0.055,"Adzerk":0.103,"FullStory":0.158,"Deep Intent":0.027,"FreeWheel":0.021,"Adotmob":0.143,"Admeta":0.076,"BLOOM Digital Platforms":0.166,"ZEDO":0.097,"plista":0.204,"Acxiom":0.034,"Technorati":0.027,"Evidon":0.481,"Think Realtime":0.008,"Undertone":0.053,"The Heron Partnership":0.323,"Intent Media":0.13,"Hurra.com":0.021,"IBM":0.3,"Adara Media":0.185,"DG":0.538,"etracker":0.246,"BrightEdge":0.032,"iPerceptions":0.21,"Tradedoubler":0.061,"adBrite":0.006,"Po.st":0.231,"Lakana":0.086,"Intergi":0.078,"Shareaholic":0.128,"AdTiger":0.011,"AdMedia":0.011,"eBay":0.187,"Marktest":0.029,"AT&T":0.027,"Marketo":0.611,"Polymorph":0.191,"FreakOut":0.078,"ClustrMaps":0.027,"Tinder":0.101,"Veoxa":0.008,"ReTargeter":0.019,"The Rimm-Kaufman Group":0.338,"Tremor Video":0.239,"iovation":0.002,"Intermarkets":0.019,"Qualaroo":0.704,"GSI Commerce":0.006,"ChannelAdvisor":0.143,"CNZZ":0.101,"SearchForce":0.006,"Cox Digital Solutions":0.263,"MailChimp":0.59,"Pardot":0.288,"Kantar Millward Brown":0.069,"NextPerformance":0.067,"orange.fr":0.019,"Webtrekk":0.162,"GumGum":0.92,"Renegade Internet":0.124,"Opera":0.011,"Spongecell":0.04,"Polar Mobile":0.265,"Silverpop":0.059,"Datonics":0.105,"Jumptap":0.017,"Acuity":0.16,"Mail.Ru":0.288,"Telstra":0.021,"AdServerPub":0.004,"Fairfax Media":0.013,"Evolve":0.046,"MaxPoint":0.059,"SupersonicAds":0.002,"agar.io":0.002,"zanox":0.092,"Neustar":0.111,"ad6media":0.046,"Selectable Media":0.048,"MerchantAdvantage":0.002,"BidVertiser":0.006,"Digital Target":0.168,"GetIntent":0.263,"Targetix":0.038,"LinkConnector":0.023,"AdReactor":0.061,"MetrixLab":0.021,"RichRelevance":0.208,"Monitus":0.017,"Internet Brands":0.12,"33Across":0.162,"Unruly":0.16,"NetSeer":0.137,"LifeStreet":0.086,"Adsty":0.13,"Effective Measure":0.103,"Switch":0.109,"AudienceScience":0.055,"SAS":0.061,"meinestadt.de":0.017,"I-Behavior":0.032,"ClickDistrict":0.155,"alibaba.com":0.004,"Underdog Media":0.05,"Automattic":0.155,"Chango":0.048,"Visible Measures":0.042,"CoinHive":0.101,"AdSpeed":0.04,"Kenshoo":0.086,"InfoStars":0.029,"Openstat":0.008,"RuTarget":0.078,"BlueCava":0.05,"eyeReturn Marketing":0.088,"engage:BDR":0.076,"Complex Media":0.069,"Infolinks":0.082,"Nexage":0.017,"BlogHer":0.078,"Jivox":0.036,"amarujala.com":0.002,"Navegg":0.092,"Caraytech":0.046,"Admotion":0.021,"Pressflex":0.008,"dianomi":0.053,"TruEffect":0.011,"ConversionRuler":0.002,"DynamicYield":0.153,"Adsupply":0.122,"ClickDimensions":0.034,"MicroAd":0.055,"anandabazar.com":0.002,"Emego":0.008,"Awio":0.008,"Forbes":0.004,"Instinctive":0.027,"ShinyStat":0.074,"GroovinAds":0.019,"Innity":0.032,"animenewsnetwork.com":0.002,"DirectAdvert":0.023,"Adiant":0.076,"AdSpirit":0.029,"Samurai Factory":0.013,"Salesforce.com":0.021,"GoDataFeed":0.013,"Fluct":0.034,"Glam Media":0.011,"Smowtion":0.002,"ara.cat":0.002,"StumbleUpon":0.05,"archiproducts.com":0.002,"argep.hu":0.002,"YuMe":0.034,"Research Now":0.071,"Adswizz":0.071,"nurago":0.011,"Woopra":0.044,"Developer Media":0.044,"Adventori":0.038,"ÖWA":0.155,"Adversal.com":0.008,"USI Technologies":0.053,"TouchCommerce":0.09,"Dataium":0.002,"Adnetik":0.015,"sophus3":0.053,"audi.co.uk":0.002,"Connexity":0.021,"Web.com":0.008,"Wirtualna Polska":0.053,"AdsTours":0.008,"Twyn Group":0.034,"avforums.com":0.002,"VisiStat":0.015,"Gannett":0.021,"ToneMedia":0.036,"Net-Results":0.008,"SocialTwist":0.004,"Mercent":0.038,"SAY":0.046,"TrafficHaus":0.084,"Rekko":0.004,"barclays.co.uk":0.002,"SmartLook":0.038,"Nanigans":0.057,"barstoolsports.com":0.002,"AdF.ly":0.015,"ADTELLIGENCE":0.013,"MarkMonitor":0.027,"VisualDNA":0.101,"User Local":0.032,"ShareASale":0.027,"Grapeshot":0.053,"C3 Metrics":0.032,"Performancing":0.011,"Net Applications":0.002,"mediaFORGE":0.044,"Dedicated Media":0.006,"Admicro":0.023,"Mirando":0.011,"Barilliance":0.008,"Fiksu":0.008,"nih.gov":0.006,"blizzardwatch.com":0.002,"Pinterest":0.029,"Delta Projects":0.011,"Shortest":0.013,"iPROM":0.011,"Ambient Digital":0.013,"FinancialContent":0.006,"Eulerian Technologies":0.008,"AdBrain":0.021,"Levexis":0.008,"britishairways.com":0.002,"brooksbrothers.com":0.002,"GitHub":0.044,"Opentracker":0.013,"adnologies":0.004,"ConvergeDirect":0.008,"AppsFlyer":0.025,"TradeTracker":0.008,"Streamray":0.008,"Public-Idées":0.006,"GoSquared":0.08,"Hearst":0.004,"Act-On":0.002,"nicovideo.jp":0.006,"sankakucomplex.com":0.004,"AdFrontiers":0.006,"chaturbate.com":0.004,"chatzy.com":0.002,"Amazing Counters":0.004,"uCoz":0.04,"cio.com":0.002,"Peer39":0.008,"clamav.net":0.002,"Collective":0.019,"Proclivity":0.032,"clubedohardware.com.br":0.002,"cnbc.com":0.002,"OneStat":0.021,"CPX Interactive":0.002,"wikimedia.org":0.008,"sosh.fr":0.002,"Optimizely":0.017,"LeadFormix":0.002,"computerworld.com":0.002,"Answers.com":0.002,"Chitika":0.015,"Httpool":0.013,"Spectate":0.008,"cqcounter.com":0.002,"Piximedia":0.017,"kohls.com":0.004,"adMarketplace":0.002,"Crowd Science":0.002,"dailycaller.com":0.002,"dailymail.co.uk":0.002,"AdvertiseSpace":0.002,"Match.com":0.008,"pornhub.com":0.021,"DoublePimp":0.029,"HealthPricer":0.006,"Kontera":0.019,"Feedjit":0.015,"HitsLink":0.015,"Unanimis":0.002,"NetShelter":0.008,"Digg":0.004,"Vizury":0.015,"Akamai":0.002,"LeadLander":0.011,"Digital River":0.013,"Begun":0.019,"MaxBounty":0.002,"Flite":0.008,"eProof.com":0.004,"Vdopia":0.013,"Monster":0.034,"xAd":0.013,"Augur":0.011,"eldiario.es":0.004,"Snoobi":0.008,"Kokteyl":0.004,"eurogamer.net":0.002,"eventhubs.com":0.002,"eventim.de":0.002,"Everyday Health":0.008,"Experian":0.004,"explosm.net":0.002,"fandango.com":0.004,"Affinity":0.004,"filmon.com":0.002,"Etarget":0.008,"financialexpress.com":0.002,"expedia.com":0.002,"flvto.biz":0.004,"Adworx":0.021,"I.UA":0.015,"HOTWords":0.002,"Ad Decisive":0.008,"bodybuilding.com":0.002,"AddFreeStats":0.013,"canoe.ca":0.002,"Ad4Game":0.011,"freewka.com":0.002,"Tisoomi":0.013,"gamecopyworld.com":0.002,"washingtonpost.com":0.006,"gamesgames.com":0.002,"Infectious Media":0.004,"AdReady":0.013,"RMBN":0.027,"Betgenius":0.004,"Accelia":0.004,"NetElixir":0.004,"walmart.com":0.006,"Adometry":0.006,"Meebo":0.002,"spiegel.de":0.006,"hd-porn.me":0.002,"ClearSaleing":0.004,"Addvantage Media":0.002,"hentai-foundry.com":0.002,"Syncapse":0.004,"ADP Dealer Services":0.008,"usps.com":0.004,"ibis.com":0.002,"craveonline.com":0.002,"Hi-media":0.002,"Adlucent":0.002,"Meteor":0.002,"infoworld.com":0.002,"Marchex":0.004,"ip-address.org":0.002,"itv.com":0.002,"Nokta":0.004,"AndBeyond":0.002,"jagranjosh.com":0.002,"Sparklit":0.002,"AdLantis":0.002,"The Numa Group":0.011,"Acquisio":0.006,"RadarURL":0.002,"kentucky.com":0.002,"ndtv.com":0.006,"Wingify":0.002,"365Media":0.013,"myThings":0.004,"Applovin":0.002,"AdPerfect":0.004,"lipsum.com":0.002,"mercadolivre.com.br":0.002,"apache.org":0.002,"Keyade":0.008,"BackBeat Media":0.004,"IgnitionOne":0.002,"KeyMetric":0.008,"4INFO":0.006,"rp-online.de":0.004,"seekingalpha.com":0.004,"StrikeAd":0.002,"Earnify":0.002,"BlogCatalog":0.002,"manga-news.com":0.002,"Wahoha":0.002,"medicare.gov":0.002,"mid-day.com":0.002,"milb.com":0.002,"perezhilton.com":0.004,"Mongoose Metrics":0.006,"Layer-Ad.org":0.002,"nationalcar.com":0.002,"affilinet":0.008,"necn.com":0.002,"networkworld.com":0.002,"next-episode.net":0.002,"Nextag":0.002,"TrackingSoft":0.002,"jimmyjohns.com":0.002,"Web Traxs":0.004,"overclock3d.net":0.002,"Brand.net":0.002,"pbskids.org":0.002,"Publishers Clearing House":0.002,"pep.ph":0.002,"Buysight":0.004,"VerticalResponse":0.002,"politiken.dk":0.002,"pornfun.com":0.002,"Web Stats":0.004,"AdEngage":0.002,"pornxs.com":0.002,"ti.com":0.002,"Web Tracking Services":0.006,"rakuten.co.jp":0.004,"ratemyprofessors.com":0.002,"Sapient":0.004,"redtube.com":0.002,"rockpapershotgun.com":0.002,"Triggit":0.002,"safeway.com":0.002,"sahibinden.com":0.002,"searchengineland.com":0.002,"CheckM8":0.004,"snapchat.com":0.002,"sonypictures.com":0.002,"southwest.com":0.002,"sparkylinux.org":0.002,"Communicator Corp":0.002,"dlink.com":0.002,"Terra":0.002,"texasroadhouse.com":0.002,"tf1.fr":0.002,"Clickdensity":0.002,"Ninua":0.004,"LiveRail":0.002,"thenextweb.com":0.002,"thesimsresource.com":0.002,"thetvdb.com":0.002,"Xrost DS":0.002,"Umbel":0.004,"tv5monde.com":0.002,"TellApart":0.004,"unrealengine.com":0.002,"vg247.com":0.002,"foxnews.com":0.002,"nationalgeographic.com":0.002,"vistek.ca":0.002,"vodafone.com.au":0.002,"walmartmoneycard.com":0.002,"Radiate Media":0.002,"dhlglobalmail.com":0.002,"NextSTAT":0.002,"Adforge":0.002,"Burst Media":0.002,"WordStream":0.002,"writing.com":0.002,"ynet.co.il":0.002,"zerozero.pt":0.002,"zorinos.com":0.002}
},{}],35:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
 * Load the abp-filter-parser node module and
 * pre-process the easylists.
 */
var abp = require('abp-filter-parser');
var constants = require('../../data/constants');
var surrogates = require('./surrogates.es6');
var settings = require('./settings.es6');
var load = require('./load.es6');
var browserWrapper = require('./chrome-wrapper.es6');

var ONEDAY = 1000 * 60 * 60 * 24;

var lists = {
    whitelists: {
        // source: https://github.com/duckduckgo/content-blocking-whitelist/blob/master/trackers-whitelist.txt
        trackersWhitelist: {
            constantsName: 'trackersWhitelist',
            parser: abp,
            parsed: {},
            isLoaded: false
        }
    },
    surrogates: {
        surrogateList: {
            constantsName: 'surrogateList',
            parser: surrogates,
            parsed: {},
            isLoaded: false
        }
    }
};

var trackersWhitelistTemporary;

function getTemporaryWhitelist() {
    return trackersWhitelistTemporary;
}

function getWhitelists() {
    return lists.whitelists;
}

/*
 * Get the list data and use abp to parse.
 * The parsed list data will be added to
 * the easyLists object.
 */
function updateLists() {
    var atb = settings.getSetting('atb');
    var setAtb = settings.getSetting('set_atb');
    var versionParam = getVersionParam();

    for (var listType in lists) {
        var _loop = function _loop(name) {
            var list = lists[listType][name];
            var constantsName = list.constantsName;

            var url = constants[constantsName];
            if (!url) return {
                    v: void 0
                };

            var etag = settings.getSetting(constantsName + '-etag') || '';

            // only add url params to contentblocking.js duckduckgo urls
            if (url.match(/^https?:\/\/(.+)?duckduckgo.com\/contentblocking\.js/)) {
                if (atb) url += '&atb=' + atb;
                if (setAtb) url += '&set_atb=' + setAtb;
                if (versionParam) url += versionParam;
            }

            console.log('Checking for list update: ', name);

            // if we don't have parsed list data skip the etag to make sure we
            // get a fresh copy of the list to process
            if (Object.keys(list.parsed).length === 0) etag = '';

            load.loadExtensionFile({ url: url, source: 'external', etag: etag }).then(function (response) {
                if (response && response.status === 200) {
                    var listData = response.data;
                    var newEtag = response.getResponseHeader('etag') || '';
                    console.log('Updating list: ', name);

                    // sync new etag to storage
                    settings.updateSetting(constantsName + '-etag', newEtag);

                    list.parser.parse(listData, list.parsed);

                    list.isLoaded = true;
                }
            });
        };

        for (var name in lists[listType]) {
            var _ret = _loop(name);

            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        }
    }

    var trackersWhitelistTemporaryEtag = settings.getSetting('trackersWhitelistTemporary-etag') || '';
    // reset etag to get a new list copy if we don't have brokenSiteList data
    if (!trackersWhitelistTemporary || !trackersWhitelistTemporaryEtag) trackersWhitelistTemporaryEtag = '';

    // load broken site list
    // source: https://github.com/duckduckgo/content-blocking-whitelist/blob/master/trackers-whitelist-temporary.txt
    load.loadExtensionFile({ url: constants.trackersWhitelistTemporary, etag: trackersWhitelistTemporaryEtag, source: 'external' }).then(function (response) {
        if (response && response.status === 200) {
            var listData = response.data;
            var newTrackersWhitelistTemporaryEtag = response.getResponseHeader('etag') || '';
            settings.updateSetting('trackersWhitelistTemporary-etag', newTrackersWhitelistTemporaryEtag);
            trackersWhitelistTemporary = listData.trim().split('\n');
        }
    });
}

// Make sure the list updater runs on start up
settings.ready().then(function () {
    return updateLists();
});

// add version param to url on the first install and
// only once a day after than
function getVersionParam() {
    var version = browserWrapper.getExtensionVersion();
    var lastEasylistUpdate = settings.getSetting('lastEasylistUpdate');
    var now = Date.now();
    var versionParam = void 0;

    // check delta for last update or if lastEasylistUpdate does
    // not exist then this is the initial install
    if (lastEasylistUpdate) {
        var delta = now - new Date(lastEasylistUpdate);

        if (delta > ONEDAY) {
            versionParam = '&v=' + version;
        }
    } else {
        versionParam = '&v=' + version;
    }

    if (versionParam) settings.updateSetting('lastEasylistUpdate', now);

    return versionParam;
}

module.exports = {
    getTemporaryWhitelist: getTemporaryWhitelist,
    getWhitelists: getWhitelists,
    updateLists: updateLists
};

},{"../../data/constants":30,"./chrome-wrapper.es6":39,"./load.es6":48,"./settings.es6":52,"./surrogates.es6":54,"abp-filter-parser":3}],36:[function(require,module,exports){
'use strict';

/**
 * DuckDuckGo's ATB pipeline to facilitate various experiments.
 * Please see https://duck.co/help/privacy/atb for more information.
 */

var settings = require('./settings.es6');
var parseUserAgentString = require('../shared-utils/parse-user-agent-string.es6');
var load = require('./load.es6');
var browserWrapper = require('./chrome-wrapper.es6');

var ATB_ERROR_COHORT = 'v1-1';

var dev = false;

var ATB = function () {
    // regex to match ddg urls to add atb params to.
    // Matching subdomains, searches, and newsletter page
    var regExpAboutPage = /^https?:\/\/(\w+\.)?duckduckgo\.com\/(\?.*|about#newsletter)/;
    var ddgAtbURL = 'https://duckduckgo.com/atb.js?';

    return {
        updateSetAtb: function updateSetAtb() {
            var atbSetting = settings.getSetting('atb');
            var setAtbSetting = settings.getSetting('set_atb');

            var errorParam = '';

            // client shouldn't have a falsy ATB value,
            // so mark them as having gone into an errored state
            // next time they won't send the e=1 param
            if (!atbSetting) {
                atbSetting = ATB_ERROR_COHORT;
                settings.updateSetting('atb', ATB_ERROR_COHORT);
                errorParam = '&e=1';
            }

            var randomValue = Math.ceil(Math.random() * 1e7);
            var url = '' + ddgAtbURL + randomValue + '&atb=' + atbSetting + '&set_atb=' + setAtbSetting + errorParam;

            return load.JSONfromExternalFile(url).then(function (res) {
                settings.updateSetting('set_atb', res.data.version);
            });
        },

        redirectURL: function redirectURL(request) {
            if (request.url.search(regExpAboutPage) !== -1) {
                if (request.url.indexOf('atb=') !== -1) {
                    return;
                }

                var atbSetting = settings.getSetting('atb');

                if (!atbSetting) {
                    return;
                }

                // handle anchor tags for pages like about#newsletter
                var urlParts = request.url.split('#');
                var newURL = request.url;
                var anchor = '';

                // if we have an anchor tag
                if (urlParts.length === 2) {
                    newURL = urlParts[0];
                    anchor = '#' + urlParts[1];
                }

                if (request.url.indexOf('?') !== -1) {
                    newURL += '&';
                } else {
                    newURL += '?';
                }

                newURL += 'atb=' + atbSetting + anchor;

                return { redirectUrl: newURL };
            }
        },

        setInitialVersions: function setInitialVersions(numTries) {
            numTries = numTries || 0;
            if (settings.getSetting('atb') || numTries > 5) return Promise.resolve();

            var randomValue = Math.ceil(Math.random() * 1e7);
            var url = ddgAtbURL + randomValue;

            return load.JSONfromExternalFile(url).then(function (res) {
                settings.updateSetting('atb', res.data.version);
            }, function () {
                console.log('couldn\'t reach atb.js for initial server call, trying again');
                numTries += 1;

                return new Promise(function (resolve) {
                    setTimeout(resolve, 500);
                }).then(function () {
                    return ATB.setInitialVersions(numTries);
                });
            });
        },

        finalizeATB: function finalizeATB() {
            var atb = settings.getSetting('atb');

            // make this request only once
            if (settings.getSetting('extiSent')) return;

            settings.updateSetting('extiSent', true);
            settings.updateSetting('set_atb', atb);

            // just a GET request, we only care that the request was made
            load.url('https://duckduckgo.com/exti/?atb=' + atb);
        },

        getNewATBFromURL: function getNewATBFromURL(url) {
            var atb = '';
            var matches = url.match(/\Wnatb=(v\d+-\d([a-z_]{2})?)(&|$)/);

            if (matches && matches[1]) {
                atb = matches[1];
            }

            return atb;
        },

        updateATBValues: function updateATBValues() {
            // wait until settings is ready to try and get atb from the page
            return settings.ready().then(ATB.setInitialVersions).then(browserWrapper.getDDGTabUrls).then(function (urls) {
                var atb = void 0;

                urls.some(function (url) {
                    atb = ATB.getNewATBFromURL(url);
                    return !!atb;
                });

                if (atb) {
                    settings.updateSetting('atb', atb);
                }

                ATB.finalizeATB();
            });
        },

        openPostInstallPage: function openPostInstallPage() {
            // only show post install page on install if:
            // - the user wasn't already looking at the app install page
            // - the user hasn't seen the page before
            settings.ready().then(function () {
                chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
                    var domain = tabs && tabs[0] ? tabs[0].url : '';
                    if (ATB.canShowPostInstall(domain)) {
                        settings.updateSetting('hasSeenPostInstall', true);
                        var postInstallURL = 'https://duckduckgo.com/app?post=1';
                        var atb = settings.getSetting('atb');
                        postInstallURL += atb ? '&atb=' + atb : '';
                        chrome.tabs.create({
                            url: postInstallURL
                        });
                    }
                });
            });
        },

        canShowPostInstall: function canShowPostInstall(domain) {
            var regExpPostInstall = /duckduckgo\.com\/app/;
            var regExpSoftwarePage = /duckduckgo\.com\/software/;

            if (!(domain && settings)) return false;

            return !settings.getSetting('hasSeenPostInstall') && !domain.match(regExpPostInstall) && !domain.match(regExpSoftwarePage);
        },

        getSurveyURL: function getSurveyURL() {
            var url = ddgAtbURL + Math.ceil(Math.random() * 1e7) + '&uninstall=1&action=survey';
            var atb = settings.getSetting('atb');
            var setAtb = settings.getSetting('set_atb');
            if (atb) url += '&atb=' + atb;
            if (setAtb) url += '&set_atb=' + setAtb;

            var browserInfo = parseUserAgentString();
            var browserName = browserInfo.browser;
            var browserVersion = browserInfo.version;
            var extensionVersion = browserWrapper.getExtensionVersion();
            if (browserName) url += '&browser=' + browserName;
            if (browserVersion) url += '&bv=' + browserVersion;
            if (extensionVersion) url += '&v=' + extensionVersion;
            if (dev) url += '&test=1';

            return url;
        },

        setDevMode: function setDevMode() {
            dev = true;
        }
    };
}();

settings.ready().then(function () {
    // set initial uninstall url
    browserWrapper.setUninstallURL(ATB.getSurveyURL());
});

module.exports = ATB;

},{"../shared-utils/parse-user-agent-string.es6":59,"./chrome-wrapper.es6":39,"./load.es6":48,"./settings.es6":52}],37:[function(require,module,exports){
'use strict';

/*
 * Copyright (C) 2012, 2016 DuckDuckGo, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// NOTE: this needs to be the first thing that's require()d when the extension loads.
// otherwise FF might miss the onInstalled event
var events = require('./chrome-events.es6');
var settings = require('./settings.es6');

settings.ready().then(function () {
  // clearing last search on browser startup
  settings.updateSetting('last_search', '');

  var os = 'o';
  if (window.navigator.userAgent.indexOf('Windows') !== -1) os = 'w';
  if (window.navigator.userAgent.indexOf('Mac') !== -1) os = 'm';
  if (window.navigator.userAgent.indexOf('Linux') !== -1) os = 'l';

  localStorage['os'] = os;

  events.onStartup();
});

},{"./chrome-events.es6":38,"./settings.es6":52}],38:[function(require,module,exports){
'use strict';

/**
 * NOTE: this needs to be the first listener that's added
 *
 * on FF, we might actually miss the onInstalled event
 * if we do too much before adding it
 */
var ATB = require('./atb.es6');
var utils = require('./utils.es6');

chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason.match(/install/)) {
        ATB.updateATBValues().then(ATB.openPostInstallPage);
    }
});

/**
 * REQUESTS
 */

var redirect = require('./redirect.es6');
var tabManager = require('./tab-manager.es6');
var pixel = require('./pixel.es6');
var https = require('./https.es6');
var constants = require('../../data/constants');
var requestListenerTypes = utils.getUpdatedRequestListenerTypes();

// Shallow copy of request types
// And add beacon type based on browser, so we can block it
chrome.webRequest.onBeforeRequest.addListener(redirect.handleRequest, {
    urls: ['<all_urls>'],
    types: requestListenerTypes
}, ['blocking']);

chrome.webRequest.onHeadersReceived.addListener(function (request) {
    if (request.type === 'main_frame') {
        tabManager.updateTabUrl(request);
    }

    if (/^https?:\/\/(.*?\.)?duckduckgo.com\/\?/.test(request.url)) {
        // returns a promise
        return ATB.updateSetAtb(request);
    }
}, {
    urls: ['<all_urls>']
});

// keep track of URLs that the browser navigates to.
//
// this is currently meant to supplement tabManager.updateTabUrl() above:
// tabManager.updateTabUrl only fires when a tab has finished loading with a 200,
// which misses a couple of edge cases like browser special pages
// and Gmail's weird redirect which returns a 200 via a service worker
chrome.webNavigation.onCommitted.addListener(function (details) {
    // ignore navigation on iframes
    if (details.frameId !== 0) return;

    var tab = tabManager.get({ tabId: details.tabId });

    if (!tab) return;

    tab.updateSite(details.url);
});

/**
 * TABS
 */

var Companies = require('./companies.es6');

chrome.tabs.onUpdated.addListener(function (id, info) {
    // sync company data to storage when a tab finishes loading
    if (info.status === 'complete') {
        Companies.syncToStorage();
    }

    tabManager.createOrUpdateTab(id, info);
});

chrome.tabs.onRemoved.addListener(function (id, info) {
    // remove the tab object
    tabManager.delete(id);
});

// message popup to close when the active tab changes
chrome.tabs.onActivated.addListener(function () {
    return chrome.runtime.sendMessage({ closePopup: true });
});

// search via omnibox

chrome.omnibox.onInputEntered.addListener(function (text) {
    chrome.tabs.query({
        'currentWindow': true,
        'active': true
    }, function (tabs) {
        chrome.tabs.update(tabs[0].id, {
            url: 'https://duckduckgo.com/?q=' + encodeURIComponent(text) + '&bext=' + localStorage['os'] + 'cl'
        });
    });
});

/**
 * MESSAGES
 */

var settings = require('./settings.es6');
var browserWrapper = require('./chrome-wrapper.es6');

// handle any messages that come from content/UI scripts
// returning `true` makes it possible to send back an async response
chrome.runtime.onMessage.addListener(function (req, sender, res) {
    if (sender.id !== chrome.runtime.id) return;

    if (req.getCurrentTab) {
        utils.getCurrentTab().then(function (tab) {
            res(tab);
        });

        return true;
    }

    if (req.updateSetting) {
        var name = req.updateSetting['name'];
        var value = req.updateSetting['value'];
        settings.ready().then(function () {
            settings.updateSetting(name, value);
        });
    } else if (req.getSetting) {
        var _name = req.getSetting['name'];
        settings.ready().then(function () {
            res(settings.getSetting(_name));
        });

        return true;
    }

    // popup will ask for the browser type then it is created
    if (req.getBrowser) {
        res(utils.getBrowserName());
        return true;
    }

    if (req.getExtensionVersion) {
        res(browserWrapper.getExtensionVersion());
        return true;
    }

    if (req.getTopBlocked) {
        res(Companies.getTopBlocked(req.getTopBlocked));
        return true;
    } else if (req.getTopBlockedByPages) {
        res(Companies.getTopBlockedByPages(req.getTopBlockedByPages));
        return true;
    } else if (req.resetTrackersData) {
        Companies.resetData();
    }

    if (req.whitelisted) {
        tabManager.whitelistDomain(req.whitelisted);
    } else if (req.getTab) {
        res(tabManager.get({ 'tabId': req.getTab }));
        return true;
    } else if (req.getSiteGrade) {
        var tab = tabManager.get({ tabId: req.getSiteGrade });
        var grade = {};

        if (!tab.site.specialDomainName) {
            grade = tab.site.grade.get();
        }

        res(grade);
        return true;
    }

    if (req.firePixel) {
        var fireArgs = req.firePixel;
        if (fireArgs.constructor !== Array) {
            fireArgs = [req.firePixel];
        }
        res(pixel.fire.apply(null, fireArgs));
        return true;
    }
});

/**
 * ALARMS
 */

var abpLists = require('./abp-lists.es6');
var httpsStorage = require('./storage/https.es6');

// recheck tracker and https lists every 12 hrs
chrome.alarms.create('updateHTTPSLists', { periodInMinutes: 12 * 60 });
// tracker lists / whitelists are 30 minutes
chrome.alarms.create('updateLists', { periodInMinutes: 30 });
// update uninstall URL every 10 minutes
chrome.alarms.create('updateUninstallURL', { periodInMinutes: 10 });

chrome.alarms.onAlarm.addListener(function (alarmEvent) {
    if (alarmEvent.name === 'updateHTTPSLists') {
        settings.ready().then(function () {
            httpsStorage.getLists(constants.httpsLists).then(function (lists) {
                return https.setLists(lists);
            }).catch(function (e) {
                return console.log(e);
            });
        });
    } else if (alarmEvent.name === 'updateUninstallURL') {
        chrome.runtime.setUninstallURL(ATB.getSurveyURL());
    } else if (alarmEvent.name === 'updateLists') {
        settings.ready().then(function () {
            abpLists.updateLists();
            https.sendHttpsUpgradeTotals();
        });
    }
});

/**
 * on start up
 */
var onStartup = function onStartup() {
    chrome.tabs.query({ currentWindow: true, status: 'complete' }, function (savedTabs) {
        for (var i = 0; i < savedTabs.length; i++) {
            var tab = savedTabs[i];

            if (tab.url) {
                tabManager.create(tab);
            }
        }
    });

    settings.ready().then(function () {
        httpsStorage.getLists(constants.httpsLists).then(function (lists) {
            return https.setLists(lists);
        }).catch(function (e) {
            return console.log(e);
        });

        https.sendHttpsUpgradeTotals();

        Companies.buildFromStorage();
    });
};

// Fire pixel on https upgrade failures to allow bad data to be removed from lists
chrome.webRequest.onErrorOccurred.addListener(function (e) {
    if (!(e.type === 'main_frame')) return;

    var tab = tabManager.get({ tabId: e.tabId });

    // We're only looking at failed main_frame upgrades. A tab can send multiple
    // main_frame request errors so we will only look at the first one then set tab.hasHttpsError.
    if (!tab || !tab.mainFrameUpgraded || tab.hasHttpsError) {
        return;
    }

    if (e.error && e.url.match(/^https/)) {
        var errCode = constants.httpsErrorCodes[e.error];
        tab.hasHttpsError = true;

        if (errCode) {
            https.incrementUpgradeCount('failedUpgrades');
            var url = new URL(e.url);
            pixel.fire('ehd', {
                'url': '' + encodeURIComponent(url.hostname),
                'error': errCode
            });
        }
    }
}, { urls: ['<all_urls>'] });

module.exports = {
    onStartup: onStartup
};

},{"../../data/constants":30,"./abp-lists.es6":35,"./atb.es6":36,"./chrome-wrapper.es6":39,"./companies.es6":46,"./https.es6":47,"./pixel.es6":49,"./redirect.es6":51,"./settings.es6":52,"./storage/https.es6":53,"./tab-manager.es6":55,"./utils.es6":58}],39:[function(require,module,exports){
'use strict';

var getExtensionURL = function getExtensionURL(path) {
    return chrome.extension.getURL(path);
};

var getExtensionVersion = function getExtensionVersion() {
    var manifest = window.chrome && chrome.runtime.getManifest();
    return manifest.version;
};

var setBadgeIcon = function setBadgeIcon(badgeData) {
    chrome.browserAction.setIcon(badgeData);
};

var syncToStorage = function syncToStorage(data) {
    chrome.storage.local.set(data, function () {});
};

var getFromStorage = function getFromStorage(key, cb) {
    chrome.storage.local.get(key, function (result) {
        cb(result[key]);
    });
};

var getExtensionId = function getExtensionId() {
    return chrome.runtime.id;
};

var notifyPopup = function notifyPopup(message) {
    chrome.runtime.sendMessage(message);
};

var normalizeTabData = function normalizeTabData(tabData) {
    return tabData;
};

var mergeSavedSettings = function mergeSavedSettings(settings, results) {
    return Object.assign(settings, results);
};

var getDDGTabUrls = function getDDGTabUrls() {
    return new Promise(function (resolve) {
        chrome.tabs.query({ url: 'https://*.duckduckgo.com/*' }, function (tabs) {
            tabs = tabs || [];

            tabs.forEach(function (tab) {
                chrome.tabs.insertCSS(tab.id, {
                    file: '/public/css/noatb.css'
                });
            });

            resolve(tabs.map(function (tab) {
                return tab.url;
            }));
        });
    });
};

var setUninstallURL = function setUninstallURL(url) {
    chrome.runtime.setUninstallURL(url);
};

module.exports = {
    getExtensionURL: getExtensionURL,
    getExtensionVersion: getExtensionVersion,
    setBadgeIcon: setBadgeIcon,
    syncToStorage: syncToStorage,
    getFromStorage: getFromStorage,
    notifyPopup: notifyPopup,
    normalizeTabData: normalizeTabData,
    mergeSavedSettings: mergeSavedSettings,
    getDDGTabUrls: getDDGTabUrls,
    setUninstallURL: setUninstallURL,
    getExtensionId: getExtensionId
};

},{}],40:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Company = function () {
    function Company(name) {
        _classCallCheck(this, Company);

        this.name = name;
        this.count = 0;
        this.pagesSeenOn = 0;
    }

    _createClass(Company, [{
        key: "incrementCount",
        value: function incrementCount() {
            this.count += 1;
        }
    }, {
        key: "incrementPagesSeenOn",
        value: function incrementPagesSeenOn() {
            this.pagesSeenOn += 1;
        }
    }, {
        key: "get",
        value: function get(property) {
            return this[property];
        }
    }, {
        key: "set",
        value: function set(property, val) {
            this[property] = val;
        }
    }]);

    return Company;
}();

module.exports = Company;

},{}],41:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var utils = require('../utils.es6');
var pixel = require('../pixel.es6');
var constants = require('../../../data/constants');

var MAINFRAME_RESET_MS = 3000;
var REQUEST_REDIRECT_LIMIT = 7;

/**
 * This class protects users from accidentally being sent into a redirect loop
 * if a site we've included into our HTTPS list redirects them back to HTTP.
 *
 * Every redirect we perform on a tab gets registered against an instance of this class.
 * If we hit too many redirects for a request, we block it via canRedirect().
 */

var HttpsRedirects = function () {
    function HttpsRedirects() {
        _classCallCheck(this, HttpsRedirects);

        this.failedUpgradeHosts = {};
        this.redirectCounts = {};

        this.mainFrameRedirect = null;
        this.clearMainFrameTimeout = null;
    }

    _createClass(HttpsRedirects, [{
        key: 'registerRedirect',
        value: function registerRedirect(request) {
            if (request.type === 'main_frame') {
                if (this.mainFrameRedirect && request.url === this.mainFrameRedirect.url) {
                    this.mainFrameRedirect.count += 1;
                    return;
                }

                this.mainFrameRedirect = {
                    url: request.url,
                    time: Date.now(),
                    count: 0
                };

                clearTimeout(this.clearMainFrameTimeout);
                this.clearMainFrameTimeout = setTimeout(this.resetMainFrameRedirect, MAINFRAME_RESET_MS);
            } else {
                this.redirectCounts[request.requestId] = this.redirectCounts[request.requestId] || 0;
                this.redirectCounts[request.requestId] += 1;
            }
        }
    }, {
        key: 'canRedirect',
        value: function canRedirect(request) {
            var canRedirect = true;

            var hostname = utils.extractHostFromURL(request.url, true);

            // this hostname previously failed, don't try to upgrade it
            if (this.failedUpgradeHosts[hostname]) {
                console.log('HTTPS: not upgrading ' + request.url + ', hostname previously failed: ' + hostname);
                return false;
            }

            /**
             * Redirect loop detection is different when the request is for the main frame vs
             * any other request on the page.
             *
             * For main frames, the redirect loop could happen as part of several distinct hits to the same URL
             * (e.g. we saw a case where a site returned 200 and the redirected to HTTP via Javascript)
             *
             * To prevent this, we count main frame hits against the same URL within a short period of time,
             * and if they hit a certain threshold, we block any further attempts to upgrade this URL.
             *
             * We need to keep this threshold high, otherwise users can accidentally trigger redirect protection
             * by trying to open the same URL repeatedly before it's loaded.
             */
            if (request.type === 'main_frame') {
                if (this.mainFrameRedirect && this.mainFrameRedirect.url === request.url) {
                    var timeSinceFirstHit = Date.now() - this.mainFrameRedirect.time;

                    if (timeSinceFirstHit < MAINFRAME_RESET_MS && this.mainFrameRedirect.count >= REQUEST_REDIRECT_LIMIT) {
                        canRedirect = false;
                    }
                }
            } else if (this.redirectCounts[request.requestId]) {
                /**
                 * For other requests, the server would likely just do a 301 redirect
                 * to the HTTP version - so we can use the requestId as an identifier
                 */
                canRedirect = this.redirectCounts[request.requestId] < REQUEST_REDIRECT_LIMIT;
            }

            // remember this hostname as previously failed, don't try to upgrade it
            if (!canRedirect) {
                if (request.type === 'main_frame') {
                    var encodedHostname = encodeURIComponent(hostname);
                    var errCode = constants.httpsErrorCodes['downgrade_redirect_loop'];
                    // Fire pixel on https upgrade failures to allow bad data to be removed from lists
                    pixel.fire('ehd', { 'url': encodedHostname, error: errCode });
                }

                this.failedUpgradeHosts[hostname] = true;
                console.log('HTTPS: not upgrading, redirect loop protection kicked in for url: ' + request.url);
            }

            return canRedirect;
        }

        /**
         * We regenerate tab objects every time a new main_frame request is made.
         *
         * persistMainFrameRedirect() is used whenever a tab object is regenerated,
         * so we can maintain redirect loop protection across multiple main_frame requests
         */

    }, {
        key: 'persistMainFrameRedirect',
        value: function persistMainFrameRedirect(redirectData) {
            if (!redirectData) {
                return;
            }

            // shallow copy to prevent pass-by-reference issues
            this.mainFrameRedirect = Object.assign({}, redirectData);

            // setup reset timeout again
            this.clearMainFrameTimeout = setTimeout(this.resetMainFrameRedirect, MAINFRAME_RESET_MS);
        }
    }, {
        key: 'getMainFrameRedirect',
        value: function getMainFrameRedirect() {
            return this.mainFrameRedirect;
        }
    }, {
        key: 'resetMainFrameRedirect',
        value: function resetMainFrameRedirect() {
            clearTimeout(this.clearMainFrameTimeout);
            this.mainFrameRedirect = null;
        }
    }]);

    return HttpsRedirects;
}();

module.exports = HttpsRedirects;

},{"../../../data/constants":30,"../pixel.es6":49,"../utils.es6":58}],42:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Each Site creates its own Grade instance. The attributes
 * of the Grade are updated as we process new events e.g. trackers
 * blocked or https status.
 *
 * The Grade attributes are then used generate a site
 * privacy grade used in the popup.
 */
var settings = require('../settings.es6');
var utils = require('../utils.es6');
var abpLists = require('../abp-lists.es6');
var privacyPractices = require('../privacy-practices.es6');
var Grade = require('@duckduckgo/privacy-grade').Grade;
var trackerPrevalence = require('../../../data/tracker_lists/prevalence');
var browserWrapper = require('../chrome-wrapper.es6');
var tldjs = require('tldjs');

var Site = function () {
    function Site(url) {
        _classCallCheck(this, Site);

        this.url = url || '';

        var domain = utils.extractHostFromURL(this.url) || '';
        domain = domain.toLowerCase();

        this.domain = domain;
        this.trackerUrls = [];
        this.grade = new Grade();
        this.whitelisted = false; // user-whitelisted sites; applies to all privacy features
        this.setWhitelistStatusFromGlobal(domain);
        this.isBroken = this.checkBrokenSites(domain); // broken sites reported to github repo
        this.didIncrementCompaniesData = false;

        this.tosdr = privacyPractices.getTosdr(domain);

        this.parentEntity = utils.findParent(domain) || '';
        this.parentPrevalence = trackerPrevalence[this.parentEntity] || 0;

        if (this.parentEntity && this.parentPrevalence) {
            this.grade.setParentEntity(this.parentEntity, this.parentPrevalence);
        }

        this.grade.setPrivacyScore(privacyPractices.getTosdrScore(domain));

        if (this.url.match(/^https:\/\//)) {
            this.grade.setHttps(true, true);
        }

        // set specialDomainName when the site is created
        this.specialDomainName = this.getSpecialDomain();
    }

    /*
     * check to see if this is a broken site reported on github
    */


    _createClass(Site, [{
        key: 'checkBrokenSites',
        value: function checkBrokenSites(domain) {
            var trackersWhitelistTemporary = abpLists.getTemporaryWhitelist();

            if (!trackersWhitelistTemporary) return;

            var parsedDomain = tldjs.parse(domain);
            var hostname = parsedDomain.hostname || domain;

            // If root domain in temp whitelist, return true
            return trackersWhitelistTemporary.some(function (brokenSiteDomain) {
                return hostname.match(new RegExp(brokenSiteDomain + '$'));
            });
        }

        /*
         * When site objects are created we check the stored whitelists
         * and set the new site whitelist statuses
         */

    }, {
        key: 'setWhitelistStatusFromGlobal',
        value: function setWhitelistStatusFromGlobal() {
            var _this = this;

            var globalwhitelists = ['whitelisted'];
            globalwhitelists.map(function (name) {
                var list = settings.getSetting(name) || {};
                _this.setWhitelisted(name, list[_this.domain]);
            });
        }
    }, {
        key: 'setWhitelisted',
        value: function setWhitelisted(name, value) {
            this[name] = value;
        }

        /*
         * Send message to the popup to rerender the whitelist
         */

    }, {
        key: 'notifyWhitelistChanged',
        value: function notifyWhitelistChanged() {
            chrome.runtime.sendMessage({ 'whitelistChanged': true });
        }
    }, {
        key: 'isWhiteListed',
        value: function isWhiteListed() {
            return this.whitelisted;
        }
    }, {
        key: 'addTracker',
        value: function addTracker(tracker) {
            if (this.trackerUrls.indexOf(tracker.url) === -1) {
                this.trackerUrls.push(tracker.url);

                if (tracker.block) {
                    this.grade.addEntityBlocked(tracker.parentCompany, tracker.prevalence);
                } else {
                    this.grade.addEntityNotBlocked(tracker.parentCompany, tracker.prevalence);
                }
            }
        }

        /*
         * specialDomain
         *
         * determine if domain is a special page
         *
         * returns: a useable special page description string.
         *          or null if not a special page.
         */

    }, {
        key: 'getSpecialDomain',
        value: function getSpecialDomain() {
            var extensionId = browserWrapper.getExtensionId();
            var url = this.url;
            var localhostName = 'localhost';
            var domain = this.domain;

            if (url === '') {
                return 'new tab';
            }

            // Both 'localhost' and the loopback ip have to be specified
            // since they're treated as different domains
            if (domain === localhostName || domain.match(/^127\.0\.0\.1/)) {
                return localhostName;
            }

            // Handle non-routable meta-address
            if (domain.match(/^0\.0\.0\.0/)) {
                return domain;
            }

            // for some reason chrome passes this back from webNavigation events
            // for new tabs instead of chrome://newtab
            //
            // "local-ntp" -> "local new tab page"
            if (url.match(/^chrome-search:\/\/local-ntp/)) {
                return 'new tab';
            }

            // for special pages with a protocol, just return whatever
            // word comes after the protocol
            // e.g. 'chrome://extensions' -> 'extensions'
            if (url.match(/^chrome:\/\//) || url.match(/^vivaldi:\/\//)) {
                if (domain === 'newtab') {
                    domain = 'new tab';
                }

                return domain;
            }

            // FF-style about: pages don't get their domains parsed properly
            // so just extract the bit after about:
            if (url.match(/^about:/)) {
                domain = url.match(/^about:([a-z-]+)/)[1];
                return domain;
            }

            // extension pages
            if (url.match(/^(chrome|moz)-extension:\/\//)) {
                // this is our own extension, let's try and get a meaningful description
                if (domain === extensionId) {
                    var matches = url.match(/^(?:chrome|moz)-extension:\/\/[^/]+\/html\/([a-z-]+).html/);

                    if (matches && matches[1]) {
                        return matches[1];
                    }
                }

                // if we failed, or this is not our extension, return a generic message
                return 'extension page';
            }

            return null;
        }
    }]);

    return Site;
}();

module.exports = Site;

},{"../../../data/tracker_lists/prevalence":34,"../abp-lists.es6":35,"../chrome-wrapper.es6":39,"../privacy-practices.es6":50,"../settings.es6":52,"../utils.es6":58,"@duckduckgo/privacy-grade":1,"tldjs":18}],43:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* This class contains information about what trackers and sites
 * are on a given tab:
 *  id: Chrome tab id
 *  url: url of the tab
 *  site: ref to a Site object
 *  trackers: {object} all trackers requested on page/tab (listed by company)
 *  trackersBlocked: {object} tracker instances we blocked on page/tab (listed by company)
 *      both `trackers` and `trackersBlocked` objects are in this format:
 *      {
 *         '<companyName>': {
 *              parentCompany: ref to a Company object
 *              urls: all unique tracker urls we have seen for this company
 *              count: total number of requests to unique tracker urls for this company
 *          }
 *      }
 */
var gradeIconLocations = {
    'A': 'img/toolbar-rating-a@2x.png',
    'B+': 'img/toolbar-rating-b-plus@2x.png',
    'B': 'img/toolbar-rating-b@2x.png',
    'C+': 'img/toolbar-rating-c-plus@2x.png',
    'C': 'img/toolbar-rating-c@2x.png',
    'D': 'img/toolbar-rating-d@2x.png',
    // we don't currently show the D- grade
    'D-': 'img/toolbar-rating-d@2x.png',
    'F': 'img/toolbar-rating-f@2x.png'
};

var Site = require('./site.es6');
var Tracker = require('./tracker.es6');
var HttpsRedirects = require('./https-redirects.es6');
var Companies = require('../companies.es6');
var browserWrapper = require('./../chrome-wrapper.es6');

var Tab = function () {
    function Tab(tabData) {
        _classCallCheck(this, Tab);

        this.id = tabData.id || tabData.tabId;
        this.trackers = {};
        this.trackersBlocked = {};
        this.url = tabData.url;
        this.upgradedHttps = false;
        this.hasHttpsError = false;
        this.mainFrameUpgraded = false;
        this.requestId = tabData.requestId;
        this.status = tabData.status;
        this.site = new Site(this.url);
        this.httpsRedirects = new HttpsRedirects();
        this.statusCode = null; // statusCode is set when headers are recieved in tabManager.js
        this.stopwatch = {
            begin: Date.now(),
            end: null,
            completeMs: null
        };
        this.resetBadgeIcon();
    }

    _createClass(Tab, [{
        key: 'resetBadgeIcon',
        value: function resetBadgeIcon() {
            // set the new tab icon to the dax logo
            browserWrapper.setBadgeIcon({ path: 'img/icon_48.png', tabId: this.id });
        }
    }, {
        key: 'updateBadgeIcon',
        value: function updateBadgeIcon(target) {
            if (this.site.specialDomainName) return;

            if (this.site.isBroken) {
                this.resetBadgeIcon();
            } else {
                var gradeIcon = void 0;
                var grade = this.site.grade.get();

                if (this.site.whitelisted) {
                    gradeIcon = gradeIconLocations[grade.site.grade];
                } else {
                    gradeIcon = gradeIconLocations[grade.enhanced.grade];
                }

                var badgeData = { path: gradeIcon, tabId: this.id };
                if (target) badgeData.target = target;

                browserWrapper.setBadgeIcon(badgeData);
            }
        }
    }, {
        key: 'updateSite',
        value: function updateSite(url) {
            if (this.site.url === url) return;

            this.url = url;
            this.site = new Site(url);

            // reset badge to dax whenever we go to a new site
            this.resetBadgeIcon();
        }
    }, {
        key: 'addToTrackers',


        // Store all trackers for a given tab even if we don't block them.
        value: function addToTrackers(t) {
            var tracker = this.trackers[t.parentCompany];
            if (tracker) {
                tracker.increment();
                tracker.update(t);
            } else {
                var newTracker = new Tracker(t);
                this.trackers[t.parentCompany] = newTracker;

                // first time we have seen this network tracker on the page
                if (t.parentCompany !== 'unknown') Companies.countCompanyOnPage(t.parentCompany);

                return newTracker;
            }
        }
    }, {
        key: 'addOrUpdateTrackersBlocked',
        value: function addOrUpdateTrackersBlocked(t) {
            var tracker = this.trackersBlocked[t.parentCompany];
            if (tracker) {
                tracker.increment();
                tracker.update(t);
            } else {
                var newTracker = new Tracker(t);
                this.trackersBlocked[t.parentCompany] = newTracker;
                return newTracker;
            }
        }
    }, {
        key: 'endStopwatch',
        value: function endStopwatch() {
            this.stopwatch.end = Date.now();
            this.stopwatch.completeMs = this.stopwatch.end - this.stopwatch.begin;
            console.log('tab.status: complete. site took ' + this.stopwatch.completeMs / 1000 + ' seconds to load.');
        }
    }]);

    return Tab;
}();

module.exports = Tab;

},{"../companies.es6":46,"./../chrome-wrapper.es6":39,"./https-redirects.es6":41,"./site.es6":42,"./tracker.es6":45}],44:[function(require,module,exports){
"use strict";

function TopBlocked() {
    this.data = [];
}

TopBlocked.prototype = {

    add: function add(element) {
        this.data.push(element);
    },

    getTop: function getTop(n, sortFunc) {
        this.sort(sortFunc);
        n = n || 10;
        return this.data.slice(0, n);
    },

    sort: function sort(sortFunc) {
        this.data.sort(sortFunc);
    },

    clear: function clear() {
        this.data = [];
    },

    setData: function setData(data) {
        this.data = data;
    }
};

module.exports = TopBlocked;

},{}],45:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Companies = require('../companies.es6');

var Tracker = function () {
    function Tracker(t) {
        _classCallCheck(this, Tracker);

        this.parentCompany = Companies.get(t.parentCompany);
        this.urls = {};
        this.urls[t.url] = { isBlocked: t.block, reason: t.reason };
        this.count = 1; // request count
        this.type = t.type || '';
    }

    _createClass(Tracker, [{
        key: 'increment',
        value: function increment() {
            this.count += 1;
        }

        /* A parent company may try
         * to track you through many different entities.
         * We store a list of all unique urls here.
         */

    }, {
        key: 'update',
        value: function update(t) {
            if (!this.urls[t.url]) {
                this.urls[t.url] = { isBlocked: t.block, reason: t.reason };
            }
        }
    }]);

    return Tracker;
}();

module.exports = Tracker;

},{"../companies.es6":46}],46:[function(require,module,exports){
'use strict';

var TopBlocked = require('./classes/top-blocked.es6');
var Company = require('./classes/company.es6');
var browserWrapper = require('./chrome-wrapper.es6');

var Companies = function () {
    var companyContainer = {};
    var topBlocked = new TopBlocked();
    var storageName = 'companyData';
    var totalPages = 0;
    var totalPagesWithTrackers = 0;
    var lastStatsResetDate = null;

    function sortByCount(a, b) {
        return companyContainer[b].count - companyContainer[a].count;
    }

    function sortByPages(a, b) {
        return companyContainer[b].pagesSeenOn - companyContainer[a].pagesSeenOn;
    }

    return {
        get: function get(name) {
            return companyContainer[name];
        },

        getTotalPages: function getTotalPages() {
            return totalPages;
        },

        add: function add(name) {
            if (!companyContainer[name]) {
                companyContainer[name] = new Company(name);
                topBlocked.add(name);
            }
            companyContainer[name].incrementCount();
            return companyContainer[name];
        },

        // This is used by tab.js to count only unique tracking networks on a tab
        countCompanyOnPage: function countCompanyOnPage(name) {
            if (!companyContainer[name]) {
                companyContainer[name] = new Company(name);
                topBlocked.add(name);
            }
            if (name !== 'unknown') companyContainer[name].incrementPagesSeenOn();
        },

        all: function all() {
            return Object.keys(companyContainer);
        },

        getTopBlocked: function getTopBlocked(n) {
            var topBlockedData = [];
            topBlocked.getTop(n, sortByCount).forEach(function (name) {
                var c = Companies.get(name);
                topBlockedData.push({ name: c.name, count: c.count });
            });

            return topBlockedData;
        },

        getTopBlockedByPages: function getTopBlockedByPages(n) {
            var topBlockedData = [];
            topBlocked.getTop(n, sortByPages).forEach(function (name) {
                var c = Companies.get(name);
                topBlockedData.push({
                    name: c.name,
                    percent: Math.min(100, Math.round(c.pagesSeenOn / totalPages * 100))
                });
            });

            return {
                topBlocked: topBlockedData,
                totalPages: totalPages,
                pctPagesWithTrackers: Math.min(100, Math.round(totalPagesWithTrackers / totalPages * 100)),
                lastStatsResetDate: lastStatsResetDate
            };
        },

        setTotalPagesFromStorage: function setTotalPagesFromStorage(n) {
            if (n) totalPages = n;
        },

        setTotalPagesWithTrackersFromStorage: function setTotalPagesWithTrackersFromStorage(n) {
            if (n) totalPagesWithTrackers = n;
        },

        resetData: function resetData() {
            companyContainer = {};
            topBlocked.clear();
            totalPages = 0;
            totalPagesWithTrackers = 0;
            lastStatsResetDate = Date.now();
            Companies.syncToStorage();
            var resetDate = Companies.getLastResetDate();
            browserWrapper.notifyPopup({ 'didResetTrackersData': resetDate });
        },

        getLastResetDate: function getLastResetDate() {
            return lastStatsResetDate;
        },

        incrementTotalPages: function incrementTotalPages() {
            totalPages += 1;
            Companies.syncToStorage();
        },

        incrementTotalPagesWithTrackers: function incrementTotalPagesWithTrackers() {
            totalPagesWithTrackers += 1;
            Companies.syncToStorage();
        },

        syncToStorage: function syncToStorage() {
            var toSync = {};
            toSync[storageName] = companyContainer;
            browserWrapper.syncToStorage(toSync);
            browserWrapper.syncToStorage({ 'totalPages': totalPages });
            browserWrapper.syncToStorage({ 'totalPagesWithTrackers': totalPagesWithTrackers });
            browserWrapper.syncToStorage({ 'lastStatsResetDate': lastStatsResetDate });
        },

        sanitizeData: function sanitizeData(storageData) {
            if (storageData && storageData.hasOwnProperty('twitter')) {
                delete storageData.twitter;
            }
            return storageData;
        },

        buildFromStorage: function buildFromStorage() {
            browserWrapper.getFromStorage(storageName, function (storageData) {
                // uncomment for testing
                // storageData.twitter = {count: 10, name: 'twitter', pagesSeenOn: 10}
                storageData = Companies.sanitizeData(storageData);
                for (var company in storageData) {
                    var newCompany = Companies.add(company);
                    newCompany.set('count', storageData[company].count || 0);
                    newCompany.set('pagesSeenOn', storageData[company].pagesSeenOn || 0);
                }
            });

            browserWrapper.getFromStorage('totalPages', function (n) {
                if (n) totalPages = n;
            });
            browserWrapper.getFromStorage('totalPagesWithTrackers', function (n) {
                if (n) totalPagesWithTrackers = n;
            });
            browserWrapper.getFromStorage('lastStatsResetDate', function (d) {
                if (d) {
                    lastStatsResetDate = d;
                } else {
                    // if 'lastStatsResetDate' not found, reset all data
                    // https://app.asana.com/0/0/460622849089890/f
                    Companies.resetData();
                }
            });
        }
    };
}();

module.exports = Companies;

},{"./chrome-wrapper.es6":39,"./classes/company.es6":40,"./classes/top-blocked.es6":44}],47:[function(require,module,exports){
(function (Buffer){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var settings = require('./settings.es6');
var utils = require('./utils.es6');
var BloomFilter = require('jsbloom').filter;
var pixel = require('./pixel.es6');

var HTTPS = function () {
    function HTTPS() {
        _classCallCheck(this, HTTPS);

        // Store multiple upgrades lists keyed by list name
        this.upgradeLists = new Map();
        // One whitelist arrray
        this.whitelist = [];
        this.isReady = false;
    }

    // Sets a list by type and name. This is data that
    // is gathered from HTTPSStorage.
    // 'upgrade list' is assumed to be a bloom filter
    // 'whitelist' is an array


    _createClass(HTTPS, [{
        key: 'setLists',
        value: function setLists(lists) {
            var _this = this;

            try {
                lists.map(function (list) {
                    if (!list.data) {
                        throw new Error('HTTPS: ' + list.name + ' missing data');
                    }

                    if (list.type === 'upgrade list') {
                        _this.upgradeLists.set(list.name, _this.createBloomFilter(list));
                    } else if (list.type === 'whitelist') {
                        _this.whitelist = list.data;
                    }
                });
                this.isReady = true;
                console.log('HTTPS: is ready');
            } catch (e) {
                // a failed setLists update will turn https off
                // validation of the data should happen before calling setLists
                this.isReady = false;
                console.log('HTTPS: setLists error, not ready');
                console.log(e);
            }
        }

        // create a new BloomFilter
        // filterData is assumed to be base64 encoded 8 bit typed array

    }, {
        key: 'createBloomFilter',
        value: function createBloomFilter(filterData) {
            var bloom = new BloomFilter(filterData.totalEntries, filterData.errorRate);
            var buffer = Buffer.from(filterData.data, 'base64');
            bloom.importData(buffer);
            return bloom;
        }
    }, {
        key: 'canUpgradeHost',
        value: function canUpgradeHost(host) {
            if (!this.isReady) {
                // console.warn('HTTPS: not ready')
                return false;
            }

            if (this.whitelist.includes(host)) {
                return false;
            }

            return Array.from(this.upgradeLists.values()).some(function (list) {
                return list.checkEntry(host);
            });
        }
    }, {
        key: 'getUpgradedUrl',
        value: function getUpgradedUrl(reqUrl, tab, isMainFrame) {
            if (!this.isReady) {
                console.warn('HTTPS: not ready');
                return reqUrl;
            }

            // Only deal with http calls
            var protocol = utils.getProtocol(reqUrl).toLowerCase();
            if (protocol !== 'http:') {
                return reqUrl;
            }

            // Obey global settings (options page)
            if (!settings.getSetting('httpsEverywhereEnabled')) {
                return reqUrl;
            }

            // Skip upgrading sites that have been whitelisted by user
            // via on/off toggle in popup
            if (tab.site.whitelisted) {
                console.log('HTTPS: ' + tab.site.domain + ' was whitelisted by user. skip upgrade check.');
                return reqUrl;
            }

            // Determine host without stripping 'www',
            var host = utils.extractHostFromURL(reqUrl, true) || '';

            if (host && this.canUpgradeHost(host)) {
                if (isMainFrame) {
                    tab.mainFrameUpgraded = true;
                    this.incrementUpgradeCount('totalUpgrades');
                }

                return reqUrl.replace(/^(http|https):\/\//i, 'https://');
            }

            // If it falls to here, default to reqUrl
            return reqUrl;
        }

        // Send https upgrade and failure totals

    }, {
        key: 'sendHttpsUpgradeTotals',
        value: function sendHttpsUpgradeTotals() {
            var upgrades = settings.getSetting('totalUpgrades');
            var failed = settings.getSetting('failedUpgrades');

            // only send if we have data
            if (upgrades || failed) {
                // clear the counts
                settings.updateSetting('totalUpgrades', 0);
                settings.updateSetting('failedUpgrades', 0);
                pixel.fire('ehs', { 'total': upgrades, 'failures': failed });
            }
        }

        // Increment upgrade or failed upgrade settings

    }, {
        key: 'incrementUpgradeCount',
        value: function incrementUpgradeCount(setting) {
            var value = parseInt(settings.getSetting(setting)) || 0;
            value += 1;
            settings.updateSetting(setting, value);
        }
    }]);

    return HTTPS;
}();

module.exports = new HTTPS();

}).call(this,require("buffer").Buffer)
},{"./pixel.es6":49,"./settings.es6":52,"./utils.es6":58,"buffer":7,"jsbloom":11}],48:[function(require,module,exports){
'use strict';

var browserWrapper = require('./chrome-wrapper.es6');

var dev = false;

function JSONfromLocalFile(path) {
    return loadExtensionFile({ url: path, returnType: 'json' });
}

function JSONfromExternalFile(url) {
    return loadExtensionFile({ url: url, returnType: 'json', source: 'external' });
}

function url(url) {
    return loadExtensionFile({ url: url, source: 'external' });
}

function returnResponse(xhr, returnType) {
    if (returnType === 'json' && xhr && xhr.responseText) {
        var res = void 0;

        try {
            res = JSON.parse(xhr.responseText);
        } catch (e) {
            console.warn('couldn\'t parse JSON response: ' + xhr.responseText);
        }

        return res;
    } else if (returnType === 'xml') {
        return xhr.responseXML;
    } else {
        return xhr.responseText;
    }
}

/*
 * Params:
 *  - url: request URL
 *  - source: requests are internal by default. set source to 'external' for non-extension URLs
 *  - etag: set an if-none-match header
 */
function loadExtensionFile(params) {
    var xhr = new XMLHttpRequest();
    var url = params.url;

    if (params.source === 'external') {
        if (dev) {
            if (url.indexOf('?') > -1) {
                url += '&';
            } else {
                url += '?';
            }

            url += 'test=1';
        }

        xhr.open('GET', url);

        if (params.etag) {
            xhr.setRequestHeader('If-None-Match', params.etag);
        }
    } else {
        // set type xhr type tag. Safari internal xhr requests
        // don't set a 200 status so we'll check this type
        xhr.type = 'internal';
        xhr.open('GET', browserWrapper.getExtensionURL(url));
    }

    xhr.timeout = params.timeout || 30000;

    xhr.send(null);

    return new Promise(function (resolve, reject) {
        xhr.ontimeout = function () {
            reject(new Error(url + ' timed out'));
        };
        xhr.onreadystatechange = function () {
            var done = XMLHttpRequest.DONE ? XMLHttpRequest.DONE : 4;
            if (xhr.readyState === done) {
                if (xhr.status === 200 || xhr.type && xhr.type === 'internal') {
                    xhr.data = returnResponse(xhr, params.returnType);
                    if (!xhr.data) reject(new Error(url + ' returned no data'));
                    resolve(xhr);
                } else if (xhr.status === 304) {
                    console.log(url + ' returned 304, resource not changed');
                    resolve(xhr);
                } else {
                    reject(new Error(url + ' returned ' + xhr.status));
                }
            }
        };
    });
}

function setDevMode() {
    dev = true;
}

module.exports = {
    loadExtensionFile: loadExtensionFile,
    JSONfromLocalFile: JSONfromLocalFile,
    JSONfromExternalFile: JSONfromExternalFile,
    url: url,
    setDevMode: setDevMode
};

},{"./chrome-wrapper.es6":39}],49:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 *
 * This is part of our tool for anonymous engagement metrics
 * Learn more at https://duck.co/help/privacy/atb
 *
 */

var load = require('./load.es6');
var browserWrapper = require('./chrome-wrapper.es6');
var settings = require('./settings.es6');
var parseUserAgentString = require('../shared-utils/parse-user-agent-string.es6');

/**
 *
 * Fire a pixel
 *
 * @param {string} pixelName
 * @param {...*} args - any number of extra data
 *
 */
function fire() {
    if (!arguments.length) return;

    var args = Array.prototype.slice.call(arguments);
    var pixelName = args[0];

    if (typeof pixelName !== 'string') return;

    var url = getURL(pixelName);

    if (!url) return;

    args = args.slice(1);
    args = args.concat(getAdditionalParams());
    var paramString = concatParams(args);

    // Send the request
    load.url(url + paramString);
}

/**
 *
 * Return URL for the pixel request
 *
 */
function getURL(pixelName) {
    if (!pixelName) return;

    var url = 'https://improving.duckduckgo.com/t/';
    return url + pixelName;
}

/**
 *
 * Return additional params for the pixel request
 *
 */
function getAdditionalParams() {
    var browserInfo = parseUserAgentString();
    var browser = browserInfo.browser;
    var extensionVersion = browserWrapper.getExtensionVersion();
    var atb = settings.getSetting('atb');
    var queryStringParams = {};
    var result = [];

    if (browser) result.push(browser.toLowerCase());
    if (extensionVersion) queryStringParams.extensionVersion = extensionVersion;
    if (atb) queryStringParams.atb = atb;

    result.push(queryStringParams);

    return result;
}

/**
 *
 * @param {array} args - data we need to append
 *
 */
function concatParams(args) {
    args = args || [];

    var paramString = '';
    var objParamString = '';
    var resultString = '';
    var randomNum = Math.ceil(Math.random() * 1e7);

    args.forEach(function (arg) {
        // append keys if object
        if ((typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object') {
            objParamString += Object.keys(arg).reduce(function (params, key) {
                var val = arg[key];
                if (val || val === 0) return params + '&' + key + '=' + val;
            }, '');
        } else if (arg) {
            // otherwise just add args separated by _
            paramString += '_' + arg;
        }
    });

    resultString = paramString + '?' + randomNum + objParamString;

    return resultString;
}

module.exports = {
    fire: fire,
    getURL: getURL,
    concatParams: concatParams
};

},{"../shared-utils/parse-user-agent-string.es6":59,"./chrome-wrapper.es6":39,"./load.es6":48,"./settings.es6":52}],50:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var tldjs = require('tldjs');
var tosdr = require('../../data/tosdr');
var constants = require('../../data/constants');
var utils = require('./utils.es6');

var tosdrRegexList = [];
var tosdrScores = {};

var PrivacyPractices = function () {
    function PrivacyPractices() {
        _classCallCheck(this, PrivacyPractices);

        Object.keys(tosdr).forEach(function (site) {
            // only match domains, and from the start of the URL
            tosdrRegexList.push(new RegExp('(^)' + tldjs.getDomain(site)));

            // generate scores for the privacy grade
            var tosdrClass = tosdr[site].class;
            var tosdrScore = tosdr[site].score;

            if (tosdrClass || tosdrScore) {
                var score = 5;

                // asign a score value to the classes/scores provided in the JSON file
                if (tosdrClass === 'A') {
                    score = 0;
                } else if (tosdrClass === 'B') {
                    score = 1;
                } else if (tosdrClass === 'D' || tosdrScore > 150) {
                    score = 10;
                } else if (tosdrClass === 'C' || tosdrScore > 100) {
                    score = 7;
                }

                tosdrScores[site] = score;

                // if the site has a parent entity, propagate the score to that, too
                // but only if the score is higher
                //
                // basically, a parent entity's privacy score is as bad as
                // that of the worst site it owns
                var parentEntity = utils.findParent(site);

                if (parentEntity && (!tosdrScores[parentEntity] || tosdrScores[parentEntity] < score)) {
                    tosdrScores[parentEntity] = score;
                }
            }
        });
    }

    _createClass(PrivacyPractices, [{
        key: 'getTosdr',
        value: function getTosdr(url) {
            var domain = tldjs.getDomain(url);
            var tosdrData = void 0;

            tosdrRegexList.some(function (tosdrSite) {
                var match = tosdrSite.exec(domain);

                if (!match) return;

                tosdrData = tosdr[match[0]];

                return tosdrData;
            });

            if (!tosdrData) return {};

            var matchGood = tosdrData.match && tosdrData.match.good || [];
            var matchBad = tosdrData.match && tosdrData.match.bad || [];

            // tosdr message
            // 1. If we have a defined tosdr class look up the message in constants
            //    for the corresponding letter class
            // 2. If there are both good and bad points -> 'mixed'
            // 3. Else use the calculated tosdr score to determine the message
            var message = constants.tosdrMessages.unknown;
            if (tosdrData.class) {
                message = constants.tosdrMessages[tosdrData.class];
            } else if (matchGood.length && matchBad.length) {
                message = constants.tosdrMessages.mixed;
            } else {
                if (tosdrData.score < 0) {
                    message = constants.tosdrMessages.good;
                } else if (tosdrData.score === 0 && (matchGood.length || matchBad.length)) {
                    message = constants.tosdrMessages.mixed;
                } else if (tosdrData.score > 0) {
                    message = constants.tosdrMessages.bad;
                }
            }

            return {
                score: tosdrData.score,
                class: tosdrData.class,
                reasons: {
                    good: matchGood,
                    bad: matchBad
                },
                message: message
            };
        }
    }, {
        key: 'getTosdrScore',
        value: function getTosdrScore(hostname) {
            var domain = tldjs.getDomain(hostname);
            var parent = utils.findParent(hostname);

            // grab the first available val
            // starting with most general first

            // minor potential for an edge case:
            // foo.bar.com and bar.com have entries in tosdr.json
            // and different scores - should they propagate
            // the same way parent entity ones do?
            var score = [tosdrScores[parent], tosdrScores[domain], tosdrScores[hostname]].find(function (s) {
                return typeof s === 'number';
            });

            return score;
        }
    }]);

    return PrivacyPractices;
}();

module.exports = new PrivacyPractices();

},{"../../data/constants":30,"../../data/tosdr":32,"./utils.es6":58,"tldjs":18}],51:[function(require,module,exports){
'use strict';

var trackers = require('./trackers.es6');
var utils = require('./utils.es6');
var https = require('./https.es6');
var Companies = require('./companies.es6');
var tabManager = require('./tab-manager.es6');
var ATB = require('./atb.es6');
var browserWrapper = require('./chrome-wrapper.es6');

var debugRequest = false;
utils.loadLists();

/**
 * Where most of the extension work happens.
 *
 * For each request made:
 * - Add ATB param
 * - Block tracker requests
 * - Upgrade http -> https where possible
 */

function handleRequest(requestData) {
    var tabId = requestData.tabId;
    // Skip requests to background tabs
    if (tabId === -1) {
        return;
    }

    var thisTab = tabManager.get(requestData);

    // For main_frame requests: create a new tab instance whenever we either
    // don't have a tab instance for this tabId or this is a new requestId.
    //
    // Safari doesn't have specific requests for main frames
    if (requestData.type === 'main_frame' && window.chrome) {
        if (!thisTab || thisTab.requestId !== requestData.requestId) {
            var newTab = tabManager.create(requestData);

            // andrey: temporary disable this. it was letting redirect loops through on Tumblr
            // persist the last URL the tab was trying to upgrade to HTTPS
            // if (thisTab && thisTab.httpsRedirects) {
            //     newTab.httpsRedirects.persistMainFrameRedirect(thisTab.httpsRedirects.getMainFrameRedirect())
            // }
            thisTab = newTab;
        }

        // add atb params only to main_frame
        var ddgAtbRewrite = ATB.redirectURL(requestData);
        if (ddgAtbRewrite) return ddgAtbRewrite;
    } else {
        /**
         * Check that we have a valid tab
         * there is a chance this tab was closed before
         * we got the webrequest event
         */
        if (!(thisTab && thisTab.url && thisTab.id)) return;

        /**
         * skip any broken sites
         */
        if (thisTab.site.isBroken) {
            console.log('temporarily skip tracker blocking for site: ' + utils.extractHostFromURL(thisTab.url) + '\n' + 'more info: https://github.com/duckduckgo/content-blocking-whitelist');
            return;
        }

        /**
         * Tracker blocking
         * If request is a tracker, cancel the request
         */
        if (window.chrome) {
            chrome.runtime.sendMessage({ 'updateTabData': true });
        }

        var tracker = trackers.isTracker(requestData.url, thisTab, requestData);

        // count and block trackers. Skip things that matched in the trackersWhitelist unless they're first party
        if (tracker && !(tracker.type === 'trackersWhitelist' && tracker.reason !== 'first party')) {
            // only count trackers on pages with 200 response. Trackers on these sites are still
            // blocked below but not counted toward company stats
            if (window.safari || thisTab.statusCode === 200) {
                // record all tracker urls on a site even if we don't block them
                thisTab.site.addTracker(tracker);

                // record potential blocked trackers for this tab
                thisTab.addToTrackers(tracker);
            }

            browserWrapper.notifyPopup({ 'updateTabData': true });

            // Block the request if the site is not whitelisted
            if (!thisTab.site.whitelisted && tracker.block) {
                thisTab.addOrUpdateTrackersBlocked(tracker);

                // update badge icon for any requests that come in after
                // the tab has finished loading
                if (thisTab.status === 'complete') thisTab.updateBadgeIcon();

                if (tracker.parentCompany !== 'unknown' && thisTab.statusCode === 200) {
                    Companies.add(tracker.parentCompany);
                }

                // for debugging specific requests. see test/tests/debugSite.js
                if (debugRequest && debugRequest.length) {
                    if (debugRequest.includes(tracker.url)) {
                        console.log('UNBLOCKED: ', tracker.url);
                        return;
                    }
                }

                if (!window.safari) {
                    // Initiate hiding of blocked ad DOM elements
                    trackers.tryElementHide(requestData, thisTab);
                }

                console.info('blocked ' + utils.extractHostFromURL(thisTab.url) + ' [' + tracker.parentCompany + '] ' + requestData.url);

                // return surrogate redirect if match, otherwise
                // tell Chrome to cancel this webrequest
                if (tracker.redirectUrl) {
                    // safari gets return data in message
                    requestData.message = { redirectUrl: tracker.redirectUrl };
                    return { redirectUrl: tracker.redirectUrl };
                } else {
                    requestData.message = { cancel: true };
                    return { cancel: true };
                }
            }
        }
    }

    /**
     * HTTPS Everywhere rules
     * If an upgrade rule is found, request is upgraded from http to https
     */

    if (!thisTab.site || !window.chrome) return;

    // Skip https upgrade on broken sites
    if (thisTab.site.isBroken) {
        console.log('temporarily skip https upgrades for site: ' + utils.extractHostFromURL(thisTab.url) + '\n' + 'more info: https://github.com/duckduckgo/content-blocking-whitelist');
        return;
    }

    // Is this request from the tab's main frame?
    var isMainFrame = requestData.type === 'main_frame';

    // Fetch upgrade rule from https module:
    var url = https.getUpgradedUrl(requestData.url, thisTab, isMainFrame);
    if (url.toLowerCase() !== requestData.url.toLowerCase() && thisTab.httpsRedirects.canRedirect(requestData)) {
        console.log('HTTPS: upgrade request url to ' + url);
        thisTab.httpsRedirects.registerRedirect(requestData);

        if (isMainFrame) {
            thisTab.upgradedHttps = true;
        }
        if (utils.getUpgradeToSecureSupport()) {
            return { upgradeToSecure: true };
        } else {
            return { redirectUrl: url };
        }
    } else if (isMainFrame) {
        thisTab.upgradedHttps = false;
    }
}

exports.handleRequest = handleRequest;

},{"./atb.es6":36,"./chrome-wrapper.es6":39,"./companies.es6":46,"./https.es6":47,"./tab-manager.es6":55,"./trackers.es6":57,"./utils.es6":58}],52:[function(require,module,exports){
'use strict';

var defaultSettings = require('../../data/defaultSettings');
var browserWrapper = require('./chrome-wrapper.es6');

/**
 * Public api
 * Usage:
 * You can use promise callbacks to check readyness before getting and updating
 * settings.ready().then(() => settings.updateSetting('settingName', settingValue))
 */
var settings = {};
var isReady = false;
var _ready = init().then(function () {
    isReady = true;
    console.log('Settings are loaded');
});

function init() {
    return new Promise(function (resolve, reject) {
        buildSettingsFromDefaults();
        buildSettingsFromLocalStorage().then(function () {
            resolve();
        });
    });
}

function ready() {
    return _ready;
}

function buildSettingsFromLocalStorage() {
    return new Promise(function (resolve) {
        browserWrapper.getFromStorage(['settings'], function (results) {
            // copy over saved settings from storage
            if (!results) resolve();
            settings = browserWrapper.mergeSavedSettings(settings, results);
            resolve();
        });
    });
}

function buildSettingsFromDefaults() {
    // initial settings are a copy of default settings
    settings = Object.assign({}, defaultSettings);
}

function syncSettingTolocalStorage() {
    browserWrapper.syncToStorage({ 'settings': settings });
}

function getSetting(name) {
    if (!isReady) {
        console.warn('Settings: getSetting() Settings not loaded: ' + name);
        return;
    }

    // let all and null return all settings
    if (name === 'all') name = null;

    if (name) {
        return settings[name];
    } else {
        return settings;
    }
}

function updateSetting(name, value) {
    if (!isReady) {
        console.warn('Settings: updateSetting() Setting not loaded: ' + name);
        return;
    }

    settings[name] = value;
    syncSettingTolocalStorage();
}

function removeSetting(name) {
    if (!isReady) {
        console.warn('Settings: removeSetting() Setting not loaded: ' + name);
        return;
    }
    if (settings[name]) {
        delete settings[name];
        syncSettingTolocalStorage();
    }
}

function logSettings() {
    browserWrapper.getFromStorage(['settings'], function (s) {
        console.log(s.settings);
    });
}

module.exports = {
    getSetting: getSetting,
    updateSetting: updateSetting,
    removeSetting: removeSetting,
    logSettings: logSettings,
    ready: ready
};

},{"../../data/defaultSettings":31,"./chrome-wrapper.es6":39}],53:[function(require,module,exports){
(function (Buffer){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var load = require('./../load.es6');
var Dexie = require('dexie');
var constants = require('../../../data/constants');
var settings = require('./../settings.es6');

var HTTPSStorage = function () {
    function HTTPSStorage() {
        _classCallCheck(this, HTTPSStorage);

        this.dbc = new Dexie(constants.httpsDBName);
        this.dbc.version(1).stores({
            httpsStorage: 'name,type,data,checksum'
        });
    }

    // Load https data defined in constants.httpsLists.
    // We wait until all promises resolve to send datd to https.
    // This is all or nothing. We gather data for each of the lists
    // and validate. If any list fails validation then promise.all will
    // reject the whole update.


    _createClass(HTTPSStorage, [{
        key: 'getLists',
        value: function getLists() {
            var _this = this;

            return Promise.all(constants.httpsLists.map(function (list) {
                var listCopy = JSON.parse(JSON.stringify(list));
                var etag = settings.getSetting(listCopy.name + '-etag') || '';

                return _this.getDataXHR(listCopy.url, etag).then(function (response) {
                    // for 200 response we update etags
                    if (response && response.status === 200) {
                        var newEtag = response.getResponseHeader('etag') || '';
                        settings.updateSetting(listCopy.name + '-etag', newEtag);
                    }

                    // We try to process both 200 and 304 responses. 200s will validate
                    // and update the db. 304s will try to grab the previous data from db
                    // or throw an error if none exists.
                    return _this.processData(listCopy, response.data).then(function (resultData) {
                        if (resultData) {
                            return resultData;
                        } else {
                            throw new Error('HTTPS: process list xhr failed  ' + listCopy.name);
                        }
                    });
                }).catch(function (e) {
                    return _this.fallbackToDB(listCopy).then(function (backupFromDB) {
                        if (backupFromDB) {
                            return backupFromDB;
                        } else {
                            // reset etag to force us to get fresh server data in case of an error
                            settings.updateSetting(listCopy.name + '-etag', '');
                            throw new Error('HTTPS: data update for ' + listCopy.name + ' failed');
                        }
                    });
                });
            }));
        }

        // validate xhr data and lookup previous data from local db if needed
        // verify the checksum before returning the processData result

    }, {
        key: 'processData',
        value: function processData(listDetails, xhrData) {
            var _this2 = this;

            if (xhrData) {
                return this.hasCorrectChecksum(xhrData).then(function (isValid) {
                    if (isValid) {
                        _this2.storeInLocalDB(listDetails.name, listDetails.type, xhrData);
                        return Object.assign(listDetails, xhrData);
                    }
                });
            } else {
                return Promise.resolve();
            }
        }
    }, {
        key: 'fallbackToDB',
        value: function fallbackToDB(listDetails) {
            var _this3 = this;

            return this.getDataFromLocalDB(listDetails.name).then(function (storedData) {
                if (!storedData) return;

                return _this3.hasCorrectChecksum(storedData.data).then(function (isValid) {
                    if (isValid) {
                        if (storedData && storedData.data) {
                            return Object.assign(listDetails, storedData.data);
                        }
                    }
                });
            });
        }
    }, {
        key: 'getDataXHR',
        value: function getDataXHR(url, etag) {
            return load.loadExtensionFile({ url: url, etag: etag, returnType: 'json', source: 'external', timeout: 60000 });
        }
    }, {
        key: 'getDataFromLocalDB',
        value: function getDataFromLocalDB(name) {
            var _this4 = this;

            console.log('HTTPS: getting ' + name + ' from db');
            return this.dbc.open().then(function () {
                return _this4.dbc.table('httpsStorage').get({ name: name });
            });
        }
    }, {
        key: 'storeInLocalDB',
        value: function storeInLocalDB(name, type, data) {
            console.log('HTTPS: storing ' + name + ' in db');
            return this.dbc.httpsStorage.put({ name: name, type: type, data: data });
        }
    }, {
        key: 'hasCorrectChecksum',
        value: function hasCorrectChecksum(data) {
            // not everything has a checksum
            if (!data.checksum) return Promise.resolve(true);

            // need a buffer to send to crypto.subtle
            var buffer = Buffer.from(data.data, 'base64');

            return crypto.subtle.digest('SHA-256', buffer).then(function (arrayBuffer) {
                var sha256 = Buffer.from(arrayBuffer).toString('base64');
                if (data.checksum.sha256 && data.checksum.sha256 === sha256) {
                    return true;
                } else {
                    return false;
                }
            });
        }
    }]);

    return HTTPSStorage;
}();

module.exports = new HTTPSStorage();

}).call(this,require("buffer").Buffer)
},{"../../../data/constants":30,"./../load.es6":48,"./../settings.es6":52,"buffer":7,"dexie":9}],54:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/****
 *
 */

var surrogateList = {};

var Surrogates = function () {
    function Surrogates() {
        _classCallCheck(this, Surrogates);
    }

    _createClass(Surrogates, [{
        key: 'parse',

        /****
         * Takes a text response, in uBlock's resources.txt format:
         * https://github.com/uBlockOrigin/uAssets/blob/master/filters/resources.txt
         *
         * Parses it into surrogateList hash, with the rules as keys
         * and the base64 encoded surrogate content as the value.
         */
        value: function parse(text, res) {
            var b64dataheader = 'data:application/javascript;base64,';
            res = res || {};

            this.trackersSurrogateList = text.trim().split('\n\n');

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.trackersSurrogateList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var sur = _step.value;

                    // remove comment lines that begin with #
                    var lines = sur.split('\n').filter(function (line) {
                        return !/^#.*/.test(line);
                    });
                    // remove first line, store it
                    var firstLine = lines.shift();
                    // take identifier from first line
                    var pattern = firstLine.split(' ')[0];
                    var b64surrogate = btoa(lines.join('\n'));
                    res[pattern] = b64dataheader + b64surrogate;
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            surrogateList = res;
            return res;
        }
    }, {
        key: 'hasList',
        value: function hasList() {
            return Object.keys(surrogateList).length;
        }
    }, {
        key: 'getContentForRule',
        value: function getContentForRule(rule) {
            return surrogateList[rule];
        }

        /****
         * Takes a full url, along with a tldjs parsed url object, and the full
         * parsed list of rules, returning surrogate content if there is some available
         * for the given url.
         */

    }, {
        key: 'getContentForUrl',
        value: function getContentForUrl(url, parsedUrl) {
            // The rules we're loading in from ublock look like:
            // googletagservices.com/gpt.js
            //
            // Anything not specific in the rule is intended to be a wildcard, including the paths.
            //
            // So that rule can match things like:
            // https://wwww.googletagservices.com/js/gpt.js
            // or
            // http://en.www.googletagservices.com/some/other/random/path/gpt.js?v=123
            //
            // All our rules have domain + filename, so for now we're safe making that assumption.
            var splitUrl = url.split('/');
            // pull everything after the last slash as the filename:
            var filename = splitUrl[splitUrl.length - 1];
            // strip off any querystring params:
            filename = filename.split('?')[0];
            // concat with domain to match the original rule:
            var ruleToMatch = parsedUrl.domain + '/' + filename;
            return surrogateList[ruleToMatch];
        }
    }]);

    return Surrogates;
}();

module.exports = new Surrogates();

},{}],55:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Companies = require('./companies.es6');
var settings = require('./settings.es6');
var Tab = require('./classes/tab.es6');
var browserWrapper = require('./chrome-wrapper.es6');

var TabManager = function () {
    function TabManager() {
        _classCallCheck(this, TabManager);

        this.tabContainer = {};
    }

    _createClass(TabManager, [{
        key: 'create',


        /* This overwrites the current tab data for a given
         * id and is only called in three cases:
         * 1. When we rebuild saved tabs when the browser is restarted
         * 2. When a new tab is opened. See onUpdated listener below
         * 3. When we get a new main_frame request
         */
        value: function create(tabData) {
            var normalizedData = browserWrapper.normalizeTabData(tabData);
            var newTab = new Tab(normalizedData);
            this.tabContainer[newTab.id] = newTab;
            return newTab;
        }
    }, {
        key: 'delete',
        value: function _delete(id) {
            delete this.tabContainer[id];
        }
    }, {
        key: 'get',


        /* Called using either a chrome tab object or by id
         * get({tabId: ###});
         */
        value: function get(tabData) {
            return this.tabContainer[tabData.tabId];
        }
    }, {
        key: 'whitelistDomain',


        /* This will whitelist any open tabs with the same domain
         * list: name of the whitelist to update
         * domain: domain to whitelist
         * value: whitelist value, true or false
         */
        value: function whitelistDomain(data) {
            this.setGlobalWhitelist(data.list, data.domain, data.value);

            for (var tabId in this.tabContainer) {
                var tab = this.tabContainer[tabId];
                if (tab.site && tab.site.domain === data.domain) {
                    tab.site.setWhitelisted(data.list, data.value);
                }
            }

            browserWrapper.notifyPopup({ whitelistChanged: true });
        }

        /* Update the whitelists kept in settings
         */

    }, {
        key: 'setGlobalWhitelist',
        value: function setGlobalWhitelist(list, domain, value) {
            var globalwhitelist = settings.getSetting(list) || {};

            if (value) {
                globalwhitelist[domain] = true;
            } else {
                delete globalwhitelist[domain];
            }

            settings.updateSetting(list, globalwhitelist);
        }

        /* This handles the new tab case. You have clicked to
         * open a new tab and haven't typed in a url yet.
         * This will fire an onUpdated event and we can create
         * an intital tab instance here. We'll update this instance
         * later on when webrequests start coming in.
         */

    }, {
        key: 'createOrUpdateTab',
        value: function createOrUpdateTab(id, info) {
            if (!tabManager.get({ 'tabId': id })) {
                info.id = id;
                tabManager.create(info);
            } else {
                var tab = tabManager.get({ tabId: id });
                if (tab && info.status) {
                    tab.status = info.status;

                    /**
                     * Re: HTTPS. When the tab finishes loading:
                     * 1. check main_frame url (via tab.url) for http/s, update site grade
                     * 2. check for incomplete upgraded https upgrade requests, whitelist
                     * the entire site if there are any then notify tabManager
                     * NOTE: we aren't making a distinction between active and passive
                     * content when https content is mixed after a forced upgrade
                     */
                    if (tab.status === 'complete') {
                        var hasHttps = !!(tab.url && tab.url.match(/^https:\/\//));
                        tab.site.grade.setHttps(hasHttps, hasHttps);

                        console.info(tab.site.grade);
                        tab.updateBadgeIcon();

                        if (tab.statusCode === 200 && !tab.site.didIncrementCompaniesData) {
                            if (tab.trackers && Object.keys(tab.trackers).length > 0) {
                                Companies.incrementTotalPagesWithTrackers();
                            }

                            Companies.incrementTotalPages();
                            tab.site.didIncrementCompaniesData = true;
                        }

                        if (tab.statusCode === 200) tab.endStopwatch();
                    }
                }
            }
        }
    }, {
        key: 'updateTabUrl',
        value: function updateTabUrl(request) {
            // Update tab data. This makes
            // sure we have the correct url after any https rewrites
            var tab = tabManager.get({ tabId: request.tabId });

            if (tab) {
                tab.statusCode = request.statusCode;
                if (tab.statusCode === 200) {
                    tab.updateSite(request.url);
                }
            }
        }
    }]);

    return TabManager;
}();

var tabManager = new TabManager();

module.exports = tabManager;

},{"./chrome-wrapper.es6":39,"./classes/tab.es6":43,"./companies.es6":46,"./settings.es6":52}],56:[function(require,module,exports){
'use strict';

var load = require('./load.es6');
var constants = require('../../data/constants');
var lists = {};

function getLists() {
    return lists;
}

function loadLists() {
    var listLocation = constants.trackerListLoc;
    var blockLists = constants.blockLists;

    blockLists.forEach(function (listName) {
        load.JSONfromLocalFile(listLocation + '/' + listName).then(function (response) {
            var listJSON = response.data;

            Object.keys(listJSON).forEach(function (categoryName) {
                var category = listJSON[categoryName];

                Object.keys(category).forEach(function (trackerName) {
                    var tracker = category[trackerName];

                    // Look for regex rules and pre-compile to speed up the blocking algo later on
                    if (tracker.rules) {
                        for (var i in tracker.rules) {
                            // All of our rules are host anchored and have an implied wildcard at the end.
                            tracker.rules[i].rule = new RegExp(tracker.rules[i].rule + '.*', 'i');
                        }
                    }
                });
            });
            console.log('Loaded tracker list: ' + listLocation + '/' + listName);
            lists[listName.replace('.json', '')] = listJSON;
        });
    });
}

loadLists();

module.exports = {
    getLists: getLists
};

},{"../../data/constants":30,"./load.es6":48}],57:[function(require,module,exports){
'use strict';

var abp = require('abp-filter-parser');
var tldjs = require('tldjs');

var settings = require('./settings.es6');
var surrogates = require('./surrogates.es6');
var trackerLists = require('./tracker-lists.es6').getLists();
var abpLists = require('./abp-lists.es6');
var constants = require('../../data/constants');
var utils = require('./utils.es6');
var entityMap = require('../../data/tracker_lists/entityMap');
var prevalence = require('../../data/tracker_lists/prevalence');

/*
 * The main parts of the isTracker algo looks like this:
 * 1. check the request against our own whitelist
 * 2. check the request against the trackersWithParentCompany list
 * 3. check the request against the easylists
 *
 * If a tracker is found in steps #2,3 we check it against getCommonParentEntity
 * to determine if this tracker is owned by the current site's parent company.
 * In this case we don't block the request but still return the tracker obj
 * for transparency.
 */
function isTracker(urlToCheck, thisTab, request) {
    var currLocation = thisTab.url || '';
    var siteDomain = thisTab.site ? thisTab.site.domain : '';
    if (!siteDomain) return;

    // DEMO embedded tweet option
    // a more robust test for tweet code may need to be used besides just
    // blocking platform.twitter.com
    if (settings.getSetting('embeddedTweetsEnabled') === false) {
        if (/platform.twitter.com/.test(urlToCheck)) {
            console.log('blocking tweet embedded code on ' + urlToCheck);
            return { parentCompany: 'Twitter', url: 'platform.twitter.com', type: 'Analytics' };
        }
    }

    if (settings.getSetting('trackerBlockingEnabled')) {
        var parsedUrl = tldjs.parse(urlToCheck);
        var hostname = void 0;

        if (parsedUrl && parsedUrl.hostname) {
            hostname = parsedUrl.hostname;
        } else {
            // fail gracefully if tldjs chokes on the URL e.g. it doesn't parse
            // if the subdomain name has underscores in it
            try {
                // last ditch attempt to try and grab a hostname
                // this will fail on more complicated URLs with e.g. ports
                // but will allow us to block simple trackers with _ in the subdomains
                hostname = urlToCheck.match(/^(?:.*:\/\/)([^/]+)/)[1];
            } catch (e) {
                // give up
                return false;
            }
        }

        var urlSplit = hostname.split('.');

        var whitelistedTracker = checkWhitelist(urlToCheck, siteDomain, request);
        if (whitelistedTracker) {
            var commonParent = getCommonParentEntity(currLocation, urlToCheck);
            if (commonParent) {
                return addCommonParent(whitelistedTracker, commonParent);
            }
            return whitelistedTracker;
        }

        var surrogateTracker = checkSurrogateList(urlToCheck, parsedUrl, currLocation);
        if (surrogateTracker) {
            var _commonParent = getCommonParentEntity(currLocation, urlToCheck);
            if (_commonParent) {
                return addCommonParent(surrogateTracker, _commonParent);
            }
            return surrogateTracker;
        }

        // Look up trackers by parent company. This function also checks to see if the poential
        // tracker is related to the current site. If this is the case we consider it to be the
        // same as a first party requrest and return
        var trackerByParentCompany = checkTrackersWithParentCompany(urlSplit, siteDomain, request);
        if (trackerByParentCompany) {
            if (trackerByParentCompany.type === utils.getBeaconName()) {
                trackerByParentCompany.reason = 'beacon';
            }

            var _commonParent2 = getCommonParentEntity(currLocation, urlToCheck);
            if (_commonParent2) {
                return addCommonParent(trackerByParentCompany, _commonParent2);
            }
            return trackerByParentCompany;
        }
    }
    return false;
}

// add common parent info to the final tracker object returned by isTracker
function addCommonParent(trackerObj, parentName) {
    trackerObj.parentCompany = parentName;
    trackerObj.prevalence = prevalence[parentName] || 0;
    trackerObj.block = false;
    trackerObj.reason = 'first party';
    return trackerObj;
}

function checkWhitelist(url, currLocation, request) {
    var result = false;
    var match = void 0;
    var whitelists = abpLists.getWhitelists();

    if (whitelists.trackersWhitelist.isLoaded) {
        match = checkABPParsedList(whitelists.trackersWhitelist.parsed, url, currLocation, request);
    }

    if (match) {
        result = getTrackerDetails(url, 'trackersWhitelist');
        result.block = false;
        result.reason = 'whitelisted';
    }

    return result;
}

function checkSurrogateList(url, parsedUrl, currLocation) {
    var dataURI = surrogates.getContentForUrl(url, parsedUrl);
    var result = false;

    if (dataURI) {
        result = getTrackerDetails(url, 'surrogatesList');
        if (result && !utils.isRelatedEntity(result.parentCompany, currLocation)) {
            result.block = true;
            result.reason = 'surrogate';
            result.redirectUrl = dataURI;
            console.log('serving surrogate content for: ', url);
            return result;
        }
    }

    return false;
}

/* Check the matched rule  options against the request data
 * return: true (all options matched)
 */
function matchRuleOptions(rule, request, siteDomain) {
    if (!rule.options) return true;

    if (rule.options.types) {
        var matchesType = rule.options.types.findIndex(function (t) {
            return t === request.type;
        });
        if (matchesType === -1) {
            return false;
        }
    }

    if (rule.options.domains) {
        var matchesDomain = rule.options.domains.findIndex(function (d) {
            return d === siteDomain;
        });
        if (matchesDomain === -1) {
            return false;
        }
    }

    return true;
}

function checkTrackersWithParentCompany(url, siteDomain, request) {
    var toBlock = void 0;

    // base case
    if (url.length < 2) {
        return false;
    }

    var trackerURL = url.join('.');

    constants.blocking.some(function (trackerType) {
        // Some trackers are listed under just the host name of their parent company without
        // any subdomain. Ex: ssl.google-analytics.com would be listed under just google-analytics.com.
        // Other trackers are listed using their subdomains. Ex: developers.google.com.
        // We'll start by checking the full host with subdomains and then if no match is found
        // try pulling off the subdomain and checking again.
        if (!trackerLists.trackersWithParentCompany[trackerType]) return;
        var tracker = trackerLists.trackersWithParentCompany[trackerType][trackerURL];
        if (!tracker) return;

        var match = false;

        toBlock = {
            parentCompany: tracker.c,
            prevalence: prevalence[tracker.c] || 0,
            url: utils.extractHostFromURL(request.url),
            type: trackerType,
            block: true,
            rule: '',
            reason: 'trackersWithParentCompany'

            // Check to see if this request matches any of the blocking rules for this tracker
        };if (tracker.rules) {
            tracker.rules.some(function (ruleObj) {
                if (requestMatchesRule(request, ruleObj.rule) && matchRuleOptions(ruleObj, request, siteDomain)) {
                    toBlock.rule = ruleObj;
                    match = true;
                    // found a match so break loop early
                    return true;
                }
            });
        } else {
            // no filters so we always block this tracker
            match = true;
            return true;
        }

        // no match on any of the rules for this tracker
        // reset toBlock for the next iteration
        if (!match) {
            toBlock = null;
        } else {
            // we have a rule based match, return early
            return true;
        }
    });

    if (toBlock) {
        return toBlock;
    } else {
        // remove the subdomain and recheck for trackers. This is recursive, we'll continue
        // to pull off subdomains until we either find a match or have no url to check.
        // Ex: x.y.z.analytics.com would be checked 4 times pulling off a subdomain each time.
        url.shift();
        return checkTrackersWithParentCompany(url, siteDomain, request);
    }
}

function requestMatchesRule(request, rule) {
    return !!rule.exec(request.url);
}

/* Compare two urls to determine if they came from the same hostname
 * pull off any subdomains before comparison.
 * Return parent company name from entityMap if one is found or unknown
 * if domains match but we don't have this site in our entityMap.
 */
function getCommonParentEntity(currLocation, urlToCheck) {
    if (!entityMap) return;
    var currentLocationParsed = tldjs.parse(currLocation);
    var urlToCheckParsed = tldjs.parse(urlToCheck);
    var parentEntity = entityMap[urlToCheckParsed.domain];
    if (currentLocationParsed.domain === urlToCheckParsed.domain || utils.isRelatedEntity(parentEntity, currLocation)) {
        return parentEntity || currentLocationParsed.domain;
    }

    return false;
}

/* Fetch parent entity for a domain. If domain is not in
 * entityMap, return 'unknown'
 */
function getParentEntity(urlToCheck) {
    if (!entityMap) {
        return 'unknown';
    }
    var urlToCheckParsed = tldjs.parse(urlToCheck);
    var parentEntity = entityMap[urlToCheckParsed.domain];
    if (parentEntity) {
        return parentEntity;
    } else {
        return 'unknown';
    }
}

function getTrackerDetails(trackerUrl, listName) {
    var host = utils.extractHostFromURL(trackerUrl);
    var parentCompany = utils.findParent(host) || 'unknown';
    return {
        parentCompany: parentCompany,
        prevalence: prevalence[parentCompany] || 0,
        url: host,
        type: listName
    };
}

function checkABPParsedList(list, url, siteDomain, request) {
    var match = abp.matches(list, url, {
        domain: siteDomain,
        elementTypeMask: abp.elementTypes[request.type.toUpperCase()]
    });
    return match;
}

/*
 *  * If element hiding is enabled on current domain, send messages
 *   * to content scripts to start the process of hiding blocked ads
 *    */
function tryElementHide(requestData, tab) {
    if (tab.site.parentEntity === 'Oath') {
        var frameId = void 0,
            messageType = void 0;
        if (requestData.type === 'sub_frame') {
            frameId = requestData.parentFrameId;
            messageType = frameId === 0 ? 'blockedFrame' : 'blockedFrameAsset';
        } else if (requestData.frameId !== 0 && (requestData.type === 'image' || requestData.type === 'script')) {
            frameId = requestData.frameId;
            messageType = 'blockedFrameAsset';
        }
        chrome.tabs.sendMessage(requestData.tabId, { type: messageType, request: requestData, mainFrameUrl: tab.url }, { frameId: frameId });
    } else if (!tab.elementHidingDisabled) {
        chrome.tabs.sendMessage(requestData.tabId, { type: 'disable' });
        tab.elementHidingDisabled = true;
    }
}
module.exports = {
    isTracker: isTracker,
    getParentEntity: getParentEntity,
    tryElementHide: tryElementHide
};

},{"../../data/constants":30,"../../data/tracker_lists/entityMap":33,"../../data/tracker_lists/prevalence":34,"./abp-lists.es6":35,"./settings.es6":52,"./surrogates.es6":54,"./tracker-lists.es6":56,"./utils.es6":58,"abp-filter-parser":3,"tldjs":18}],58:[function(require,module,exports){
'use strict';

var tldjs = require('tldjs');
var entityMap = require('../../data/tracker_lists/entityMap');
var constants = require('../../data/constants');
var parseUserAgentString = require('../shared-utils/parse-user-agent-string.es6');
var browserInfo = parseUserAgentString();
var load = require('./load.es6');

var entityList = {};

function loadLists() {
    load.JSONfromExternalFile(constants.entityList).then(function (response) {
        entityList = response.data;
    });
}

/* Check to see if a company is related to a domain.
 * @param {string} entity - company name
 * @param {string} domain - domain or url
 */
function isRelatedEntity(entityName, domain) {
    var parentEntity = entityList[entityName];
    var host = extractHostFromURL(domain);

    if (parentEntity && parentEntity.properties) {
        // join parent entities to use as regex and store in parentEntity so we don't have to do this again
        if (!parentEntity.regexProperties) {
            var propertyList = parentEntity.properties;

            if (parentEntity.resources) {
                propertyList = propertyList.concat(parentEntity.resources);
            }

            parentEntity.regexProperties = new RegExp(propertyList.map(function (e) {
                // escape regex, add $ to match on end of domains
                return e.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&').replace(/$/, '$');
            }).join('|'));
        }

        if (parentEntity.regexProperties.test(host)) {
            return true;
        }
    }

    return false;
}

function extractHostFromURL(url, shouldKeepWWW) {
    if (!url) return '';

    var urlObj = tldjs.parse(url);
    var hostname = urlObj.hostname || '';

    if (!shouldKeepWWW) {
        hostname = hostname.replace(/^www\./, '');
    }

    return hostname;
}

function extractTopSubdomainFromHost(host) {
    if (typeof host !== 'string') return false;
    var rgx = /\./g;
    if (host.match(rgx) && host.match(rgx).length > 1) {
        return host.split('.')[0];
    }
    return false;
}

// pull off subdomains and look for parent companies
function findParent(url) {
    var parts = extractHostFromURL(url).split('.');

    while (parts.length > 1) {
        var joinURL = parts.join('.');

        if (entityMap[joinURL]) {
            return entityMap[joinURL];
        }
        parts.shift();
    }
}

function getProtocol(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.protocol;
}

function getCurrentURL(callback) {
    chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, function (tabData) {
        if (tabData.length) {
            callback(tabData[0].url);
        }
    });
}

function getCurrentTab(callback) {
    return new Promise(function (resolve, reject) {
        chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, function (tabData) {
            if (tabData.length) {
                resolve(tabData[0]);
            }
        });
    });
}

// Browser / Version detection
// Get correct name for fetching UI assets
function getBrowserName() {
    if (!browserInfo || !browserInfo.browser) return;

    var browser = browserInfo.browser.toLowerCase();
    if (browser === 'firefox') browser = 'moz';

    return browser;
}

// Determine if upgradeToSecure supported (Firefox 59+)
function getUpgradeToSecureSupport() {
    var canUpgrade = false;
    if (getBrowserName() !== 'moz') return canUpgrade;

    if (browserInfo && browserInfo.version >= 59) {
        canUpgrade = true;
    }

    return canUpgrade;
}

// Chrome errors with 'beacon', but supports 'ping'
// Firefox only blocks 'beacon' (even though it should support 'ping')
function getBeaconName() {
    var beaconNamesByBrowser = {
        'chrome': 'ping',
        'moz': 'beacon'
    };

    return beaconNamesByBrowser[getBrowserName()];
}

// Return requestListenerTypes + beacon or ping
function getUpdatedRequestListenerTypes() {
    var requestListenerTypes = constants.requestListenerTypes.slice();
    requestListenerTypes.push(getBeaconName());

    return requestListenerTypes;
}

module.exports = {
    extractHostFromURL: extractHostFromURL,
    extractTopSubdomainFromHost: extractTopSubdomainFromHost,
    getCurrentURL: getCurrentURL,
    getCurrentTab: getCurrentTab,
    getProtocol: getProtocol,
    getBrowserName: getBrowserName,
    getUpgradeToSecureSupport: getUpgradeToSecureSupport,
    findParent: findParent,
    getBeaconName: getBeaconName,
    getUpdatedRequestListenerTypes: getUpdatedRequestListenerTypes,
    isRelatedEntity: isRelatedEntity,
    loadLists: loadLists
};

},{"../../data/constants":30,"../../data/tracker_lists/entityMap":33,"../shared-utils/parse-user-agent-string.es6":59,"./load.es6":48,"tldjs":18}],59:[function(require,module,exports){
'use strict';

module.exports = function (uaString) {
    if (!uaString) uaString = window.navigator.userAgent;

    var browser = void 0;
    var version = void 0;

    try {
        var parsedUaParts = uaString.match(/(Firefox|Chrome|Safari)\/([0-9]+)/);
        browser = parsedUaParts[1];
        version = parsedUaParts[2];

        // in Safari, the bit immediately after Safari/ is the Webkit version
        // the *actual* version number is elsewhere
        if (browser === 'Safari') {
            version = uaString.match(/Version\/(\d+)/)[1];
        }
    } catch (e) {
        // unlikely, prevent extension from exploding if we don't recognize the UA
        browser = version = '';
    }

    return {
        browser: browser,
        version: version
    };
};

},{}]},{},[37]);

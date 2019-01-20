(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var document = require('global/document')
var hyperx = require('hyperx')
var onload = require('on-load')

var SVGNS = 'http://www.w3.org/2000/svg'
var XLINKNS = 'http://www.w3.org/1999/xlink'

var BOOL_PROPS = {
  autofocus: 1,
  checked: 1,
  defaultchecked: 1,
  disabled: 1,
  formnovalidate: 1,
  indeterminate: 1,
  readonly: 1,
  required: 1,
  selected: 1,
  willvalidate: 1
}
var COMMENT_TAG = '!--'
var SVG_TAGS = [
  'svg',
  'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor',
  'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile',
  'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix',
  'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting',
  'feDisplacementMap', 'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB',
  'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode',
  'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting',
  'feSpotLight', 'feTile', 'feTurbulence', 'filter', 'font', 'font-face',
  'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri',
  'foreignObject', 'g', 'glyph', 'glyphRef', 'hkern', 'image', 'line',
  'linearGradient', 'marker', 'mask', 'metadata', 'missing-glyph', 'mpath',
  'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect',
  'set', 'stop', 'switch', 'symbol', 'text', 'textPath', 'title', 'tref',
  'tspan', 'use', 'view', 'vkern'
]

function belCreateElement (tag, props, children) {
  var el

  // If an svg tag, it needs a namespace
  if (SVG_TAGS.indexOf(tag) !== -1) {
    props.namespace = SVGNS
  }

  // If we are using a namespace
  var ns = false
  if (props.namespace) {
    ns = props.namespace
    delete props.namespace
  }

  // Create the element
  if (ns) {
    el = document.createElementNS(ns, tag)
  } else if (tag === COMMENT_TAG) {
    return document.createComment(props.comment)
  } else {
    el = document.createElement(tag)
  }

  // If adding onload events
  if (props.onload || props.onunload) {
    var load = props.onload || function () {}
    var unload = props.onunload || function () {}
    onload(el, function belOnload () {
      load(el)
    }, function belOnunload () {
      unload(el)
    },
    // We have to use non-standard `caller` to find who invokes `belCreateElement`
    belCreateElement.caller.caller.caller)
    delete props.onload
    delete props.onunload
  }

  // Create the properties
  for (var p in props) {
    if (props.hasOwnProperty(p)) {
      var key = p.toLowerCase()
      var val = props[p]
      // Normalize className
      if (key === 'classname') {
        key = 'class'
        p = 'class'
      }
      // The for attribute gets transformed to htmlFor, but we just set as for
      if (p === 'htmlFor') {
        p = 'for'
      }
      // If a property is boolean, set itself to the key
      if (BOOL_PROPS[key]) {
        if (val === 'true') val = key
        else if (val === 'false') continue
      }
      // If a property prefers being set directly vs setAttribute
      if (key.slice(0, 2) === 'on') {
        el[p] = val
      } else {
        if (ns) {
          if (p === 'xlink:href') {
            el.setAttributeNS(XLINKNS, p, val)
          } else if (/^xmlns($|:)/i.test(p)) {
            // skip xmlns definitions
          } else {
            el.setAttributeNS(null, p, val)
          }
        } else {
          el.setAttribute(p, val)
        }
      }
    }
  }

  function appendChild (childs) {
    if (!Array.isArray(childs)) return
    for (var i = 0; i < childs.length; i++) {
      var node = childs[i]
      if (Array.isArray(node)) {
        appendChild(node)
        continue
      }

      if (typeof node === 'number' ||
        typeof node === 'boolean' ||
        typeof node === 'function' ||
        node instanceof Date ||
        node instanceof RegExp) {
        node = node.toString()
      }

      if (typeof node === 'string') {
        if (el.lastChild && el.lastChild.nodeName === '#text') {
          el.lastChild.nodeValue += node
          continue
        }
        node = document.createTextNode(node)
      }

      if (node && node.nodeType) {
        el.appendChild(node)
      }
    }
  }
  appendChild(children)

  return el
}

module.exports = hyperx(belCreateElement, {comments: true})
module.exports.default = module.exports
module.exports.createElement = belCreateElement

},{"global/document":7,"hyperx":11,"on-load":21}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
var upperCase = require('upper-case')
var noCase = require('no-case')

/**
 * Camel case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale, mergeNumbers) {
  var result = noCase(value, locale)

  // Replace periods between numeric entities with an underscore.
  if (!mergeNumbers) {
    result = result.replace(/ (?=\d)/g, '_')
  }

  // Replace spaces between words with an upper cased character.
  return result.replace(/ (.)/g, function (m, $1) {
    return upperCase($1, locale)
  })
}

},{"no-case":17,"upper-case":30}],4:[function(require,module,exports){
exports.no = exports.noCase = require('no-case')
exports.dot = exports.dotCase = require('dot-case')
exports.swap = exports.swapCase = require('swap-case')
exports.path = exports.pathCase = require('path-case')
exports.upper = exports.upperCase = require('upper-case')
exports.lower = exports.lowerCase = require('lower-case')
exports.camel = exports.camelCase = require('camel-case')
exports.snake = exports.snakeCase = require('snake-case')
exports.title = exports.titleCase = require('title-case')
exports.param = exports.paramCase = require('param-case')
exports.header = exports.headerCase = require('header-case')
exports.pascal = exports.pascalCase = require('pascal-case')
exports.constant = exports.constantCase = require('constant-case')
exports.sentence = exports.sentenceCase = require('sentence-case')
exports.isUpper = exports.isUpperCase = require('is-upper-case')
exports.isLower = exports.isLowerCase = require('is-lower-case')
exports.ucFirst = exports.upperCaseFirst = require('upper-case-first')
exports.lcFirst = exports.lowerCaseFirst = require('lower-case-first')

},{"camel-case":3,"constant-case":5,"dot-case":6,"header-case":9,"is-lower-case":12,"is-upper-case":13,"lower-case":15,"lower-case-first":14,"no-case":17,"param-case":22,"pascal-case":23,"path-case":24,"sentence-case":25,"snake-case":26,"swap-case":27,"title-case":28,"upper-case":30,"upper-case-first":29}],5:[function(require,module,exports){
var upperCase = require('upper-case')
var snakeCase = require('snake-case')

/**
 * Constant case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale) {
  return upperCase(snakeCase(value, locale), locale)
}

},{"snake-case":26,"upper-case":30}],6:[function(require,module,exports){
var noCase = require('no-case')

/**
 * Dot case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale) {
  return noCase(value, locale, '.')
}

},{"no-case":17}],7:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

var doccy;

if (typeof document !== 'undefined') {
    doccy = document;
} else {
    doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }
}

module.exports = doccy;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":2}],8:[function(require,module,exports){
(function (global){
var win;

if (typeof window !== "undefined") {
    win = window;
} else if (typeof global !== "undefined") {
    win = global;
} else if (typeof self !== "undefined"){
    win = self;
} else {
    win = {};
}

module.exports = win;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],9:[function(require,module,exports){
var noCase = require('no-case')
var upperCase = require('upper-case')

/**
 * Header case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale) {
  return noCase(value, locale, '-').replace(/^.|-./g, function (m) {
    return upperCase(m, locale)
  })
}

},{"no-case":17,"upper-case":30}],10:[function(require,module,exports){
module.exports = attributeToProperty

var transform = {
  'class': 'className',
  'for': 'htmlFor',
  'http-equiv': 'httpEquiv'
}

function attributeToProperty (h) {
  return function (tagName, attrs, children) {
    for (var attr in attrs) {
      if (attr in transform) {
        attrs[transform[attr]] = attrs[attr]
        delete attrs[attr]
      }
    }
    return h(tagName, attrs, children)
  }
}

},{}],11:[function(require,module,exports){
var attrToProp = require('hyperscript-attribute-to-property')

var VAR = 0, TEXT = 1, OPEN = 2, CLOSE = 3, ATTR = 4
var ATTR_KEY = 5, ATTR_KEY_W = 6
var ATTR_VALUE_W = 7, ATTR_VALUE = 8
var ATTR_VALUE_SQ = 9, ATTR_VALUE_DQ = 10
var ATTR_EQ = 11, ATTR_BREAK = 12
var COMMENT = 13

module.exports = function (h, opts) {
  if (!opts) opts = {}
  var concat = opts.concat || function (a, b) {
    return String(a) + String(b)
  }
  if (opts.attrToProp !== false) {
    h = attrToProp(h)
  }

  return function (strings) {
    var state = TEXT, reg = ''
    var arglen = arguments.length
    var parts = []

    for (var i = 0; i < strings.length; i++) {
      if (i < arglen - 1) {
        var arg = arguments[i+1]
        var p = parse(strings[i])
        var xstate = state
        if (xstate === ATTR_VALUE_DQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_SQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_W) xstate = ATTR_VALUE
        if (xstate === ATTR) xstate = ATTR_KEY
        if (xstate === OPEN) {
          if (reg === '/') {
            p.push([ OPEN, '/', arg ])
            reg = ''
          } else {
            p.push([ OPEN, arg ])
          }
        } else {
          p.push([ VAR, xstate, arg ])
        }
        parts.push.apply(parts, p)
      } else parts.push.apply(parts, parse(strings[i]))
    }

    var tree = [null,{},[]]
    var stack = [[tree,-1]]
    for (var i = 0; i < parts.length; i++) {
      var cur = stack[stack.length-1][0]
      var p = parts[i], s = p[0]
      if (s === OPEN && /^\//.test(p[1])) {
        var ix = stack[stack.length-1][1]
        if (stack.length > 1) {
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === OPEN) {
        var c = [p[1],{},[]]
        cur[2].push(c)
        stack.push([c,cur[2].length-1])
      } else if (s === ATTR_KEY || (s === VAR && p[1] === ATTR_KEY)) {
        var key = ''
        var copyKey
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_KEY) {
            key = concat(key, parts[i][1])
          } else if (parts[i][0] === VAR && parts[i][1] === ATTR_KEY) {
            if (typeof parts[i][2] === 'object' && !key) {
              for (copyKey in parts[i][2]) {
                if (parts[i][2].hasOwnProperty(copyKey) && !cur[1][copyKey]) {
                  cur[1][copyKey] = parts[i][2][copyKey]
                }
              }
            } else {
              key = concat(key, parts[i][2])
            }
          } else break
        }
        if (parts[i][0] === ATTR_EQ) i++
        var j = i
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_VALUE || parts[i][0] === ATTR_KEY) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][1])
            else parts[i][1]==="" || (cur[1][key] = concat(cur[1][key], parts[i][1]));
          } else if (parts[i][0] === VAR
          && (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][2])
            else parts[i][2]==="" || (cur[1][key] = concat(cur[1][key], parts[i][2]));
          } else {
            if (key.length && !cur[1][key] && i === j
            && (parts[i][0] === CLOSE || parts[i][0] === ATTR_BREAK)) {
              // https://html.spec.whatwg.org/multipage/infrastructure.html#boolean-attributes
              // empty string is falsy, not well behaved value in browser
              cur[1][key] = key.toLowerCase()
            }
            if (parts[i][0] === CLOSE) {
              i--
            }
            break
          }
        }
      } else if (s === ATTR_KEY) {
        cur[1][p[1]] = true
      } else if (s === VAR && p[1] === ATTR_KEY) {
        cur[1][p[2]] = true
      } else if (s === CLOSE) {
        if (selfClosing(cur[0]) && stack.length) {
          var ix = stack[stack.length-1][1]
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === VAR && p[1] === TEXT) {
        if (p[2] === undefined || p[2] === null) p[2] = ''
        else if (!p[2]) p[2] = concat('', p[2])
        if (Array.isArray(p[2][0])) {
          cur[2].push.apply(cur[2], p[2])
        } else {
          cur[2].push(p[2])
        }
      } else if (s === TEXT) {
        cur[2].push(p[1])
      } else if (s === ATTR_EQ || s === ATTR_BREAK) {
        // no-op
      } else {
        throw new Error('unhandled: ' + s)
      }
    }

    if (tree[2].length > 1 && /^\s*$/.test(tree[2][0])) {
      tree[2].shift()
    }

    if (tree[2].length > 2
    || (tree[2].length === 2 && /\S/.test(tree[2][1]))) {
      throw new Error(
        'multiple root elements must be wrapped in an enclosing tag'
      )
    }
    if (Array.isArray(tree[2][0]) && typeof tree[2][0][0] === 'string'
    && Array.isArray(tree[2][0][2])) {
      tree[2][0] = h(tree[2][0][0], tree[2][0][1], tree[2][0][2])
    }
    return tree[2][0]

    function parse (str) {
      var res = []
      if (state === ATTR_VALUE_W) state = ATTR
      for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i)
        if (state === TEXT && c === '<') {
          if (reg.length) res.push([TEXT, reg])
          reg = ''
          state = OPEN
        } else if (c === '>' && !quot(state) && state !== COMMENT) {
          if (state === OPEN && reg.length) {
            res.push([OPEN,reg])
          } else if (state === ATTR_KEY) {
            res.push([ATTR_KEY,reg])
          } else if (state === ATTR_VALUE && reg.length) {
            res.push([ATTR_VALUE,reg])
          }
          res.push([CLOSE])
          reg = ''
          state = TEXT
        } else if (state === COMMENT && /-$/.test(reg) && c === '-') {
          if (opts.comments) {
            res.push([ATTR_VALUE,reg.substr(0, reg.length - 1)],[CLOSE])
          }
          reg = ''
          state = TEXT
        } else if (state === OPEN && /^!--$/.test(reg)) {
          if (opts.comments) {
            res.push([OPEN, reg],[ATTR_KEY,'comment'],[ATTR_EQ])
          }
          reg = c
          state = COMMENT
        } else if (state === TEXT || state === COMMENT) {
          reg += c
        } else if (state === OPEN && c === '/' && reg.length) {
          // no-op, self closing tag without a space <br/>
        } else if (state === OPEN && /\s/.test(c)) {
          if (reg.length) {
            res.push([OPEN, reg])
          }
          reg = ''
          state = ATTR
        } else if (state === OPEN) {
          reg += c
        } else if (state === ATTR && /[^\s"'=/]/.test(c)) {
          state = ATTR_KEY
          reg = c
        } else if (state === ATTR && /\s/.test(c)) {
          if (reg.length) res.push([ATTR_KEY,reg])
          res.push([ATTR_BREAK])
        } else if (state === ATTR_KEY && /\s/.test(c)) {
          res.push([ATTR_KEY,reg])
          reg = ''
          state = ATTR_KEY_W
        } else if (state === ATTR_KEY && c === '=') {
          res.push([ATTR_KEY,reg],[ATTR_EQ])
          reg = ''
          state = ATTR_VALUE_W
        } else if (state === ATTR_KEY) {
          reg += c
        } else if ((state === ATTR_KEY_W || state === ATTR) && c === '=') {
          res.push([ATTR_EQ])
          state = ATTR_VALUE_W
        } else if ((state === ATTR_KEY_W || state === ATTR) && !/\s/.test(c)) {
          res.push([ATTR_BREAK])
          if (/[\w-]/.test(c)) {
            reg += c
            state = ATTR_KEY
          } else state = ATTR
        } else if (state === ATTR_VALUE_W && c === '"') {
          state = ATTR_VALUE_DQ
        } else if (state === ATTR_VALUE_W && c === "'") {
          state = ATTR_VALUE_SQ
        } else if (state === ATTR_VALUE_DQ && c === '"') {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_SQ && c === "'") {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_W && !/\s/.test(c)) {
          state = ATTR_VALUE
          i--
        } else if (state === ATTR_VALUE && /\s/.test(c)) {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE || state === ATTR_VALUE_SQ
        || state === ATTR_VALUE_DQ) {
          reg += c
        }
      }
      if (state === TEXT && reg.length) {
        res.push([TEXT,reg])
        reg = ''
      } else if (state === ATTR_VALUE && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_DQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_SQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_KEY) {
        res.push([ATTR_KEY,reg])
        reg = ''
      }
      return res
    }
  }

  function strfn (x) {
    if (typeof x === 'function') return x
    else if (typeof x === 'string') return x
    else if (x && typeof x === 'object') return x
    else return concat('', x)
  }
}

function quot (state) {
  return state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ
}

var hasOwn = Object.prototype.hasOwnProperty
function has (obj, key) { return hasOwn.call(obj, key) }

var closeRE = RegExp('^(' + [
  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command', 'embed',
  'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param',
  'source', 'track', 'wbr', '!--',
  // SVG TAGS
  'animate', 'animateTransform', 'circle', 'cursor', 'desc', 'ellipse',
  'feBlend', 'feColorMatrix', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
  'feGaussianBlur', 'feImage', 'feMergeNode', 'feMorphology',
  'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
  'feTurbulence', 'font-face-format', 'font-face-name', 'font-face-uri',
  'glyph', 'glyphRef', 'hkern', 'image', 'line', 'missing-glyph', 'mpath',
  'path', 'polygon', 'polyline', 'rect', 'set', 'stop', 'tref', 'use', 'view',
  'vkern'
].join('|') + ')(?:[\.#][a-zA-Z0-9\u007F-\uFFFF_:-]+)*$')
function selfClosing (tag) { return closeRE.test(tag) }

},{"hyperscript-attribute-to-property":10}],12:[function(require,module,exports){
var lowerCase = require('lower-case')

/**
 * Check if a string is lower case.
 *
 * @param  {String}  string
 * @param  {String}  [locale]
 * @return {Boolean}
 */
module.exports = function (string, locale) {
  return lowerCase(string, locale) === string
}

},{"lower-case":15}],13:[function(require,module,exports){
var upperCase = require('upper-case')

/**
 * Check if a string is upper case.
 *
 * @param  {String}  string
 * @param  {String}  [locale]
 * @return {Boolean}
 */
module.exports = function (string, locale) {
  return upperCase(string, locale) === string
}

},{"upper-case":30}],14:[function(require,module,exports){
var lowerCase = require('lower-case')

/**
 * Lower case the first character of a string.
 *
 * @param  {String} str
 * @return {String}
 */
module.exports = function (str, locale) {
  if (str == null) {
    return ''
  }

  str = String(str)

  return lowerCase(str.charAt(0), locale) + str.substr(1)
}

},{"lower-case":15}],15:[function(require,module,exports){
/**
 * Special language-specific overrides.
 *
 * Source: ftp://ftp.unicode.org/Public/UCD/latest/ucd/SpecialCasing.txt
 *
 * @type {Object}
 */
var LANGUAGES = {
  tr: {
    regexp: /\u0130|\u0049|\u0049\u0307/g,
    map: {
      '\u0130': '\u0069',
      '\u0049': '\u0131',
      '\u0049\u0307': '\u0069'
    }
  },
  az: {
    regexp: /[\u0130]/g,
    map: {
      '\u0130': '\u0069',
      '\u0049': '\u0131',
      '\u0049\u0307': '\u0069'
    }
  },
  lt: {
    regexp: /[\u0049\u004A\u012E\u00CC\u00CD\u0128]/g,
    map: {
      '\u0049': '\u0069\u0307',
      '\u004A': '\u006A\u0307',
      '\u012E': '\u012F\u0307',
      '\u00CC': '\u0069\u0307\u0300',
      '\u00CD': '\u0069\u0307\u0301',
      '\u0128': '\u0069\u0307\u0303'
    }
  }
}

/**
 * Lowercase a string.
 *
 * @param  {String} str
 * @return {String}
 */
module.exports = function (str, locale) {
  var lang = LANGUAGES[locale]

  str = str == null ? '' : String(str)

  if (lang) {
    str = str.replace(lang.regexp, function (m) { return lang.map[m] })
  }

  return str.toLowerCase()
}

},{}],16:[function(require,module,exports){
assert.notEqual = notEqual
assert.notOk = notOk
assert.equal = equal
assert.ok = assert

module.exports = assert

function equal (a, b, m) {
  assert(a == b, m) // eslint-disable-line eqeqeq
}

function notEqual (a, b, m) {
  assert(a != b, m) // eslint-disable-line eqeqeq
}

function notOk (t, m) {
  assert(!t, m)
}

function assert (t, m) {
  if (!t) throw new Error(m || 'AssertionError')
}

},{}],17:[function(require,module,exports){
var lowerCase = require('lower-case')

var NON_WORD_REGEXP = require('./vendor/non-word-regexp')
var CAMEL_CASE_REGEXP = require('./vendor/camel-case-regexp')
var CAMEL_CASE_UPPER_REGEXP = require('./vendor/camel-case-upper-regexp')

/**
 * Sentence case a string.
 *
 * @param  {string} str
 * @param  {string} locale
 * @param  {string} replacement
 * @return {string}
 */
module.exports = function (str, locale, replacement) {
  if (str == null) {
    return ''
  }

  replacement = typeof replacement !== 'string' ? ' ' : replacement

  function replace (match, index, value) {
    if (index === 0 || index === (value.length - match.length)) {
      return ''
    }

    return replacement
  }

  str = String(str)
    // Support camel case ("camelCase" -> "camel Case").
    .replace(CAMEL_CASE_REGEXP, '$1 $2')
    // Support odd camel case ("CAMELCase" -> "CAMEL Case").
    .replace(CAMEL_CASE_UPPER_REGEXP, '$1 $2')
    // Remove all non-word characters and replace with a single space.
    .replace(NON_WORD_REGEXP, replace)

  // Lower case the entire string.
  return lowerCase(str, locale)
}

},{"./vendor/camel-case-regexp":18,"./vendor/camel-case-upper-regexp":19,"./vendor/non-word-regexp":20,"lower-case":15}],18:[function(require,module,exports){
module.exports = /([a-z\xB5\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02AF\u0371\u0373\u0377\u037B-\u037D\u0390\u03AC-\u03CE\u03D0\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0561-\u0587\u13F8-\u13FD\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD0-\u1FD3\u1FD6\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u210A\u210E\u210F\u2113\u212F\u2134\u2139\u213C\u213D\u2146-\u2149\u214E\u2184\u2C30-\u2C5E\u2C61\u2C65\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73\u2C74\u2C76-\u2C7B\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F\uA771-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793-\uA795\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7B5\uA7B7\uA7FA\uAB30-\uAB5A\uAB60-\uAB65\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A0-9\xB2\xB3\xB9\xBC-\xBE\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u09F4-\u09F9\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0B72-\u0B77\u0BE6-\u0BF2\u0C66-\u0C6F\u0C78-\u0C7E\u0CE6-\u0CEF\u0D66-\u0D75\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F33\u1040-\u1049\u1090-\u1099\u1369-\u137C\u16EE-\u16F0\u17E0-\u17E9\u17F0-\u17F9\u1810-\u1819\u1946-\u194F\u19D0-\u19DA\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\u2070\u2074-\u2079\u2080-\u2089\u2150-\u2182\u2185-\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2CFD\u3007\u3021-\u3029\u3038-\u303A\u3192-\u3195\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\uA620-\uA629\uA6E6-\uA6EF\uA830-\uA835\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19])([A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E\u213F\u2145\u2183\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AD\uA7B0-\uA7B4\uA7B6\uFF21-\uFF3A])/g

},{}],19:[function(require,module,exports){
module.exports = /([A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E\u213F\u2145\u2183\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AD\uA7B0-\uA7B4\uA7B6\uFF21-\uFF3A])([A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E\u213F\u2145\u2183\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AD\uA7B0-\uA7B4\uA7B6\uFF21-\uFF3A][a-z\xB5\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02AF\u0371\u0373\u0377\u037B-\u037D\u0390\u03AC-\u03CE\u03D0\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0561-\u0587\u13F8-\u13FD\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD0-\u1FD3\u1FD6\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u210A\u210E\u210F\u2113\u212F\u2134\u2139\u213C\u213D\u2146-\u2149\u214E\u2184\u2C30-\u2C5E\u2C61\u2C65\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73\u2C74\u2C76-\u2C7B\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F\uA771-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793-\uA795\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7B5\uA7B7\uA7FA\uAB30-\uAB5A\uAB60-\uAB65\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A])/g

},{}],20:[function(require,module,exports){
module.exports = /[^A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC0-9\xB2\xB3\xB9\xBC-\xBE\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u09F4-\u09F9\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0B72-\u0B77\u0BE6-\u0BF2\u0C66-\u0C6F\u0C78-\u0C7E\u0CE6-\u0CEF\u0D66-\u0D75\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F33\u1040-\u1049\u1090-\u1099\u1369-\u137C\u16EE-\u16F0\u17E0-\u17E9\u17F0-\u17F9\u1810-\u1819\u1946-\u194F\u19D0-\u19DA\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\u2070\u2074-\u2079\u2080-\u2089\u2150-\u2182\u2185-\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2CFD\u3007\u3021-\u3029\u3038-\u303A\u3192-\u3195\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\uA620-\uA629\uA6E6-\uA6EF\uA830-\uA835\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19]+/g

},{}],21:[function(require,module,exports){
/* global MutationObserver */
var document = require('global/document')
var window = require('global/window')
var assert = require('assert')
var watch = Object.create(null)
var KEY_ID = 'onloadid' + (new Date() % 9e6).toString(36)
var KEY_ATTR = 'data-' + KEY_ID
var INDEX = 0

if (window && window.MutationObserver) {
  var observer = new MutationObserver(function (mutations) {
    if (Object.keys(watch).length < 1) return
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].attributeName === KEY_ATTR) {
        eachAttr(mutations[i], turnon, turnoff)
        continue
      }
      eachMutation(mutations[i].removedNodes, turnoff)
      eachMutation(mutations[i].addedNodes, turnon)
    }
  })
  if (document.body) {
    beginObserve(observer)
  } else {
    document.addEventListener('DOMContentLoaded', function (event) {
      beginObserve(observer)
    })
  }
}

function beginObserve (observer) {
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: [KEY_ATTR]
  })
}

module.exports = function onload (el, on, off, caller) {
  assert(document.body, 'on-load: will not work prior to DOMContentLoaded')
  on = on || function () {}
  off = off || function () {}
  el.setAttribute(KEY_ATTR, 'o' + INDEX)
  watch['o' + INDEX] = [on, off, 0, caller || onload.caller]
  INDEX += 1
  return el
}

module.exports.KEY_ATTR = KEY_ATTR
module.exports.KEY_ID = KEY_ID

function turnon (index, el) {
  if (watch[index][0] && watch[index][2] === 0) {
    watch[index][0](el)
    watch[index][2] = 1
  }
}

function turnoff (index, el) {
  if (watch[index][1] && watch[index][2] === 1) {
    watch[index][1](el)
    watch[index][2] = 0
  }
}

function eachAttr (mutation, on, off) {
  var newValue = mutation.target.getAttribute(KEY_ATTR)
  if (sameOrigin(mutation.oldValue, newValue)) {
    watch[newValue] = watch[mutation.oldValue]
    return
  }
  if (watch[mutation.oldValue]) {
    off(mutation.oldValue, mutation.target)
  }
  if (watch[newValue]) {
    on(newValue, mutation.target)
  }
}

function sameOrigin (oldValue, newValue) {
  if (!oldValue || !newValue) return false
  return watch[oldValue][3] === watch[newValue][3]
}

function eachMutation (nodes, fn) {
  var keys = Object.keys(watch)
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] && nodes[i].getAttribute && nodes[i].getAttribute(KEY_ATTR)) {
      var onloadid = nodes[i].getAttribute(KEY_ATTR)
      keys.forEach(function (k) {
        if (onloadid === k) {
          fn(k, nodes[i])
        }
      })
    }
    if (nodes[i].childNodes.length > 0) {
      eachMutation(nodes[i].childNodes, fn)
    }
  }
}

},{"assert":16,"global/document":7,"global/window":8}],22:[function(require,module,exports){
var noCase = require('no-case')

/**
 * Param case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale) {
  return noCase(value, locale, '-')
}

},{"no-case":17}],23:[function(require,module,exports){
var camelCase = require('camel-case')
var upperCaseFirst = require('upper-case-first')

/**
 * Pascal case a string.
 *
 * @param  {string}  value
 * @param  {string}  [locale]
 * @param  {boolean} [mergeNumbers]
 * @return {string}
 */
module.exports = function (value, locale, mergeNumbers) {
  return upperCaseFirst(camelCase(value, locale, mergeNumbers), locale)
}

},{"camel-case":3,"upper-case-first":29}],24:[function(require,module,exports){
var noCase = require('no-case')

/**
 * Path case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale) {
  return noCase(value, locale, '/')
}

},{"no-case":17}],25:[function(require,module,exports){
var noCase = require('no-case')
var upperCaseFirst = require('upper-case-first')

/**
 * Sentence case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale) {
  return upperCaseFirst(noCase(value, locale), locale)
}

},{"no-case":17,"upper-case-first":29}],26:[function(require,module,exports){
var noCase = require('no-case')

/**
 * Snake case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale) {
  return noCase(value, locale, '_')
}

},{"no-case":17}],27:[function(require,module,exports){
var upperCase = require('upper-case')
var lowerCase = require('lower-case')

/**
 * Swap the case of a string. Manually iterate over every character and check
 * instead of replacing certain characters for better unicode support.
 *
 * @param  {String} str
 * @param  {String} [locale]
 * @return {String}
 */
module.exports = function (str, locale) {
  if (str == null) {
    return ''
  }

  var result = ''

  for (var i = 0; i < str.length; i++) {
    var c = str[i]
    var u = upperCase(c, locale)

    result += u === c ? lowerCase(c, locale) : u
  }

  return result
}

},{"lower-case":15,"upper-case":30}],28:[function(require,module,exports){
var noCase = require('no-case')
var upperCase = require('upper-case')

/**
 * Title case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale) {
  return noCase(value, locale).replace(/^.| ./g, function (m) {
    return upperCase(m, locale)
  })
}

},{"no-case":17,"upper-case":30}],29:[function(require,module,exports){
var upperCase = require('upper-case')

/**
 * Upper case the first character of a string.
 *
 * @param  {String} str
 * @return {String}
 */
module.exports = function (str, locale) {
  if (str == null) {
    return ''
  }

  str = String(str)

  return upperCase(str.charAt(0), locale) + str.substr(1)
}

},{"upper-case":30}],30:[function(require,module,exports){
/**
 * Special language-specific overrides.
 *
 * Source: ftp://ftp.unicode.org/Public/UCD/latest/ucd/SpecialCasing.txt
 *
 * @type {Object}
 */
var LANGUAGES = {
  tr: {
    regexp: /[\u0069]/g,
    map: {
      '\u0069': '\u0130'
    }
  },
  az: {
    regexp: /[\u0069]/g,
    map: {
      '\u0069': '\u0130'
    }
  },
  lt: {
    regexp: /[\u0069\u006A\u012F]\u0307|\u0069\u0307[\u0300\u0301\u0303]/g,
    map: {
      '\u0069\u0307': '\u0049',
      '\u006A\u0307': '\u004A',
      '\u012F\u0307': '\u012E',
      '\u0069\u0307\u0300': '\u00CC',
      '\u0069\u0307\u0301': '\u00CD',
      '\u0069\u0307\u0303': '\u0128'
    }
  }
}

/**
 * Upper case a string.
 *
 * @param  {String} str
 * @return {String}
 */
module.exports = function (str, locale) {
  var lang = LANGUAGES[locale]

  str = str == null ? '' : String(str)

  if (lang) {
    str = str.replace(lang.regexp, function (m) { return lang.map[m] })
  }

  return str.toUpperCase()
}

},{}],31:[function(require,module,exports){
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

},{}],32:[function(require,module,exports){
module.exports={"Google":83.513,"Taboola":3.027,"Facebook":16.092,"Twitter":6.715,"AddThis":3.77,"whos.amung.us":0.651,"Amazon.com":12.609,"Criteo":7.373,"nugg.ad":1.092,"AT Internet":0.855,"Médiamétrie-eStat":0.244,"PageFair":0.653,"Moat":0.569,"Horyzon Media":1.285,"AdSafe Media":0.529,"AppNexus":11.908,"Fox One Stop Media":4.833,"TripleLift":0.615,"Yandex":2.966,"PopAds":0.536,"Webtrends":0.363,"LiveInternet":2.273,"New Relic":8.7,"eXTReMe digital":0.174,"ADITION":0.628,"INFOnline":1.584,"WPP":1.029,"adscale":0.584,"ADTECH":1.372,"Casale Media":4.001,"OpenX":4.739,"Oath":6.054,"Adobe":9.557,"ValueClick":1.334,"Rhythm":1.311,"Federated Media":3.073,"CONTEXTWEB":2.829,"SiteScout":2.046,"EQ Ads":0.931,"ShareThis":0.676,"Rambler":0.386,"comScore":10.54,"Skimlinks":1.069,"Cross Pixel":0.191,"AK":1.391,"BlueKai":2.663,"MediaMath":4.619,"The Trade Desk":5.682,"Rocket Fuel":1.374,"Quantcast":6.814,"TNS":0.317,"AdFox":0.206,"Go Daddy":0.149,"unknown":4.092,"DoubleVerify":0.076,"SpotXchange":0.76,"DataXu":1.391,"Improve Digital":0.29,"Tapad":1.401,"Drawbridge":0.781,"Krux":2.945,"Rapleaf":1.796,"PubMatic":3.023,"StatCounter":1.363,"bigmir)net":0.059,"OptinMonster":0.386,"KISSmetrics":0.151,"Crazy Egg":1.796,"VigLink":0.916,"Weborama":0.378,"Chartbeat":3.176,"Wishabi":0.376,"Outbrain":1.344,"Lotame":3.413,"LinkedIn":0.823,"Histats":1.199,"Roxr":0.622,"Mixpanel":1.033,"Commission Junction":0.092,"Adverline":0.053,"m6d":1.559,"Meetrics":0.193,"Yieldlab":0.452,"xplosion interactive":0.498,"Gemius":0.878,"Demandbase":0.38,"ClickTale":0.349,"HP":0.034,"Ensighten":0.91,"Hotjar":2.867,"VKontakte":0.384,"reddit":0.193,"TubeMogul":0.523,"AdXpansion":0.05,"Adality":0.05,"Yieldmo":0.26,"media.net":0.83,"BuySellAds":0.334,"Simpli.fi":0.83,"GoStats":0.011,"Adform":1.433,"ExoClick":1.888,"Attracta":0.002,"EroAdvertising":0.376,"Soasta":0.781,"Exponential Interactive":0.466,"BloomReach":0.168,"eXelate":1.029,"Teads.tv":0.452,"LinkShare":0.229,"DC Storm":0.17,"cXense":0.519,"OwnerIQ":0.693,"Nativo":1.092,"Monetate":0.51,"Listrak":0.334,"Project Wonderful":0.032,"Gruner + Jahr":0.279,"Vibrant Media":0.258,"MarketGid":0.176,"Mouseflow":0.311,"Intercom":0.265,"sociomantic labs":0.099,"Specific Media":0.04,"ActiveConversion":0.002,"Nielsen":1.739,"Belstat":0.006,"Lockerz":0.336,"FriendFinder Networks":0.067,"Adverticum":0.057,"Flashtalking":0.204,"LiveIntent":0.271,"AdOcean":0.141,"Zemanta":0.355,"RadiumOne":0.235,"Netmining":0.281,"Microsoft":0.536,"AdRoll":1.021,"AWeber":0.256,"AdRiver":0.313,"RevContent":0.284,"AvantLink":0.08,"CPMStar":0.08,"JuicyAds":0.603,"BrightTag":0.536,"Datalogix":0.935,"Pictela":0.214,"Swoop":0.258,"Segment.io":0.626,"Inspectlet":0.284,"Bizo":0.206,"Oracle":0.624,"Certona":0.218,"Magnetic":0.403,"InvestingChannel":0.027,"Wysistat":0.021,"Amobee":0.042,"AdKernel":0.3,"AdGlare":0.023,"SessionCam":0.143,"SteelHouse":0.168,"Veeseo":0.013,"4shared.com":0.002,"OPT":0.021,"GetSiteControl":0.183,"HubSpot":0.559,"QuinStreet":0.055,"Adzerk":0.103,"FullStory":0.158,"Deep Intent":0.027,"FreeWheel":0.021,"Adotmob":0.143,"Admeta":0.076,"BLOOM Digital Platforms":0.166,"ZEDO":0.097,"plista":0.204,"Acxiom":0.034,"Technorati":0.027,"Evidon":0.481,"Think Realtime":0.008,"Undertone":0.053,"The Heron Partnership":0.323,"Intent Media":0.13,"Hurra.com":0.021,"IBM":0.3,"Adara Media":0.185,"DG":0.538,"etracker":0.246,"BrightEdge":0.032,"iPerceptions":0.21,"Tradedoubler":0.061,"adBrite":0.006,"Po.st":0.231,"Lakana":0.086,"Intergi":0.078,"Shareaholic":0.128,"AdTiger":0.011,"AdMedia":0.011,"eBay":0.187,"Marktest":0.029,"AT&T":0.027,"Marketo":0.611,"Polymorph":0.191,"FreakOut":0.078,"ClustrMaps":0.027,"Tinder":0.101,"Veoxa":0.008,"ReTargeter":0.019,"The Rimm-Kaufman Group":0.338,"Tremor Video":0.239,"iovation":0.002,"Intermarkets":0.019,"Qualaroo":0.704,"GSI Commerce":0.006,"ChannelAdvisor":0.143,"CNZZ":0.101,"SearchForce":0.006,"Cox Digital Solutions":0.263,"MailChimp":0.59,"Pardot":0.288,"Kantar Millward Brown":0.069,"NextPerformance":0.067,"orange.fr":0.019,"Webtrekk":0.162,"GumGum":0.92,"Renegade Internet":0.124,"Opera":0.011,"Spongecell":0.04,"Polar Mobile":0.265,"Silverpop":0.059,"Datonics":0.105,"Jumptap":0.017,"Acuity":0.16,"Mail.Ru":0.288,"Telstra":0.021,"AdServerPub":0.004,"Fairfax Media":0.013,"Evolve":0.046,"MaxPoint":0.059,"SupersonicAds":0.002,"agar.io":0.002,"zanox":0.092,"Neustar":0.111,"ad6media":0.046,"Selectable Media":0.048,"MerchantAdvantage":0.002,"BidVertiser":0.006,"Digital Target":0.168,"GetIntent":0.263,"Targetix":0.038,"LinkConnector":0.023,"AdReactor":0.061,"MetrixLab":0.021,"RichRelevance":0.208,"Monitus":0.017,"Internet Brands":0.12,"33Across":0.162,"Unruly":0.16,"NetSeer":0.137,"LifeStreet":0.086,"Adsty":0.13,"Effective Measure":0.103,"Switch":0.109,"AudienceScience":0.055,"SAS":0.061,"meinestadt.de":0.017,"I-Behavior":0.032,"ClickDistrict":0.155,"alibaba.com":0.004,"Underdog Media":0.05,"Automattic":0.155,"Chango":0.048,"Visible Measures":0.042,"CoinHive":0.101,"AdSpeed":0.04,"Kenshoo":0.086,"InfoStars":0.029,"Openstat":0.008,"RuTarget":0.078,"BlueCava":0.05,"eyeReturn Marketing":0.088,"engage:BDR":0.076,"Complex Media":0.069,"Infolinks":0.082,"Nexage":0.017,"BlogHer":0.078,"Jivox":0.036,"amarujala.com":0.002,"Navegg":0.092,"Caraytech":0.046,"Admotion":0.021,"Pressflex":0.008,"dianomi":0.053,"TruEffect":0.011,"ConversionRuler":0.002,"DynamicYield":0.153,"Adsupply":0.122,"ClickDimensions":0.034,"MicroAd":0.055,"anandabazar.com":0.002,"Emego":0.008,"Awio":0.008,"Forbes":0.004,"Instinctive":0.027,"ShinyStat":0.074,"GroovinAds":0.019,"Innity":0.032,"animenewsnetwork.com":0.002,"DirectAdvert":0.023,"Adiant":0.076,"AdSpirit":0.029,"Samurai Factory":0.013,"Salesforce.com":0.021,"GoDataFeed":0.013,"Fluct":0.034,"Glam Media":0.011,"Smowtion":0.002,"ara.cat":0.002,"StumbleUpon":0.05,"archiproducts.com":0.002,"argep.hu":0.002,"YuMe":0.034,"Research Now":0.071,"Adswizz":0.071,"nurago":0.011,"Woopra":0.044,"Developer Media":0.044,"Adventori":0.038,"ÖWA":0.155,"Adversal.com":0.008,"USI Technologies":0.053,"TouchCommerce":0.09,"Dataium":0.002,"Adnetik":0.015,"sophus3":0.053,"audi.co.uk":0.002,"Connexity":0.021,"Web.com":0.008,"Wirtualna Polska":0.053,"AdsTours":0.008,"Twyn Group":0.034,"avforums.com":0.002,"VisiStat":0.015,"Gannett":0.021,"ToneMedia":0.036,"Net-Results":0.008,"SocialTwist":0.004,"Mercent":0.038,"SAY":0.046,"TrafficHaus":0.084,"Rekko":0.004,"barclays.co.uk":0.002,"SmartLook":0.038,"Nanigans":0.057,"barstoolsports.com":0.002,"AdF.ly":0.015,"ADTELLIGENCE":0.013,"MarkMonitor":0.027,"VisualDNA":0.101,"User Local":0.032,"ShareASale":0.027,"Grapeshot":0.053,"C3 Metrics":0.032,"Performancing":0.011,"Net Applications":0.002,"mediaFORGE":0.044,"Dedicated Media":0.006,"Admicro":0.023,"Mirando":0.011,"Barilliance":0.008,"Fiksu":0.008,"nih.gov":0.006,"blizzardwatch.com":0.002,"Pinterest":0.029,"Delta Projects":0.011,"Shortest":0.013,"iPROM":0.011,"Ambient Digital":0.013,"FinancialContent":0.006,"Eulerian Technologies":0.008,"AdBrain":0.021,"Levexis":0.008,"britishairways.com":0.002,"brooksbrothers.com":0.002,"GitHub":0.044,"Opentracker":0.013,"adnologies":0.004,"ConvergeDirect":0.008,"AppsFlyer":0.025,"TradeTracker":0.008,"Streamray":0.008,"Public-Idées":0.006,"GoSquared":0.08,"Hearst":0.004,"Act-On":0.002,"nicovideo.jp":0.006,"sankakucomplex.com":0.004,"AdFrontiers":0.006,"chaturbate.com":0.004,"chatzy.com":0.002,"Amazing Counters":0.004,"uCoz":0.04,"cio.com":0.002,"Peer39":0.008,"clamav.net":0.002,"Collective":0.019,"Proclivity":0.032,"clubedohardware.com.br":0.002,"cnbc.com":0.002,"OneStat":0.021,"CPX Interactive":0.002,"wikimedia.org":0.008,"sosh.fr":0.002,"Optimizely":0.017,"LeadFormix":0.002,"computerworld.com":0.002,"Answers.com":0.002,"Chitika":0.015,"Httpool":0.013,"Spectate":0.008,"cqcounter.com":0.002,"Piximedia":0.017,"kohls.com":0.004,"adMarketplace":0.002,"Crowd Science":0.002,"dailycaller.com":0.002,"dailymail.co.uk":0.002,"AdvertiseSpace":0.002,"Match.com":0.008,"pornhub.com":0.021,"DoublePimp":0.029,"HealthPricer":0.006,"Kontera":0.019,"Feedjit":0.015,"HitsLink":0.015,"Unanimis":0.002,"NetShelter":0.008,"Digg":0.004,"Vizury":0.015,"Akamai":0.002,"LeadLander":0.011,"Digital River":0.013,"Begun":0.019,"MaxBounty":0.002,"Flite":0.008,"eProof.com":0.004,"Vdopia":0.013,"Monster":0.034,"xAd":0.013,"Augur":0.011,"eldiario.es":0.004,"Snoobi":0.008,"Kokteyl":0.004,"eurogamer.net":0.002,"eventhubs.com":0.002,"eventim.de":0.002,"Everyday Health":0.008,"Experian":0.004,"explosm.net":0.002,"fandango.com":0.004,"Affinity":0.004,"filmon.com":0.002,"Etarget":0.008,"financialexpress.com":0.002,"expedia.com":0.002,"flvto.biz":0.004,"Adworx":0.021,"I.UA":0.015,"HOTWords":0.002,"Ad Decisive":0.008,"bodybuilding.com":0.002,"AddFreeStats":0.013,"canoe.ca":0.002,"Ad4Game":0.011,"freewka.com":0.002,"Tisoomi":0.013,"gamecopyworld.com":0.002,"washingtonpost.com":0.006,"gamesgames.com":0.002,"Infectious Media":0.004,"AdReady":0.013,"RMBN":0.027,"Betgenius":0.004,"Accelia":0.004,"NetElixir":0.004,"walmart.com":0.006,"Adometry":0.006,"Meebo":0.002,"spiegel.de":0.006,"hd-porn.me":0.002,"ClearSaleing":0.004,"Addvantage Media":0.002,"hentai-foundry.com":0.002,"Syncapse":0.004,"ADP Dealer Services":0.008,"usps.com":0.004,"ibis.com":0.002,"craveonline.com":0.002,"Hi-media":0.002,"Adlucent":0.002,"Meteor":0.002,"infoworld.com":0.002,"Marchex":0.004,"ip-address.org":0.002,"itv.com":0.002,"Nokta":0.004,"AndBeyond":0.002,"jagranjosh.com":0.002,"Sparklit":0.002,"AdLantis":0.002,"The Numa Group":0.011,"Acquisio":0.006,"RadarURL":0.002,"kentucky.com":0.002,"ndtv.com":0.006,"Wingify":0.002,"365Media":0.013,"myThings":0.004,"Applovin":0.002,"AdPerfect":0.004,"lipsum.com":0.002,"mercadolivre.com.br":0.002,"apache.org":0.002,"Keyade":0.008,"BackBeat Media":0.004,"IgnitionOne":0.002,"KeyMetric":0.008,"4INFO":0.006,"rp-online.de":0.004,"seekingalpha.com":0.004,"StrikeAd":0.002,"Earnify":0.002,"BlogCatalog":0.002,"manga-news.com":0.002,"Wahoha":0.002,"medicare.gov":0.002,"mid-day.com":0.002,"milb.com":0.002,"perezhilton.com":0.004,"Mongoose Metrics":0.006,"Layer-Ad.org":0.002,"nationalcar.com":0.002,"affilinet":0.008,"necn.com":0.002,"networkworld.com":0.002,"next-episode.net":0.002,"Nextag":0.002,"TrackingSoft":0.002,"jimmyjohns.com":0.002,"Web Traxs":0.004,"overclock3d.net":0.002,"Brand.net":0.002,"pbskids.org":0.002,"Publishers Clearing House":0.002,"pep.ph":0.002,"Buysight":0.004,"VerticalResponse":0.002,"politiken.dk":0.002,"pornfun.com":0.002,"Web Stats":0.004,"AdEngage":0.002,"pornxs.com":0.002,"ti.com":0.002,"Web Tracking Services":0.006,"rakuten.co.jp":0.004,"ratemyprofessors.com":0.002,"Sapient":0.004,"redtube.com":0.002,"rockpapershotgun.com":0.002,"Triggit":0.002,"safeway.com":0.002,"sahibinden.com":0.002,"searchengineland.com":0.002,"CheckM8":0.004,"snapchat.com":0.002,"sonypictures.com":0.002,"southwest.com":0.002,"sparkylinux.org":0.002,"Communicator Corp":0.002,"dlink.com":0.002,"Terra":0.002,"texasroadhouse.com":0.002,"tf1.fr":0.002,"Clickdensity":0.002,"Ninua":0.004,"LiveRail":0.002,"thenextweb.com":0.002,"thesimsresource.com":0.002,"thetvdb.com":0.002,"Xrost DS":0.002,"Umbel":0.004,"tv5monde.com":0.002,"TellApart":0.004,"unrealengine.com":0.002,"vg247.com":0.002,"foxnews.com":0.002,"nationalgeographic.com":0.002,"vistek.ca":0.002,"vodafone.com.au":0.002,"walmartmoneycard.com":0.002,"Radiate Media":0.002,"dhlglobalmail.com":0.002,"NextSTAT":0.002,"Adforge":0.002,"Burst Media":0.002,"WordStream":0.002,"writing.com":0.002,"ynet.co.il":0.002,"zerozero.pt":0.002,"zorinos.com":0.002}
},{}],33:[function(require,module,exports){
module.exports={
    "TopTrackerDomains": {
        "adlantic.nl": {
            "c": "AppNexus",
            "t": "Advertising"
        },
        "adnxs.com": {
            "c": "AppNexus",
            "t": "Advertising"
        },
        "adrdgt.com": {
            "c": "AppNexus",
            "t": "Advertising"
        },
        "appnexus.com": {
            "c": "AppNexus",
            "t": "Advertising"
        },
        "alenty.com": {
            "c": "AppNexus",
            "t": "Advertising"
        },
        "adroitinteractive.com": {
            "c": "MediaMath",
            "t": "Advertising"
        },
        "designbloxlive.com": {
            "c": "MediaMath",
            "t": "Advertising"
        },
        "mathtag.com": {
            "c": "MediaMath",
            "t": "Advertising"
        },
        "mediamath.com": {
            "c": "MediaMath",
            "t": "Advertising"
        },
        "estara.com": {
            "c": "Oracle",
            "t": "Advertising"
        },
        "2mdn.net": {
            "c": "Google",
            "t": "Advertising"
        },
        "admeld.com": {
            "c": "Google",
            "t": "Advertising"
        },
        "admob.com": {
            "c": "Google",
            "t": "Advertising"
        },
        "cc-dt.com": {
            "c": "Google",
            "t": "Advertising"
        },
        "destinationurl.com": {
            "c": "Google",
            "t": "Advertising"
        },
        "developers.google.com": {
            "c": "Google",
            "t": "Social"
        },
        "doubleclick.net": {
            "c": "Google",
            "t": "Advertising"
        },
        "gmail.com": {
            "c": "Google",
            "t": "Social"
        },
        "google-analytics.com": {
            "c": "Google",
            "t": "Analytics"
        },
        "adwords.google.com": {
            "c": "Google",
            "t": "Advertising"
        },
        "mail.google.com": {
            "c": "Google",
            "t": "Social"
        },
        "inbox.google.com": {
            "c": "Google",
            "t": "Social"
        },
        "plus.google.com": {
            "c": "Google",
            "t": "Social"
        },
        "plusone.google.com": {
            "c": "Google",
            "t": "Social"
        },
        "voice.google.com": {
            "c": "Google",
            "t": "Social"
        },
        "wave.google.com": {
            "c": "Google",
            "t": "Social"
        },
        "googleadservices.com": {
            "c": "Google",
            "t": "Advertising"
        },
        "googlemail.com": {
            "c": "Google",
            "t": "Social"
        },
        "googlesyndication.com": {
            "c": "Google",
            "t": "Advertising"
        },
        "googletagservices.com": {
            "c": "Google",
            "t": "Advertising"
        },
        "invitemedia.com": {
            "c": "Google",
            "t": "Advertising"
        },
        "orkut.com": {
            "c": "Google",
            "t": "Social"
        },
        "postrank.com": {
            "c": "Google",
            "t": "Analytics"
        },
        "smtad.net": {
            "c": "Google",
            "t": "Advertising"
        },
        "teracent.com": {
            "c": "Google",
            "t": "Advertising"
        },
        "teracent.net": {
            "c": "Google",
            "t": "Advertising"
        },
        "ytsa.net": {
            "c": "Google",
            "t": "Advertising"
        },
        "googletagmanager.com": {
            "c": "Google",
            "t": "Advertising"
        },
        "polldaddy.com": {
            "c": "Automattic",
            "t": "Analytics"
        },
        "facebook.com": {
            "c": "Facebook",
            "t": "Social"
        },
        "facebook.de": {
            "c": "Facebook",
            "t": "Social"
        },
        "facebook.fr": {
            "c": "Facebook",
            "t": "Social"
        },
        "facebook.net": {
            "c": "Facebook",
            "t": "Social"
        },
        "fb.com": {
            "c": "Facebook",
            "t": "Social"
        },
        "atlassolutions.com": {
            "c": "Facebook",
            "t": "Social"
        },
        "friendfeed.com": {
            "c": "Facebook",
            "t": "Social"
        },
        "backtype.com": {
            "c": "Twitter",
            "t": "Social"
        },
        "crashlytics.com": {
            "c": "Twitter",
            "t": "Social"
        },
        "tweetdeck.com": {
            "c": "Twitter",
            "t": "Social"
        },
        "twimg.com": {
            "c": "Twitter",
            "t": "Social"
        },
        "twitter.com": {
            "c": "Twitter",
            "t": "Social"
        },
        "twitter.jp": {
            "c": "Twitter",
            "t": "Social"
        }
    },
    "Advertising": {
        "2leep.com": {
            "c": "2leep.com",
            "u": "http://2leep.com/"
        },
        "33across.com": {
            "c": "33Across",
            "u": "http://33across.com/"
        },
        "365dm.com": {
            "c": "365Media",
            "u": "http://365media.com/"
        },
        "365media.com": {
            "c": "365Media",
            "u": "http://365media.com/"
        },
        "4info.com": {
            "c": "4INFO",
            "u": "http://www.4info.com/"
        },
        "adhaven.com": {
            "c": "4INFO",
            "u": "http://www.4info.com/"
        },
        "4mads.com": {
            "c": "4mads",
            "u": "http://4mads.com/"
        },
        "adeurope.com": {
            "c": "AD Europe",
            "u": "http://www.adeurope.com/"
        },
        "ad2onegroup.com": {
            "c": "AD2ONE",
            "u": "http://www.ad2onegroup.com/"
        },
        "adition.com": {
            "c": "ADITION",
            "u": "http://www.adition.com/"
        },
        "admission.net": {
            "c": "ADP Dealer Services",
            "u": "http://www.adpdealerservices.com/"
        },
        "adpdealerservices.com": {
            "c": "ADP Dealer Services",
            "u": "http://www.adpdealerservices.com/"
        },
        "cobalt.com": {
            "c": "ADP Dealer Services",
            "u": "http://www.adpdealerservices.com/"
        },
        "adtech.com": {
            "c": "ADTECH",
            "u": "http://www.adtech.com/"
        },
        "adtech.de": {
            "c": "ADTECH",
            "u": "http://www.adtech.com/"
        },
        "adtechus.com": {
            "c": "ADTECH",
            "u": "http://www.adtech.com/"
        },
        "adtelligence.de": {
            "c": "ADTELLIGENCE",
            "u": "http://www.adtelligence.de/"
        },
        "adzcentral.com": {
            "c": "ADZ",
            "u": "http://www.adzcentral.com/"
        },
        "aerifymedia.com": {
            "c": "AERIFY MEDIA",
            "u": "http://aerifymedia.com/"
        },
        "anonymous-media.com": {
            "c": "AERIFY MEDIA",
            "u": "http://aerifymedia.com/"
        },
        "aggregateknowledge.com": {
            "c": "AK",
            "u": "http://www.aggregateknowledge.com/"
        },
        "agkn.com": {
            "c": "AK",
            "u": "http://www.aggregateknowledge.com/"
        },
        "adsonar.com": {
            "c": "AOL",
            "u": "http://www.aol.com/"
        },
        "advertising.com": {
            "c": "AOL",
            "u": "http://www.aol.com/"
        },
        "atwola.com": {
            "c": "AOL",
            "u": "http://www.aol.com/"
        },
        "leadback.com": {
            "c": "AOL",
            "u": "http://www.aol.com/"
        },
        "tacoda.net": {
            "c": "AOL",
            "u": "http://www.aol.com/"
        },
        "adtechjp.com": {
            "c": "AOL",
            "u": "http://www.aol.com/"
        },
        "hit-parade.com": {
            "c": "AT Internet",
            "u": "http://www.atinternet.com/"
        },
        "att.com": {
            "c": "AT&T",
            "u": "http://www.att.com/"
        },
        "yp.com": {
            "c": "AT&T",
            "u": "http://www.att.com/"
        },
        "affiliatetracking.com": {
            "c": "ATN",
            "u": "http://affiliatetracking.com/"
        },
        "am.ua": {
            "c": "AUTOCENTRE.UA",
            "u": "http://www.autocentre.ua/"
        },
        "autocentre.ua": {
            "c": "AUTOCENTRE.UA",
            "u": "http://www.autocentre.ua/"
        },
        "aweber.com": {
            "c": "AWeber",
            "u": "http://www.aweber.com/"
        },
        "abaxinteractive.com": {
            "c": "Abax Interactive",
            "u": "http://abaxinteractive.com/"
        },
        "accelia.net": {
            "c": "Accelia",
            "u": "http://www.accelia.net/"
        },
        "durasite.net": {
            "c": "Accelia",
            "u": "http://www.accelia.net/"
        },
        "accordantmedia.com": {
            "c": "Accordant Media",
            "u": "http://www.accordantmedia.com/"
        },
        "acquisio.com": {
            "c": "Acquisio",
            "u": "http://www.acquisio.com/"
        },
        "clickequations.net": {
            "c": "Acquisio",
            "u": "http://www.acquisio.com/"
        },
        "act-on.com": {
            "c": "Act-On",
            "u": "http://www.act-on.com/"
        },
        "actonsoftware.com": {
            "c": "Act-On",
            "u": "http://www.act-on.com/"
        },
        "actisens.com": {
            "c": "Actisens",
            "u": "http://www.actisens.com/"
        },
        "gestionpub.com": {
            "c": "Actisens",
            "u": "http://www.actisens.com/"
        },
        "activeconversion.com": {
            "c": "ActiveConversion",
            "u": "http://www.activeconversion.com/"
        },
        "activemeter.com": {
            "c": "ActiveConversion",
            "u": "http://www.activeconversion.com/"
        },
        "acuity.com": {
            "c": "Acuity",
            "u": "http://www.acuity.com/"
        },
        "acuityads.com": {
            "c": "Acuity",
            "u": "http://www.acuity.com/"
        },
        "acuityplatform.com": {
            "c": "Acuity",
            "u": "http://www.acuity.com/"
        },
        "a2dfp.net": {
            "c": "Ad Decisive",
            "u": "http://www.addecisive.com/"
        },
        "addecisive.com": {
            "c": "Ad Decisive",
            "u": "http://www.addecisive.com/"
        },
        "addynamo.com": {
            "c": "Ad Dynamo",
            "u": "http://www.addynamo.com/"
        },
        "addynamo.net": {
            "c": "Ad Dynamo",
            "u": "http://www.addynamo.com/"
        },
        "adknife.com": {
            "c": "Ad Knife",
            "u": "http://static.adknife.com/"
        },
        "admagnet.com": {
            "c": "Ad Magnet",
            "u": "http://www.admagnet.com/"
        },
        "admagnet.net": {
            "c": "Ad Magnet",
            "u": "http://www.admagnet.com/"
        },
        "ad4game.com": {
            "c": "Ad4Game",
            "u": "http://ad4game.com/"
        },
        "adcirrus.com": {
            "c": "AdCirrus",
            "u": "http://adcirrus.com/"
        },
        "adengage.com": {
            "c": "AdEngage",
            "u": "http://adengage.com/"
        },
        "adextent.com": {
            "c": "AdExtent",
            "u": "http://www.adextent.com/"
        },
        "adf.ly": {
            "c": "AdF.ly",
            "u": "http://adf.ly/"
        },
        "adfox.ru": {
            "c": "AdFox",
            "u": "http://adfox.ru/"
        },
        "adfrontiers.com": {
            "c": "AdFrontiers",
            "u": "http://www.adfrontiers.com/"
        },
        "adgentdigital.com": {
            "c": "AdGent Digital",
            "u": "http://www.adgentdigital.com/"
        },
        "shorttailmedia.com": {
            "c": "AdGent Digital",
            "u": "http://www.adgentdigital.com/"
        },
        "adgibbon.com": {
            "c": "AdGibbon",
            "u": "http://www.adgibbon.com/"
        },
        "adiquity.com": {
            "c": "AdIQuity",
            "u": "http://adiquity.com/"
        },
        "adinsight.com": {
            "c": "AdInsight",
            "u": "http://www.adinsight.com/"
        },
        "adinsight.eu": {
            "c": "AdInsight",
            "u": "http://www.adinsight.com/"
        },
        "adjug.com": {
            "c": "AdJug",
            "u": "http://www.adjug.com/"
        },
        "adjuggler.com": {
            "c": "AdJuggler",
            "u": "http://www.adjuggler.com/"
        },
        "adjuggler.net": {
            "c": "AdJuggler",
            "u": "http://www.adjuggler.com/"
        },
        "adkeeper.com": {
            "c": "AdKeeper",
            "u": "http://www.adkeeper.com/"
        },
        "akncdn.com": {
            "c": "AdKeeper",
            "u": "http://www.adkeeper.com/"
        },
        "adkernel.com": {
            "c": "AdKernel",
            "u": "http://adkernel.com"
        },
        "adimg.net": {
            "c": "AdLantis",
            "u": "http://www.adlantis.jp/"
        },
        "adlantis.jp": {
            "c": "AdLantis",
            "u": "http://www.adlantis.jp/"
        },
        "adleave.com": {
            "c": "AdLeave",
            "u": "http://www.adleave.com/"
        },
        "admarvel.com": {
            "c": "AdMarvel",
            "u": "http://www.admarvel.com/"
        },
        "admaximizer.com": {
            "c": "AdMaximizer Network",
            "u": "http://admaximizer.com/"
        },
        "admedia.com": {
            "c": "AdMedia",
            "u": "http://www.admedia.com/"
        },
        "adnetwork.net": {
            "c": "AdNetwork.net",
            "u": "http://www.adnetwork.net/"
        },
        "adocean-global.com": {
            "c": "AdOcean",
            "u": "http://www.adocean-global.com/"
        },
        "adocean.pl": {
            "c": "AdOcean",
            "u": "http://www.adocean-global.com/"
        },
        "adonnetwork.com": {
            "c": "Prime Visibility",
            "u": "http://www.primevisibility.com/"
        },
        "dashboardad.net": {
            "c": "AdOn Network",
            "u": "http://adonnetwork.com/"
        },
        "adonion.com": {
            "c": "AdOnion",
            "u": "http://www.adonion.com/"
        },
        "adperfect.com": {
            "c": "AdPerfect",
            "u": "http://www.adperfect.com/"
        },
        "adpredictive.com": {
            "c": "AdPredictive",
            "u": "http://www.adpredictive.com/"
        },
        "adreactor.com": {
            "c": "AdReactor",
            "u": "http://www.adreactor.com/"
        },
        "adready.com": {
            "c": "AdReady",
            "u": "http://www.adready.com/"
        },
        "adreadytractions.com": {
            "c": "AdReady",
            "u": "http://www.adready.com/"
        },
        "adrevolution.com": {
            "c": "AdRevolution",
            "u": "http://adrevolution.com/"
        },
        "adriver.ru": {
            "c": "AdRiver",
            "u": "http://adriver.ru/"
        },
        "adroll.com": {
            "c": "AdRoll",
            "u": "http://www.adroll.com/"
        },
        "adsafemedia.com": {
            "c": "AdSafe Media",
            "u": "http://adsafemedia.com/"
        },
        "adsafeprotected.com": {
            "c": "AdSafe Media",
            "u": "http://adsafemedia.com/"
        },
        "adserverpub.com": {
            "c": "AdServerPub",
            "u": "http://www.adserverpub.com/"
        },
        "adshuffle.com": {
            "c": "AdShuffle",
            "u": "http://www.adshuffle.com/"
        },
        "adside.com": {
            "c": "AdSide",
            "u": "http://www.adside.com/"
        },
        "doclix.com": {
            "c": "AdSide",
            "u": "http://www.adside.com/"
        },
        "adsmart.com": {
            "c": "AdSmart",
            "u": "http://adsmart.com/"
        },
        "adspeed.com": {
            "c": "AdSpeed",
            "u": "http://www.adspeed.com/"
        },
        "adspeed.net": {
            "c": "AdSpeed",
            "u": "http://www.adspeed.com/"
        },
        "adspirit.com": {
            "c": "AdSpirit",
            "u": "http://www.adspirit.de/"
        },
        "adspirit.de": {
            "c": "AdSpirit",
            "u": "http://www.adspirit.de/"
        },
        "adspirit.net": {
            "c": "AdSpirit",
            "u": "http://www.adspirit.de/"
        },
        "adtiger.de": {
            "c": "AdTiger",
            "u": "http://www.adtiger.de/"
        },
        "adtruth.com": {
            "c": "AdTruth",
            "u": "http://adtruth.com/"
        },
        "adxpansion.com": {
            "c": "AdXpansion",
            "u": "http://www.adxpansion.com/"
        },
        "adality.de": {
            "c": "Adality",
            "u": "http://adality.de/"
        },
        "adrtx.net": {
            "c": "Adality",
            "u": "http://adality.de/"
        },
        "adaptiveads.com": {
            "c": "AdaptiveAds",
            "u": "http://www.adaptiveads.com/"
        },
        "adaptly.com": {
            "c": "Adaptly",
            "u": "http://adaptly.com/"
        },
        "adaramedia.com": {
            "c": "Adara Media",
            "u": "http://www.adaramedia.com/"
        },
        "opinmind.com": {
            "c": "Adara Media",
            "u": "http://www.adaramedia.com/"
        },
        "yieldoptimizer.com": {
            "c": "Adara Media",
            "u": "http://www.adaramedia.com/"
        },
        "adatus.com": {
            "c": "Adatus",
            "u": "http://www.adatus.com/"
        },
        "adbrn.com": {
            "c": "Adbrain",
            "u": "http://www.adbrain.com/"
        },
        "adbrain.com": {
            "c": "Adbrain",
            "u": "http://www.adbrain.com/"
        },
        "adbroker.de": {
            "c": "Adbroker.de",
            "u": "http://adbroker.de/"
        },
        "adchemy.com": {
            "c": "Adchemy",
            "u": "http://www.adchemy.com/"
        },
        "adconion.com": {
            "c": "Adconion",
            "u": "http://www.adconion.com/"
        },
        "amgdgt.com": {
            "c": "Adconion",
            "u": "http://www.adconion.com/"
        },
        "euroclick.com": {
            "c": "Adconion",
            "u": "http://www.adconion.com/"
        },
        "smartclip.com": {
            "c": "Adconion",
            "u": "http://www.adconion.com/"
        },
        "addvantagemedia.com": {
            "c": "Addvantage Media",
            "u": "http://www.addvantagemedia.com/"
        },
        "adfonic.com": {
            "c": "Adfonic",
            "u": "http://adfonic.com/"
        },
        "adforgeinc.com": {
            "c": "Adforge",
            "u": "http://adforgeinc.com/"
        },
        "adform.com": {
            "c": "Adform",
            "u": "http://www.adform.com/"
        },
        "adform.net": {
            "c": "Adform",
            "u": "http://www.adform.com/"
        },
        "adformdsp.net": {
            "c": "Adform",
            "u": "http://www.adform.com/"
        },
        "adfunky.com": {
            "c": "Adfunky",
            "u": "http://www.adfunky.com/"
        },
        "adfunkyserver.com": {
            "c": "Adfunky",
            "u": "http://www.adfunky.com/"
        },
        "adfusion.com": {
            "c": "Adfusion",
            "u": "http://www.adfusion.com/"
        },
        "adglare.net": {
            "c": "Adglare",
            "u": "https://www.adglare.com/"
        },
        "adglare.com": {
            "c": "Adglare",
            "u": "https://www.adglare.com/"
        },
        "adblade.com": {
            "c": "Adiant",
            "u": "http://www.adiant.com/"
        },
        "adiant.com": {
            "c": "Adiant",
            "u": "http://www.adiant.com/"
        },
        "adknowledge.com": {
            "c": "Adknowledge",
            "u": "http://www.adknowledge.com/"
        },
        "adparlor.com": {
            "c": "Adknowledge",
            "u": "http://www.adknowledge.com/"
        },
        "bidsystem.com": {
            "c": "Adknowledge",
            "u": "http://www.adknowledge.com/"
        },
        "cubics.com": {
            "c": "Adknowledge",
            "u": "http://www.adknowledge.com/"
        },
        "lookery.com": {
            "c": "Adknowledge",
            "u": "http://www.adknowledge.com/"
        },
        "adlibrium.com": {
            "c": "Adlibrium",
            "u": "http://www.adlibrium.com/"
        },
        "adlucent.com": {
            "c": "Adlucent",
            "u": "http://adlucent.com"
        },
        "admarketplace.net": {
            "c": "Admarketplace",
            "u": "http://www.admarketplace.com/"
        },
        "admarketplace.com": {
            "c": "Admarketplace",
            "u": "http://www.admarketplace.com/"
        },
        "ampxchange.com": {
            "c": "Admarketplace",
            "u": "http://www.admarketplace.com/"
        },
        "admeta.com": {
            "c": "Admeta",
            "u": "http://www.admeta.com/"
        },
        "atemda.com": {
            "c": "Admeta",
            "u": "http://www.admeta.com/"
        },
        "admicro.vn": {
            "c": "Admicro",
            "u": "http://www.admicro.vn/"
        },
        "vcmedia.vn": {
            "c": "Vcmedia",
            "u": "http://vcmedia.vn/"
        },
        "admixer.co.kr": {
            "c": "Admixer",
            "u": "https://admixer.co.kr/main"
        },
        "admized.com": {
            "c": "Admized",
            "u": "http://www.admized.com/"
        },
        "admobile.com": {
            "c": "Admobile",
            "u": "http://admobile.com/"
        },
        "admotion.com": {
            "c": "Admotion",
            "u": "http://www.admotion.com/"
        },
        "nspmotion.com": {
            "c": "Admotion",
            "u": "http://www.admotion.com/"
        },
        "adnetik.com": {
            "c": "Adnetik",
            "u": "http://adnetik.com/"
        },
        "wtp101.com": {
            "c": "Adnetik",
            "u": "http://adnetik.com/"
        },
        "2o7.net": {
            "c": "Adobe",
            "u": "http://www.adobe.com/"
        },
        "auditude.com": {
            "c": "Adobe",
            "u": "http://www.adobe.com/"
        },
        "demdex.com": {
            "c": "Adobe",
            "u": "http://www.adobe.com/"
        },
        "demdex.net": {
            "c": "Adobe",
            "u": "http://www.adobe.com/"
        },
        "dmtracker.com": {
            "c": "Adobe",
            "u": "http://www.adobe.com/"
        },
        "efrontier.com": {
            "c": "Adobe",
            "u": "http://www.adobe.com/"
        },
        "everestads.net": {
            "c": "Adobe",
            "u": "http://www.adobe.com/"
        },
        "everestjs.net": {
            "c": "Adobe",
            "u": "http://www.adobe.com/"
        },
        "everesttech.net": {
            "c": "Adobe",
            "u": "http://www.adobe.com/"
        },
        "hitbox.com": {
            "c": "Adobe",
            "u": "http://www.adobe.com/"
        },
        "omniture.com": {
            "c": "Adobe",
            "u": "http://www.adobe.com/"
        },
        "omtrdc.net": {
            "c": "Adobe",
            "u": "http://www.adobe.com/"
        },
        "touchclarity.com": {
            "c": "Adobe",
            "u": "http://www.adobe.com/"
        },
        "adometry.com": {
            "c": "Adometry",
            "u": "http://www.adometry.com/"
        },
        "dmtry.com": {
            "c": "Adometry",
            "u": "http://www.adometry.com/"
        },
        "clickotmedia.com": {
            "c": "Adorika",
            "u": "http://www.clickotmedia.com/"
        },
        "adotmob.com": {
            "c": "Adotmob",
            "u": "https://adotmob.com/"
        },
        "adperium.com": {
            "c": "Adperium",
            "u": "http://www.adperium.com/"
        },
        "adpersia.com": {
            "c": "Adpersia",
            "u": "http://www.adpersia.com/"
        },
        "adstours.com": {
            "c": "AdsTours",
            "u": "http://www.adstours.com/"
        },
        "clickintext.net": {
            "c": "AdsTours",
            "u": "http://www.adstours.com/"
        },
        "adscience.nl": {
            "c": "Adscience",
            "u": "https://www.adscience.nl/"
        },
        "adsperity.com": {
            "c": "Adsperity",
            "u": "https://www.adsperity.com/"
        },
        "adsrevenue.net": {
            "c": "Adsrevenue.net",
            "u": "http://adsrevenue.net/"
        },
        "adx1.com": {
            "c": "Adsty",
            "u": "http://adsty.com/"
        },
        "adsty.com": {
            "c": "Adsty",
            "u": "http://adsty.com/"
        },
        "4dsply.com": {
            "c": "Adsupply",
            "u": "http://www.adsupply.com/"
        },
        "adsupply.com": {
            "c": "Adsupply",
            "u": "http://www.adsupply.com/"
        },
        "adswizz.com": {
            "c": "Adswizz",
            "u": "http://adswizz.com"
        },
        "adtegrity.com": {
            "c": "Adtegrity.com",
            "u": "http://www.adtegrity.com/"
        },
        "adtegrity.net": {
            "c": "Adtegrity.com",
            "u": "http://www.adtegrity.com/"
        },
        "adultadworld.com": {
            "c": "Adult AdWorld",
            "u": "http://adultadworld.com/"
        },
        "adultmoda.com": {
            "c": "Adultmoda",
            "u": "http://www.adultmoda.com/"
        },
        "adventive.com": {
            "c": "Adventive",
            "u": "http://adventive.com/"
        },
        "adnext.fr": {
            "c": "Adverline",
            "u": "http://www.adverline.com/"
        },
        "adverline.com": {
            "c": "Adverline",
            "u": "http://www.adverline.com/"
        },
        "adversal.com": {
            "c": "Adversal.com",
            "u": "http://www.adversal.com/"
        },
        "adv-adserver.com": {
            "c": "Adversal.com",
            "u": "http://www.adversal.com/"
        },
        "advertstream.com": {
            "c": "Advert Stream",
            "u": "http://www.advertstream.com/"
        },
        "adverticum.com": {
            "c": "Adverticum",
            "u": "http://www.adverticum.com/"
        },
        "adverticum.net": {
            "c": "Adverticum",
            "u": "http://www.adverticum.com/"
        },
        "advertise.com": {
            "c": "Advertise.com",
            "u": "http://www.advertise.com/"
        },
        "advertisespace.com": {
            "c": "AdvertiseSpace",
            "u": "http://www.advertisespace.com/"
        },
        "advisormedia.cz": {
            "c": "Advisor Media",
            "u": "http://advisormedia.cz/"
        },
        "adworx.at": {
            "c": "Adworx",
            "u": "http://adworx.at/"
        },
        "adworx.be": {
            "c": "Adworx",
            "u": "http://adworx.at/"
        },
        "adworx.nl": {
            "c": "Adworx",
            "u": "http://adworx.at/"
        },
        "adxvalue.com": {
            "c": "Adxvalue",
            "u": "http://adxvalue.com/"
        },
        "adxvalue.de": {
            "c": "Adxvalue",
            "u": "http://adxvalue.com/"
        },
        "adzerk.com": {
            "c": "Adzerk",
            "u": "http://www.adzerk.com/"
        },
        "adzerk.net": {
            "c": "Adzerk",
            "u": "http://www.adzerk.com/"
        },
        "aemedia.com": {
            "c": "Aegis Group",
            "u": "http://www.aemedia.com/"
        },
        "bluestreak.com": {
            "c": "Aegis Group",
            "u": "http://www.aemedia.com/"
        },
        "affectv.co.uk": {
            "c": "Affectv",
            "u": "http://affectv.co.uk/"
        },
        "affine.tv": {
            "c": "Affine",
            "u": "http://www.affine.tv/"
        },
        "affinesystems.com": {
            "c": "Affine",
            "u": "http://www.affine.tv/"
        },
        "affinity.com": {
            "c": "Affinity",
            "u": "http://www.affinity.com/"
        },
        "afdads.com": {
            "c": "AfterDownload",
            "u": "http://www.afterdownload.com/"
        },
        "afterdownload.com": {
            "c": "AfterDownload",
            "u": "http://www.afterdownload.com/"
        },
        "aim4media.com": {
            "c": "Aim4Media",
            "u": "http://aim4media.com/"
        },
        "airpush.com": {
            "c": "Airpush",
            "u": "http://www.airpush.com/"
        },
        "imiclk.com": {
            "c": "Akamai",
            "u": "http://www.akamai.com/"
        },
        "allstarmediagroup.com": {
            "c": "AllStar Media",
            "u": "http://allstarmediagroup.com/"
        },
        "aloodo.com": {
            "c": "Aloodo",
            "u": "https://aloodo.com/"
        },
        "amazon-adsystem.com": {
            "c": "Amazon.com",
            "u": "http://www.amazon.com/"
        },
        "amazon.ca": {
            "c": "Amazon.com",
            "u": "http://www.amazon.com/"
        },
        "amazon.co.jp": {
            "c": "Amazon.com",
            "u": "http://www.amazon.com/"
        },
        "amazon.co.uk": {
            "c": "Amazon.com",
            "u": "http://www.amazon.com/"
        },
        "amazon.de": {
            "c": "Amazon.com",
            "u": "http://www.amazon.com/"
        },
        "amazon.es": {
            "c": "Amazon.com",
            "u": "http://www.amazon.com/"
        },
        "amazon.fr": {
            "c": "Amazon.com",
            "u": "http://www.amazon.com/"
        },
        "amazon.it": {
            "c": "Amazon.com",
            "u": "http://www.amazon.com/"
        },
        "assoc-amazon.com": {
            "c": "Amazon.com",
            "u": "http://www.amazon.com/"
        },
        "adnetwork.vn": {
            "c": "Ambient Digital",
            "u": "http://ambientdigital.com.vn/"
        },
        "ambientdigital.com.vn": {
            "c": "Ambient Digital",
            "u": "http://ambientdigital.com.vn/"
        },
        "amobee.com": {
            "c": "Amobee",
            "u": "http://amobee.com/"
        },
        "andbeyond.media": {
            "c": "AndBeyond",
            "u": "http://andbeyond.media/"
        },
        "dsply.com": {
            "c": "Answers.com",
            "u": "http://www.answers.com/"
        },
        "appflood.com": {
            "c": "AppFlood",
            "u": "http://appflood.com/"
        },
        "adlantic.nl": {
            "c": "AppNexus",
            "u": "http://www.appnexus.com/"
        },
        "adnxs.com": {
            "c": "AppNexus",
            "u": "http://www.appnexus.com/"
        },
        "adrdgt.com": {
            "c": "AppNexus",
            "u": "http://www.appnexus.com/"
        },
        "appnexus.com": {
            "c": "AppNexus",
            "u": "http://www.appnexus.com/"
        },
        "alenty.com": {
            "c": "AppNexus",
            "u": "http://www.appnexus.com/"
        },
        "appenda.com": {
            "c": "Appenda",
            "u": "http://www.appenda.com/"
        },
        "appier.com": {
            "c": "Appier",
            "u": "http://appier.com/"
        },
        "applifier.com": {
            "c": "Applifier",
            "u": "http://www.applifier.com/"
        },
        "applovin.com": {
            "c": "Applovin",
            "u": "http://www.applovin.com/"
        },
        "appsflyer.com": {
            "c": "AppsFlyer",
            "u": "http://appsflyer.com/"
        },
        "arkwrightshomebrew.com": {
            "c": "Arkwrights Homebrew",
            "u": "http://www.arkwrightshomebrew.com/"
        },
        "ctasnet.com": {
            "c": "Arkwrights Homebrew",
            "u": "http://www.arkwrightshomebrew.com/"
        },
        "atoomic.com": {
            "c": "Atoomic.com",
            "u": "http://www.atoomic.com/"
        },
        "atrinsic.com": {
            "c": "Atrinsic",
            "u": "http://atrinsic.com/"
        },
        "audienceadnetwork.com": {
            "c": "Audience Ad Network",
            "u": "http://audienceadnetwork.com/"
        },
        "audience2media.com": {
            "c": "Audience2Media",
            "u": "http://www.audience2media.com/"
        },
        "audiencescience.com": {
            "c": "AudienceScience",
            "u": "http://www.audiencescience.com/"
        },
        "revsci.net": {
            "c": "AudienceScience",
            "u": "http://www.audiencescience.com/"
        },
        "targetingmarketplace.com": {
            "c": "AudienceScience",
            "u": "http://www.audiencescience.com/"
        },
        "wunderloop.net": {
            "c": "AudienceScience",
            "u": "http://www.audiencescience.com/"
        },
        "augme.com": {
            "c": "Augme",
            "u": "http://www.augme.com/"
        },
        "hipcricket.com": {
            "c": "Augme",
            "u": "http://www.augme.com/"
        },
        "augur.io": {
            "c": "Augur",
            "u": "http://www.augur.io/"
        },
        "avalanchers.com": {
            "c": "Avalanchers",
            "u": "http://www.avalanchers.com/"
        },
        "avantlink.com": {
            "c": "AvantLink",
            "u": "http://www.avantlink.com/"
        },
        "avsads.com": {
            "c": "Avsads",
            "u": "http://avsads.com/"
        },
        "adgear.com": {
            "c": "BLOOM Digital Platforms",
            "u": "http://bloom-hq.com/"
        },
        "bloom-hq.com": {
            "c": "BLOOM Digital Platforms",
            "u": "http://bloom-hq.com/"
        },
        "adgrx.com": {
            "c": "BLOOM Digital Platforms",
            "u": "http://bloom-hq.com/"
        },
        "buzzcity.com": {
            "c": "BuzzCity",
            "u": "http://www.buzzcity.com/"
        },
        "bvmedia.ca": {
            "c": "BV! MEDIA",
            "u": "http://www.buzzcity.com/"
        },
        "networldmedia.com": {
            "c": "BV! MEDIA",
            "u": "http://www.buzzcity.com/"
        },
        "networldmedia.net": {
            "c": "BV! MEDIA",
            "u": "http://www.buzzcity.com/"
        },
        "backbeatmedia.com": {
            "c": "BackBeat Media",
            "u": "http://www.backbeatmedia.com/"
        },
        "bannerconnect.net": {
            "c": "Bannerconnect",
            "u": "http://www.bannerconnect.net/"
        },
        "barilliance.com": {
            "c": "Barilliance",
            "u": "http://www.barilliance.com/"
        },
        "baronsoffers.com": {
            "c": "BaronsNetworks",
            "u": "http://baronsoffers.com/"
        },
        "batanga.com": {
            "c": "Batanga Network",
            "u": "http://www.batanganetwork.com/"
        },
        "batanganetwork.com": {
            "c": "Batanga Network",
            "u": "http://www.batanganetwork.com/"
        },
        "beanstockmedia.com": {
            "c": "Beanstock Media",
            "u": "http://www.beanstockmedia.com/"
        },
        "begun.ru": {
            "c": "Begun",
            "u": "http://www.begun.ru/"
        },
        "betgenius.com": {
            "c": "Betgenius",
            "u": "http://www.betgenius.com/"
        },
        "connextra.com": {
            "c": "Betgenius",
            "u": "http://www.betgenius.com/"
        },
        "bidvertiser.com": {
            "c": "BidVertiser",
            "u": "http://www.bidvertiser.com/"
        },
        "binlayer.com": {
            "c": "BinLayer",
            "u": "http://binlayer.com/"
        },
        "bitcoinplus.com": {
            "c": "Bitcoin Plus",
            "u": "http://www.bitcoinplus.com/"
        },
        "bittads.com": {
            "c": "BittAds",
            "u": "http://www.bittads.com/"
        },
        "bizo.com": {
            "c": "Bizo",
            "u": "http://www.bizo.com/"
        },
        "bizographics.com": {
            "c": "Bizo",
            "u": "http://www.bizo.com/"
        },
        "blacklabelads.com": {
            "c": "Black Label Ads",
            "u": "http://www.blacklabelads.com/"
        },
        "blogcatalog.com": {
            "c": "BlogCatalog",
            "u": "http://www.blogcatalog.com/"
        },
        "theblogfrog.com": {
            "c": "BlogFrog",
            "u": "http://theblogfrog.com/"
        },
        "blogher.com": {
            "c": "BlogHer",
            "u": "http://www.blogher.com/"
        },
        "blogherads.com": {
            "c": "BlogHer",
            "u": "http://www.blogher.com/"
        },
        "blogrollr.com": {
            "c": "BlogRollr",
            "u": "http://blogrollr.com/"
        },
        "bloomreach.com": {
            "c": "BloomReach",
            "u": "http://www.bloomreach.com/"
        },
        "brcdn.com": {
            "c": "BloomReach",
            "u": "http://www.bloomreach.com/"
        },
        "brsrvr.com": {
            "c": "BloomReach",
            "u": "http://www.bloomreach.com/"
        },
        "blutrumpet.com": {
            "c": "Blu Trumpet",
            "u": "http://www.blutrumpet.com/"
        },
        "bluecava.com": {
            "c": "BlueCava",
            "u": "http://www.bluecava.com/"
        },
        "bkrtx.com": {
            "c": "BlueKai",
            "u": "http://www.bluekai.com/"
        },
        "bluekai.com": {
            "c": "BlueKai",
            "u": "http://www.bluekai.com/"
        },
        "tracksimple.com": {
            "c": "BlueKai",
            "u": "http://www.bluekai.com/"
        },
        "brainient.com": {
            "c": "Brainient",
            "u": "http://brainient.com/"
        },
        "brandaffinity.net": {
            "c": "Brand Affinity Technologies",
            "u": "http://www.brandaffinity.net/"
        },
        "brand.net": {
            "c": "Brand.net",
            "u": "http://www.brand.net/"
        },
        "brandscreen.com": {
            "c": "Brandscreen",
            "u": "http://www.brandscreen.com/"
        },
        "rtbidder.net": {
            "c": "Brandscreen",
            "u": "http://www.brandscreen.com/"
        },
        "brightroll.com": {
            "c": "BrightRoll",
            "u": "http://www.brightroll.com/"
        },
        "btrll.com": {
            "c": "BrightRoll",
            "u": "http://www.brightroll.com/"
        },
        "brighttag.com": {
            "c": "BrightTag",
            "u": "http://www.brighttag.com/"
        },
        "btstatic.com": {
            "c": "BrightTag",
            "u": "http://www.brighttag.com/"
        },
        "thebrighttag.com": {
            "c": "BrightTag",
            "u": "http://www.brighttag.com/"
        },
        "brilig.com": {
            "c": "Brilig",
            "u": "http://www.brilig.com/"
        },
        "burstbeacon.com": {
            "c": "Burst Media",
            "u": "http://www.burstmedia.com/"
        },
        "burstdirectads.com": {
            "c": "Burst Media",
            "u": "http://www.burstmedia.com/"
        },
        "burstmedia.com": {
            "c": "Burst Media",
            "u": "http://www.burstmedia.com/"
        },
        "burstnet.com": {
            "c": "Burst Media",
            "u": "http://www.burstmedia.com/"
        },
        "giantrealm.com": {
            "c": "Burst Media",
            "u": "http://www.burstmedia.com/"
        },
        "burstly.com": {
            "c": "Burstly",
            "u": "http://www.burstly.com/"
        },
        "businessol.com": {
            "c": "BusinessOnline",
            "u": "http://www.businessol.com/"
        },
        "beaconads.com": {
            "c": "BuySellAds",
            "u": "http://buysellads.com/"
        },
        "buysellads.com": {
            "c": "BuySellAds",
            "u": "http://buysellads.com/"
        },
        "buysight.com": {
            "c": "Buysight",
            "u": "http://www.buysight.com/"
        },
        "permuto.com": {
            "c": "Buysight",
            "u": "http://www.buysight.com/"
        },
        "pulsemgr.com": {
            "c": "Buysight",
            "u": "http://www.buysight.com/"
        },
        "buzzparadise.com": {
            "c": "BuzzParadise",
            "u": "http://www.buzzparadise.com/"
        },
        "capitaldata.fr": {
            "c": "CAPITALDATA",
            "u": "http://www.capitaldata.fr/"
        },
        "cbproads.com": {
            "c": "CBproADS",
            "u": "http://www.cbproads.com/"
        },
        "contaxe.com": {
            "c": "CONTAXE",
            "u": "http://www.contaxe.com/"
        },
        "contextweb.com": {
            "c": "CONTEXTWEB",
            "u": "http://www.contextweb.com/"
        },
        "admailtiser.com": {
            "c": "CONTEXTin",
            "u": "http://www.contextin.com/"
        },
        "contextin.com": {
            "c": "CONTEXTin",
            "u": "http://www.contextin.com/"
        },
        "cpmstar.com": {
            "c": "CPMStar",
            "u": "http://www.cpmstar.com/"
        },
        "cpxadroit.com": {
            "c": "CPX Interactive",
            "u": "http://www.cpxinteractive.com/"
        },
        "cpxinteractive.com": {
            "c": "CPX Interactive",
            "u": "http://www.cpxinteractive.com/"
        },
        "adreadypixels.com": {
            "c": "CPX Interactive",
            "u": "http://www.cpxinteractive.com/"
        },
        "cadreon.com": {
            "c": "Cadreon",
            "u": "http://www.cadreon.com/"
        },
        "campaigngrid.com": {
            "c": "CampaignGrid",
            "u": "http://www.campaigngrid.com/"
        },
        "caraytech.com.ar": {
            "c": "Caraytech",
            "u": "http://www.caraytech.com.ar/"
        },
        "e-planning.net": {
            "c": "Caraytech",
            "u": "http://www.caraytech.com.ar/"
        },
        "cart.ro": {
            "c": "Cart.ro",
            "u": "http://www.cart.ro/"
        },
        "statistics.ro": {
            "c": "Cart.ro",
            "u": "http://www.cart.ro/"
        },
        "casalemedia.com": {
            "c": "Casale Media",
            "u": "http://www.casalemedia.com/"
        },
        "medianet.com": {
            "c": "Casale Media",
            "u": "http://www.casalemedia.com/"
        },
        "chango.ca": {
            "c": "Chango",
            "u": "http://www.chango.com/"
        },
        "chango.com": {
            "c": "Chango",
            "u": "http://www.chango.com/"
        },
        "channelintelligence.com": {
            "c": "Channel Intelligence",
            "u": "http://www.channelintelligence.com/"
        },
        "channeladvisor.com": {
            "c": "ChannelAdvisor",
            "u": "http://www.channeladvisor.com/"
        },
        "searchmarketing.com": {
            "c": "ChannelAdvisor",
            "u": "http://www.channeladvisor.com/"
        },
        "chartboost.com": {
            "c": "Chartboost",
            "u": "https://www.chartboost.com/"
        },
        "checkm8.com": {
            "c": "CheckM8",
            "u": "http://www.checkm8.com/"
        },
        "chitika.com": {
            "c": "Chitika",
            "u": "http://chitika.com/"
        },
        "chitika.net": {
            "c": "Chitika",
            "u": "http://chitika.com/"
        },
        "choicestream.com": {
            "c": "ChoiceStream",
            "u": "http://www.choicestream.com/"
        },
        "clearsaleing.com": {
            "c": "ClearSaleing",
            "u": "http://www.clearsaleing.com/"
        },
        "csdata1.com": {
            "c": "ClearSaleing",
            "u": "http://www.clearsaleing.com/"
        },
        "csdata2.com": {
            "c": "ClearSaleing",
            "u": "http://www.clearsaleing.com/"
        },
        "csdata3.com": {
            "c": "ClearSaleing",
            "u": "http://www.clearsaleing.com/"
        },
        "clearsightinteractive.com": {
            "c": "ClearSight Interactive",
            "u": "http://www.clearsightinteractive.com/"
        },
        "csi-tracking.com": {
            "c": "ClearSight Interactive",
            "u": "http://www.clearsightinteractive.com/"
        },
        "clearsearchmedia.com": {
            "c": "Clearsearch Media",
            "u": "http://www.clearsearchmedia.com/"
        },
        "csm-secure.com": {
            "c": "Clearsearch Media",
            "u": "http://www.clearsearchmedia.com/"
        },
        "clicmanager.fr": {
            "c": "ClicManager",
            "u": "http://www.clicmanager.fr/"
        },
        "clickaider.com": {
            "c": "ClickAider",
            "u": "http://clickaider.com/"
        },
        "clickdimensions.com": {
            "c": "ClickDimensions",
            "u": "http://www.clickdimensions.com/"
        },
        "clickdistrict.com": {
            "c": "ClickDistrict",
            "u": "http://www.clickdistrict.com/"
        },
        "creative-serving.com": {
            "c": "ClickDistrict",
            "u": "http://www.clickdistrict.com/"
        },
        "conversiondashboard.com": {
            "c": "ClickFuel",
            "u": "http://clickfuel.com/"
        },
        "clickinc.com": {
            "c": "ClickInc",
            "u": "http://www.clickinc.com/"
        },
        "clickbooth.com": {
            "c": "Clickbooth",
            "u": "http://www.clickbooth.com/"
        },
        "adtoll.com": {
            "c": "Clickbooth",
            "u": "http://www.clickbooth.com/"
        },
        "clicksor.com": {
            "c": "Clicksor",
            "u": "http://www.clicksor.com/"
        },
        "clicksor.net": {
            "c": "Clicksor",
            "u": "http://www.clicksor.com/"
        },
        "clickwinks.com": {
            "c": "Clickwinks",
            "u": "http://www.clickwinks.com/"
        },
        "clovenetwork.com": {
            "c": "Clove Network",
            "u": "http://www.clovenetwork.com/"
        },
        "cmads.com.tw": {
            "c": "Cognitive Match",
            "u": "http://www.cognitivematch.com/"
        },
        "cmadsasia.com": {
            "c": "Cognitive Match",
            "u": "http://www.cognitivematch.com/"
        },
        "cmadseu.com": {
            "c": "Cognitive Match",
            "u": "http://www.cognitivematch.com/"
        },
        "cmmeglobal.com": {
            "c": "Cognitive Match",
            "u": "http://www.cognitivematch.com/"
        },
        "cognitivematch.com": {
            "c": "Cognitive Match",
            "u": "http://www.cognitivematch.com/"
        },
        "coinhive.com": {
            "c": "CoinHive",
            "u": "https://coinhive.com"
        },
        "coin-hive.com": {
            "c": "CoinHive",
            "u": "https://coinhive.com"
        },
        "collective-media.net": {
            "c": "Collective",
            "u": "http://collective.com/"
        },
        "collective.com": {
            "c": "Collective",
            "u": "http://collective.com/"
        },
        "oggifinogi.com": {
            "c": "Collective",
            "u": "http://collective.com/"
        },
        "tumri.com": {
            "c": "Collective",
            "u": "http://collective.com/"
        },
        "tumri.net": {
            "c": "Collective",
            "u": "http://collective.com/"
        },
        "yt1187.net": {
            "c": "Collective",
            "u": "http://collective.com/"
        },
        "apmebf.com": {
            "c": "Commission Junction",
            "u": "http://www.cj.com/"
        },
        "awltovhc.com": {
            "c": "Commission Junction",
            "u": "http://www.cj.com/"
        },
        "cj.com": {
            "c": "Commission Junction",
            "u": "http://www.cj.com/"
        },
        "ftjcfx.com": {
            "c": "Commission Junction",
            "u": "http://www.cj.com/"
        },
        "kcdwa.com": {
            "c": "Commission Junction",
            "u": "http://www.cj.com/"
        },
        "qksz.com": {
            "c": "Commission Junction",
            "u": "http://www.cj.com/"
        },
        "qksz.net": {
            "c": "Commission Junction",
            "u": "http://www.cj.com/"
        },
        "tqlkg.com": {
            "c": "Commission Junction",
            "u": "http://www.cj.com/"
        },
        "yceml.net": {
            "c": "Commission Junction",
            "u": "http://www.cj.com/"
        },
        "communicatorcorp.com": {
            "c": "Communicator Corp",
            "u": "http://www.communicatorcorp.com/"
        },
        "compasslabs.com": {
            "c": "Compass Labs",
            "u": "http://compasslabs.com/"
        },
        "complex.com": {
            "c": "Complex Media",
            "u": "http://www.complexmedianetwork.com/"
        },
        "complexmedianetwork.com": {
            "c": "Complex Media",
            "u": "http://www.complexmedianetwork.com/"
        },
        "consiliummedia.com": {
            "c": "Consilium Media",
            "u": "http://www.consiliummedia.com/"
        },
        "agencytradingdesk.net": {
            "c": "ContextuAds",
            "u": "http://www.contextuads.com/"
        },
        "contextuads.com": {
            "c": "ContextuAds",
            "u": "http://www.contextuads.com/"
        },
        "convergedirect.com": {
            "c": "ConvergeDirect",
            "u": "http://www.convergedirect.com/"
        },
        "convergetrack.com": {
            "c": "ConvergeDirect",
            "u": "http://www.convergedirect.com/"
        },
        "conversionruler.com": {
            "c": "ConversionRuler",
            "u": "http://www.conversionruler.com/"
        },
        "conversive.nl": {
            "c": "Conversive",
            "u": "http://www.conversive.nl/"
        },
        "coremotives.com": {
            "c": "CoreMotives",
            "u": "http://coremotives.com/"
        },
        "adify.com": {
            "c": "Cox Digital Solutions",
            "u": "http://www.coxdigitalsolutions.com/"
        },
        "afy11.net": {
            "c": "Cox Digital Solutions",
            "u": "http://www.coxdigitalsolutions.com/"
        },
        "coxdigitalsolutions.com": {
            "c": "Cox Digital Solutions",
            "u": "http://www.coxdigitalsolutions.com/"
        },
        "creafi.com": {
            "c": "Creafi",
            "u": "http://www.creafi.com/"
        },
        "crimtan.com": {
            "c": "Crimtan",
            "u": "http://www.crimtan.com/"
        },
        "crispmedia.com": {
            "c": "Crisp Media",
            "u": "http://www.crispmedia.com/"
        },
        "criteo.com": {
            "c": "Criteo",
            "u": "http://www.criteo.com/"
        },
        "criteo.net": {
            "c": "Criteo",
            "u": "http://www.criteo.com/"
        },
        "crosspixel.net": {
            "c": "Cross Pixel",
            "u": "http://crosspixel.net/"
        },
        "crosspixelmedia.com": {
            "c": "Cross Pixel",
            "u": "http://crosspixel.net/"
        },
        "crsspxl.com": {
            "c": "Cross Pixel",
            "u": "http://crosspixel.net/"
        },
        "crypto-loot.com": {
            "c": "CryptoLoot",
            "u": "https://crypto-loot.com"
        },
        "cyberplex.com": {
            "c": "Cyberplex",
            "u": "http://www.cyberplex.com/"
        },
        "dc-storm.com": {
            "c": "DC Storm",
            "u": "http://www.dc-storm.com/"
        },
        "stormiq.com": {
            "c": "DC Storm",
            "u": "http://www.dc-storm.com/"
        },
        "dgit.com": {
            "c": "DG",
            "u": "http://www.dgit.com/"
        },
        "eyeblaster.com": {
            "c": "DG",
            "u": "http://www.dgit.com/"
        },
        "eyewonder.com": {
            "c": "DG",
            "u": "http://www.dgit.com/"
        },
        "mdadx.com": {
            "c": "DG",
            "u": "http://www.dgit.com/"
        },
        "serving-sys.com": {
            "c": "DG",
            "u": "http://www.dgit.com/"
        },
        "unicast.com": {
            "c": "DG",
            "u": "http://www.dgit.com/"
        },
        "ds-iq.com": {
            "c": "DS-IQ",
            "u": "http://www.ds-iq.com/"
        },
        "dsnrgroup.com": {
            "c": "DSNR Group",
            "u": "http://www.dsnrmg.com/"
        },
        "dsnrmg.com": {
            "c": "DSNR Group",
            "u": "http://www.dsnrmg.com/"
        },
        "traffiliate.com": {
            "c": "DSNR Group",
            "u": "http://www.dsnrmg.com/"
        },
        "z5x.com": {
            "c": "DSNR Group",
            "u": "http://www.dsnrmg.com/"
        },
        "z5x.net": {
            "c": "DSNR Group",
            "u": "http://www.dsnrmg.com/"
        },
        "dada.pro": {
            "c": "Dada",
            "u": "http://dada.pro/"
        },
        "simply.com": {
            "c": "Dada",
            "u": "http://dada.pro/"
        },
        "dataxu.com": {
            "c": "DataXu",
            "u": "http://www.dataxu.com/"
        },
        "dataxu.net": {
            "c": "DataXu",
            "u": "http://www.dataxu.com/"
        },
        "mexad.com": {
            "c": "DataXu",
            "u": "http://www.dataxu.com/"
        },
        "w55c.net": {
            "c": "DataXu",
            "u": "http://www.dataxu.com/"
        },
        "nexac.com": {
            "c": "Datalogix",
            "u": "http://www.datalogix.com/"
        },
        "nextaction.net": {
            "c": "Datalogix",
            "u": "http://www.datalogix.com/"
        },
        "datonics.com": {
            "c": "Datonics",
            "u": "http://datonics.com/"
        },
        "pro-market.net": {
            "c": "Datonics",
            "u": "http://datonics.com/"
        },
        "datranmedia.com": {
            "c": "Datran Media",
            "u": "http://www.datranmedia.com/"
        },
        "displaymarketplace.com": {
            "c": "Datran Media",
            "u": "http://www.datranmedia.com/"
        },
        "datvantage.com": {
            "c": "Datvantage",
            "u": "http://datvantage.com/"
        },
        "dedicatedmedia.com": {
            "c": "Dedicated Media",
            "u": "http://www.dedicatedmedia.com/"
        },
        "dedicatednetworks.com": {
            "c": "Dedicated Media",
            "u": "http://www.dedicatedmedia.com/"
        },
        "delivr.com": {
            "c": "Delivr",
            "u": "http://delivr.com/"
        },
        "percentmobile.com": {
            "c": "Delivr",
            "u": "http://delivr.com/"
        },
        "adaction.se": {
            "c": "Delta Projects",
            "u": "http://www.deltaprojects.se/"
        },
        "de17a.com": {
            "c": "Delta Projects",
            "u": "http://www.deltaprojects.se/"
        },
        "deltaprojects.se": {
            "c": "Delta Projects",
            "u": "http://www.deltaprojects.se/"
        },
        "demandmedia.com": {
            "c": "Demand Media",
            "u": "http://www.demandmedia.com/"
        },
        "indieclick.com": {
            "c": "Demand Media",
            "u": "http://www.demandmedia.com/"
        },
        "adcloud.com": {
            "c": "Deutsche Post DHL",
            "u": "http://www.dp-dhl.com/"
        },
        "adcloud.net": {
            "c": "Deutsche Post DHL",
            "u": "http://www.dp-dhl.com/"
        },
        "dp-dhl.com": {
            "c": "Deutsche Post DHL",
            "u": "http://www.dp-dhl.com/"
        },
        "developermedia.com": {
            "c": "Developer Media",
            "u": "http://developermedia.com/"
        },
        "lqcdn.com": {
            "c": "Developer Media",
            "u": "http://developermedia.com/"
        },
        "did-it.com": {
            "c": "Didit",
            "u": "http://www.didit.com/"
        },
        "didit.com": {
            "c": "Didit",
            "u": "http://www.didit.com/"
        },
        "digitalriver.com": {
            "c": "Digital River",
            "u": "http://www.digitalriver.com/"
        },
        "keywordmax.com": {
            "c": "Digital River",
            "u": "http://www.digitalriver.com/"
        },
        "netflame.cc": {
            "c": "Digital River",
            "u": "http://www.digitalriver.com/"
        },
        "digitaltarget.ru": {
            "c": "Digital Target",
            "u": "http://digitaltarget.ru"
        },
        "digitalwindow.com": {
            "c": "Digital Window",
            "u": "http://www.digitalwindow.com/"
        },
        "perfiliate.com": {
            "c": "Digital Window",
            "u": "http://www.digitalwindow.com/"
        },
        "digitize.ie": {
            "c": "Digitize",
            "u": "http://www.digitize.ie/"
        },
        "directresponsegroup.com": {
            "c": "Direct Response Group",
            "u": "http://www.directresponsegroup.com/"
        },
        "ppctracking.net": {
            "c": "Direct Response Group",
            "u": "http://www.directresponsegroup.com/"
        },
        "directadvert.ru": {
            "c": "DirectAdvert",
            "u": "http://www.directadvert.ru/"
        },
        "directtrack.com": {
            "c": "Directtrack",
            "u": "http://directtrack.com/"
        },
        "doublepimp.com": {
            "c": "DoublePimp",
            "u": "http://doublepimp.com/"
        },
        "bid-tag.com": {
            "c": "DoublePositive",
            "u": "http://www.doublepositive.com/"
        },
        "doublepositive.com": {
            "c": "DoublePositive",
            "u": "http://www.doublepositive.com/"
        },
        "doubleverify.com": {
            "c": "DoubleVerify",
            "u": "http://www.doubleverify.com/"
        },
        "adsymptotic.com": {
            "c": "Drawbridge",
            "u": "http://http://drawbrid.ge/"
        },
        "drawbrid.ge": {
            "c": "Drawbridge",
            "u": "http://http://drawbrid.ge/"
        },
        "dynamicoxygen.com": {
            "c": "DynamicOxygen",
            "u": "http://www.dynamicoxygen.com/"
        },
        "exitjunction.com": {
            "c": "DynamicOxygen",
            "u": "http://www.dynamicoxygen.com/"
        },
        "dynamicyield.com": {
            "c": "DynamicYield",
            "u": "https://www.dynamicyield.com/"
        },
        "eqads.com": {
            "c": "EQ Ads",
            "u": "http://www.eqads.com/"
        },
        "extensions.ru": {
            "c": "EXTENSIONS.RU",
            "u": "http://extensions.ru/"
        },
        "earnify.com": {
            "c": "Earnify",
            "u": "http://earnify.com/"
        },
        "effectivemeasure.com": {
            "c": "Effective Measure",
            "u": "http://www.effectivemeasure.com/"
        },
        "effectivemeasure.net": {
            "c": "Effective Measure",
            "u": "http://www.effectivemeasure.com/"
        },
        "eleavers.com": {
            "c": "Eleavers",
            "u": "http://eleavers.com/"
        },
        "emediate.biz": {
            "c": "Emediate",
            "u": "http://www.emediate.com/"
        },
        "emediate.com": {
            "c": "Emediate",
            "u": "http://www.emediate.com/"
        },
        "emediate.dk": {
            "c": "Emediate",
            "u": "http://www.emediate.com/"
        },
        "emediate.eu": {
            "c": "Emediate",
            "u": "http://www.emediate.com/"
        },
        "usemax.de": {
            "c": "Emego",
            "u": "http://www.usemax.de/"
        },
        "enecto.com": {
            "c": "Enecto",
            "u": "http://www.enecto.com/"
        },
        "appmetrx.com": {
            "c": "Engago Technology",
            "u": "http://www.engago.com/"
        },
        "engago.com": {
            "c": "Engago Technology",
            "u": "http://www.engago.com/"
        },
        "enginenetwork.com": {
            "c": "Engine Network",
            "u": "http://enginenetwork.com/"
        },
        "ensighten.com": {
            "c": "Ensighten",
            "u": "http://www.ensighten.com/"
        },
        "entireweb.com": {
            "c": "Entireweb",
            "u": "http://www.entireweb.com/"
        },
        "epicadvertising.com": {
            "c": "Epic Media Group",
            "u": "http://www.theepicmediagroup.com/"
        },
        "epicmarketplace.com": {
            "c": "Epic Media Group",
            "u": "http://www.theepicmediagroup.com/"
        },
        "epicmobileads.com": {
            "c": "Epic Media Group",
            "u": "http://www.theepicmediagroup.com/"
        },
        "theepicmediagroup.com": {
            "c": "Epic Media Group",
            "u": "http://www.theepicmediagroup.com/"
        },
        "trafficmp.com": {
            "c": "Epic Media Group",
            "u": "http://www.theepicmediagroup.com/"
        },
        "epsilon.com": {
            "c": "Epsilon",
            "u": "http://www.epsilon.com/"
        },
        "ero-advertising.com": {
            "c": "EroAdvertising",
            "u": "http://www.ero-advertising.com/"
        },
        "etargetnet.com": {
            "c": "Etarget",
            "u": "http://etargetnet.com/"
        },
        "etarget.eu": {
            "c": "Etarget",
            "u": "http://etargetnet.com/"
        },
        "adwitserver.com": {
            "c": "Etineria",
            "u": "http://www.etineria.com/"
        },
        "etineria.com": {
            "c": "Etineria",
            "u": "http://www.etineria.com/"
        },
        "everydayhealth.com": {
            "c": "Everyday Health",
            "u": "http://www.everydayhealth.com/"
        },
        "waterfrontmedia.com": {
            "c": "Everyday Health",
            "u": "http://www.everydayhealth.com/"
        },
        "betrad.com": {
            "c": "Evidon",
            "u": "http://www.evidon.com/"
        },
        "evidon.com": {
            "c": "Evidon",
            "u": "http://www.evidon.com/"
        },
        "engineseeker.com": {
            "c": "Evisions Marketing",
            "u": "http://www.evisionsmarketing.com/"
        },
        "evisionsmarketing.com": {
            "c": "Evisions Marketing",
            "u": "http://www.evisionsmarketing.com/"
        },
        "evolvemediacorp.com": {
            "c": "Evolve",
            "u": "http://www.evolvemediacorp.com/"
        },
        "evolvemediametrics.com": {
            "c": "Evolve",
            "u": "http://www.evolvemediacorp.com/"
        },
        "gorillanation.com": {
            "c": "Evolve",
            "u": "http://www.evolvemediacorp.com/"
        },
        "exoclick.com": {
            "c": "ExoClick",
            "u": "http://www.exoclick.com/"
        },
        "audienceiq.com": {
            "c": "Experian",
            "u": "http://www.experian.com/"
        },
        "experian.com": {
            "c": "Experian",
            "u": "http://www.experian.com/"
        },
        "pricegrabber.com": {
            "c": "Experian",
            "u": "http://www.experian.com/"
        },
        "adotube.com": {
            "c": "Exponential Interactive",
            "u": "http://www.exponential.com/"
        },
        "exponential.com": {
            "c": "Exponential Interactive",
            "u": "http://www.exponential.com/"
        },
        "fulltango.com": {
            "c": "Exponential Interactive",
            "u": "http://www.exponential.com/"
        },
        "tribalfusion.com": {
            "c": "Exponential Interactive",
            "u": "http://www.exponential.com/"
        },
        "extensionfactory.com": {
            "c": "Extension Factory",
            "u": "http://www.extensionfactory.com/"
        },
        "eyeconomy.co.uk": {
            "c": "Eyeconomy",
            "u": "http://www.eyeconomy.co.uk/"
        },
        "eyeconomy.com": {
            "c": "Eyeconomy",
            "u": "http://www.eyeconomy.co.uk/"
        },
        "sublimemedia.net": {
            "c": "Eyeconomy",
            "u": "http://www.eyeconomy.co.uk/"
        },
        "eyeviewdigital.com": {
            "c": "Eyeviewdigital",
            "u": "http://www.eyeviewdigital.com/"
        },
        "adsfac.eu": {
            "c": "Facilitate Digital",
            "u": "http://www.facilitatedigital.com/"
        },
        "adsfac.info": {
            "c": "Facilitate Digital",
            "u": "http://www.facilitatedigital.com/"
        },
        "adsfac.net": {
            "c": "Facilitate Digital",
            "u": "http://www.facilitatedigital.com/"
        },
        "adsfac.sg": {
            "c": "Facilitate Digital",
            "u": "http://www.facilitatedigital.com/"
        },
        "adsfac.us": {
            "c": "Facilitate Digital",
            "u": "http://www.facilitatedigital.com/"
        },
        "facilitatedigital.com": {
            "c": "Facilitate Digital",
            "u": "http://www.facilitatedigital.com/"
        },
        "fairfax.com.au": {
            "c": "Fairfax Media",
            "u": "http://www.fxj.com.au/"
        },
        "fxj.com.au": {
            "c": "Fairfax Media",
            "u": "http://www.fxj.com.au/"
        },
        "fathomdelivers.com": {
            "c": "Fathom",
            "u": "http://www.fathomdelivers.com/"
        },
        "fathomseo.com": {
            "c": "Fathom",
            "u": "http://www.fathomdelivers.com/"
        },
        "federatedmedia.net": {
            "c": "Federated Media",
            "u": "http://www.federatedmedia.net/"
        },
        "fmpub.net": {
            "c": "Federated Media",
            "u": "http://www.federatedmedia.net/"
        },
        "lijit.com": {
            "c": "Federated Media",
            "u": "http://www.federatedmedia.net/"
        },
        "fetchback.com": {
            "c": "FetchBack",
            "u": "http://www.fetchback.com/"
        },
        "fiksu.com": {
            "c": "Fiksu",
            "u": "http://www.fiksu.com/"
        },
        "financialcontent.com": {
            "c": "FinancialContent",
            "u": "http://www.financialcontent.com/"
        },
        "fizzbuzzmedia.com": {
            "c": "Fizz-Buzz Media",
            "u": "http://www.fizzbuzzmedia.com/"
        },
        "fizzbuzzmedia.net": {
            "c": "Fizz-Buzz Media",
            "u": "http://www.fizzbuzzmedia.com/"
        },
        "flashtalking.com": {
            "c": "Flashtalking",
            "u": "http://www.flashtalking.com/"
        },
        "flite.com": {
            "c": "Flite",
            "u": "http://www.flite.com/"
        },
        "widgetserver.com": {
            "c": "Flite",
            "u": "http://www.flite.com/"
        },
        "fluct.jp": {
            "c": "Fluct",
            "u": "https://corp.fluct.jp/"
        },
        "adingo.jp": {
            "c": "Fluct",
            "u": "https://corp.fluct.jp/"
        },
        "flurry.com": {
            "c": "Flurry",
            "u": "http://www.flurry.com/"
        },
        "flytxt.com": {
            "c": "Flytxt",
            "u": "http://www.flytxt.com/"
        },
        "brandsideplatform.com": {
            "c": "Forbes",
            "u": "http://www.forbes.com/"
        },
        "forbes.com": {
            "c": "Forbes",
            "u": "http://www.forbes.com/"
        },
        "fimserve.com": {
            "c": "Fox One Stop Media",
            "u": "http://www.foxonestop.com/"
        },
        "foxnetworks.com": {
            "c": "Fox One Stop Media",
            "u": "http://www.foxonestop.com/"
        },
        "foxonestop.com": {
            "c": "Fox One Stop Media",
            "u": "http://www.foxonestop.com/"
        },
        "mobsmith.com": {
            "c": "Fox One Stop Media",
            "u": "http://www.foxonestop.com/"
        },
        "myads.com": {
            "c": "Fox One Stop Media",
            "u": "http://www.foxonestop.com/"
        },
        "othersonline.com": {
            "c": "Fox One Stop Media",
            "u": "http://www.foxonestop.com/"
        },
        "rubiconproject.com": {
            "c": "Fox One Stop Media",
            "u": "http://www.foxonestop.com/"
        },
        "fout.jp": {
            "c": "FreakOut",
            "u": "http://fout.jp/"
        },
        "freedom.com": {
            "c": "Freedom Communications",
            "u": "http://www.freedom.com/"
        },
        "adultfriendfinder.com": {
            "c": "FriendFinder Networks",
            "u": "http://ffn.com/"
        },
        "ffn.com": {
            "c": "FriendFinder Networks",
            "u": "http://ffn.com/"
        },
        "pop6.com": {
            "c": "FriendFinder Networks",
            "u": "http://ffn.com/"
        },
        "double-check.com": {
            "c": "Frog Sex",
            "u": "http://www.frogsex.com/"
        },
        "frogsex.com": {
            "c": "Frog Sex",
            "u": "http://www.frogsex.com/"
        },
        "futureads.com": {
            "c": "Future Ads",
            "u": "https://www.futureads.com/"
        },
        "resultlinks.com": {
            "c": "Future Ads",
            "u": "https://www.futureads.com/"
        },
        "gb-world.net": {
            "c": "GB-World",
            "u": "http://www.gb-world.net/"
        },
        "geniegroupltd.co.uk": {
            "c": "GENIE GROUP",
            "u": "http://www.geniegroupltd.co.uk/"
        },
        "gismads.jp": {
            "c": "GISMAds",
            "u": "http://www.gismads.jp/"
        },
        "gsicommerce.com": {
            "c": "GSI Commerce",
            "u": "http://www.gsicommerce.com/"
        },
        "gsimedia.net": {
            "c": "GSI Commerce",
            "u": "http://www.gsicommerce.com/"
        },
        "pepperjam.com": {
            "c": "GSI Commerce",
            "u": "http://www.gsicommerce.com/"
        },
        "pjatr.com": {
            "c": "GSI Commerce",
            "u": "http://www.gsicommerce.com/"
        },
        "pjtra.com": {
            "c": "GSI Commerce",
            "u": "http://www.gsicommerce.com/"
        },
        "pntra.com": {
            "c": "GSI Commerce",
            "u": "http://www.gsicommerce.com/"
        },
        "pntrac.com": {
            "c": "GSI Commerce",
            "u": "http://www.gsicommerce.com/"
        },
        "pntrs.com": {
            "c": "GSI Commerce",
            "u": "http://www.gsicommerce.com/"
        },
        "game-advertising-online.com": {
            "c": "Game Advertising Online",
            "u": "http://www.game-advertising-online.com/"
        },
        "games2win.com": {
            "c": "Games2win",
            "u": "http://www.games2win.com/"
        },
        "inviziads.com": {
            "c": "Games2win",
            "u": "http://www.games2win.com/"
        },
        "gamned.com": {
            "c": "Gamned",
            "u": "http://www.gamned.com/"
        },
        "gannett.com": {
            "c": "Gannett",
            "u": "http://www.gannett.com/"
        },
        "pointroll.com": {
            "c": "Gannett",
            "u": "http://www.gannett.com/"
        },
        "gemius.com": {
            "c": "Gemius",
            "u": "http://www.gemius.com/"
        },
        "gemius.pl": {
            "c": "Gemius",
            "u": "http://www.gemius.com/"
        },
        "genesismedia.com": {
            "c": "Genesis Media",
            "u": "http://www.genesismedia.com/"
        },
        "genesismediaus.com": {
            "c": "Genesis Media",
            "u": "http://www.genesismedia.com/"
        },
        "geoads.com": {
            "c": "GeoAds",
            "u": "http://www.geoads.com/"
        },
        "getglue.com": {
            "c": "GetGlue",
            "u": "http://getglue.com/"
        },
        "smrtlnks.com": {
            "c": "GetGlue",
            "u": "http://getglue.com/"
        },
        "adhigh.net": {
            "c": "GetIntent",
            "u": "http://getintent.com/"
        },
        "getintent.com": {
            "c": "GetIntent",
            "u": "http://getintent.com/"
        },
        "glam.com": {
            "c": "Glam Media",
            "u": "http://www.glammedia.com/"
        },
        "glammedia.com": {
            "c": "Glam Media",
            "u": "http://www.glammedia.com/"
        },
        "globe7.com": {
            "c": "Globe7",
            "u": "http://www.globe7.com/"
        },
        "godatafeed.com": {
            "c": "GoDataFeed",
            "u": "http://godatafeed.com/"
        },
        "goldspotmedia.com": {
            "c": "GoldSpot Media",
            "u": "http://www.goldspotmedia.com/"
        },
        "goldbachgroup.com": {
            "c": "Goldbach",
            "u": "http://www.goldbachgroup.com/"
        },
        "goldbach.com": {
            "c": "Goldbach",
            "u": "http://www.goldbachgroup.com/"
        },
        "grapeshot.co.uk": {
            "c": "Grapeshot",
            "u": "http://www.grapeshot.co.uk/"
        },
        "groceryshopping.net": {
            "c": "Grocery Shopping Network",
            "u": "http://www.groceryshopping.net/"
        },
        "groovinads.com": {
            "c": "GroovinAds",
            "u": "http://www.groovinads.com/"
        },
        "guj.de": {
            "c": "Gruner + Jahr",
            "u": "http://www.guj.de/"
        },
        "ligatus.com": {
            "c": "Gruner + Jahr",
            "u": "http://www.guj.de/"
        },
        "gumgum.com": {
            "c": "GumGum",
            "u": "http://gumgum.com/"
        },
        "gunggo.com": {
            "c": "Gunggo",
            "u": "http://www.gunggo.com/"
        },
        "hotwords.com": {
            "c": "HOTWords",
            "u": "http://www.hotwords.com/"
        },
        "hotwords.es": {
            "c": "HOTWords",
            "u": "http://www.hotwords.com/"
        },
        "hp.com": {
            "c": "HP",
            "u": "http://www.hp.com/"
        },
        "optimost.com": {
            "c": "HP",
            "u": "http://www.hp.com/"
        },
        "huntmads.com": {
            "c": "HUNT Mobile Ads",
            "u": "http://www.huntmads.com/"
        },
        "hands.com.br": {
            "c": "Hands Mobile",
            "u": "http://www.hands.com.br/"
        },
        "harrenmedia.com": {
            "c": "Harrenmedia",
            "u": "http://www.harrenmedia.com/"
        },
        "harrenmedianetwork.com": {
            "c": "Harrenmedia",
            "u": "http://www.harrenmedia.com/"
        },
        "adacado.com": {
            "c": "HealthPricer",
            "u": "http://www.healthpricer.com/"
        },
        "healthpricer.com": {
            "c": "HealthPricer",
            "u": "http://www.healthpricer.com/"
        },
        "hearst.com": {
            "c": "Hearst",
            "u": "http://www.hearst.com/"
        },
        "ic-live.com": {
            "c": "Hearst",
            "u": "http://www.hearst.com/"
        },
        "iclive.com": {
            "c": "Hearst",
            "u": "http://www.hearst.com/"
        },
        "icrossing.com": {
            "c": "Hearst",
            "u": "http://www.hearst.com/"
        },
        "sptag.com": {
            "c": "Hearst",
            "u": "http://www.hearst.com/"
        },
        "sptag1.com": {
            "c": "Hearst",
            "u": "http://www.hearst.com/"
        },
        "sptag2.com": {
            "c": "Hearst",
            "u": "http://www.hearst.com/"
        },
        "sptag3.com": {
            "c": "Hearst",
            "u": "http://www.hearst.com/"
        },
        "comclick.com": {
            "c": "Hi-media",
            "u": "http://www.hi-media.com/"
        },
        "hi-media.com": {
            "c": "Hi-media",
            "u": "http://www.hi-media.com/"
        },
        "hlserve.com": {
            "c": "HookLogic",
            "u": "http://www.hooklogic.com/"
        },
        "hooklogic.com": {
            "c": "HookLogic",
            "u": "http://www.hooklogic.com/"
        },
        "horyzon-media.com": {
            "c": "Horyzon Media",
            "u": "http://www.horyzon-media.com/"
        },
        "meetic-partners.com": {
            "c": "Horyzon Media",
            "u": "http://www.horyzon-media.com/"
        },
        "smartadserver.com": {
            "c": "Horyzon Media",
            "u": "http://www.horyzon-media.com/"
        },
        "httpool.com": {
            "c": "Httpool",
            "u": "http://www.httpool.com/"
        },
        "hurra.com": {
            "c": "Hurra.com",
            "u": "http://www.hurra.com/"
        },
        "i-behavior.com": {
            "c": "QUISMA",
            "u": "http://www.i-behavior.com/"
        },
        "ib-ibi.com": {
            "c": "I-Behavior",
            "u": "http://www.i-behavior.com/"
        },
        "i.ua": {
            "c": "I.UA",
            "u": "http://www.i.ua/"
        },
        "iac.com": {
            "c": "IAC",
            "u": "http://www.iac.com/"
        },
        "iacadvertising.com": {
            "c": "IAC",
            "u": "http://www.iac.com/"
        },
        "unica.com": {
            "c": "IBM",
            "u": "http://www.ibm.com/"
        },
        "idg.com": {
            "c": "IDG",
            "u": "http://www.idg.com/"
        },
        "idgtechnetwork.com": {
            "c": "IDG",
            "u": "http://www.idg.com/"
        },
        "adversalservers.com": {
            "c": "ISI Technologies",
            "u": "http://digbro.com/"
        },
        "digbro.com": {
            "c": "ISI Technologies",
            "u": "http://digbro.com/"
        },
        "ignitad.com": {
            "c": "IgnitAd",
            "u": "http://www.ignitad.com/"
        },
        "ignitionone.com": {
            "c": "IgnitionOne",
            "u": "http://www.ignitionone.com/"
        },
        "ignitionone.net": {
            "c": "IgnitionOne",
            "u": "http://www.ignitionone.com/"
        },
        "searchignite.com": {
            "c": "IgnitionOne",
            "u": "http://www.ignitionone.com/"
        },
        "360yield.com": {
            "c": "Improve Digital",
            "u": "www.improvedigital.com/"
        },
        "improvedigital.com": {
            "c": "Improve Digital",
            "u": "www.improvedigital.com/"
        },
        "inmobi.com": {
            "c": "InMobi",
            "u": "http://www.inmobi.com/"
        },
        "sproutinc.com": {
            "c": "InMobi",
            "u": "http://www.inmobi.com/"
        },
        "inskinmedia.com": {
            "c": "InSkin Media",
            "u": "http://inskinmedia.com/"
        },
        "anadcoads.com": {
            "c": "Inadco",
            "u": "http://www.inadco.com/"
        },
        "inadco.com": {
            "c": "Inadco",
            "u": "http://www.inadco.com/"
        },
        "inadcoads.com": {
            "c": "Inadco",
            "u": "http://www.inadco.com/"
        },
        "impressiondesk.com": {
            "c": "Infectious Media",
            "u": "http://www.infectiousmedia.com/"
        },
        "infectiousmedia.com": {
            "c": "Infectious Media",
            "u": "http://www.infectiousmedia.com/"
        },
        "inflectionpointmedia.com": {
            "c": "Inflection Point Media",
            "u": "http://www.inflectionpointmedia.com/"
        },
        "infogroup.com": {
            "c": "Infogroup",
            "u": "http://www.infogroup.com/"
        },
        "infolinks.com": {
            "c": "Infolinks",
            "u": "http://www.infolinks.com/"
        },
        "infra-ad.com": {
            "c": "Infra-Ad",
            "u": "http://www.infra-ad.com/"
        },
        "innity.com": {
            "c": "Innity",
            "u": "http://innity.com/"
        },
        "insightexpress.com": {
            "c": "InsightExpress",
            "u": "http://www.insightexpress.com/"
        },
        "insightexpressai.com": {
            "c": "InsightExpress",
            "u": "http://www.insightexpress.com/"
        },
        "instinctiveads.com": {
            "c": "Instinctive",
            "u": "https://instinctive.io/"
        },
        "instinctive.io": {
            "c": "Instinctive",
            "u": "https://instinctive.io/"
        },
        "intentmedia.com": {
            "c": "Intent Media",
            "u": "http://www.intentmedia.com/"
        },
        "intentmedia.net": {
            "c": "Intent Media",
            "u": "http://www.intentmedia.com/"
        },
        "intergi.com": {
            "c": "Intergi",
            "u": "http://intergi.com/"
        },
        "intermarkets.net": {
            "c": "Intermarkets",
            "u": "http://www.intermarkets.net/"
        },
        "intermundomedia.com": {
            "c": "Intermundo Media",
            "u": "http://intermundomedia.com/"
        },
        "ibpxl.com": {
            "c": "Internet Brands",
            "u": "http://www.internetbrands.com/"
        },
        "internetbrands.com": {
            "c": "Internet Brands",
            "u": "http://www.internetbrands.com/"
        },
        "interpolls.com": {
            "c": "Interpolls",
            "u": "http://www.interpolls.com/"
        },
        "inuvo.com": {
            "c": "Inuvo",
            "u": "http://inuvo.com/"
        },
        "investingchannel.com": {
            "c": "InvestingChannel",
            "u": "http://investingchannel.com/"
        },
        "jaroop.com": {
            "c": "Jaroop",
            "u": "http://www.jaroop.com/"
        },
        "jasperlabs.com": {
            "c": "JasperLabs",
            "u": "http://www.jasperlabs.com/"
        },
        "jemmgroup.com": {
            "c": "Jemm",
            "u": "http://jemmgroup.com/"
        },
        "jink.de": {
            "c": "Jink",
            "u": "http://www.jink.de/"
        },
        "jinkads.com": {
            "c": "Jink",
            "u": "http://www.jink.de/"
        },
        "adcolony.com": {
            "c": "Jirbo",
            "u": "http://jirbo.com/"
        },
        "jirbo.com": {
            "c": "Jirbo",
            "u": "http://jirbo.com/"
        },
        "jivox.com": {
            "c": "Jivox",
            "u": "http://www.jivox.com/"
        },
        "jobthread.com": {
            "c": "JobThread",
            "u": "http://www.jobthread.com/"
        },
        "juicyads.com": {
            "c": "JuicyAds",
            "u": "http://www.juicyads.com/"
        },
        "jumptap.com": {
            "c": "Jumptap",
            "u": "http://www.jumptap.com/"
        },
        "keewurd.com": {
            "c": "KIT digital",
            "u": "http://kitd.com/"
        },
        "kitd.com": {
            "c": "KIT digital",
            "u": "http://kitd.com/"
        },
        "peerset.com": {
            "c": "KIT digital",
            "u": "http://kitd.com/"
        },
        "kenshoo.com": {
            "c": "Kenshoo",
            "u": "http://www.kenshoo.com/"
        },
        "xg4ken.com": {
            "c": "Kenshoo",
            "u": "http://www.kenshoo.com/"
        },
        "keyade.com": {
            "c": "Keyade",
            "u": "http://www.keyade.com/"
        },
        "kissmyads.com": {
            "c": "KissMyAds",
            "u": "http://kissmyads.com/"
        },
        "103092804.com": {
            "c": "Kitara Media",
            "u": "http://www.kitaramedia.com/"
        },
        "kitaramedia.com": {
            "c": "Kitara Media",
            "u": "http://www.kitaramedia.com/"
        },
        "admost.com": {
            "c": "Kokteyl",
            "u": "http://www.kokteyl.com/"
        },
        "kokteyl.com": {
            "c": "Kokteyl",
            "u": "http://www.kokteyl.com/"
        },
        "komli.com": {
            "c": "Komli",
            "u": "http://www.komli.com/"
        },
        "kontera.com": {
            "c": "Kontera",
            "u": "http://www.kontera.com/"
        },
        "adsummos.com": {
            "c": "Korrelate",
            "u": "http://korrelate.com/"
        },
        "adsummos.net": {
            "c": "Korrelate",
            "u": "http://korrelate.com/"
        },
        "korrelate.com": {
            "c": "Korrelate",
            "u": "http://korrelate.com/"
        },
        "krux.com": {
            "c": "Krux",
            "u": "http://www.krux.com/"
        },
        "kruxdigital.com": {
            "c": "Krux",
            "u": "http://www.krux.com/"
        },
        "krxd.net": {
            "c": "Krux",
            "u": "http://www.krux.com/"
        },
        "lakana.com": {
            "c": "Lakana",
            "u": "http://www.lakana.com/"
        },
        "ibsys.com": {
            "c": "Lakana",
            "u": "http://www.lakana.com/"
        },
        "layer-ads.net": {
            "c": "Layer Ads",
            "u": "http://layer-ads.net/"
        },
        "layer-ad.org": {
            "c": "Layer-Ad.org",
            "u": "http://layer-ad.org/"
        },
        "leadbolt.com": {
            "c": "LeadBolt",
            "u": "http://www.leadbolt.com/"
        },
        "leadformix.com": {
            "c": "LeadFormix",
            "u": "http://www.leadformix.com/"
        },
        "leadforce1.com": {
            "c": "LeadFormix",
            "u": "http://www.leadformix.com/"
        },
        "leadlander.com": {
            "c": "LeadLander",
            "u": "http://www.leadlander.com/"
        },
        "trackalyzer.com": {
            "c": "LeadLander",
            "u": "http://www.leadlander.com/"
        },
        "legolas-media.com": {
            "c": "Legolas Media",
            "u": "http://www.legolas-media.com/"
        },
        "levexis.com": {
            "c": "Levexis",
            "u": "http://www.levexis.com/"
        },
        "adbull.com": {
            "c": "Lexos Media",
            "u": "http://www.lexosmedia.com/"
        },
        "lexosmedia.com": {
            "c": "Lexos Media",
            "u": "http://www.lexosmedia.com/"
        },
        "lfstmedia.com": {
            "c": "LifeStreet",
            "u": "http://lifestreetmedia.com/"
        },
        "lifestreetmedia.com": {
            "c": "LifeStreet",
            "u": "http://lifestreetmedia.com/"
        },
        "linkconnector.com": {
            "c": "LinkConnector",
            "u": "http://www.linkconnector.com/"
        },
        "linkshare.com": {
            "c": "LinkShare",
            "u": "http://www.linkshare.com/"
        },
        "linksynergy.com": {
            "c": "LinkShare",
            "u": "http://www.linkshare.com/"
        },
        "linkz.net": {
            "c": "Linkz",
            "u": "http://www.linkz.net/"
        },
        "listrak.com": {
            "c": "Listrak",
            "u": "http://www.listrak.com/"
        },
        "listrakbi.com": {
            "c": "Listrak",
            "u": "http://www.listrak.com/"
        },
        "liadm.com": {
            "c": "LiveIntent",
            "u": "http://www.liveintent.com/"
        },
        "liveintent.com": {
            "c": "LiveIntent",
            "u": "http://www.liveintent.com/"
        },
        "liveinternet.ru": {
            "c": "LiveInternet",
            "u": "http://www.liveinternet.ru"
        },
        "yadro.ru": {
            "c": "LiveInternet",
            "u": "http://www.liveinternet.ru"
        },
        "localyokelmedia.com": {
            "c": "Local Yokel Media",
            "u": "http://www.localyokelmedia.com/"
        },
        "longboardmedia.com": {
            "c": "Longboard Media",
            "u": "http://longboardmedia.com/"
        },
        "loomia.com": {
            "c": "Loomia",
            "u": "http://www.loomia.com/"
        },
        "lfov.net": {
            "c": "LoopFuse",
            "u": "https://www.loopfuse.net/"
        },
        "loopfuse.net": {
            "c": "LoopFuse",
            "u": "https://www.loopfuse.net/"
        },
        "lowermybills.com": {
            "c": "Lower My Bills",
            "u": "http://lowermybills.com"
        },
        "lucidmedia.com": {
            "c": "LucidMedia",
            "u": "http://www.lucidmedia.com/"
        },
        "cpalead.com": {
            "c": "MONETIZEdigital",
            "u": "https://www.cpalead.com/"
        },
        "mundomedia.com": {
            "c": "MUNDO Media",
            "u": "http://www.mundomedia.com/"
        },
        "silver-path.com": {
            "c": "MUNDO Media",
            "u": "http://www.mundomedia.com/"
        },
        "madhouse.cn": {
            "c": "Madhouse",
            "u": "http://www.madhouse.cn/"
        },
        "dinclinx.com": {
            "c": "Madison Logic",
            "u": "http://www.madisonlogic.com/"
        },
        "madisonlogic.com": {
            "c": "Madison Logic",
            "u": "http://www.madisonlogic.com/"
        },
        "domdex.com": {
            "c": "Magnetic",
            "u": "http://www.magnetic.com/"
        },
        "domdex.net": {
            "c": "Magnetic",
            "u": "http://www.magnetic.com/"
        },
        "magnetic.com": {
            "c": "Magnetic",
            "u": "http://www.magnetic.com/"
        },
        "qjex.net": {
            "c": "Magnetic",
            "u": "http://www.magnetic.com/"
        },
        "dialogmgr.com": {
            "c": "Magnify360",
            "u": "http://www.magnify360.com/"
        },
        "magnify360.com": {
            "c": "Magnify360",
            "u": "http://www.magnify360.com/"
        },
        "campaign-archive1.com": {
            "c": "MailChimp",
            "u": "http://mailchimp.com/"
        },
        "list-manage.com": {
            "c": "MailChimp",
            "u": "http://mailchimp.com/"
        },
        "mailchimp.com": {
            "c": "MailChimp",
            "u": "http://mailchimp.com/"
        },
        "bannerbank.ru": {
            "c": "Manifest",
            "u": "http://www.manifest.ru/"
        },
        "manifest.ru": {
            "c": "Manifest",
            "u": "http://www.manifest.ru/"
        },
        "industrybrains.com": {
            "c": "Marchex",
            "u": "http://www.marchex.com/"
        },
        "marchex.com": {
            "c": "Marchex",
            "u": "http://www.marchex.com/"
        },
        "marimedia.net": {
            "c": "Marimedia",
            "u": "http://www.marimedia.net/"
        },
        "dt00.net": {
            "c": "MarketGid",
            "u": "http://www.marketgid.com/"
        },
        "dt07.net": {
            "c": "MarketGid",
            "u": "http://www.marketgid.com/"
        },
        "marketgid.com": {
            "c": "MarketGid",
            "u": "http://www.marketgid.com/"
        },
        "marketo.com": {
            "c": "Marketo",
            "u": "http://www.marketo.com/"
        },
        "marketo.net": {
            "c": "Marketo",
            "u": "http://www.marketo.com/"
        },
        "martiniadnetwork.com": {
            "c": "Martini Media",
            "u": "http://martinimedianetwork.com/"
        },
        "martinimedianetwork.com": {
            "c": "Martini Media",
            "u": "http://martinimedianetwork.com/"
        },
        "chemistry.com": {
            "c": "Match.com",
            "u": "http://www.match.com/"
        },
        "match.com": {
            "c": "Match.com",
            "u": "http://www.match.com/"
        },
        "matomy.com": {
            "c": "Matomy Market",
            "u": "http://www.matomy.com/"
        },
        "matomymarket.com": {
            "c": "Matomy",
            "u": "http://www.matomy.com/"
        },
        "matomymedia.com": {
            "c": "Matomy",
            "u": "http://www.matomy.com/"
        },
        "xtendmedia.com": {
            "c": "Matomy",
            "u": "http://www.matomy.com/"
        },
        "adsmarket.com": {
            "c": "Matomy Market",
            "u": "http://www.matomy.com/"
        },
        "maxbounty.com": {
            "c": "MaxBounty",
            "u": "http://www.maxbounty.com/"
        },
        "mb01.com": {
            "c": "MaxBounty",
            "u": "http://www.maxbounty.com/"
        },
        "maxpointinteractive.com": {
            "c": "MaxPoint",
            "u": "http://maxpointinteractive.com/"
        },
        "maxusglobal.com": {
            "c": "MaxPoint",
            "u": "http://maxpointinteractive.com/"
        },
        "mxptint.net": {
            "c": "MaxPoint",
            "u": "http://maxpointinteractive.com/"
        },
        "mdotm.com": {
            "c": "MdotM",
            "u": "http://mdotm.com/"
        },
        "mediabrix.com": {
            "c": "MediaBrix",
            "u": "http://www.mediabrix.com/"
        },
        "mediacom.com": {
            "c": "MediaCom",
            "u": "http://www.mediacom.com/"
        },
        "adroitinteractive.com": {
            "c": "MediaMath",
            "u": "http://www.mediamath.com/"
        },
        "designbloxlive.com": {
            "c": "MediaMath",
            "u": "http://www.mediamath.com/"
        },
        "mathtag.com": {
            "c": "MediaMath",
            "u": "http://www.mediamath.com/"
        },
        "mediamath.com": {
            "c": "MediaMath",
            "u": "http://www.mediamath.com/"
        },
        "media-servers.net": {
            "c": "MediaShakers",
            "u": "http://www.mediashakers.com/"
        },
        "mediashakers.com": {
            "c": "MediaShakers",
            "u": "http://www.mediashakers.com/"
        },
        "mediatrust.com": {
            "c": "MediaTrust",
            "u": "http://www.mediatrust.com/"
        },
        "adnetinteractive.com": {
            "c": "MediaWhiz",
            "u": "http://www.mediawhiz.com/"
        },
        "mediawhiz.com": {
            "c": "MediaWhiz",
            "u": "http://www.mediawhiz.com/"
        },
        "medialets.com": {
            "c": "Medialets",
            "u": "http://www.medialets.com/"
        },
        "adbuyer.com": {
            "c": "Mediaocean",
            "u": "http://www.mediaocean.com/"
        },
        "mediaocean.com": {
            "c": "Mediaocean",
            "u": "http://www.mediaocean.com/"
        },
        "medicxmedia.com": {
            "c": "Medicx Media Solutions",
            "u": "http://www.medicxmedia.com/"
        },
        "megaindex.ru": {
            "c": "MegaIndex",
            "u": "http://www.megaindex.ru/"
        },
        "mercent.com": {
            "c": "Mercent",
            "u": "http://www.mercent.com/"
        },
        "merchantadvantage.com": {
            "c": "MerchantAdvantage",
            "u": "http://www.merchantadvantage.com/"
        },
        "merchenta.com": {
            "c": "Merchenta",
            "u": "http://www.merchenta.com/"
        },
        "metanetwork.com": {
            "c": "Meta Network",
            "u": "http://www.metanetwork.com/"
        },
        "meteorsolutions.com": {
            "c": "Meteor",
            "u": "http://www.meteorsolutions.com/"
        },
        "opinionbar.com": {
            "c": "MetrixLab",
            "u": "https://www.metrixlab.com"
        },
        "metrixlab.com": {
            "c": "MetrixLab",
            "u": "https://www.metrixlab.com"
        },
        "adoftheyear.com": {
            "c": "MetrixLab",
            "u": "https://www.metrixlab.com"
        },
        "crm-metrix.com": {
            "c": "MetrixLab",
            "u": "https://www.metrixlab.com"
        },
        "customerconversio.com": {
            "c": "MetrixLab",
            "u": "https://www.metrixlab.com"
        },
        "microad.jp": {
            "c": "MicroAd",
            "u": "http://www.microad.jp/"
        },
        "adbureau.net": {
            "c": "Microsoft",
            "u": "http://www.microsoft.com/"
        },
        "adecn.com": {
            "c": "Microsoft",
            "u": "http://www.microsoft.com/"
        },
        "aquantive.com": {
            "c": "Microsoft",
            "u": "http://www.microsoft.com/"
        },
        "atdmt.com": {
            "c": "Microsoft",
            "u": "http://www.microsoft.com/"
        },
        "msads.net": {
            "c": "Microsoft",
            "u": "http://www.microsoft.com/"
        },
        "netconversions.com": {
            "c": "Microsoft",
            "u": "http://www.microsoft.com/"
        },
        "roiservice.com": {
            "c": "Microsoft",
            "u": "http://www.microsoft.com/"
        },
        "decktrade.com": {
            "c": "Millennial Media",
            "u": "http://www.millennialmedia.com/"
        },
        "millennialmedia.com": {
            "c": "Millennial Media",
            "u": "http://www.millennialmedia.com/"
        },
        "mydas.mobi": {
            "c": "Millennial Media",
            "u": "http://www.millennialmedia.com/"
        },
        "mindset-media.com": {
            "c": "Mindset Media",
            "u": "http://www.mindset-media.com/"
        },
        "mmismm.com": {
            "c": "Mindset Media",
            "u": "http://www.mindset-media.com/"
        },
        "mirando.de": {
            "c": "Mirando",
            "u": "http://www.mirando.de/"
        },
        "mixpo.com": {
            "c": "Mixpo",
            "u": "http://www.mixpo.com/"
        },
        "mopub.com": {
            "c": "MoPub",
            "u": "http://www.mopub.com/"
        },
        "moat.com": {
            "c": "Moat",
            "u": "http://www.moat.com/"
        },
        "moatads.com": {
            "c": "Moat",
            "u": "http://www.moat.com/"
        },
        "mobfox.com": {
            "c": "MobFox",
            "u": "http://www.mobfox.com/"
        },
        "admoda.com": {
            "c": "MobVision",
            "u": "http://www.mobvision.com/"
        },
        "mobvision.com": {
            "c": "MobVision",
            "u": "http://www.mobvision.com/"
        },
        "mobilemeteor.com": {
            "c": "Mobile Meteor",
            "u": "http://mobilemeteor.com/"
        },
        "showmeinn.com": {
            "c": "Mobile Meteor",
            "u": "http://mobilemeteor.com/"
        },
        "mobilestorm.com": {
            "c": "Mobile Storm",
            "u": "http://mobilestorm.com/"
        },
        "moceanmobile.com": {
            "c": "Mocean Mobile",
            "u": "http://www.moceanmobile.com/"
        },
        "mochila.com": {
            "c": "Mochila",
            "u": "http://www.mochila.com/"
        },
        "mojiva.com": {
            "c": "Mojiva",
            "u": "http://www.mojiva.com/"
        },
        "monetate.com": {
            "c": "Monetate",
            "u": "http://monetate.com/"
        },
        "monetate.net": {
            "c": "Monetate",
            "u": "http://monetate.com/"
        },
        "monetizemore.com": {
            "c": "Monetize More",
            "u": "http://monetizemore.com/"
        },
        "monoloop.com": {
            "c": "Monoloop",
            "u": "http://www.monoloop.com/"
        },
        "monster.com": {
            "c": "Monster",
            "u": "http://www.monster.com/"
        },
        "moolah-media.com": {
            "c": "Moolah Media",
            "u": "http://www.moolahmedia.com/"
        },
        "moolahmedia.com": {
            "c": "Moolah Media",
            "u": "http://www.moolahmedia.com/"
        },
        "affbuzzads.com": {
            "c": "MovieLush.com",
            "u": "https://www.movielush.com/"
        },
        "movielush.com": {
            "c": "MovieLush.com",
            "u": "https://www.movielush.com/"
        },
        "adclickmedia.com": {
            "c": "Multiple Stream Media",
            "u": "http://www.multiplestreammktg.com/"
        },
        "multiplestreammktg.com": {
            "c": "Multiple Stream Media",
            "u": "http://www.multiplestreammktg.com/"
        },
        "mybuys.com": {
            "c": "MyBuys",
            "u": "http://www.mybuys.com/"
        },
        "veruta.com": {
            "c": "MyBuys",
            "u": "http://www.mybuys.com/"
        },
        "mycounter.com.ua": {
            "c": "MyCounter",
            "u": "http://mycounter.com.ua/"
        },
        "ppjol.net": {
            "c": "MyPressPlus",
            "u": "http://www.mypressplus.com/"
        },
        "mypressplus.com": {
            "c": "MyPressPlus",
            "u": "http://www.mypressplus.com/"
        },
        "mywebgrocer.com": {
            "c": "MyWebGrocer",
            "u": "http://www.mywebgrocer.com/"
        },
        "nanigans.com": {
            "c": "Nanigans",
            "u": "http://www.nanigans.com/"
        },
        "postrelease.com": {
            "c": "Nativo",
            "u": "http://www.nativo.net/"
        },
        "navdmp.com": {
            "c": "Navegg",
            "u": "http://www.navegg.com/"
        },
        "navegg.com": {
            "c": "Navegg",
            "u": "http://www.navegg.com/"
        },
        "cdnma.com": {
            "c": "Net-Results",
            "u": "http://www.net-results.com/"
        },
        "net-results.com": {
            "c": "Net-Results",
            "u": "http://www.net-results.com/"
        },
        "nr7.us": {
            "c": "Net-Results",
            "u": "http://www.net-results.com/"
        },
        "netaffiliation.com": {
            "c": "NetAffiliation",
            "u": "http://www.netaffiliation.com/"
        },
        "netbina.com": {
            "c": "NetBina",
            "u": "http://www.netbina.com/"
        },
        "adelixir.com": {
            "c": "NetElixir",
            "u": "http://www.netelixir.com/"
        },
        "netelixir.com": {
            "c": "NetElixir",
            "u": "http://www.netelixir.com/"
        },
        "netseer.com": {
            "c": "NetSeer",
            "u": "http://www.netseer.com/"
        },
        "netshelter.com": {
            "c": "NetShelter",
            "u": "http://netshelter.com/"
        },
        "netshelter.net": {
            "c": "NetShelter",
            "u": "http://netshelter.com/"
        },
        "netmining.com": {
            "c": "Netmining",
            "u": "http://www.netmining.com/"
        },
        "netmng.com": {
            "c": "Netmining",
            "u": "http://www.netmining.com/"
        },
        "adadvisor.net": {
            "c": "Neustar",
            "u": "http://www.neustar.biz/"
        },
        "neustar.biz": {
            "c": "Neustar",
            "u": "http://www.neustar.biz/"
        },
        "nexage.com": {
            "c": "Nexage",
            "u": "http://nexage.com/"
        },
        "nextperformance.com": {
            "c": "NextPerformance",
            "u": "http://www.nextperformance.com/"
        },
        "nxtck.com": {
            "c": "NextPerformance",
            "u": "http://www.nextperformance.com/"
        },
        "nextag.com": {
            "c": "Nextag",
            "u": "http://www.nextag.com/"
        },
        "imrworldwide.com": {
            "c": "Nielsen",
            "u": "http://www.nielsen.com/"
        },
        "imrworldwide.net": {
            "c": "Nielsen",
            "u": "http://www.nielsen.com/"
        },
        "networkedblogs.com": {
            "c": "Ninua",
            "u": "http://www.ninua.com/"
        },
        "ninua.com": {
            "c": "Ninua",
            "u": "http://www.ninua.com/"
        },
        "noktamedya.com": {
            "c": "Nokta",
            "u": "http://www.noktamedya.com/"
        },
        "virgul.com": {
            "c": "Nokta",
            "u": "http://www.noktamedya.com/"
        },
        "nowspots.com": {
            "c": "NowSpots",
            "u": "http://nowspots.com/"
        },
        "nuffnang.com": {
            "c": "Nuffnang",
            "u": "http://www.nuffnang.com.my/"
        },
        "nuffnang.com.my": {
            "c": "Nuffnang",
            "u": "http://www.nuffnang.com.my/"
        },
        "advg.jp": {
            "c": "OPT",
            "u": "http://www.opt.ne.jp/"
        },
        "opt.ne.jp": {
            "c": "OPT",
            "u": "http://www.opt.ne.jp/"
        },
        "p-advg.com": {
            "c": "OPT",
            "u": "http://www.opt.ne.jp/"
        },
        "adohana.com": {
            "c": "Ohana Media",
            "u": "http://www.ohana-media.com/"
        },
        "ohana-media.com": {
            "c": "Ohana Media",
            "u": "http://www.ohana-media.com/"
        },
        "ohanaqb.com": {
            "c": "Ohana Media",
            "u": "http://www.ohana-media.com/"
        },
        "accuenmedia.com": {
            "c": "Omnicom Group",
            "u": "http://www.omnicomgroup.com/"
        },
        "omnicomgroup.com": {
            "c": "Omnicom Group",
            "u": "http://www.omnicomgroup.com/"
        },
        "p-td.com": {
            "c": "Omnicom Group",
            "u": "http://www.omnicomgroup.com/"
        },
        "itsoneiota.com": {
            "c": "One iota",
            "u": "http://www.itsoneiota.com/"
        },
        "oneiota.co.uk": {
            "c": "One iota",
            "u": "http://www.itsoneiota.com/"
        },
        "oneupweb.com": {
            "c": "Oneupweb",
            "u": "http://www.oneupweb.com/"
        },
        "sodoit.com": {
            "c": "Oneupweb",
            "u": "http://www.oneupweb.com/"
        },
        "onm.de": {
            "c": "Open New Media",
            "u": "http://www.onm.de/"
        },
        "liftdna.com": {
            "c": "OpenX",
            "u": "http://openx.com/"
        },
        "openx.com": {
            "c": "OpenX",
            "u": "http://openx.com/"
        },
        "openx.net": {
            "c": "OpenX",
            "u": "http://openx.com/"
        },
        "openx.org": {
            "c": "OpenX",
            "u": "http://openx.com/"
        },
        "openxenterprise.com": {
            "c": "OpenX",
            "u": "http://openx.com/"
        },
        "servedbyopenx.com": {
            "c": "OpenX",
            "u": "http://openx.com/"
        },
        "mobiletheory.com": {
            "c": "Opera",
            "u": "http://www.opera.com/"
        },
        "operamediaworks.com": {
            "c": "Opera",
            "u": "http://www.opera.com/"
        },
        "operasoftware.com": {
            "c": "Opera",
            "u": "http://www.opera.com/"
        },
        "opera.com": {
            "c": "Opera",
            "u": "http://www.opera.com/"
        },
        "optmd.com": {
            "c": "OptMD",
            "u": "http://optmd.com/"
        },
        "optify.net": {
            "c": "Optify",
            "u": "http://www.optify.net/"
        },
        "cpmadvisors.com": {
            "c": "Optimal",
            "u": "http://optim.al/"
        },
        "cpmatic.com": {
            "c": "Optimal",
            "u": "http://optim.al/"
        },
        "nprove.com": {
            "c": "Optimal",
            "u": "http://optim.al/"
        },
        "optim.al": {
            "c": "Optimal",
            "u": "http://optim.al/"
        },
        "orbengine.com": {
            "c": "Optimal",
            "u": "http://optim.al/"
        },
        "xa.net": {
            "c": "Optimal",
            "u": "http://optim.al/"
        },
        "optimumresponse.com": {
            "c": "OptimumResponse",
            "u": "http://www.optimumresponse.com/"
        },
        "optnmstr.com": {
            "c": "OptinMonster",
            "u": "https://optinmonster.com/"
        },
        "optinmonster.com": {
            "c": "OptinMonster",
            "u": "https://optinmonster.com/"
        },
        "estara.com": {
            "c": "Oracle",
            "u": "http://www.oracle.com/"
        },
        "orangesoda.com": {
            "c": "OrangeSoda",
            "u": "http://www.orangesoda.com/"
        },
        "otracking.com": {
            "c": "OrangeSoda",
            "u": "http://www.orangesoda.com/"
        },
        "out-there-media.com": {
            "c": "Out There Media",
            "u": "http://www.out-there-media.com/"
        },
        "outbrain.com": {
            "c": "Outbrain",
            "u": "http://www.outbrain.com/"
        },
        "sphere.com": {
            "c": "Outbrain",
            "u": "http://www.outbrain.com/"
        },
        "dsnextgen.com": {
            "c": "Oversee.net",
            "u": "http://www.oversee.net/"
        },
        "oversee.net": {
            "c": "Oversee.net",
            "u": "http://www.oversee.net/"
        },
        "owneriq.com": {
            "c": "OwnerIQ",
            "u": "http://www.owneriq.com/"
        },
        "owneriq.net": {
            "c": "OwnerIQ",
            "u": "http://www.owneriq.com/"
        },
        "adconnexa.com": {
            "c": "OxaMedia",
            "u": "http://www.oxamedia.com/"
        },
        "adsbwm.com": {
            "c": "OxaMedia",
            "u": "http://www.oxamedia.com/"
        },
        "oxamedia.com": {
            "c": "OxaMedia",
            "u": "http://www.oxamedia.com/"
        },
        "platform-one.co.jp": {
            "c": "PLATFORM ONE",
            "u": "http://www.platform-one.co.jp/"
        },
        "pagefair.com": {
            "c": "PageFair",
            "u": "https://pagefair.com/"
        },
        "pagefair.net": {
            "c": "PageFair",
            "u": "https://pagefair.com/"
        },
        "paid-to-promote.net": {
            "c": "Paid-To-Promote.net",
            "u": "http://www.paid-to-promote.net/"
        },
        "pardot.com": {
            "c": "Pardot",
            "u": "http://www.pardot.com/"
        },
        "payhit.com": {
            "c": "PayHit",
            "u": "http://www.payhit.com/"
        },
        "lzjl.com": {
            "c": "Paypopup.com",
            "u": "http://www.paypopup.com/"
        },
        "paypopup.com": {
            "c": "Paypopup.com",
            "u": "http://www.paypopup.com/"
        },
        "peer39.com": {
            "c": "Peer39",
            "u": "http://www.peer39.com/"
        },
        "peer39.net": {
            "c": "Peer39",
            "u": "http://www.peer39.com/"
        },
        "peerfly.com": {
            "c": "PeerFly",
            "u": "http://peerfly.com/"
        },
        "performancing.com": {
            "c": "Performancing",
            "u": "http://performancing.com/"
        },
        "pheedo.com": {
            "c": "Pheedo",
            "u": "http://site.pheedo.com/"
        },
        "pictela.com": {
            "c": "Pictela",
            "u": "http://www.pictela.com/"
        },
        "pictela.net": {
            "c": "Pictela",
            "u": "http://www.pictela.com/"
        },
        "pixel.sg": {
            "c": "Pixel.sg",
            "u": "http://www.pixel.sg/"
        },
        "piximedia.com": {
            "c": "Piximedia",
            "u": "http://www.piximedia.com/"
        },
        "po.st": {
            "c": "Po.st",
            "u": "http://www.po.st/"
        },
        "pocketcents.com": {
            "c": "PocketCents",
            "u": "http://pocketcents.com/"
        },
        "polarmobile.com": {
            "c": "Polar Mobile",
            "u": "http://polarmobile.com"
        },
        "mediavoice.com": {
            "c": "Polar Mobile",
            "u": "http://polarmobile.com"
        },
        "politads.com": {
            "c": "Politads",
            "u": "http://politads.com/"
        },
        "getpolymorph.com": {
            "c": "Polymorph",
            "u": "http://getpolymorph.com/"
        },
        "adsnative.com": {
            "c": "Polymorph",
            "u": "http://getpolymorph.com/"
        },
        "pontiflex.com": {
            "c": "Pontiflex",
            "u": "http://www.pontiflex.com/"
        },
        "popads.net": {
            "c": "PopAds",
            "u": "https://www.popads.net/"
        },
        "popadscdn.net": {
            "c": "PopAds",
            "u": "https://www.popads.net/"
        },
        "gocampaignlive.com": {
            "c": "PopRule",
            "u": "http://poprule.com/"
        },
        "poprule.com": {
            "c": "PopRule",
            "u": "http://poprule.com/"
        },
        "popunder.ru": {
            "c": "Popunder.ru",
            "u": "http://popunder.ru/"
        },
        "precisionclick.com": {
            "c": "PrecisionClick",
            "u": "http://www.precisionclick.com/"
        },
        "predictad.com": {
            "c": "PredictAd",
            "u": "http://www.predictad.com/"
        },
        "blogads.com": {
            "c": "Pressflex",
            "u": "http://www.pressflex.com/"
        },
        "pressflex.com": {
            "c": "Pressflex",
            "u": "http://www.pressflex.com/"
        },
        "adcde.com": {
            "c": "Prime Visibility",
            "u": "http://www.primevisibility.com/"
        },
        "addlvr.com": {
            "c": "Prime Visibility",
            "u": "http://www.primevisibility.com/"
        },
        "adonnetwork.net": {
            "c": "Prime Visibility",
            "u": "http://www.primevisibility.com/"
        },
        "adtrgt.com": {
            "c": "Prime Visibility",
            "u": "http://www.primevisibility.com/"
        },
        "bannertgt.com": {
            "c": "Prime Visibility",
            "u": "http://www.primevisibility.com/"
        },
        "cptgt.com": {
            "c": "Prime Visibility",
            "u": "http://www.primevisibility.com/"
        },
        "cpvfeed.com": {
            "c": "Prime Visibility",
            "u": "http://www.primevisibility.com/"
        },
        "cpvtgt.com": {
            "c": "Prime Visibility",
            "u": "http://www.primevisibility.com/"
        },
        "popcde.com": {
            "c": "Prime Visibility",
            "u": "http://www.primevisibility.com/"
        },
        "primevisibility.com": {
            "c": "Prime Visibility",
            "u": "http://www.primevisibility.com/"
        },
        "sdfje.com": {
            "c": "Prime Visibility",
            "u": "http://www.primevisibility.com/"
        },
        "urtbk.com": {
            "c": "Prime Visibility",
            "u": "http://www.primevisibility.com/"
        },
        "proclivitymedia.com": {
            "c": "Proclivity",
            "u": "http://www.proclivitymedia.com/"
        },
        "proclivitysystems.com": {
            "c": "Proclivity",
            "u": "http://www.proclivitymedia.com/"
        },
        "pswec.com": {
            "c": "Proclivity",
            "u": "http://www.proclivitymedia.com/"
        },
        "projectwonderful.com": {
            "c": "Project Wonderful",
            "u": "http://www.projectwonderful.com/"
        },
        "propellerads.com": {
            "c": "Propeller Ads",
            "u": "http://propellerads.com/"
        },
        "prosperent.com": {
            "c": "Prosperent",
            "u": "http://prosperent.com/"
        },
        "proxilinks.com": {
            "c": "Proximic",
            "u": "http://www.proximic.com/"
        },
        "proximic.com": {
            "c": "Proximic",
            "u": "http://www.proximic.com/"
        },
        "proximic.net": {
            "c": "Proximic",
            "u": "http://www.proximic.com/"
        },
        "pubmatic.com": {
            "c": "PubMatic",
            "u": "http://www.pubmatic.com/"
        },
        "revinet.com": {
            "c": "PubMatic",
            "u": "http://www.pubmatic.com/"
        },
        "publicidees.com": {
            "c": "Public-Idées",
            "u": "http://www.publicidees.com/"
        },
        "pch.com": {
            "c": "Publishers Clearing House",
            "u": "http://www.pch.com/"
        },
        "iaded.com": {
            "c": "QUISMA",
            "u": "http://www.i-behavior.com/"
        },
        "quisma.com": {
            "c": "QUISMA",
            "u": "http://www.i-behavior.com/"
        },
        "quismatch.com": {
            "c": "QUISMA",
            "u": "http://www.i-behavior.com/"
        },
        "xaded.com": {
            "c": "QUISMA",
            "u": "http://www.i-behavior.com/"
        },
        "xmladed.com": {
            "c": "QUISMA",
            "u": "http://www.i-behavior.com/"
        },
        "quakemarketing.com": {
            "c": "Quake Marketing",
            "u": "http://quakemarketing.com/"
        },
        "quantcast.com": {
            "c": "Quantcast",
            "u": "http://www.quantcast.com/"
        },
        "quantserve.com": {
            "c": "Quantcast",
            "u": "http://www.quantcast.com/"
        },
        "qnsr.com": {
            "c": "QuinStreet",
            "u": "http://quinstreet.com/"
        },
        "qsstats.com": {
            "c": "QuinStreet",
            "u": "http://quinstreet.com/"
        },
        "quinstreet.com": {
            "c": "QuinStreet",
            "u": "http://quinstreet.com/"
        },
        "rmbn.net": {
            "c": "RMBN",
            "u": "http://rmbn.net/"
        },
        "rmbn.ru": {
            "c": "RMBN",
            "u": "http://rmbn.net/"
        },
        "rmmonline.com": {
            "c": "RMM",
            "u": "http://www.rmmonline.com/"
        },
        "matchbin.com": {
            "c": "Radiate Media",
            "u": "http://www.radiatemedia.com/"
        },
        "radiatemedia.com": {
            "c": "Radiate Media",
            "u": "http://www.radiatemedia.com/"
        },
        "gwallet.com": {
            "c": "RadiumOne",
            "u": "http://www.radiumone.com/"
        },
        "radiumone.com": {
            "c": "RadiumOne",
            "u": "http://www.radiumone.com/"
        },
        "radiusmarketing.com": {
            "c": "Radius Marketing",
            "u": "http://www.radiusmarketing.com/"
        },
        "rambler.ru": {
            "c": "Rambler",
            "u": "http://www.rambler.ru/"
        },
        "liveramp.com": {
            "c": "Rapleaf",
            "u": "http://www.rapleaf.com/"
        },
        "rapleaf.com": {
            "c": "Rapleaf",
            "u": "http://www.rapleaf.com/"
        },
        "rlcdn.com": {
            "c": "Rapleaf",
            "u": "http://www.rapleaf.com/"
        },
        "retargeter.com": {
            "c": "ReTargeter",
            "u": "http://www.retargeter.com/"
        },
        "reachlocal.com": {
            "c": "ReachLocal",
            "u": "http://www.reachlocal.com/"
        },
        "rlcdn.net": {
            "c": "ReachLocal",
            "u": "http://www.reachlocal.com/"
        },
        "react2media.com": {
            "c": "React2Media",
            "u": "http://www.react2media.com/"
        },
        "reduxmedia.com": {
            "c": "Redux Media",
            "u": "http://reduxmedia.com/"
        },
        "convertglobal.com": {
            "c": "Rekko",
            "u": "http://rekko.com/"
        },
        "rekko.com": {
            "c": "Rekko",
            "u": "http://rekko.com/"
        },
        "reklamstore.com": {
            "c": "Reklam Store",
            "u": "http://reklamstore.com/"
        },
        "reklamport.com": {
            "c": "Reklamport",
            "u": "http://www.reklamport.com/"
        },
        "reklamz.com": {
            "c": "Reklamz",
            "u": "http://www.reklamz.com/"
        },
        "relestar.com": {
            "c": "Relevad",
            "u": "http://www.relevad.com/"
        },
        "relevad.com": {
            "c": "Relevad",
            "u": "http://www.relevad.com/"
        },
        "advertserve.com": {
            "c": "Renegade Internet",
            "u": "http://www.renegadeinternet.com/"
        },
        "renegadeinternet.com": {
            "c": "Renegade Internet",
            "u": "http://www.renegadeinternet.com/"
        },
        "resolutionmedia.com": {
            "c": "Resolution Media",
            "u": "http://resolutionmedia.com/"
        },
        "resonateinsights.com": {
            "c": "Resonate",
            "u": "http://www.resonateinsights.com/"
        },
        "resonatenetworks.com": {
            "c": "Resonate",
            "u": "http://www.resonateinsights.com/"
        },
        "responsys.com": {
            "c": "Responsys",
            "u": "http://www.responsys.com/"
        },
        "blvdstatus.com": {
            "c": "Retirement Living",
            "u": "www.retirement-living.com/"
        },
        "retirement-living.com": {
            "c": "Retirement Living",
            "u": "www.retirement-living.com/"
        },
        "revcontent.com": {
            "c": "RevContent",
            "u": "http://revcontent.com/"
        },
        "revenuemax.de": {
            "c": "RevenueMax",
            "u": "http://revenuemax.de/"
        },
        "rhythmnewmedia.com": {
            "c": "Rhythm",
            "u": "http://rhythmnewmedia.com/"
        },
        "rnmd.net": {
            "c": "Rhythm",
            "u": "http://rhythmnewmedia.com/"
        },
        "1rx.io": {
            "c": "Rhythm",
            "u": "http://rhythmnewmedia.com/"
        },
        "rhythmone.com": {
            "c": "Rhythm",
            "u": "http://rhythmnewmedia.com/"
        },
        "richrelevance.com": {
            "c": "RichRelevance",
            "u": "http://www.richrelevance.com/"
        },
        "rightaction.com": {
            "c": "RightAction",
            "u": "http://rightaction.com/"
        },
        "rfihub.com": {
            "c": "Rocket Fuel",
            "u": "http://rocketfuel.com/"
        },
        "rfihub.net": {
            "c": "Rocket Fuel",
            "u": "http://rocketfuel.com/"
        },
        "rocketfuel.com": {
            "c": "Rocket Fuel",
            "u": "http://rocketfuel.com/"
        },
        "rovion.com": {
            "c": "Rovion",
            "u": "http://www.rovion.com/"
        },
        "rutarget.ru": {
            "c": "RuTarget",
            "u": "http://www.rutarget.ru/"
        },
        "aimatch.com": {
            "c": "SAS",
            "u": "http://www.sas.com/"
        },
        "sas.com": {
            "c": "SAS",
            "u": "http://www.sas.com/"
        },
        "reztrack.com": {
            "c": "Sabre",
            "u": "http://www.sabre.com/"
        },
        "sabre.com": {
            "c": "Sabre",
            "u": "http://www.sabre.com/"
        },
        "sabrehospitality.com": {
            "c": "Sabre",
            "u": "http://www.sabre.com/"
        },
        "salesforce.com": {
            "c": "Salesforce.com",
            "u": "http://www.salesforce.com/"
        },
        "samurai-factory.jp": {
            "c": "Samurai Factory",
            "u": "http://www.samurai-factory.jp/"
        },
        "shinobi.jp": {
            "c": "Samurai Factory",
            "u": "http://www.samurai-factory.jp/"
        },
        "bridgetrack.com": {
            "c": "Sapient",
            "u": "http://www.sapient.com/"
        },
        "sapient.com": {
            "c": "Sapient",
            "u": "http://www.sapient.com/"
        },
        "scandinavianadnetworks.com": {
            "c": "Scandinavian AdNetworks",
            "u": "http://www.scandinavianadnetworks.com/"
        },
        "scribol.com": {
            "c": "Scribol",
            "u": "http://scribol.com/"
        },
        "searchforce.com": {
            "c": "SearchForce",
            "u": "http://www.searchforce.com/"
        },
        "searchforce.net": {
            "c": "SearchForce",
            "u": "http://www.searchforce.com/"
        },
        "kanoodle.com": {
            "c": "Seevast",
            "u": "http://www.seevast.com/"
        },
        "pulse360.com": {
            "c": "Seevast",
            "u": "http://www.seevast.com/"
        },
        "seevast.com": {
            "c": "Seevast",
            "u": "http://www.seevast.com/"
        },
        "syndigonetworks.com": {
            "c": "Seevast",
            "u": "http://www.seevast.com/"
        },
        "nabbr.com": {
            "c": "Selectable Media",
            "u": "http://selectablemedia.com/"
        },
        "selectablemedia.com": {
            "c": "Selectable Media",
            "u": "http://selectablemedia.com/"
        },
        "sevenads.net": {
            "c": "SevenAds",
            "u": "http://www.sevenads.net/"
        },
        "sexinyourcity.com": {
            "c": "SexInYourCity",
            "u": "http://www.sexinyourcity.com/"
        },
        "shareasale.com": {
            "c": "ShareASale",
            "u": "http://www.shareasale.com/"
        },
        "shopzilla.com": {
            "c": "Shopzilla",
            "u": "http://www.shopzilla.com/"
        },
        "mkt51.net": {
            "c": "Silverpop",
            "u": "http://www.silverpop.com/"
        },
        "pages05.net": {
            "c": "Silverpop",
            "u": "http://www.silverpop.com/"
        },
        "silverpop.com": {
            "c": "Silverpop",
            "u": "http://www.silverpop.com/"
        },
        "vtrenz.net": {
            "c": "Silverpop",
            "u": "http://www.silverpop.com/"
        },
        "simpli.fi": {
            "c": "Simpli.fi",
            "u": "http://www.simpli.fi/"
        },
        "sitescout.com": {
            "c": "SiteScout",
            "u": "http://www.sitescout.com/"
        },
        "skimlinks.com": {
            "c": "Skimlinks",
            "u": "http://skimlinks.com/"
        },
        "skimresources.com": {
            "c": "Skimlinks",
            "u": "http://skimlinks.com/"
        },
        "adcentriconline.com": {
            "c": "Skupe Net",
            "u": "http://www.skupenet.com/"
        },
        "skupenet.com": {
            "c": "Skupe Net",
            "u": "http://www.skupenet.com/"
        },
        "smaato.com": {
            "c": "Smaato",
            "u": "http://www.smaato.com/"
        },
        "smileymedia.com": {
            "c": "Smiley Media",
            "u": "http://www.smileymedia.com/"
        },
        "smowtion.com": {
            "c": "Smowtion",
            "u": "http://smowtion.com/"
        },
        "snap.com": {
            "c": "Snap",
            "u": "http://www.snap.com/"
        },
        "halogenmediagroup.com": {
            "c": "SocialChorus",
            "u": "http://www.socialchorus.com/"
        },
        "halogennetwork.com": {
            "c": "SocialChorus",
            "u": "http://www.socialchorus.com/"
        },
        "socialchorus.com": {
            "c": "SocialChorus",
            "u": "http://www.socialchorus.com/"
        },
        "ratevoice.com": {
            "c": "SocialInterface",
            "u": "http://socialinterface.com/"
        },
        "socialinterface.com": {
            "c": "SocialInterface",
            "u": "http://socialinterface.com/"
        },
        "socialtwist.com": {
            "c": "SocialTwist",
            "u": "http://tellafriend.socialtwist.com/"
        },
        "spacechimpmedia.com": {
            "c": "Space Chimp Media",
            "u": "http://spacechimpmedia.com/"
        },
        "sparkstudios.com": {
            "c": "Spark Studios",
            "u": "http://www.sparkstudios.com/"
        },
        "adbutler.com": {
            "c": "Sparklit",
            "u": "http://www.sparklit.com/"
        },
        "sparklit.com": {
            "c": "Sparklit",
            "u": "http://www.sparklit.com/"
        },
        "adviva.co.uk": {
            "c": "Specific Media",
            "u": "http://www.specificmedia.com/"
        },
        "adviva.net": {
            "c": "Specific Media",
            "u": "http://www.specificmedia.com/"
        },
        "sitemeter.com": {
            "c": "Specific Media",
            "u": "http://www.specificmedia.com/"
        },
        "specificclick.net": {
            "c": "Specific Media",
            "u": "http://www.specificmedia.com/"
        },
        "specificmedia.com": {
            "c": "Specific Media",
            "u": "http://www.specificmedia.com/"
        },
        "specificmedia.co.uk": {
            "c": "Specific Media",
            "u": "http://www.specificmedia.com/"
        },
        "spectate.com": {
            "c": "Spectate",
            "u": "http://spectate.com/"
        },
        "spongegroup.com": {
            "c": "Sponge",
            "u": "http://spongegroup.com/"
        },
        "spongecell.com": {
            "c": "Spongecell",
            "u": "http://www.spongecell.com/"
        },
        "sponsorads.de": {
            "c": "SponsorAds",
            "u": "http://www.sponsorads.de/"
        },
        "spot200.com": {
            "c": "Spot200",
            "u": "http://spot200.com/"
        },
        "spotxchange.com": {
            "c": "SpotXchange",
            "u": "http://www.spotxchange.com/"
        },
        "stargamesaffiliate.com": {
            "c": "StarGames",
            "u": "https://www.stargames.net/"
        },
        "steelhouse.com": {
            "c": "SteelHouse",
            "u": "http://www.steelhouse.com/"
        },
        "steelhousemedia.com": {
            "c": "SteelHouse",
            "u": "http://www.steelhouse.com/"
        },
        "cams.com": {
            "c": "Streamray",
            "u": "http://streamray.com/"
        },
        "streamray.com": {
            "c": "Streamray",
            "u": "http://streamray.com/"
        },
        "strikead.com": {
            "c": "StrikeAd",
            "u": "http://www.strikead.com/"
        },
        "popularmedia.com": {
            "c": "StrongMail",
            "u": "http://www.strongmail.com/"
        },
        "struq.com": {
            "c": "Struq",
            "u": "http://struq.com/"
        },
        "suite66.com": {
            "c": "Suite 66",
            "u": "http://www.suite66.com/"
        },
        "summitmedia.co.uk": {
            "c": "Summit",
            "u": "http://www.summit.co.uk/"
        },
        "supersonicads.com": {
            "c": "SupersonicAds",
            "u": "http://www.supersonicads.com/"
        },
        "switchadhub.com": {
            "c": "Switch",
            "u": "http://www.switchconcepts.com/"
        },
        "switchconcepts.co.uk": {
            "c": "Switch",
            "u": "http://www.switchconcepts.com/"
        },
        "switchconcepts.com": {
            "c": "Switch",
            "u": "http://www.switchconcepts.com/"
        },
        "ethicalads.net": {
            "c": "Switch",
            "u": "http://www.switchconcepts.com/"
        },
        "swoop.com": {
            "c": "Swoop",
            "u": "http://swoop.com/"
        },
        "factortg.com": {
            "c": "SymphonyAM",
            "u": "http://www.factortg.com/"
        },
        "clickable.net": {
            "c": "Syncapse",
            "u": "http://www.syncapse.com/"
        },
        "syncapse.com": {
            "c": "Syncapse",
            "u": "http://www.syncapse.com/"
        },
        "adotsolution.com": {
            "c": "Syrup Ad",
            "u": "http://adotsolution.com/"
        },
        "tlvmedia.com": {
            "c": "TLVMedia",
            "u": "http://tlvmedia.com/"
        },
        "taboola.com": {
            "c": "Taboola",
            "u": "https://www.taboola.com/"
        },
        "perfectmarket.com": {
            "c": "Taboola",
            "u": "https://www.taboola.com/"
        },
        "tailsweep.com": {
            "c": "Tailsweep",
            "u": "http://www.tailsweep.com/"
        },
        "tap.me": {
            "c": "Tap.me",
            "u": "http://tap.me/"
        },
        "tapit.com": {
            "c": "TapIt!",
            "u": "http://tapit.com/"
        },
        "tapad.com": {
            "c": "Tapad",
            "u": "http://www.tapad.com/"
        },
        "bizmey.com": {
            "c": "Tapgage",
            "u": "http://www.tapgage.com/"
        },
        "tapgage.com": {
            "c": "Tapgage",
            "u": "http://www.tapgage.com/"
        },
        "targetix.net": {
            "c": "Targetix",
            "u": "http://targetix.net/"
        },
        "quicknoodles.com": {
            "c": "Tatto Media",
            "u": "http://tattomedia.com/"
        },
        "tattomedia.com": {
            "c": "Tatto Media",
            "u": "http://tattomedia.com/"
        },
        "teadma.com": {
            "c": "Teadma",
            "u": "http://www.teadma.com/"
        },
        "teads.tv": {
            "c": "Teads.tv",
            "u": "http://teads.tv/"
        },
        "ebuzzing.com": {
            "c": "Teads.tv",
            "u": "http://teads.tv/"
        },
        "technorati.com": {
            "c": "Technorati",
            "u": "http://technorati.com/"
        },
        "technoratimedia.com": {
            "c": "Technorati",
            "u": "http://technorati.com/"
        },
        "tellapart.com": {
            "c": "TellApart",
            "u": "http://tellapart.com/"
        },
        "tellapt.com": {
            "c": "TellApart",
            "u": "http://tellapart.com/"
        },
        "sensis.com.au": {
            "c": "Telstra",
            "u": "http://www.telstra.com.au/"
        },
        "sensisdata.com.au": {
            "c": "Telstra",
            "u": "http://www.telstra.com.au/"
        },
        "sensisdigitalmedia.com.au": {
            "c": "Telstra",
            "u": "http://www.telstra.com.au/"
        },
        "telstra.com.au": {
            "c": "Telstra",
            "u": "http://www.telstra.com.au/"
        },
        "eztargetmedia.com": {
            "c": "Terra",
            "u": "http://www.terra.com.br/"
        },
        "terra.com.br": {
            "c": "Terra",
            "u": "http://www.terra.com.br/"
        },
        "hittail.com": {
            "c": "The Numa Group",
            "u": "http://www.thenumagroup.com/"
        },
        "thenumagroup.com": {
            "c": "The Numa Group",
            "u": "http://www.thenumagroup.com/"
        },
        "rimmkaufman.com": {
            "c": "The Rimm-Kaufman Group",
            "u": "http://www.rimmkaufman.com/"
        },
        "rkdms.com": {
            "c": "The Rimm-Kaufman Group",
            "u": "http://www.rimmkaufman.com/"
        },
        "thesearchagency.com": {
            "c": "The Search Agency",
            "u": "http://www.thesearchagency.com/"
        },
        "thesearchagency.net": {
            "c": "The Search Agency",
            "u": "http://www.thesearchagency.com/"
        },
        "adsrvr.org": {
            "c": "The Trade Desk",
            "u": "http://thetradedesk.com/"
        },
        "thetradedesk.com": {
            "c": "The Trade Desk",
            "u": "http://thetradedesk.com/"
        },
        "echosearch.com": {
            "c": "Think Realtime",
            "u": "http://www.thinkrealtime.com/"
        },
        "esm1.net": {
            "c": "Think Realtime",
            "u": "http://www.thinkrealtime.com/"
        },
        "thinkrealtime.com": {
            "c": "Think Realtime",
            "u": "http://www.thinkrealtime.com/"
        },
        "carbonads.com": {
            "c": "Tinder",
            "u": "http://tinder.com/"
        },
        "tinder.com": {
            "c": "Tinder",
            "u": "http://tinder.com/"
        },
        "tiqiq.com": {
            "c": "TiqIQ",
            "u": "http://www.tiqiq.com/"
        },
        "adternal.com": {
            "c": "Tisoomi",
            "u": "http://www.tisoomi.com/"
        },
        "tisoomi.com": {
            "c": "Tisoomi",
            "u": "http://www.tisoomi.com/"
        },
        "todacell.com": {
            "c": "Todacell",
            "u": "http://www.todacell.com/"
        },
        "tonefuse.com": {
            "c": "ToneFuse",
            "u": "http://tonefuse.com/"
        },
        "clickfuse.com": {
            "c": "ToneMedia",
            "u": "http://tonemedia.com/"
        },
        "tonemedia.com": {
            "c": "ToneMedia",
            "u": "http://tonemedia.com/"
        },
        "inq.com": {
            "c": "TouchCommerce",
            "u": "http://www.touchcommerce.com/"
        },
        "touchcommerce.com": {
            "c": "TouchCommerce",
            "u": "http://www.touchcommerce.com/"
        },
        "trackingsoft.com": {
            "c": "TrackingSoft",
            "u": "http://trackingsoft.com/"
        },
        "tradetracker.com": {
            "c": "TradeTracker",
            "u": "http://www.tradetracker.com/"
        },
        "tradetracker.net": {
            "c": "TradeTracker",
            "u": "http://www.tradetracker.com/"
        },
        "tradedoubler.com": {
            "c": "Tradedoubler",
            "u": "http://www.tradedoubler.com/"
        },
        "traffichaus.com": {
            "c": "TrafficHaus",
            "u": "http://www.traffichaus.com/"
        },
        "traffichouse.com": {
            "c": "TrafficHaus",
            "u": "http://www.traffichaus.com/"
        },
        "trafficrevenue.net": {
            "c": "TrafficRevenue",
            "u": "http://www.trafficrevenue.net/"
        },
        "traffiq.com": {
            "c": "Traffiq",
            "u": "http://www.traffiq.com/"
        },
        "traveladnetwork.com": {
            "c": "Travora Media",
            "u": "http://www.travoramedia.com/"
        },
        "traveladvertising.com": {
            "c": "Travora Media",
            "u": "http://www.travoramedia.com/"
        },
        "travoramedia.com": {
            "c": "Travora Media",
            "u": "http://www.travoramedia.com/"
        },
        "scanscout.com": {
            "c": "Tremor Video",
            "u": "http://www.tremorvideo.com/"
        },
        "tmnetads.com": {
            "c": "Tremor Video",
            "u": "http://www.tremorvideo.com/"
        },
        "tremormedia.com": {
            "c": "Tremor Video",
            "u": "http://www.tremorvideo.com/"
        },
        "tremorvideo.com": {
            "c": "Tremor Video",
            "u": "http://www.tremorvideo.com/"
        },
        "tremorhub.com": {
            "c": "Tremor Video",
            "u": "http://www.tremorvideo.com/"
        },
        "triggit.com": {
            "c": "Triggit",
            "u": "http://triggit.com/"
        },
        "3lift.com": {
            "c": "TripleLift",
            "u": "http://triplelift.com/"
        },
        "triplelift.com": {
            "c": "TripleLift",
            "u": "http://triplelift.com/"
        },
        "adlegend.com": {
            "c": "TruEffect",
            "u": "http://www.trueffect.com/"
        },
        "trueffect.com": {
            "c": "TruEffect",
            "u": "http://www.trueffect.com/"
        },
        "tmogul.com": {
            "c": "TubeMogul",
            "u": "http://www.tubemogul.com/"
        },
        "tubemogul.com": {
            "c": "TubeMogul",
            "u": "http://www.tubemogul.com/"
        },
        "buzzlogic.com": {
            "c": "Twelvefold",
            "u": "http://www.twelvefold.com/"
        },
        "twelvefold.com": {
            "c": "Twelvefold",
            "u": "http://www.twelvefold.com/"
        },
        "tyroo.com": {
            "c": "Tyroo",
            "u": "http://www.tyroo.com/"
        },
        "upsellit.com": {
            "c": "USI Technologies",
            "u": "http://www.usitechnologies.com/"
        },
        "usitechnologies.com": {
            "c": "USI Technologies",
            "u": "http://www.usitechnologies.com/"
        },
        "unanimis.co.uk": {
            "c": "Unanimis",
            "u": "http://www.unanimis.co.uk/"
        },
        "udmserve.net": {
            "c": "Underdog Media",
            "u": "http://www.underdogmedia.com/"
        },
        "underdogmedia.com": {
            "c": "Underdog Media",
            "u": "http://www.underdogmedia.com/"
        },
        "undertone.com": {
            "c": "Undertone",
            "u": "http://www.undertone.com/"
        },
        "undertonenetworks.com": {
            "c": "Undertone",
            "u": "http://www.undertone.com/"
        },
        "undertonevideo.com": {
            "c": "Undertone",
            "u": "http://www.undertone.com/"
        },
        "51network.com": {
            "c": "UniQlick",
            "u": "http://www.uniqlick.com/"
        },
        "uniqlick.com": {
            "c": "UniQlick",
            "u": "http://www.uniqlick.com/"
        },
        "wanmo.com": {
            "c": "UniQlick",
            "u": "http://www.uniqlick.com/"
        },
        "unrulymedia.com": {
            "c": "Unruly",
            "u": "http://www.unrulymedia.com/"
        },
        "valuead.com": {
            "c": "Value Ad",
            "u": "http://valuead.com/"
        },
        "adserver.com": {
            "c": "ValueClick",
            "u": "http://www.valueclick.com/"
        },
        "dotomi.com": {
            "c": "ValueClick",
            "u": "http://www.valueclick.com/"
        },
        "dtmpub.com": {
            "c": "ValueClick",
            "u": "http://www.valueclick.com/"
        },
        "emjcd.com": {
            "c": "ValueClick",
            "u": "http://www.valueclick.com/"
        },
        "fastclick.com": {
            "c": "ValueClick",
            "u": "http://www.valueclick.com/"
        },
        "fastclick.net": {
            "c": "ValueClick",
            "u": "http://www.valueclick.com/"
        },
        "greystripe.com": {
            "c": "ValueClick",
            "u": "http://www.valueclick.com/"
        },
        "lduhtrp.net": {
            "c": "ValueClick",
            "u": "http://www.valueclick.com/"
        },
        "mediaplex.com": {
            "c": "ValueClick",
            "u": "http://www.valueclick.com/"
        },
        "valueclick.com": {
            "c": "ValueClick",
            "u": "http://www.valueclick.com/"
        },
        "valueclick.net": {
            "c": "ValueClick",
            "u": "http://www.valueclick.com/"
        },
        "valueclickmedia.com": {
            "c": "ValueClick",
            "u": "http://www.valueclick.com/"
        },
        "amigos.com": {
            "c": "Various",
            "u": "http://www.various.com/"
        },
        "getiton.com": {
            "c": "Various",
            "u": "http://www.various.com/"
        },
        "medley.com": {
            "c": "Various",
            "u": "http://www.various.com/"
        },
        "nostringsattached.com": {
            "c": "Various",
            "u": "http://www.various.com/"
        },
        "various.com": {
            "c": "Various",
            "u": "http://www.various.com/"
        },
        "ivdopia.com": {
            "c": "Vdopia",
            "u": "http://www.vdopia.com/"
        },
        "vdopia.com": {
            "c": "Vdopia",
            "u": "http://www.vdopia.com/"
        },
        "veeseo.com": {
            "c": "Veeseo",
            "u": "http://veeseo.com"
        },
        "adsvelocity.com": {
            "c": "Velocity Media",
            "u": "http://adsvelocity.com/"
        },
        "mobclix.com": {
            "c": "Velti",
            "u": "http://www.velti.com/"
        },
        "velti.com": {
            "c": "Velti",
            "u": "http://www.velti.com/"
        },
        "vemba.com": {
            "c": "Vemba",
            "u": "https://www.vemba.com/"
        },
        "singlefeed.com": {
            "c": "Vendio",
            "u": "http://www.vendio.com/"
        },
        "vendio.com": {
            "c": "Vendio",
            "u": "http://www.vendio.com/"
        },
        "veoxa.com": {
            "c": "Veoxa",
            "u": "http://www.veoxa.com/"
        },
        "veremedia.com": {
            "c": "Veremedia",
            "u": "http://www.veremedia.com/"
        },
        "verticalresponse.com": {
            "c": "VerticalResponse",
            "u": "http://www.verticalresponse.com/"
        },
        "vresp.com": {
            "c": "VerticalResponse",
            "u": "http://www.verticalresponse.com/"
        },
        "intellitxt.com": {
            "c": "Vibrant Media",
            "u": "http://www.vibrantmedia.com/"
        },
        "picadmedia.com": {
            "c": "Vibrant Media",
            "u": "http://www.vibrantmedia.com/"
        },
        "vibrantmedia.com": {
            "c": "Vibrant Media",
            "u": "http://www.vibrantmedia.com/"
        },
        "viglink.com": {
            "c": "VigLink",
            "u": "http://www.viglink.com/"
        },
        "viewablemedia.net": {
            "c": "Visible Measures",
            "u": "http://www.visiblemeasures.com/"
        },
        "visiblemeasures.com": {
            "c": "Visible Measures",
            "u": "http://www.visiblemeasures.com/"
        },
        "visbrands.com": {
            "c": "VisibleBrands",
            "u": "http://www.visbrands.com/"
        },
        "vdna-assets.com": {
            "c": "VisualDNA",
            "u": "http://www.visualdna.com/"
        },
        "visualdna-stats.com": {
            "c": "VisualDNA",
            "u": "http://www.visualdna.com/"
        },
        "visualdna.com": {
            "c": "VisualDNA",
            "u": "http://www.visualdna.com/"
        },
        "vizu.com": {
            "c": "Vizu",
            "u": "http://www.vizu.com/"
        },
        "vizury.com": {
            "c": "Vizury",
            "u": "http://www.vizury.com/"
        },
        "vserv.com": {
            "c": "Vserv",
            "u": "http://www.vserv.com/"
        },
        "vserv.mobi": {
            "c": "Vserv",
            "u": "http://www.vserv.com/"
        },
        "247realmedia.com": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "accelerator-media.com": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "acceleratorusa.com": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "decdna.net": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "decideinteractive.com": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "gmads.net": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "groupm.com": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "kantarmedia.com": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "mecglobal.com": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "mindshare.nl": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "mookie1.com": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "pm14.com": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "realmedia.com": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "targ.ad": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "themig.com": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "wpp.com": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "xaxis.com": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "contentwidgets.net": {
            "c": "Wahoha",
            "u": "http://wahoha.com/"
        },
        "wahoha.com": {
            "c": "Wahoha",
            "u": "http://wahoha.com/"
        },
        "feedperfect.com": {
            "c": "Web.com",
            "u": "http://www.web.com/"
        },
        "web.com": {
            "c": "Web.com",
            "u": "http://www.web.com/"
        },
        "webads.co.uk": {
            "c": "WebAds",
            "u": "http://www.webads.co.uk/"
        },
        "webgozar.com": {
            "c": "WebGozar.com",
            "u": "http://www.webgozar.com/"
        },
        "webgozar.ir": {
            "c": "WebGozar.com",
            "u": "http://www.webgozar.com/"
        },
        "dsmmadvantage.com": {
            "c": "WebMetro",
            "u": "http://www.webmetro.com/"
        },
        "webmetro.com": {
            "c": "WebMetro",
            "u": "http://www.webmetro.com/"
        },
        "weborama.com": {
            "c": "Weborama",
            "u": "http://weborama.com/"
        },
        "weborama.fr": {
            "c": "Weborama",
            "u": "http://weborama.com/"
        },
        "webtraffic.no": {
            "c": "Webtraffic",
            "u": "http://www.webtraffic.se/"
        },
        "webtraffic.se": {
            "c": "Webtraffic",
            "u": "http://www.webtraffic.se/"
        },
        "wiredminds.com": {
            "c": "WiredMinds",
            "u": "http://www.wiredminds.com/"
        },
        "wiredminds.de": {
            "c": "WiredMinds",
            "u": "http://www.wiredminds.com/"
        },
        "adtotal.pl": {
            "c": "Wirtualna Polska",
            "u": "http://www.wp.pl/"
        },
        "wp.pl": {
            "c": "Wirtualna Polska",
            "u": "http://www.wp.pl/"
        },
        "wishabi.com": {
            "c": "Wishabi",
            "u": "http://wishabi.com"
        },
        "wishabi.net": {
            "c": "Wishabi",
            "u": "http://wishabi.com"
        },
        "wordstream.com": {
            "c": "WordStream",
            "u": "http://www.wordstream.com/"
        },
        "admanager-xertive.com": {
            "c": "Xertive Media",
            "u": "http://www.xertivemedia.com/"
        },
        "xertivemedia.com": {
            "c": "Xertive Media",
            "u": "http://www.xertivemedia.com/"
        },
        "adplan-ds.com": {
            "c": "Xrost DS",
            "u": "http://www.adplan-ds.com/"
        },
        "ydworld.com": {
            "c": "YD",
            "u": "http://www.ydworld.com/"
        },
        "yieldivision.com": {
            "c": "YD",
            "u": "http://www.ydworld.com/"
        },
        "yoc.com": {
            "c": "YOC",
            "u": "http://group.yoc.com/"
        },
        "yoc-performance.com": {
            "c": "YOC",
            "u": "http://group.yoc.com/"
        },
        "yabuka.com": {
            "c": "Yabuka",
            "u": "http://www.yabuka.com/"
        },
        "adinterax.com": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "adrevolver.com": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "bluelithium.com": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "dapper.net": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "interclick.com": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "overture.com": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "rightmedia.com": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "rmxads.com": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "secure-adserver.com": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "adserver.yahoo.com": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "advertising.yahoo.com": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "marketingsolutions.yahoo.com": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "thewheelof.com": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "yieldmanager.com": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "yieldmanager.net": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "yldmgrimg.net": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "web-visor.com": {
            "c": "Yandex",
            "u": "http://www.yandex.com/"
        },
        "moikrug.ru": {
            "c": "Yandex",
            "u": "http://www.yandex.com/"
        },
        "yandex.com": {
            "c": "Yandex",
            "u": "http://www.yandex.com/"
        },
        "yandex.ru": {
            "c": "Yandex",
            "u": "http://www.yandex.com/"
        },
        "yandex.st": {
            "c": "Yandex",
            "u": "http://www.yandex.com/"
        },
        "yandex.ua": {
            "c": "Yandex",
            "u": "http://www.yandex.com/"
        },
        "yandex.com.tr": {
            "c": "Yandex",
            "u": "http://www.yandex.com/"
        },
        "yandex.by": {
            "c": "Yandex",
            "u": "http://www.yandex.com/"
        },
        "addynamix.com": {
            "c": "Ybrant Digital",
            "u": "http://www.ybrantdigital.com/"
        },
        "adserverplus.com": {
            "c": "Ybrant Digital",
            "u": "http://www.ybrantdigital.com/"
        },
        "oridian.com": {
            "c": "Ybrant Digital",
            "u": "http://www.ybrantdigital.com/"
        },
        "ybrantdigital.com": {
            "c": "Ybrant Digital",
            "u": "http://www.ybrantdigital.com/"
        },
        "attracto.com": {
            "c": "YellowHammer",
            "u": "http://www.yhmg.com/"
        },
        "clickhype.com": {
            "c": "YellowHammer",
            "u": "http://www.yhmg.com/"
        },
        "yellowhammermg.com": {
            "c": "YellowHammer",
            "u": "http://www.yhmg.com/"
        },
        "yhmg.com": {
            "c": "YellowHammer",
            "u": "http://www.yhmg.com/"
        },
        "yesads.com": {
            "c": "Yes Ads",
            "u": "http://yesads.com/"
        },
        "yieldads.com": {
            "c": "YieldAds",
            "u": "http://yieldads.com/"
        },
        "ybx.io": {
            "c": "YieldBids",
            "u": "http://ybx.io/"
        },
        "yieldbuild.com": {
            "c": "YieldBuild",
            "u": "http://yieldbuild.com/"
        },
        "yieldlab.de": {
            "c": "Yieldlab",
            "u": "http://www.yieldlab.de/"
        },
        "yieldlab.net": {
            "c": "Yieldlab",
            "u": "http://www.yieldlab.de/"
        },
        "yieldmo.com": {
            "c": "Yieldmo",
            "u": "https://yieldmo.com"
        },
        "yoggrt.com": {
            "c": "Yoggrt",
            "u": "http://www.yoggrt.com/"
        },
        "yume.com": {
            "c": "YuMe",
            "u": "http://www.yume.com/"
        },
        "yumenetworks.com": {
            "c": "YuMe",
            "u": "http://www.yume.com/"
        },
        "zedo.com": {
            "c": "ZEDO",
            "u": "http://www.zedo.com/"
        },
        "zincx.com": {
            "c": "ZEDO",
            "u": "http://www.zedo.com/"
        },
        "metricsdirect.com": {
            "c": "Zango",
            "u": "http://www.zango.com/"
        },
        "zango.com": {
            "c": "Zango",
            "u": "http://www.zango.com/"
        },
        "zemanta.com": {
            "c": "Zemanta",
            "u": "http://www.zemanta.com/"
        },
        "zestad.com": {
            "c": "ZestAd",
            "u": "http://www.zestad.com/"
        },
        "insightgrit.com": {
            "c": "Zeta Email Solutions",
            "u": "http://www.zetaemailsolutions.com/"
        },
        "zetaemailsolutions.com": {
            "c": "Zeta Email Solutions",
            "u": "http://www.zetaemailsolutions.com/"
        },
        "zumobi.com": {
            "c": "Zumobi",
            "u": "http://www.zumobi.com/"
        },
        "zypmedia.com": {
            "c": "ZypMedia",
            "u": "http://www.zypmedia.com/"
        },
        "ru4.com": {
            "c": "[x+1]",
            "u": "http://www.xplusone.com/"
        },
        "xplusone.com": {
            "c": "[x+1]",
            "u": "http://www.xplusone.com/"
        },
        "adpepper.com": {
            "c": "ad pepper media",
            "u": "http://www.adpepper.us/"
        },
        "adpepper.us": {
            "c": "ad pepper media",
            "u": "http://www.adpepper.us/"
        },
        "ad6media.fr": {
            "c": "ad6media",
            "u": "http://www.ad6media.fr/"
        },
        "adbrite.com": {
            "c": "adBrite",
            "u": "http://www.adbrite.com/"
        },
        "adprs.net": {
            "c": "adPrecision",
            "u": "http://adprecision.net/"
        },
        "aprecision.net": {
            "c": "adPrecision",
            "u": "http://adprecision.net/"
        },
        "addgloo.com": {
            "c": "addGloo",
            "u": "http://www.addgloo.com/"
        },
        "adhood.com": {
            "c": "adhood",
            "u": "http://www.adhood.com/"
        },
        "adnologies.com": {
            "c": "adnologies",
            "u": "http://www.adnologies.com/"
        },
        "heias.com": {
            "c": "adnologies",
            "u": "http://www.adnologies.com/"
        },
        "adrolays.com": {
            "c": "adrolays",
            "u": "http://adrolays.com/"
        },
        "adrolays.de": {
            "c": "adrolays",
            "u": "http://adrolays.com/"
        },
        "adscale.de": {
            "c": "adscale",
            "u": "http://www.adscale.de/"
        },
        "adyard.de": {
            "c": "adyard",
            "u": "http://adyard.de/"
        },
        "adzly.com": {
            "c": "adzly",
            "u": "http://www.adzly.com/"
        },
        "affili.net": {
            "c": "affilinet",
            "u": "http://www.affili.net/"
        },
        "affilinet-inside.de": {
            "c": "affilinet",
            "u": "http://www.affili.net/"
        },
        "banner-rotation.com": {
            "c": "affilinet",
            "u": "http://www.affili.net/"
        },
        "successfultogether.co.uk": {
            "c": "affilinet",
            "u": "http://www.affili.net/"
        },
        "appssavvy.com": {
            "c": "appssavvy",
            "u": "http://appssavvy.com/"
        },
        "beencounter.com": {
            "c": "beencounter",
            "u": "http://www.beencounter.com/"
        },
        "adbutler.de": {
            "c": "belboon",
            "u": "http://www.belboon.com/"
        },
        "belboon.com": {
            "c": "belboon",
            "u": "http://www.belboon.com/"
        },
        "bigmir.net": {
            "c": "bigmir)net",
            "u": "http://www.bigmir.net/"
        },
        "cxense.com": {
            "c": "cXense",
            "u": "http://www.cxense.com/"
        },
        "adxpose.com": {
            "c": "comScore",
            "u": "http://www.comscore.com/"
        },
        "dianomi.com": {
            "c": "dianomi",
            "u": "http://www.dianomi.com/"
        },
        "ebay.com": {
            "c": "eBay",
            "u": "http://www.ebay.com/"
        },
        "gopjn.com": {
            "c": "eBay",
            "u": "http://www.ebay.com/"
        },
        "etrigue.com": {
            "c": "eTrigue",
            "u": "http://www.etrigue.com/"
        },
        "ewaydirect.com": {
            "c": "eWayDirect",
            "u": "http://www.ewaydirect.com/"
        },
        "ixs1.net": {
            "c": "eWayDirect",
            "u": "http://www.ewaydirect.com/"
        },
        "exelate.com": {
            "c": "eXelate",
            "u": "http://exelate.com/"
        },
        "exelator.com": {
            "c": "eXelate",
            "u": "http://exelate.com/"
        },
        "e-kolay.net": {
            "c": "ekolay",
            "u": "http://www.ekolay.net/"
        },
        "ekolay.net": {
            "c": "ekolay",
            "u": "http://www.ekolay.net/"
        },
        "bnmla.com": {
            "c": "engage:BDR",
            "u": "http://engagebdr.com/"
        },
        "engagebdr.com": {
            "c": "engage:BDR",
            "u": "http://engagebdr.com/"
        },
        "777seo.com": {
            "c": "ewebse",
            "u": "http://ewebse.com/"
        },
        "ewebse.com": {
            "c": "ewebse",
            "u": "http://ewebse.com/"
        },
        "excitad.com": {
            "c": "excitad",
            "u": "http://excitad.com/"
        },
        "expo-max.com": {
            "c": "expo-MAX",
            "u": "http://expo-max.com/"
        },
        "eyereturn.com": {
            "c": "eyeReturn Marketing",
            "u": "http://www.eyereturnmarketing.com/"
        },
        "eyereturnmarketing.com": {
            "c": "eyeReturn Marketing",
            "u": "http://www.eyereturnmarketing.com/"
        },
        "faithadnet.com": {
            "c": "faithadnet",
            "u": "http://www.faithadnet.com/"
        },
        "600z.com": {
            "c": "iEntry",
            "u": "http://www.ientry.com/"
        },
        "ientry.com": {
            "c": "iEntry",
            "u": "http://www.ientry.com/"
        },
        "centraliprom.com": {
            "c": "iPROM",
            "u": "http://www.iprom.si/"
        },
        "iprom.net": {
            "c": "iPROM",
            "u": "http://www.iprom.si/"
        },
        "iprom.si": {
            "c": "iPROM",
            "u": "http://www.iprom.si/"
        },
        "mediaiprom.com": {
            "c": "iPROM",
            "u": "http://www.iprom.si/"
        },
        "ipromote.com": {
            "c": "iPromote",
            "u": "http://www.ipromote.com/"
        },
        "iprospect.com": {
            "c": "iProspect",
            "u": "http://www.iprospect.com/"
        },
        "clickmanage.com": {
            "c": "iProspect",
            "u": "http://www.iprospect.com/"
        },
        "inner-active.com": {
            "c": "inneractive",
            "u": "http://inner-active.com/"
        },
        "adsbyisocket.com": {
            "c": "isocket",
            "u": "https://www.isocket.com/"
        },
        "isocket.com": {
            "c": "isocket",
            "u": "https://www.isocket.com/"
        },
        "m6d.com": {
            "c": "m6d",
            "u": "http://m6d.com/"
        },
        "media6degrees.com": {
            "c": "m6d",
            "u": "http://m6d.com/"
        },
        "madvertise.com": {
            "c": "madvertise",
            "u": "http://madvertise.com/"
        },
        "mashero.com": {
            "c": "mashero",
            "u": "http://www.mashero.com/"
        },
        "media.net": {
            "c": "media.net",
            "u": "http://www.media.net/"
        },
        "mediaforge.com": {
            "c": "mediaFORGE",
            "u": "http://www.mediaforge.com/"
        },
        "mythings.com": {
            "c": "myThings",
            "u": "http://www.mythings.com/"
        },
        "mythingsmedia.com": {
            "c": "myThings",
            "u": "http://www.mythings.com/"
        },
        "newtention.de": {
            "c": "newtention",
            "u": "http://newtention.de/"
        },
        "newtention.net": {
            "c": "newtention",
            "u": "http://newtention.de/"
        },
        "newtentionassets.net": {
            "c": "newtention",
            "u": "http://newtention.de/"
        },
        "nrelate.com": {
            "c": "nrelate",
            "u": "http://nrelate.com/"
        },
        "nugg.ad": {
            "c": "nugg.ad",
            "u": "http://www.nugg.ad/"
        },
        "nuggad.net": {
            "c": "nugg.ad",
            "u": "http://www.nugg.ad/"
        },
        "onad.eu": {
            "c": "onAd",
            "u": "http://www.onad.eu/"
        },
        "plista.com": {
            "c": "plista",
            "u": "http://www.plista.com/"
        },
        "quadrantone.com": {
            "c": "quadrantOne",
            "u": "http://www.quadrantone.com/"
        },
        "sociomantic.com": {
            "c": "sociomantic labs",
            "u": "http://www.sociomantic.com/"
        },
        "sophus3.co.uk": {
            "c": "sophus3",
            "u": "http://www.sophus3.com/"
        },
        "sophus3.com": {
            "c": "sophus3",
            "u": "http://www.sophus3.com/"
        },
        "twyn.com": {
            "c": "Twyn Group",
            "u": "http://www.twyn.com/"
        },
        "twyn-group.com": {
            "c": "Twyn Group",
            "u": "http://www.twyn.com/"
        },
        "ucoz.ae": {
            "c": "uCoz",
            "u": "http://www.ucoz.com/"
        },
        "ucoz.br": {
            "c": "uCoz",
            "u": "http://www.ucoz.com/"
        },
        "ucoz.com": {
            "c": "uCoz",
            "u": "http://www.ucoz.com/"
        },
        "ucoz.du": {
            "c": "uCoz",
            "u": "http://www.ucoz.com/"
        },
        "ucoz.fr": {
            "c": "uCoz",
            "u": "http://www.ucoz.com/"
        },
        "ucoz.net": {
            "c": "uCoz",
            "u": "http://www.ucoz.com/"
        },
        "ucoz.ru": {
            "c": "uCoz",
            "u": "http://www.ucoz.com/"
        },
        "up-value.de": {
            "c": "up-value",
            "u": "http://www.up-value.de/"
        },
        "xad.com": {
            "c": "xAd",
            "u": "http://www.xad.com/"
        },
        "xplosion.de": {
            "c": "xplosion interactive",
            "u": "http://www.xplosion.de/"
        },
        "youknowbest.com": {
            "c": "youknowbest",
            "u": "http://www.youknowbest.com/"
        },
        "buy.at": {
            "c": "zanox",
            "u": "http://www.zanox.com/"
        },
        "zanox-affiliate.de": {
            "c": "zanox",
            "u": "http://www.zanox.com/"
        },
        "zanox.com": {
            "c": "zanox",
            "u": "http://www.zanox.com/"
        },
        "zaparena.com": {
            "c": "zapunited",
            "u": "http://www.zapunited.com/"
        },
        "zapunited.com": {
            "c": "zapunited",
            "u": "http://www.zapunited.com/"
        },
        "2mdn.net": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "admeld.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "admob.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "cc-dt.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "destinationurl.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "developers.google.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "doubleclick.net": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "gmail.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "google-analytics.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "adwords.google.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "mail.google.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "inbox.google.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "plus.google.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "plusone.google.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "voice.google.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "wave.google.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "googleadservices.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "googlemail.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "googlesyndication.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "googletagservices.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "invitemedia.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "orkut.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "postrank.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "smtad.net": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "teracent.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "teracent.net": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "ytsa.net": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "googletagmanager.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        }
    },
    "Analytics": {
        "63squares.com": {
            "c": "63 Squares",
            "u": "http://63squares.com/"
        },
        "i-stats.com": {
            "c": "63 Squares",
            "u": "http://63squares.com/"
        },
        "atinternet.com": {
            "c": "AT Internet",
            "u": "http://www.atinternet.com/"
        },
        "xiti.com": {
            "c": "AT Internet",
            "u": "http://www.atinternet.com/"
        },
        "acxiom.com": {
            "c": "Acxiom",
            "u": "http://www.acxiom.com/"
        },
        "mm7.net": {
            "c": "Acxiom",
            "u": "http://www.acxiom.com/"
        },
        "acxiomapac.com": {
            "c": "Acxiom",
            "u": "http://www.acxiom.com/"
        },
        "3dstats.com": {
            "c": "AddFreeStats",
            "u": "http://www.addfreestats.com/"
        },
        "addfreestats.com": {
            "c": "AddFreeStats",
            "u": "http://www.addfreestats.com/"
        },
        "adlooxtracking.com": {
            "c": "Adloox",
            "u": "http://www.adloox.com/"
        },
        "adloox.com": {
            "c": "Adloox",
            "u": "http://www.adloox.com/"
        },
        "adobedtm.com": {
            "c": "Adobe",
            "u": "http://www.adobe.com/"
        },
        "adventori.com": {
            "c": "Adventori",
            "u": "https://adventori.com"
        },
        "amadesa.com": {
            "c": "Amadesa",
            "u": "http://www.amadesa.com/"
        },
        "amazingcounters.com": {
            "c": "Amazing Counters",
            "u": "http://amazingcounters.com/"
        },
        "alexametrics.com": {
            "c": "Amazon.com",
            "u": "http://www.amazon.com/"
        },
        "attracta.com": {
            "c": "Attracta",
            "u": "https://www.attracta.com/"
        },
        "polldaddy.com": {
            "c": "Automattic",
            "u": "http://automattic.com/"
        },
        "awio.com": {
            "c": "Awio",
            "u": "http://www.awio.com/"
        },
        "w3counter.com": {
            "c": "Awio",
            "u": "http://www.awio.com/"
        },
        "w3roi.com": {
            "c": "Awio",
            "u": "http://www.awio.com/"
        },
        "belstat.be": {
            "c": "Belstat",
            "u": "http://www.belstat.com/"
        },
        "belstat.com": {
            "c": "Belstat",
            "u": "http://www.belstat.com/"
        },
        "belstat.de": {
            "c": "Belstat",
            "u": "http://www.belstat.com/"
        },
        "belstat.fr": {
            "c": "Belstat",
            "u": "http://www.belstat.com/"
        },
        "belstat.nl": {
            "c": "Belstat",
            "u": "http://www.belstat.com/"
        },
        "blogcounter.de": {
            "c": "BlogCounter.com",
            "u": "http://www.blogcounter.de/"
        },
        "bluemetrix.com": {
            "c": "Bluemetrix",
            "u": "http://www.bluemetrix.com/"
        },
        "bmmetrix.com": {
            "c": "Bluemetrix",
            "u": "http://www.bluemetrix.com/"
        },
        "branica.com": {
            "c": "Branica",
            "u": "http://www.branica.com/"
        },
        "brightedge.com": {
            "c": "BrightEdge",
            "u": "http://www.brightedge.com/"
        },
        "bubblestat.com": {
            "c": "Bubblestat",
            "u": "http://www.bubblestat.com/"
        },
        "attributionmodel.com": {
            "c": "C3 Metrics",
            "u": "http://c3metrics.com/"
        },
        "c3metrics.com": {
            "c": "C3 Metrics",
            "u": "http://c3metrics.com/"
        },
        "c3tag.com": {
            "c": "C3 Metrics",
            "u": "http://c3metrics.com/"
        },
        "cnzz.com": {
            "c": "CNZZ",
            "u": "http://www.cnzz.com/"
        },
        "chartbeat.com": {
            "c": "Chartbeat",
            "u": "http://chartbeat.com/"
        },
        "chartbeat.net": {
            "c": "Chartbeat",
            "u": "http://chartbeat.com/"
        },
        "clicktale.com": {
            "c": "ClickTale",
            "u": "http://www.clicktale.com/"
        },
        "clicktale.net": {
            "c": "ClickTale",
            "u": "http://www.clicktale.com/"
        },
        "pantherssl.com": {
            "c": "ClickTale",
            "u": "http://www.clicktale.com/"
        },
        "clickdensity.com": {
            "c": "Clickdensity",
            "u": "http://www.clickdensity.com/"
        },
        "clixmetrix.com": {
            "c": "ClixMetrix",
            "u": "http://www.clixmetrix.com/"
        },
        "clixpy.com": {
            "c": "Clixpy",
            "u": "http://clixpy.com/"
        },
        "clustrmaps.com": {
            "c": "ClustrMaps",
            "u": "http://www.clustrmaps.com/"
        },
        "axf8.net": {
            "c": "Compuware",
            "u": "http://www.compuware.com/"
        },
        "compuware.com": {
            "c": "Compuware",
            "u": "http://www.compuware.com/"
        },
        "gomez.com": {
            "c": "Compuware",
            "u": "http://www.compuware.com/"
        },
        "connexity.com": {
            "c": "Connexity",
            "u": "http://www.connexity.com/"
        },
        "connexity.net": {
            "c": "Connexity",
            "u": "http://www.connexity.com/"
        },
        "zmedia.com": {
            "c": "Conversant Media",
            "u": "http://www.conversantmedia.com/"
        },
        "conversantmedia.com": {
            "c": "Conversant Media",
            "u": "http://www.conversantmedia.com/"
        },
        "convert.com": {
            "c": "Convert Insights",
            "u": "http://www.convert.com/"
        },
        "reedge.com": {
            "c": "Convert Insights",
            "u": "http://www.convert.com/"
        },
        "convertro.com": {
            "c": "Convertro",
            "u": "http://www.convertro.com/"
        },
        "cetrk.com": {
            "c": "Crazy Egg",
            "u": "http://www.crazyegg.com/"
        },
        "crazyegg.com": {
            "c": "Crazy Egg",
            "u": "http://www.crazyegg.com/"
        },
        "crowdscience.com": {
            "c": "Crowd Science",
            "u": "http://crowdscience.com/"
        },
        "cya2.net": {
            "c": "Cya2",
            "u": "http://cya2.net/"
        },
        "collserve.com": {
            "c": "Dataium",
            "u": "http://www.dataium.com/"
        },
        "dataium.com": {
            "c": "Dataium",
            "u": "http://www.dataium.com/"
        },
        "deepintent.com": {
            "c": "Deep Intent",
            "u": "https://www.deepintent.com/"
        },
        "demandbase.com": {
            "c": "Demandbase",
            "u": "http://www.demandbase.com/"
        },
        "ipcounter.de": {
            "c": "DirectCORP",
            "u": "http://www.directcorp.de/"
        },
        "trackersimulator.org": {
            "c": "EFF",
            "u": "https://www.eff.org/"
        },
        "eviltracker.net": {
            "c": "EFF",
            "u": "https://www.eff.org/"
        },
        "do-not-tracker.org": {
            "c": "EFF",
            "u": "https://www.eff.org/"
        },
        "eloqua.com": {
            "c": "Eloqua",
            "u": "http://www.eloqua.com/"
        },
        "encoremetrics.com": {
            "c": "Encore",
            "u": "http://www.encoremetrics.com/"
        },
        "sitecompass.com": {
            "c": "Encore",
            "u": "http://www.encoremetrics.com/"
        },
        "eulerian.com": {
            "c": "Eulerian Technologies",
            "u": "http://www.eulerian.com/"
        },
        "eulerian.net": {
            "c": "Eulerian Technologies",
            "u": "http://www.eulerian.com/"
        },
        "feedjit.com": {
            "c": "Feedjit",
            "u": "http://feedjit.com/"
        },
        "footprintlive.com": {
            "c": "Footprint",
            "u": "http://www.footprintlive.com/"
        },
        "freeonlineusers.com": {
            "c": "Free Online Users",
            "u": "http://www.freeonlineusers.com/"
        },
        "free-pagerank.com": {
            "c": "Free-PageRank.com",
            "u": "http://www.free-pagerank.com/"
        },
        "fullstory.com": {
            "c": "Fullstory",
            "u": "https://www.fullstory.com/"
        },
        "gtop.ro": {
            "c": "GTop",
            "u": "http://www.gtop.ro/"
        },
        "gtopstats.com": {
            "c": "GTop",
            "u": "http://www.gtop.ro/"
        },
        "getsitecontrol.com": {
            "c": "GetSiteControl",
            "u": "https://getsitecontrol.com/"
        },
        "daphnecm.com": {
            "c": "GfK Group",
            "u": "http://www.gfk.com/"
        },
        "gfk.com": {
            "c": "GfK Group",
            "u": "http://www.gfk.com/"
        },
        "gfkdaphne.com": {
            "c": "GfK Group",
            "u": "http://www.gfk.com/"
        },
        "gaug.es": {
            "c": "GitHub",
            "u": "https://github.com/"
        },
        "godaddy.com": {
            "c": "Go Daddy",
            "u": "http://www.godaddy.com/"
        },
        "trafficfacts.com": {
            "c": "Go Daddy",
            "u": "http://www.godaddy.com/"
        },
        "gosquared.com": {
            "c": "GoSquared",
            "u": "https://www.gosquared.com/"
        },
        "gostats.com": {
            "c": "GoStats",
            "u": "http://gostats.com/"
        },
        "raasnet.com": {
            "c": "Hearst",
            "u": "http://www.hearst.com/"
        },
        "redaril.com": {
            "c": "Hearst",
            "u": "http://www.hearst.com/"
        },
        "histats.com": {
            "c": "Histats",
            "u": "http://www.histats.com/"
        },
        "hitsniffer.com": {
            "c": "Hit Sniffer",
            "u": "http://www.hitsniffer.com/"
        },
        "hitslink.com": {
            "c": "HitsLink",
            "u": "http://www.hitslink.com/"
        },
        "hotjar.com": {
            "c": "Hotjar",
            "u": "https://www.hotjar.com"
        },
        "hs-analytics.net": {
            "c": "HubSpot",
            "u": "http://www.hubspot.com/"
        },
        "cmcore.com": {
            "c": "IBM",
            "u": "http://www.ibm.com/"
        },
        "coremetrics.com": {
            "c": "IBM",
            "u": "http://www.ibm.com/"
        },
        "ibm.com": {
            "c": "IBM",
            "u": "http://www.ibm.com/"
        },
        "infonline.de": {
            "c": "INFOnline",
            "u": "https://www.infonline.de/"
        },
        "ivwbox.de": {
            "c": "INFOnline",
            "u": "https://www.infonline.de/"
        },
        "ioam.de": {
            "c": "INFOnline",
            "u": "https://www.infonline.de/"
        },
        "enquisite.com": {
            "c": "InboundWriter",
            "u": "http://www.inboundwriter.com/"
        },
        "inboundwriter.com": {
            "c": "InboundWriter",
            "u": "http://www.inboundwriter.com/"
        },
        "hotlog.ru": {
            "c": "InfoStars",
            "u": "http://infostars.ru/"
        },
        "infostars.ru": {
            "c": "InfoStars",
            "u": "http://infostars.ru/"
        },
        "inspectlet.com": {
            "c": "Inspectlet",
            "u": "http://www.inspectlet.com/"
        },
        "domodomain.com": {
            "c": "IntelligenceFocus",
            "u": "http://www.intelligencefocus.com/"
        },
        "intelligencefocus.com": {
            "c": "IntelligenceFocus",
            "u": "http://www.intelligencefocus.com/"
        },
        "intercom.io": {
            "c": "Intercom",
            "u": "https://www.intercom.io/"
        },
        "kissmetrics.com": {
            "c": "KISSmetrics",
            "u": "http://kissmetrics.com/"
        },
        "keymetric.net": {
            "c": "KeyMetric",
            "u": "http://www.keymetric.net/"
        },
        "src.kitcode.net": {
            "c": "Kitcode",
            "u": "http://src.kitcode.net/"
        },
        "linezing.com": {
            "c": "LineZing",
            "u": "http://www.linezing.com/"
        },
        "liveperson.com": {
            "c": "LivePerson",
            "u": "http://www.liveperson.net/"
        },
        "nuconomy.com": {
            "c": "LivePerson",
            "u": "http://www.liveperson.net/"
        },
        "logdy.com": {
            "c": "Logdy",
            "u": "http://logdy.com/"
        },
        "crwdcntrl.net": {
            "c": "Lotame",
            "u": "http://www.lotame.com/"
        },
        "lotame.com": {
            "c": "Lotame",
            "u": "http://www.lotame.com/"
        },
        "lynchpin.com": {
            "c": "Lynchpin",
            "u": "http://www.lynchpin.com/"
        },
        "lypn.com": {
            "c": "Lynchpin",
            "u": "http://www.lynchpin.com/"
        },
        "clicktracks.com": {
            "c": "Lyris",
            "u": "http://www.lyris.com/"
        },
        "lyris.com": {
            "c": "Lyris",
            "u": "http://www.lyris.com/"
        },
        "lytiks.com": {
            "c": "Lytiks",
            "u": "http://www.lytiks.com/"
        },
        "markmonitor.com": {
            "c": "MarkMonitor",
            "u": "https://www.markmonitor.com"
        },
        "9c9media.ca": {
            "c": "MarkMonitor",
            "u": "https://www.markmonitor.com"
        },
        "marktest.com": {
            "c": "Marktest",
            "u": "http://www.marktest.com/"
        },
        "marktest.pt": {
            "c": "Marktest",
            "u": "http://www.marktest.com/"
        },
        "maxymiser.com": {
            "c": "Maxymiser",
            "u": "http://www.maxymiser.com/"
        },
        "meetrics.de": {
            "c": "Meetrics",
            "u": "http://www.meetrics.de/"
        },
        "meetrics.net": {
            "c": "Meetrics",
            "u": "http://www.meetrics.de/"
        },
        "research.de.com": {
            "c": "Meetrics",
            "u": "http://www.meetrics.de/"
        },
        "mixpanel.com": {
            "c": "Mixpanel",
            "u": "https://mixpanel.com/"
        },
        "mxpnl.com": {
            "c": "Mixpanel",
            "u": "https://mixpanel.com/"
        },
        "mongoosemetrics.com": {
            "c": "Mongoose Metrics",
            "u": "http://www.mongoosemetrics.com/"
        },
        "monitus.net": {
            "c": "Monitus",
            "u": "http://www.monitus.net/"
        },
        "mouseflow.com": {
            "c": "Mouseflow",
            "u": "http://mouseflow.com/"
        },
        "mypagerank.net": {
            "c": "MyPagerank.Net",
            "u": "http://www.mypagerank.net/"
        },
        "estat.com": {
            "c": "Médiamétrie-eStat",
            "u": "http://www.mediametrie-estat.com/"
        },
        "mediametrie-estat.com": {
            "c": "Médiamétrie-eStat",
            "u": "http://www.mediametrie-estat.com/"
        },
        "hitsprocessor.com": {
            "c": "Net Applications",
            "u": "http://www.netapplications.com/"
        },
        "netapplications.com": {
            "c": "Net Applications",
            "u": "http://www.netapplications.com/"
        },
        "newrelic.com": {
            "c": "New Relic",
            "u": "http://newrelic.com/"
        },
        "nr-data.net": {
            "c": "New Relic",
            "u": "http://newrelic.com/"
        },
        "apnewsregistry.com": {
            "c": "NewsRight",
            "u": "http://www.newsright.com/"
        },
        "nextstat.com": {
            "c": "NextSTAT",
            "u": "http://www.nextstat.com/"
        },
        "glanceguide.com": {
            "c": "Nielsen",
            "u": "http://www.nielsen.com/"
        },
        "nielsen.com": {
            "c": "Nielsen",
            "u": "http://www.nielsen.com/"
        },
        "observerapp.com": {
            "c": "Observer",
            "u": "http://observerapp.com/"
        },
        "onestat.com": {
            "c": "OneStat",
            "u": "http://www.onestat.com/"
        },
        "openstat.ru": {
            "c": "Openstat",
            "u": "https://www.openstat.ru/"
        },
        "spylog.com": {
            "c": "Openstat",
            "u": "https://www.openstat.ru/"
        },
        "opentracker.net": {
            "c": "Opentracker",
            "u": "http://www.opentracker.net/"
        },
        "persianstat.com": {
            "c": "PersianStat.com",
            "u": "http://www.persianstat.com/"
        },
        "phonalytics.com": {
            "c": "Phonalytics",
            "u": "http://www.phonalytics.com/"
        },
        "piwik.org": {
            "c": "Piwik",
            "u": "http://piwik.org/"
        },
        "pronunciator.com": {
            "c": "Pronunciator",
            "u": "http://www.pronunciator.com/"
        },
        "visitorville.com": {
            "c": "Pronunciator",
            "u": "http://www.pronunciator.com/"
        },
        "protected.media": {
            "c": "Protected Media",
            "u": "http://www.protected.media/"
        },
        "ad-score.com": {
            "c": "Protected Media",
            "u": "http://www.protected.media/"
        },
        "kissinsights.com": {
            "c": "Qualaroo",
            "u": "http://qualaroo.com/"
        },
        "qualaroo.com": {
            "c": "Qualaroo",
            "u": "http://qualaroo.com/"
        },
        "thecounter.com": {
            "c": "QuinStreet",
            "u": "http://quinstreet.com/"
        },
        "quintelligence.com": {
            "c": "Quintelligence",
            "u": "http://www.quintelligence.com/"
        },
        "radarurl.com": {
            "c": "RadarURL",
            "u": "http://radarurl.com/"
        },
        "researchnow.com": {
            "c": "Research Now",
            "u": "http://www.researchnow.com/"
        },
        "valuedopinions.co.uk": {
            "c": "Research Now",
            "u": "http://www.researchnow.com/"
        },
        "revtrax.com": {
            "c": "Revtracks",
            "u": "http://revtrax.com/"
        },
        "ringier.cz": {
            "c": "Ringier",
            "u": "http://ringier.cz/"
        },
        "getclicky.com": {
            "c": "Roxr",
            "u": "http://roxr.net/"
        },
        "roxr.net": {
            "c": "Roxr",
            "u": "http://roxr.net/"
        },
        "staticstuff.net": {
            "c": "Roxr",
            "u": "http://roxr.net/"
        },
        "statsit.com": {
            "c": "STATSIT",
            "u": "http://www.statsit.com/"
        },
        "dl-rms.com": {
            "c": "Safecount",
            "u": "http://www.safecount.net/"
        },
        "dlqm.net": {
            "c": "Safecount",
            "u": "http://www.safecount.net/"
        },
        "questionmarket.com": {
            "c": "Safecount",
            "u": "http://www.safecount.net/"
        },
        "safecount.net": {
            "c": "Safecount",
            "u": "http://www.safecount.net/"
        },
        "sageanalyst.net": {
            "c": "SageMetrics",
            "u": "http://www.sagemetrics.com/"
        },
        "sagemetrics.com": {
            "c": "SageMetrics",
            "u": "http://www.sagemetrics.com/"
        },
        "seevolution.com": {
            "c": "SeeVolution",
            "u": "https://www.seevolution.com/"
        },
        "svlu.net": {
            "c": "SeeVolution",
            "u": "https://www.seevolution.com/"
        },
        "segment.io": {
            "c": "Segment.io",
            "u": "https://segment.io/"
        },
        "sessioncam.com": {
            "c": "SessionCam",
            "u": "https://sessioncam.com/"
        },
        "shinystat.com": {
            "c": "ShinyStat",
            "u": "http://www.shinystat.com/"
        },
        "shorte.st": {
            "c": "Shortest",
            "u": "http://shorte.st/"
        },
        "smartlook.com": {
            "c": "Smartlook",
            "u": "https://www.smartlook.com/"
        },
        "snoobi.com": {
            "c": "Snoobi",
            "u": "http://www.snoobi.com/"
        },
        "go-mpulse.net": {
            "c": "Soasta",
            "u": "https://www.soasta.com"
        },
        "statcounter.com": {
            "c": "StatCounter",
            "u": "http://statcounter.com/"
        },
        "statisfy.net": {
            "c": "Statisfy",
            "u": "http://statisfy.net"
        },
        "stratigent.com": {
            "c": "Stratigent",
            "u": "http://www.stratigent.com/"
        },
        "tensquare.com": {
            "c": "TENSQUARE",
            "u": "http://www.tensquare.com/"
        },
        "sesamestats.com": {
            "c": "TNS",
            "u": "http://www.tnsglobal.com/"
        },
        "statistik-gallup.net": {
            "c": "TNS",
            "u": "http://www.tnsglobal.com/"
        },
        "tns-counter.ru": {
            "c": "TNS",
            "u": "http://www.tnsglobal.com/"
        },
        "tns-cs.net": {
            "c": "TNS",
            "u": "http://www.tnsglobal.com/"
        },
        "tnsglobal.com": {
            "c": "TNS",
            "u": "http://www.tnsglobal.com/"
        },
        "heronpartners.com.au": {
            "c": "The Heron Partnership",
            "u": "http://www.heronpartners.com.au/"
        },
        "marinsm.com": {
            "c": "The Heron Partnership",
            "u": "http://www.heronpartners.com.au/"
        },
        "roia.biz": {
            "c": "TrackingSoft",
            "u": "http://trackingsoft.com/"
        },
        "trackingsoft.com": {
            "c": "TrackingSoft",
            "u": "http://trackingsoft.com/"
        },
        "umbel.com": {
            "c": "Umbel",
            "u": "https://www.umbel.com/"
        },
        "nakanohito.jp": {
            "c": "User Local",
            "u": "http://nakanohito.jp/"
        },
        "vertster.com": {
            "c": "Vertster",
            "u": "http://www.vertster.com/"
        },
        "sa-as.com": {
            "c": "VisiStat",
            "u": "http://www.visistat.com/"
        },
        "visistat.com": {
            "c": "VisiStat",
            "u": "http://www.visistat.com/"
        },
        "visitstreamer.com": {
            "c": "Visit Streamer",
            "u": "http://www.visitstreamer.com/"
        },
        "vizisense.com": {
            "c": "ViziSense",
            "u": "http://www.vizisense.com/"
        },
        "vizisense.net": {
            "c": "ViziSense",
            "u": "http://www.vizisense.com/"
        },
        "wowanalytics.co.uk": {
            "c": "WOW Analytics",
            "u": "http://www.wowanalytics.co.uk/"
        },
        "compete.com": {
            "c": "WPP",
            "u": "http://www.wpp.com/"
        },
        "onlinewebstats.com": {
            "c": "Web Stats",
            "u": "http://www.onlinewebstats.com/"
        },
        "web-stat.com": {
            "c": "Web Tracking Services",
            "u": "http://www.webtrackingservices.com/"
        },
        "webtrackingservices.com": {
            "c": "Web Tracking Services",
            "u": "http://www.webtrackingservices.com/"
        },
        "webtraxs.com": {
            "c": "Web Traxs",
            "u": "http://www.webtraxs.com/"
        },
        "webclicktracker.com": {
            "c": "Webclicktracker",
            "u": "http://www.webclicktracker.com/"
        },
        "webtrekk.com": {
            "c": "Webtrekk",
            "u": "http://www.webtrekk.com/"
        },
        "webtrekk.net": {
            "c": "Webtrekk",
            "u": "http://www.webtrekk.com/"
        },
        "reinvigorate.net": {
            "c": "Webtrends",
            "u": "http://webtrends.com/"
        },
        "webtrends.com": {
            "c": "Webtrends",
            "u": "http://webtrends.com/"
        },
        "webtrendslive.com": {
            "c": "Webtrends",
            "u": "http://webtrends.com/"
        },
        "adzmath.com": {
            "c": "White Ops",
            "u": "https://www.whiteops.com/"
        },
        "whiteops.com": {
            "c": "White Ops",
            "u": "https://www.whiteops.com/"
        },
        "woopra-ns.com": {
            "c": "Woopra",
            "u": "http://www.woopra.com/"
        },
        "woopra.com": {
            "c": "Woopra",
            "u": "http://www.woopra.com/"
        },
        "wysistat.com": {
            "c": "Wysistat",
            "u": "http://www.wysistat.com/"
        },
        "analytics.yahoo.com": {
            "c": "Yahoo!",
            "u": "http://www.yahoo.com/"
        },
        "yellowtracker.com": {
            "c": "YellowTracker",
            "u": "http://www.yellowtracker.com/"
        },
        "anormal-media.de": {
            "c": "anormal-media.de",
            "u": "http://anormal-media.de/"
        },
        "anormal-tracker.de": {
            "c": "anormal-media.de",
            "u": "http://anormal-media.de/"
        },
        "certifica.com": {
            "c": "comScore",
            "u": "http://www.comscore.com/"
        },
        "comscore.com": {
            "c": "comScore",
            "u": "http://www.comscore.com/"
        },
        "scorecardresearch.com": {
            "c": "comScore",
            "u": "http://www.comscore.com/"
        },
        "sitestat.com": {
            "c": "comScore",
            "u": "http://www.comscore.com/"
        },
        "voicefive.com": {
            "c": "comScore",
            "u": "http://www.comscore.com/"
        },
        "mdotlabs.com": {
            "c": "comScore",
            "u": "http://www.comscore.com/"
        },
        "dwstat.cn": {
            "c": "dwstat.com",
            "u": "http://www.dwstat.cn/"
        },
        "eproof.com": {
            "c": "eProof.com",
            "u": "http://www.eproof.com/"
        },
        "extreme-dm.com": {
            "c": "eXTReMe digital",
            "u": "http://extremetracking.com/"
        },
        "extremetracking.com": {
            "c": "eXTReMe digital",
            "u": "http://extremetracking.com/"
        },
        "etracker.com": {
            "c": "etracker",
            "u": "http://www.etracker.com/"
        },
        "etracker.de": {
            "c": "etracker",
            "u": "http://www.etracker.com/"
        },
        "sedotracker.com": {
            "c": "etracker",
            "u": "http://www.etracker.com/"
        },
        "sedotracker.de": {
            "c": "etracker",
            "u": "http://www.etracker.com/"
        },
        "iperceptions.com": {
            "c": "iPerceptions",
            "u": "http://www.iperceptions.com/"
        },
        "motigo.com": {
            "c": "motigo",
            "u": "http://motigo.com/"
        },
        "nedstatbasic.net": {
            "c": "motigo",
            "u": "http://motigo.com/"
        },
        "nurago.com": {
            "c": "nurago",
            "u": "http://www.nurago.com/"
        },
        "nurago.de": {
            "c": "nurago",
            "u": "http://www.nurago.com/"
        },
        "sensic.net": {
            "c": "nurago",
            "u": "http://www.nurago.com/"
        },
        "phpmyvisites.us": {
            "c": "phpMyVisites",
            "u": "http://www.phpmyvisites.us/"
        },
        "4u.pl": {
            "c": "stat4u",
            "u": "http://stat.4u.pl/"
        },
        "vistrac.com": {
            "c": "vistrac",
            "u": "http://vistrac.com/"
        },
        "amung.us": {
            "c": "whos.amung.us",
            "u": "http://whos.amung.us/"
        },
        "oewa.at": {
            "c": "ÖWA",
            "u": "http://www.oewa.at/"
        },
        "oewabox.at": {
            "c": "ÖWA",
            "u": "http://www.oewa.at/"
        },
        "google-analytics.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        },
        "postrank.com": {
            "c": "Google",
            "u": "http://www.google.com/"
        }
    },
    "Social": {
        "facebook.com": {
            "c": "Facebook",
            "u": "https://facebook.com",
            "rules": [
                {"rule": "facebook\\.com\\/ai\\.php\\?"},
                {"rule": "facebook\\.com\\/audience_network\\/", "options": {"types": ["image"]}},
                {"rule": "pixel\\.facebook\\.com($|[?/])"},
                {"rule": "facebook\\.com.*\\/impression\\.php"},
                {"rule": "graph\\.facebook\\.com\\/\\?ids=.*&callback=.*", "options": {"types": ["script"]}},
                {"rule": "facebook\\.com\\/.*\\/plugins\\/send_to_messenger\\.php\\?app_id="},
                {"rule": "facebook\\.com\\/brandlift\\.php"},
                {"rule": "facebook\\.com\\/tr[?/]"},
                {"rule": "facebook\\.com\\/common\\/scribe_endpoint\\.php"},
                {"rule": "facebook\\.com\\/email_open_loc_pic\\.php"},
                {"rule": "facebook\\.com\\/fr\\/u\\.php\\?"},
                {"rule": "facebook\\.com\\/method\\/links\\.getStats\\?"},
                {"rule": "facebook\\.com\\/offsite_event\\.php"},
                {"rule": "facebook\\.com\\/rtb_impression\\/\\?"},
                {"rule": "facebook\\.com\\/rtb_video\\/\\?"},
                {"rule": "facebook\\.com[?/].*\\/tracking\\.js"},
                {"rule": "facebook\\.com\\/ajax\/.*\\/log\\.php"},
                {"rule": "facebook\\.com\\/ajax\\/.*logging\\."},
                {"rule": "facebook\\.com\\/ct\\.php"},
                {"rule": "facebook\\.com\\/friends\\/requests\\/log_impressions"},
                {"rule": "facebook\\.com\\/search\\/web\\/instrumentation\\.php\\?"},
                {"rule": "facebook\\.com\\/xti\\.php\\?"},
                {"rule": "facebook\\.com[?/].*\\/impression_logging\\/"},
                {"rule": "facebook\\.com[?/].*\\/instream\\/vast\\.xml\\?"}
            ]
        },
        "facebook.net": {
            "c": "Facebook",
            "u": "https://facebook.com",
            "rules": [
                {"rule": "connect\\.facebook\\.net\\/signals\\/"},
                {"rule": "connect\\.facebook\\.net[?/].*\\/fbevents\\.js"},
                {"rule": "facebook\\.net[?/].*\\/AudienceNetworkVPAID\\.", "options": {"domains": ["dailymotion.com"]}}
            ]
        },
        "twitter.com": {
            "c": "Twitter",
            "u": "https://twitter.com",
            "rules": [
                {"rule": "twitter\\.com\\/i\/jot"},
                {"rule": "twitter\\.com\\/jot\\.html"},
                {"rule": "twitter\\.com\\/oct\\.js"},
                {"rule": "twitter\\.com\\/scribe"},
                {"rule": "twitter\\.com\\/abacus\\?"},
                {"rule": "twitter\\.com\\/csp_report\\?"},
                {"rule": "platform\\.twitter\\.com\\/impressions\\.js"},
                {"rule": "analytics\\.twitter\\.com($|[?/])"},
                {"rule": "scribe\\.twitter\\.com($|[?/])"},
                {"rule": "twitter\\.com[?/].*\\/anonymize\\?data"},
                {"rule": "analytics\\.twitter\\.com($|[?/])"},
                {"rule": "twitter\\.com[?/].*\\/log\\.json\\?"}, 
                {"rule": "twitter\\.com[?/].*\\/prompts\\/impress"},
                {"rule": "twitter\\.com\\/i\\/cards\\/tfw\\/.*\\?advertiser_name="}
            ]
        },
        "linkedin.com": {
            "c": "LinkedIn",
            "u": "https://linkedin.com",
            "rules": [
                {"rule": "linkedin\\.com\\/analytics\\/"},
                {"rule": "ads\\.linkedin\\.com($|[?/])"},
                {"rule": "linkedin\\.com\\/csp\\/dtag\\?"},
                {"rule": "linkedin\\.com\\/emimp\\/", "options": {"types": ["image"]}}
            ]
        }
    }
}

},{}],34:[function(require,module,exports){
'use strict';

var fetch = function fetch(message) {
    return new Promise(function (resolve, reject) {
        window.chrome.runtime.sendMessage(message, function (result) {
            return resolve(result);
        });
    });
};

var backgroundMessage = function backgroundMessage(thisModel) {
    // listen for messages from background and
    // // notify subscribers
    window.chrome.runtime.onMessage.addListener(function (req, sender) {
        if (sender.id !== chrome.runtime.id) return;
        if (req.whitelistChanged) thisModel.send('whitelistChanged');
        if (req.updateTabData) thisModel.send('updateTabData');
        if (req.didResetTrackersData) thisModel.send('didResetTrackersData', req.didResetTrackersData);
        if (req.closePopup) window.close();
    });
};

var getBackgroundTabData = function getBackgroundTabData() {
    return new Promise(function (resolve, reject) {
        fetch({ getCurrentTab: true }).then(function (tab) {
            if (tab) {
                fetch({ getTab: tab.id }).then(function (backgroundTabObj) {
                    resolve(backgroundTabObj);
                });
            }
        });
    });
};

var search = function search(url) {
    window.chrome.tabs.create({ url: 'https://duckduckgo.com/?q=' + url + '&bext=' + window.localStorage['os'] + 'cr' });
};

var getExtensionURL = function getExtensionURL(path) {
    return chrome.extension.getURL(path);
};

var openExtensionPage = function openExtensionPage(path) {
    window.chrome.tabs.create({ url: getExtensionURL(path) });
};

var openOptionsPage = function openOptionsPage(browser) {
    if (browser === 'moz') {
        openExtensionPage('/html/options.html');
        window.close();
    } else if (browser === 'chrome') {
        window.chrome.runtime.openOptionsPage();
    }
};

var reloadTab = function reloadTab(id) {
    window.chrome.tabs.reload(id);
};

var closePopup = function closePopup() {
    var w = window.chrome.extension.getViews({ type: 'popup' })[0];
    w.close();
};

module.exports = {
    fetch: fetch,
    reloadTab: reloadTab,
    closePopup: closePopup,
    backgroundMessage: backgroundMessage,
    getBackgroundTabData: getBackgroundTabData,
    search: search,
    openOptionsPage: openOptionsPage,
    openExtensionPage: openExtensionPage,
    getExtensionURL: getExtensionURL
};

},{}],35:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Model;

function Autocomplete(attrs) {
    Parent.call(this, attrs);
}

Autocomplete.prototype = window.$.extend({}, Parent.prototype, {

    modelName: 'autocomplete',

    fetchSuggestions: function fetchSuggestions(searchText) {
        var _this = this;

        return new Promise(function (resolve, reject) {
            // TODO: ajax call here to ddg autocomplete service
            // for now we'll just mock up an async xhr query result:
            _this.suggestions = [searchText + ' world', searchText + ' united', searchText + ' famfam'];
            resolve();
        });
    }
});

module.exports = Autocomplete;

},{}],36:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Model;
var browserUIWrapper = require('./../base/chrome-ui-wrapper.es6.js');

/**
 * Background messaging is done via two methods:
 *
 * 1. Passive messages from background -> backgroundMessage model -> subscribing model
 *
 *  The background sends these messages using chrome.runtime.sendMessage({'name': 'value'})
 *  The backgroundMessage model (here) receives the message and forwards the
 *  it to the global event store via model.send(msg)
 *  Other modules that are subscribed to state changes in backgroundMessage are notified
 *
 * 2. Two-way messaging using this.model.fetch() as a passthrough
 *
 *  Each model can use a fetch method to send and receive a response from the background.
 *  Ex: this.model.fetch({'name': 'value'}).then((response) => console.log(response))
 *  Listeners must be registered in the background to respond to messages with this 'name'.
 *
 *  The common fetch method is defined in base/model.es6.js
 */
function BackgroundMessage(attrs) {
    Parent.call(this, attrs);
    var thisModel = this;
    browserUIWrapper.backgroundMessage(thisModel);
}

BackgroundMessage.prototype = window.$.extend({}, Parent.prototype, {
    modelName: 'backgroundMessage'
});

module.exports = BackgroundMessage;

},{"./../base/chrome-ui-wrapper.es6.js":34}],37:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Model;

function HamburgerMenu(attrs) {
    attrs = attrs || {};
    attrs.tabUrl = '';
    Parent.call(this, attrs);
}

HamburgerMenu.prototype = window.$.extend({}, Parent.prototype, {
    modelName: 'hamburgerMenu'
});

module.exports = HamburgerMenu;

},{}],38:[function(require,module,exports){
'use strict';

module.exports = {
    // Fixes cases like "Amazon.com", which break the company icon
    normalizeCompanyName: function normalizeCompanyName(companyName) {
        companyName = companyName || '';
        var normalizedName = companyName.toLowerCase().replace(/\.[a-z]+$/, '');
        return normalizedName;
    }
};

},{}],39:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Model;
var browserUIWrapper = require('./../base/chrome-ui-wrapper.es6.js');

function Search(attrs) {
    Parent.call(this, attrs);
}

Search.prototype = window.$.extend({}, Parent.prototype, {

    modelName: 'search',

    doSearch: function doSearch(s) {
        this.searchText = s;
        s = encodeURIComponent(s);

        console.log('doSearch() for ' + s);

        browserUIWrapper.search(s);
    }
});

module.exports = Search;

},{"./../base/chrome-ui-wrapper.es6.js":34}],40:[function(require,module,exports){
'use strict';

var DOMAIN_MAPPINGS = require('./../../../data/tracker_lists/trackersWithParentCompany.json').TopTrackerDomains;
var Parent = window.DDG.base.Model;
var normalizeCompanyName = require('./mixins/normalize-company-name.es6');

function SiteCompanyList(attrs) {
    attrs = attrs || {};
    attrs.tab = null;
    attrs.companyListMap = [];
    attrs.DOMAIN_MAPPINGS = DOMAIN_MAPPINGS;
    Parent.call(this, attrs);
}

SiteCompanyList.prototype = window.$.extend({}, Parent.prototype, normalizeCompanyName, {

    modelName: 'siteCompanyList',

    fetchAsyncData: function fetchAsyncData() {
        var _this = this;

        return new Promise(function (resolve, reject) {
            _this.fetch({ getCurrentTab: true }).then(function (tab) {
                if (tab) {
                    _this.fetch({ getTab: tab.id }).then(function (bkgTab) {
                        _this.tab = bkgTab;
                        _this.domain = _this.tab && _this.tab.site ? _this.tab.site.domain : '';
                        _this._updateCompaniesList();
                        resolve();
                    });
                } else {
                    console.debug('SiteDetails model: no tab');
                    resolve();
                }
            });
        });
    },

    _updateCompaniesList: function _updateCompaniesList() {
        var _this2 = this;

        // list of all trackers on page (whether we blocked them or not)
        this.trackers = this.tab.trackers || {};
        var companyNames = Object.keys(this.trackers);
        var unknownSameDomainCompany = null;

        // set trackerlist metadata for list display by company:
        this.companyListMap = companyNames.map(function (companyName) {
            var company = _this2.trackers[companyName];
            var urlsList = company.urls ? Object.keys(company.urls) : [];
            // Unknown same domain trackers need to be individually fetched and put
            // in the unblocked list
            if (companyName === 'unknown' && _this2.hasUnblockedTrackers(company, urlsList)) {
                unknownSameDomainCompany = _this2.createUnblockedList(company, urlsList);
            }

            // calc max using pixels instead of % to make margins easier
            // max width: 300 - (horizontal padding in css) = 260
            return {
                name: companyName,
                normalizedName: _this2.normalizeCompanyName(companyName),
                count: _this2._setCount(company, companyName, urlsList),
                urls: company.urls,
                urlsList: urlsList
            };
        }, this).sort(function (a, b) {
            return b.count - a.count;
        });

        if (unknownSameDomainCompany) {
            this.companyListMap.push(unknownSameDomainCompany);
        }
    },

    // Make ad-hoc unblocked list
    // used to cherry pick unblocked trackers from unknown companies
    // the name is the site domain, count is -2 to show the list at the bottom
    createUnblockedList: function createUnblockedList(company, urlsList) {
        var unblockedTrackers = this.spliceUnblockedTrackers(company, urlsList);
        return {
            name: this.domain,
            iconName: '', // we won't have an icon for unknown first party trackers
            count: -2,
            urls: unblockedTrackers,
            urlsList: Object.keys(unblockedTrackers)
        };
    },

    // Return an array of unblocked trackers
    // and remove those entries from the specified company
    // only needed for unknown trackers, so far
    spliceUnblockedTrackers: function spliceUnblockedTrackers(company, urlsList) {
        if (!company || !company.urls || !urlsList) return null;

        return urlsList.filter(function (url) {
            return company.urls[url].isBlocked === false;
        }).reduce(function (unblockedTrackers, url) {
            unblockedTrackers[url] = company.urls[url];

            // Update the company urls and urlsList
            delete company.urls[url];
            urlsList.splice(urlsList.indexOf(url), 1);

            return unblockedTrackers;
        }, {});
    },

    // Return true if company has unblocked trackers in the current tab
    hasUnblockedTrackers: function hasUnblockedTrackers(company, urlsList) {
        if (!company || !company.urls || !urlsList) return false;

        return urlsList.some(function (url) {
            return company.urls[url].isBlocked === false;
        });
    },

    // Determines sorting order of the company list
    _setCount: function _setCount(company, companyName, urlsList) {
        var count = company.count;
        // Unknown trackers, followed by unblocked first party,
        // should be at the bottom of the list
        if (companyName === 'unknown') {
            count = -1;
        } else if (this.hasUnblockedTrackers(company, urlsList)) {
            count = -2;
        }

        return count;
    }
});

module.exports = SiteCompanyList;

},{"./../../../data/tracker_lists/trackersWithParentCompany.json":33,"./mixins/normalize-company-name.es6":38}],41:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Model;
var constants = require('../../../data/constants');
var trackerPrevalence = require('../../../data/tracker_lists/prevalence');
var httpsMessages = constants.httpsMessages;
var browserUIWrapper = require('./../base/chrome-ui-wrapper.es6.js');

// for now we consider tracker networks found on more than 7% of sites
// as "major"
var MAJOR_TRACKER_THRESHOLD_PCT = 7;

var majorTrackingNetworks = Object.keys(trackerPrevalence).filter(function (t) {
    return trackerPrevalence[t] >= MAJOR_TRACKER_THRESHOLD_PCT;
})
// lowercase them cause we only use them for comparing
.map(function (t) {
    return t.toLowerCase();
});

function Site(attrs) {
    attrs = attrs || {};
    attrs.disabled = true; // disabled by default
    attrs.tab = null;
    attrs.domain = '-';
    attrs.isWhitelisted = false;
    attrs.isCalculatingSiteRating = true;
    attrs.siteRating = {};
    attrs.httpsState = 'none';
    attrs.httpsStatusText = '';
    attrs.trackersCount = 0; // unique trackers count
    attrs.majorTrackerNetworksCount = 0;
    attrs.totalTrackerNetworksCount = 0;
    attrs.trackerNetworks = [];
    attrs.tosdr = {};
    attrs.isaMajorTrackingNetwork = false;
    Parent.call(this, attrs);

    this.bindEvents([[this.store.subscribe, 'action:backgroundMessage', this.handleBackgroundMsg]]);
}

Site.prototype = window.$.extend({}, Parent.prototype, {

    modelName: 'site',

    getBackgroundTabData: function getBackgroundTabData() {
        var _this = this;

        return new Promise(function (resolve) {
            browserUIWrapper.getBackgroundTabData().then(function (tab) {
                if (tab) {
                    _this.set('tab', tab);
                    _this.domain = tab.site.domain;
                    _this.fetchSiteRating();
                    _this.set('tosdr', tab.site.tosdr);
                    _this.set('isaMajorTrackingNetwork', tab.site.parentPrevalence >= MAJOR_TRACKER_THRESHOLD_PCT);
                } else {
                    console.debug('Site model: no tab');
                }

                _this.setSiteProperties();
                _this.setHttpsMessage();
                _this.update();
                resolve();
            });
        });
    },

    fetchSiteRating: function fetchSiteRating() {
        var _this2 = this;

        // console.log('[model] fetchSiteRating()')
        if (this.tab) {
            this.fetch({ getSiteGrade: this.tab.id }).then(function (rating) {
                console.log('fetchSiteRating: ', rating);
                if (rating) _this2.update({ siteRating: rating });
            });
        }
    },

    setSiteProperties: function setSiteProperties() {
        if (!this.tab) {
            this.domain = 'new tab'; // tab can be null for firefox new tabs
            this.set({ isCalculatingSiteRating: false });
        } else {
            this.isWhitelisted = this.tab.site.whitelisted;
            if (this.tab.site.specialDomainName) {
                this.domain = this.tab.site.specialDomainName; // eg "extensions", "options", "new tab"
                this.set({ isCalculatingSiteRating: false });
            } else {
                this.set({ 'disabled': false });
            }
        }

        if (this.domain && this.domain === '-') this.set('disabled', true);
    },

    setHttpsMessage: function setHttpsMessage() {
        if (!this.tab) return;

        if (this.tab.upgradedHttps) {
            this.httpsState = 'upgraded';
        } else if (/^https/.exec(this.tab.url)) {
            this.httpsState = 'secure';
        } else {
            this.httpsState = 'none';
        }

        this.httpsStatusText = httpsMessages[this.httpsState];
    },

    handleBackgroundMsg: function handleBackgroundMsg(message) {
        var _this3 = this;

        // console.log('[model] handleBackgroundMsg()')
        if (!this.tab) return;
        if (message.action && message.action === 'updateTabData') {
            this.fetch({ getTab: this.tab.id }).then(function (backgroundTabObj) {
                _this3.tab = backgroundTabObj;
                _this3.update();
                _this3.fetchSiteRating();
            });
        }
    },

    // calls `this.set()` to trigger view re-rendering
    update: function update(ops) {
        // console.log('[model] update()')
        if (this.tab) {
            // got siteRating back from background process
            if (ops && ops.siteRating && ops.siteRating.site && ops.siteRating.enhanced) {
                var before = ops.siteRating.site.grade;
                var after = ops.siteRating.enhanced.grade;

                // we don't currently show D- grades
                if (before === 'D-') before = 'D';
                if (after === 'D-') after = 'D';

                if (before !== this.siteRating.before || after !== this.siteRating.after) {
                    var newSiteRating = {
                        cssBefore: before.replace('+', '-plus').toLowerCase(),
                        cssAfter: after.replace('+', '-plus').toLowerCase(),
                        before: before,
                        after: after
                    };

                    this.set({
                        'siteRating': newSiteRating,
                        'isCalculatingSiteRating': false
                    });
                } else if (this.isCalculatingSiteRating) {
                    // got site rating from background process
                    this.set('isCalculatingSiteRating', false);
                }
            }

            var newTrackersCount = this.getUniqueTrackersCount();
            if (newTrackersCount !== this.trackersCount) {
                this.set('trackersCount', newTrackersCount);
            }

            var newTrackersBlockedCount = this.getUniqueTrackersBlockedCount();
            if (newTrackersBlockedCount !== this.trackersBlockedCount) {
                this.set('trackersBlockedCount', newTrackersBlockedCount);
            }

            var newTrackerNetworks = this.getTrackerNetworksOnPage();
            if (this.trackerNetworks.length === 0 || newTrackerNetworks.length !== this.trackerNetworks.length) {
                this.set('trackerNetworks', newTrackerNetworks);
            }

            var newUnknownTrackersCount = this.getUnknownTrackersCount();
            var newTotalTrackerNetworksCount = newUnknownTrackersCount + newTrackerNetworks.length;
            if (newTotalTrackerNetworksCount !== this.totalTrackerNetworksCount) {
                this.set('totalTrackerNetworksCount', newTotalTrackerNetworksCount);
            }

            var newMajorTrackerNetworksCount = this.getMajorTrackerNetworksCount();
            if (newMajorTrackerNetworksCount !== this.majorTrackerNetworksCount) {
                this.set('majorTrackerNetworksCount', newMajorTrackerNetworksCount);
            }
        }
    },

    getUniqueTrackersCount: function getUniqueTrackersCount() {
        var _this4 = this;

        // console.log('[model] getUniqueTrackersCount()')
        var count = Object.keys(this.tab.trackers).reduce(function (total, name) {
            return _this4.tab.trackers[name].count + total;
        }, 0);

        return count;
    },

    getUniqueTrackersBlockedCount: function getUniqueTrackersBlockedCount() {
        var _this5 = this;

        // console.log('[model] getUniqueTrackersBlockedCount()')
        var count = Object.keys(this.tab.trackersBlocked).reduce(function (total, name) {
            var companyBlocked = _this5.tab.trackersBlocked[name];

            // Don't throw a TypeError if urls are not there
            var trackersBlocked = companyBlocked.urls ? Object.keys(companyBlocked.urls) : null;

            // Counting unique URLs instead of using the count
            // because the count refers to all requests rather than unique number of trackers
            var trackersBlockedCount = trackersBlocked ? trackersBlocked.length : 0;
            return trackersBlockedCount + total;
        }, 0);

        return count;
    },

    getUnknownTrackersCount: function getUnknownTrackersCount() {
        // console.log('[model] getUnknownTrackersCount()')
        var unknownTrackers = this.tab.trackers ? this.tab.trackers.unknown : {};

        var count = 0;
        if (unknownTrackers && unknownTrackers.urls) {
            var unknownTrackersUrls = Object.keys(unknownTrackers.urls);
            count = unknownTrackersUrls ? unknownTrackersUrls.length : 0;
        }

        return count;
    },

    getMajorTrackerNetworksCount: function getMajorTrackerNetworksCount() {
        // console.log('[model] getMajorTrackerNetworksCount()')
        // Show only blocked major trackers count, unless site is whitelisted
        var trackers = this.isWhitelisted ? this.tab.trackers : this.tab.trackersBlocked;
        var count = Object.keys(trackers).reduce(function (total, name) {
            var tempTracker = name.toLowerCase();
            var idx = majorTrackingNetworks.indexOf(tempTracker);

            total += idx > -1 ? 1 : 0;
            return total;
        }, 0);

        return count;
    },

    getTrackerNetworksOnPage: function getTrackerNetworksOnPage() {
        // console.log('[model] getMajorTrackerNetworksOnPage()')
        // all tracker networks found on this page/tab
        var networks = Object.keys(this.tab.trackers).map(function (t) {
            return t.toLowerCase();
        }).filter(function (t) {
            return t !== 'unknown';
        });
        return networks;
    },

    toggleWhitelist: function toggleWhitelist() {
        if (this.tab && this.tab.site) {
            this.isWhitelisted = !this.isWhitelisted;
            this.set('whitelisted', this.isWhitelisted);
            var whitelistOnOrOff = this.isWhitelisted ? 'off' : 'on';
            this.fetch({ firePixel: ['ept', whitelistOnOrOff] });

            this.fetch({ 'whitelisted': {
                    list: 'whitelisted',
                    domain: this.tab.site.domain,
                    value: this.isWhitelisted
                }
            });
        }
    }
});

module.exports = Site;

},{"../../../data/constants":31,"../../../data/tracker_lists/prevalence":32,"./../base/chrome-ui-wrapper.es6.js":34}],42:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Model;
var normalizeCompanyName = require('./mixins/normalize-company-name.es6');

function TopBlocked(attrs) {
    attrs = attrs || {};
    attrs.numCompanies = attrs.numCompanies;
    attrs.companyList = [];
    attrs.companyListMap = [];
    attrs.pctPagesWithTrackers = null;
    attrs.lastStatsResetDate = null;
    Parent.call(this, attrs);
}

TopBlocked.prototype = window.$.extend({}, Parent.prototype, normalizeCompanyName, {

    modelName: 'topBlocked',

    getTopBlocked: function getTopBlocked() {
        var _this = this;

        return new Promise(function (resolve, reject) {
            _this.fetch({ getTopBlockedByPages: _this.numCompanies }).then(function (data) {
                if (!data.totalPages || data.totalPages < 30) return resolve();
                if (!data.topBlocked || data.topBlocked.length < 1) return resolve();
                _this.companyList = data.topBlocked;
                _this.companyListMap = _this.companyList.map(function (company) {
                    return {
                        name: company.name,
                        normalizedName: _this.normalizeCompanyName(company.name),
                        percent: company.percent,
                        // calc graph bars using pixels instead of % to
                        // make margins easier
                        // max width: 145px
                        px: Math.floor(company.percent / 100 * 145)
                    };
                });
                if (data.pctPagesWithTrackers) {
                    _this.pctPagesWithTrackers = data.pctPagesWithTrackers;

                    if (data.lastStatsResetDate) {
                        _this.lastStatsResetDate = data.lastStatsResetDate;
                    }
                }
                resolve();
            });
        });
    },

    reset: function reset(resetDate) {
        this.companyList = [];
        this.companyListMap = [];
        this.pctPagesWithTrackers = null;
        this.lastStatsResetDate = resetDate;
    }
});

module.exports = TopBlocked;

},{"./mixins/normalize-company-name.es6":38}],43:[function(require,module,exports){
'use strict';

module.exports = {
    setBrowserClassOnBodyTag: function setBrowserClassOnBodyTag() {
        window.chrome.runtime.sendMessage({ 'getBrowser': true }, function (browser) {
            var browserClass = 'is-browser--' + browser;
            window.$('html').addClass(browserClass);
            window.$('body').addClass(browserClass);
        });
    }
};

},{}],44:[function(require,module,exports){
'use strict';

module.exports = {
    setBrowserClassOnBodyTag: require('./chrome-set-browser-class.es6.js'),
    parseQueryString: require('./parse-query-string.es6.js')
};

},{"./chrome-set-browser-class.es6.js":43,"./parse-query-string.es6.js":45}],45:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

module.exports = {
    parseQueryString: function parseQueryString(qs) {
        if (typeof qs !== 'string') {
            throw new Error('tried to parse a non-string query string');
        }

        var parsed = {};

        if (qs[0] === '?') {
            qs = qs.substr(1);
        }

        var parts = qs.split('&');

        parts.forEach(function (part) {
            var _part$split = part.split('='),
                _part$split2 = _slicedToArray(_part$split, 2),
                key = _part$split2[0],
                val = _part$split2[1];

            if (key && val) {
                parsed[key] = val;
            }
        });

        return parsed;
    }
};

},{}],46:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Page;
var mixins = require('./mixins/index.es6.js');
var HamburgerMenuView = require('./../views/hamburger-menu.es6.js');
var HamburgerMenuModel = require('./../models/hamburger-menu.es6.js');
var hamburgerMenuTemplate = require('./../templates/hamburger-menu.es6.js');
var TopBlockedView = require('./../views/top-blocked-truncated.es6.js');
var TopBlockedModel = require('./../models/top-blocked.es6.js');
var topBlockedTemplate = require('./../templates/top-blocked-truncated.es6.js');
var SiteView = require('./../views/site.es6.js');
var SiteModel = require('./../models/site.es6.js');
var siteTemplate = require('./../templates/site.es6.js');
var SearchView = require('./../views/search.es6.js');
var SearchModel = require('./../models/search.es6.js');
var searchTemplate = require('./../templates/search.es6.js');
var AutocompleteView = require('./../views/autocomplete.es6.js');
var AutocompleteModel = require('./../models/autocomplete.es6.js');
var autocompleteTemplate = require('./../templates/autocomplete.es6.js');
var BackgroundMessageModel = require('./../models/background-message.es6.js');

function Trackers(ops) {
    this.$parent = window.$('#popup-container');
    Parent.call(this, ops);
}

Trackers.prototype = window.$.extend({}, Parent.prototype, mixins.setBrowserClassOnBodyTag, {

    pageName: 'popup',

    ready: function ready() {
        Parent.prototype.ready.call(this);
        this.message = new BackgroundMessageModel();
        this.setBrowserClassOnBodyTag();

        this.views.search = new SearchView({
            pageView: this,
            model: new SearchModel({ searchText: '' }),
            appendTo: this.$parent,
            template: searchTemplate
        });

        this.views.hamburgerMenu = new HamburgerMenuView({
            pageView: this,
            model: new HamburgerMenuModel(),
            appendTo: this.$parent,
            template: hamburgerMenuTemplate
        });

        this.views.site = new SiteView({
            pageView: this,
            model: new SiteModel(),
            appendTo: this.$parent,
            template: siteTemplate
        });

        this.views.topblocked = new TopBlockedView({
            pageView: this,
            model: new TopBlockedModel({ numCompanies: 3 }),
            appendTo: this.$parent,
            template: topBlockedTemplate
        });

        // TODO: hook up model query to actual ddg ac endpoint.
        // For now this is just here to demonstrate how to
        // listen to another component via model.set() +
        // store.subscribe()
        this.views.autocomplete = new AutocompleteView({
            pageView: this,
            model: new AutocompleteModel({ suggestions: [] }),
            // appendTo: this.views.search.$el,
            appendTo: null,
            template: autocompleteTemplate
        });
    }
});

// kickoff!
window.DDG = window.DDG || {};
window.DDG.page = new Trackers();

},{"./../models/autocomplete.es6.js":35,"./../models/background-message.es6.js":36,"./../models/hamburger-menu.es6.js":37,"./../models/search.es6.js":39,"./../models/site.es6.js":41,"./../models/top-blocked.es6.js":42,"./../templates/autocomplete.es6.js":47,"./../templates/hamburger-menu.es6.js":49,"./../templates/search.es6.js":51,"./../templates/site.es6.js":64,"./../templates/top-blocked-truncated.es6.js":67,"./../views/autocomplete.es6.js":70,"./../views/hamburger-menu.es6.js":72,"./../views/search.es6.js":76,"./../views/site.es6.js":77,"./../views/top-blocked-truncated.es6.js":79,"./mixins/index.es6.js":44}],47:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<ul class="js-autocomplete" style="', '">\n        ', '\n    </ul>'], ['<ul class="js-autocomplete" style="', '">\n        ', '\n    </ul>']),
    _templateObject2 = _taggedTemplateLiteral(['\n            <li><a href="javascript:void(0)">', '</a></li>'], ['\n            <li><a href="javascript:void(0)">', '</a></li>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function () {
    // TODO/REMOVE: remove marginTop style tag once this is actually hooked up
    // this is just to demo model store for now!
    //  -> this is gross, don't do this:
    var marginTop = this.model.suggestions && this.model.suggestions.length > 0 ? 'margin-top: 50px;' : '';

    return bel(_templateObject, marginTop, this.model.suggestions.map(function (suggestion) {
        return bel(_templateObject2, suggestion);
    }));
};

},{"bel":1}],48:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<section class="sliding-subview sliding-subview--has-fixed-header">\n    <div class="site-info site-info--full-height card">\n        ', '\n        ', '\n        ', '\n    </div>\n</section>'], ['<section class="sliding-subview sliding-subview--has-fixed-header">\n    <div class="site-info site-info--full-height card">\n        ', '\n        ', '\n        ', '\n    </div>\n</section>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var reasons = require('./shared/grade-scorecard-reasons.es6.js');
var grades = require('./shared/grade-scorecard-grades.es6.js');
var ratingHero = require('./shared/rating-hero.es6.js');

module.exports = function () {
    return bel(_templateObject, ratingHero(this.model, { showClose: true }), reasons(this.model), grades(this.model));
};

},{"./shared/grade-scorecard-grades.es6.js":53,"./shared/grade-scorecard-reasons.es6.js":54,"./shared/rating-hero.es6.js":57,"bel":1}],49:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<nav class="hamburger-menu js-hamburger-menu is-hidden">\n    <div class="hamburger-menu__bg"></div>\n    <div class="hamburger-menu__content card padded">\n        <h2 class="menu-title border--bottom hamburger-menu__content__more-options">\n            More Options\n        </h2>\n        <nav class="pull-right hamburger-menu__close-container">\n            <a href="javascript:void(0)" class="icon icon__close js-hamburger-menu-close" role="button" aria-label="Close options"></a>\n        </nav>\n        <ul class="hamburger-menu__links padded default-list">\n            <li>\n                <a href="javascript:void(0)" class="menu-title js-hamburger-menu-options-link">\n                    Settings\n                    <span>Manage whitelist and other options</span>\n                </a>\n            </li>\n            <li>\n                <a href="javascript:void(0)" class="menu-title js-hamburger-menu-feedback-link">\n                    Send feedback\n                    <span>Got issues or suggestions? Let us know!</span>\n                </a>\n            </li>\n            <li>\n                <a href="javascript:void(0)" class="menu-title js-hamburger-menu-broken-site-link">\n                    Report broken site\n                    <span>If a site\'s not working, please tell us.</span>\n                </a>\n            </li>\n        </ul>\n    </div>\n</nav>'], ['<nav class="hamburger-menu js-hamburger-menu is-hidden">\n    <div class="hamburger-menu__bg"></div>\n    <div class="hamburger-menu__content card padded">\n        <h2 class="menu-title border--bottom hamburger-menu__content__more-options">\n            More Options\n        </h2>\n        <nav class="pull-right hamburger-menu__close-container">\n            <a href="javascript:void(0)" class="icon icon__close js-hamburger-menu-close" role="button" aria-label="Close options"></a>\n        </nav>\n        <ul class="hamburger-menu__links padded default-list">\n            <li>\n                <a href="javascript:void(0)" class="menu-title js-hamburger-menu-options-link">\n                    Settings\n                    <span>Manage whitelist and other options</span>\n                </a>\n            </li>\n            <li>\n                <a href="javascript:void(0)" class="menu-title js-hamburger-menu-feedback-link">\n                    Send feedback\n                    <span>Got issues or suggestions? Let us know!</span>\n                </a>\n            </li>\n            <li>\n                <a href="javascript:void(0)" class="menu-title js-hamburger-menu-broken-site-link">\n                    Report broken site\n                    <span>If a site\'s not working, please tell us.</span>\n                </a>\n            </li>\n        </ul>\n    </div>\n</nav>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function () {
    return bel(_templateObject);
};

},{"bel":1}],50:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<section class="sliding-subview sliding-subview--has-fixed-header">\n    <div class="privacy-practices site-info site-info--full-height card">\n        <div class="js-privacy-practices-hero">\n            ', '\n        </div>\n        <div class="privacy-practices__explainer padded border--bottom--inner\n            text--center">\n            Privacy practices indicate how much the personal information\n            that you share with a website is protected.\n        </div>\n        <div class="privacy-practices__details padded border--bottom--inner\n            js-privacy-practices-details">\n            ', '\n        </div>\n        <div class="privacy-practices__attrib padded text--center">\n            Privacy Practice results from ', '\n        </div>\n    </div>\n</section>'], ['<section class="sliding-subview sliding-subview--has-fixed-header">\n    <div class="privacy-practices site-info site-info--full-height card">\n        <div class="js-privacy-practices-hero">\n            ', '\n        </div>\n        <div class="privacy-practices__explainer padded border--bottom--inner\n            text--center">\n            Privacy practices indicate how much the personal information\n            that you share with a website is protected.\n        </div>\n        <div class="privacy-practices__details padded border--bottom--inner\n            js-privacy-practices-details">\n            ', '\n        </div>\n        <div class="privacy-practices__attrib padded text--center">\n            Privacy Practice results from ', '\n        </div>\n    </div>\n</section>']),
    _templateObject2 = _taggedTemplateLiteral(['<div class="text--center">\n    <div class="privacy-practices__details__no-detail-icon"></div>\n    <h1 class="privacy-practices__details__title">\n        No Privacy Practices Found\n    </h1>\n    <div class="privacy-practices__details__msg">\n        The Privacy practices of this website have not been reviewed.\n    </div>\n</div>'], ['<div class="text--center">\n    <div class="privacy-practices__details__no-detail-icon"></div>\n    <h1 class="privacy-practices__details__title">\n        No Privacy Practices Found\n    </h1>\n    <div class="privacy-practices__details__msg">\n        The Privacy practices of this website have not been reviewed.\n    </div>\n</div>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var changeCase = require('change-case');
var hero = require('./shared/hero.es6.js');
var statusList = require('./shared/status-list.es6.js');
var constants = require('../../../data/constants');
var crossplatformLink = require('./shared/crossplatform-link.es6.js');

module.exports = function () {
    var domain = this.model && this.model.domain;
    var tosdr = this.model && this.model.tosdr;

    var tosdrMsg = tosdr && tosdr.message || constants.tosdrMessages.unknown;
    var tosdrStatus = tosdrMsg.toLowerCase();

    return bel(_templateObject, hero({
        status: tosdrStatus,
        title: domain,
        subtitle: tosdrMsg + ' Privacy Practices',
        showClose: true
    }), tosdr && tosdr.reasons ? renderDetails(tosdr.reasons) : renderNoDetails(), crossplatformLink('https://tosdr.org/', {
        className: 'bold',
        target: '_blank',
        text: 'ToS;DR',
        attributes: {
            'aria-label': 'Terms of Service; Didn\'t Read'
        }
    }));
};

function renderDetails(reasons) {
    var good = reasons.good || [];
    var bad = reasons.bad || [];

    if (!good.length && !bad.length) return renderNoDetails();

    // convert arrays to work for the statusList template,
    // which use objects

    good = good.map(function (item) {
        return {
            msg: changeCase.upperCaseFirst(item),
            modifier: 'good'
        };
    });

    bad = bad.map(function (item) {
        return {
            msg: changeCase.upperCaseFirst(item),
            modifier: 'bad'
        };
    });

    // list good first, then bad
    return statusList(good.concat(bad));
}

function renderNoDetails() {
    return bel(_templateObject2);
}

},{"../../../data/constants":31,"./shared/crossplatform-link.es6.js":52,"./shared/hero.es6.js":56,"./shared/status-list.es6.js":59,"bel":1,"change-case":4}],51:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<section>\n    <form class="sliding-subview__header search-form js-search-form" name="x">\n        <span class="ddg-logo"></span>\n        <input type="text" autocomplete="off" placeholder="Search DuckDuckGo"\n            name="q" class="search-form__input js-search-input"\n            value="', '" />\n        <input class="search-form__go js-search-go" value="" type="submit" aria-label="Search" />\n        ', '\n    </form>\n</section>'], ['<section>\n    <form class="sliding-subview__header search-form js-search-form" name="x">\n        <span class="ddg-logo"></span>\n        <input type="text" autocomplete="off" placeholder="Search DuckDuckGo"\n            name="q" class="search-form__input js-search-input"\n            value="', '" />\n        <input class="search-form__go js-search-go" value="" type="submit" aria-label="Search" />\n        ', '\n    </form>\n</section>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var hamburgerButton = require('./shared/hamburger-button.es6.js');

module.exports = function () {
    return bel(_templateObject, this.model.searchText, hamburgerButton('js-search-hamburger-button'));
};

},{"./shared/hamburger-button.es6.js":55,"bel":1}],52:[function(require,module,exports){
'use strict';

/* Generates a link that will work on both webextensions and safari
 * url: href url
 * options: any a tag attribute
 */
module.exports = function (url, options) {
    var a = document.createElement('a');
    a.href = url;

    // attributes for the <a> tag, e.g. "aria-label"
    if (options.attributes) {
        for (var attr in options.attributes) {
            a.setAttribute(attr, options.attributes[attr]);
        }

        delete options.attributes;
    }

    for (var key in options) {
        a[key] = options[key];
    }

    if (window.safari) {
        // safari can't use _blank target so we'll add a click handler
        if (a.target === '_blank') {
            a.removeAttribute('target');
            a.href = 'javascript:void(0)';
            a.onclick = function () {
                window.safari.application.activeBrowserWindow.openTab().url = url;
                window.safari.self.hide();
            };
        }
    }

    return a;
};

},{}],53:[function(require,module,exports){
'use strict';

var statusList = require('./status-list.es6.js');

module.exports = function (site) {
    var grades = getGrades(site.siteRating, site.isWhitelisted);

    if (!grades || !grades.length) return;

    return statusList(grades, 'status-list--right padded js-grade-scorecard-grades');
};

function getGrades(rating, isWhitelisted) {
    if (!rating || !rating.before || !rating.after) return;

    // transform site ratings into grades
    // that the template can display more easily
    var before = rating.cssBefore;
    var after = rating.cssAfter;

    var grades = [];

    grades.push({
        msg: 'Privacy Grade',
        modifier: before.toLowerCase()
    });

    if (before !== after && !isWhitelisted) {
        grades.push({
            msg: 'Enhanced Grade',
            modifier: after.toLowerCase(),
            highlight: true
        });
    }

    return grades;
}

},{"./status-list.es6.js":59}],54:[function(require,module,exports){
'use strict';

var statusList = require('./status-list.es6.js');
var constants = require('../../../../data/constants');
var trackerNetworksText = require('./tracker-networks-text.es6.js');

module.exports = function (site) {
    var reasons = getReasons(site);

    if (!reasons || !reasons.length) return;

    return statusList(reasons, 'status-list--right padded border--bottom--inner js-grade-scorecard-reasons');
};

function getReasons(site) {
    var reasons = [];

    // grab all the data from the site to create
    // a list of reasons behind the grade

    // encryption status
    var httpsState = site.httpsState;
    if (httpsState) {
        var _modifier = httpsState === 'none' ? 'bad' : 'good';

        reasons.push({
            modifier: _modifier,
            msg: site.httpsStatusText
        });
    }

    // tracking networks blocked or found,
    // only show a message if there's any
    var trackersCount = site.isWhitelisted ? site.trackersCount : site.trackersBlockedCount;
    var trackersBadOrGood = trackersCount !== 0 ? 'bad' : 'good';
    reasons.push({
        modifier: trackersBadOrGood,
        msg: '' + trackerNetworksText(site)
    });

    // major tracking networks,
    // only show a message if there are any
    var majorTrackersBadOrGood = site.majorTrackerNetworksCount !== 0 ? 'bad' : 'good';
    reasons.push({
        modifier: majorTrackersBadOrGood,
        msg: '' + trackerNetworksText(site, true)
    });

    // Is the site itself a major tracking network?
    // only show a message if it is
    if (site.isaMajorTrackingNetwork) {
        reasons.push({
            modifier: 'bad',
            msg: 'Site is a Major Tracker Network'
        });
    }

    // privacy practices from tosdr
    var unknownPractices = constants.tosdrMessages.unknown;
    var privacyMessage = site.tosdr && site.tosdr.message || unknownPractices;
    var modifier = privacyMessage === unknownPractices ? 'bad' : privacyMessage.toLowerCase();
    reasons.push({
        modifier: modifier,
        msg: privacyMessage + ' Privacy Practices'
    });

    return reasons;
}

},{"../../../../data/constants":31,"./status-list.es6.js":59,"./tracker-networks-text.es6.js":63}],55:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<button type="button" class="hamburger-button ', '" aria-label="More options">\n    <span></span>\n    <span></span>\n    <span></span>\n</button>'], ['<button type="button" class="hamburger-button ', '" aria-label="More options">\n    <span></span>\n    <span></span>\n    <span></span>\n</button>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function (klass) {
    klass = klass || '';
    return bel(_templateObject, klass);
};

},{"bel":1}],56:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<div class="hero border--bottom text--center ', ' silver-bg">\n    <div class="hero__icon hero__icon--', '">\n    </div>\n    <h1 class="hero__title">\n        ', '\n    </h1>\n    <h2 class="hero__subtitle" aria-label="', '">\n        ', '\n    </h2>\n    ', '\n</div>'], ['<div class="hero border--bottom text--center ', ' silver-bg">\n    <div class="hero__icon hero__icon--', '">\n    </div>\n    <h1 class="hero__title">\n        ', '\n    </h1>\n    <h2 class="hero__subtitle" aria-label="', '">\n        ', '\n    </h2>\n    ', '\n</div>']),
    _templateObject2 = _taggedTemplateLiteral(['<a href="javascript:void(0)"\n        class="hero__', '"\n        role="button"\n        aria-label="', '"\n        >\n    <span class="icon icon__arrow icon__arrow--large ', '">\n    </span>\n</a>'], ['<a href="javascript:void(0)"\n        class="hero__', '"\n        role="button"\n        aria-label="', '"\n        >\n    <span class="icon icon__arrow icon__arrow--large ', '">\n    </span>\n</a>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function (ops) {
    var slidingSubviewClass = ops.showClose ? 'js-sliding-subview-close' : '';
    return bel(_templateObject, slidingSubviewClass, ops.status, ops.title, ops.subtitleLabel ? ops.subtitleLabel : ops.subtitle, ops.subtitle, renderOpenOrCloseButton(ops.showClose));
};

function renderOpenOrCloseButton(isCloseButton) {
    var openOrClose = isCloseButton ? 'close' : 'open';
    var arrowIconClass = isCloseButton ? 'icon__arrow--left' : '';
    return bel(_templateObject2, openOrClose, isCloseButton ? 'Go back' : 'More details', arrowIconClass);
}

},{"bel":1}],57:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<div class="rating-hero-container js-rating-hero">\n     ', '\n</div>'], ['<div class="rating-hero-container js-rating-hero">\n     ', '\n</div>']),
    _templateObject2 = _taggedTemplateLiteral(['<span>Enhanced from\n    <span class="rating-letter rating-letter--', '">\n    </span> to\n    <span class="rating-letter rating-letter--', '">\n    </span>\n</span>'], ['<span>Enhanced from\n    <span class="rating-letter rating-letter--', '">\n    </span> to\n    <span class="rating-letter rating-letter--', '">\n    </span>\n</span>']),
    _templateObject3 = _taggedTemplateLiteral(['', ''], ['', '']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var hero = require('./hero.es6.js');

module.exports = function (site, ops) {
    var status = siteRatingStatus(site.isCalculatingSiteRating, site.siteRating, site.isWhitelisted);
    var subtitle = siteRatingSubtitle(site.isCalculatingSiteRating, site.siteRating, site.isWhitelisted);
    var label = subtitleLabel(site.isCalculatingSiteRating, site.siteRating, site.isWhitelisted);

    return bel(_templateObject, hero({
        status: status,
        title: site.domain,
        subtitle: subtitle,
        subtitleLabel: label,
        showClose: ops.showClose,
        showOpen: ops.showOpen
    }));
};

function siteRatingStatus(isCalculating, rating, isWhitelisted) {
    var status = void 0;
    var isActive = '';

    if (isCalculating) {
        status = 'calculating';
    } else if (rating && rating.before) {
        isActive = isWhitelisted ? '' : '--active';

        if (isActive && rating.after) {
            status = rating.cssAfter;
        } else {
            status = rating.cssBefore;
        }
    } else {
        status = 'null';
    }

    return status + isActive;
}

function siteRatingSubtitle(isCalculating, rating, isWhitelisted) {
    var isActive = true;
    if (isWhitelisted) isActive = false;
    // site grade/rating was upgraded by extension
    if (isActive && rating && rating.before && rating.after) {
        if (rating.before !== rating.after) {
            // wrap this in a single root span otherwise bel complains
            return bel(_templateObject2, rating.cssBefore, rating.cssAfter);
        }
    }

    // deal with other states
    var msg = 'Privacy Grade';
    // site is whitelisted
    if (!isActive) {
        msg = 'Privacy Protection Disabled';
        // "null" state (empty tab, browser's "about:" pages)
    } else if (!isCalculating && !rating.before && !rating.after) {
        msg = 'We only grade regular websites';
        // rating is still calculating
    } else if (isCalculating) {
        msg = 'Calculating...';
    }

    return bel(_templateObject3, msg);
}

// to avoid duplicating messages between the icon and the subtitle,
// we combine information for both here
function subtitleLabel(isCalculating, rating, isWhitelisted) {
    if (isCalculating) return;

    if (isWhitelisted && rating.before) {
        return 'Privacy Protection Disabled, Privacy Grade ' + rating.before;
    }

    if (rating.before && rating.before === rating.after) {
        return 'Privacy Grade ' + rating.before;
    }

    if (rating.before && rating.after) {
        return 'Enhanced from ' + rating.before + ' to ' + rating.after;
    }
}

},{"./hero.es6.js":56,"bel":1}],58:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<nav class="sliding-subview__header card">\n    <a href="javascript:void(0)" class="sliding-subview__header__back\n        sliding-subview__header__back--is-icon\n        js-sliding-subview-close">\n        <span class="icon icon__arrow icon__arrow--left pull-left">\n        </span>\n    </a>\n    <h2 class="sliding-subview__header__title">\n        ', '\n    </h2>\n    ', '\n</nav>'], ['<nav class="sliding-subview__header card">\n    <a href="javascript:void(0)" class="sliding-subview__header__back\n        sliding-subview__header__back--is-icon\n        js-sliding-subview-close">\n        <span class="icon icon__arrow icon__arrow--left pull-left">\n        </span>\n    </a>\n    <h2 class="sliding-subview__header__title">\n        ', '\n    </h2>\n    ', '\n</nav>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var hamburgerButton = require('./hamburger-button.es6.js');

module.exports = function (title) {
    return bel(_templateObject, title, hamburgerButton());
};

},{"./hamburger-button.es6.js":55,"bel":1}],59:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<ul class="status-list ', '">\n    ', '\n</ul>'], ['<ul class="status-list ', '">\n    ', '\n</ul>']),
    _templateObject2 = _taggedTemplateLiteral(['<li class="status-list__item status-list__item--', '\n    bold ', '">\n    ', '\n</li>'], ['<li class="status-list__item status-list__item--', '\n    bold ', '">\n    ', '\n</li>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function (items, extraClasses) {
    extraClasses = extraClasses || '';

    return bel(_templateObject, extraClasses, items.map(renderItem));
};

function renderItem(item) {
    return bel(_templateObject2, item.modifier, item.highlight ? 'is-highlighted' : '', item.msg);
}

},{"bel":1}],60:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['\n<button class="toggle-button toggle-button--is-active-', ' ', '"\n    data-key="', '"\n    type="button"\n    aria-pressed="', '"\n    >\n    <div class="toggle-button__bg">\n    </div>\n    <div class="toggle-button__knob"></div>\n</button>'], ['\n<button class="toggle-button toggle-button--is-active-', ' ', '"\n    data-key="', '"\n    type="button"\n    aria-pressed="', '"\n    >\n    <div class="toggle-button__bg">\n    </div>\n    <div class="toggle-button__knob"></div>\n</button>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function (isActiveBoolean, klass, dataKey) {
    // make `klass` and `dataKey` optional:
    klass = klass || '';
    dataKey = dataKey || '';

    return bel(_templateObject, isActiveBoolean, klass, dataKey, isActiveBoolean ? 'true' : 'false');
};

},{"bel":1}],61:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<div class="top-blocked__no-data">\n    <div class="top-blocked__no-data__graph">\n        <span class="top-blocked__no-data__graph__bar one"></span>\n        <span class="top-blocked__no-data__graph__bar two"></span>\n        <span class="top-blocked__no-data__graph__bar three"></span>\n        <span class="top-blocked__no-data__graph__bar four"></span>\n    </div>\n    <p class="top-blocked__no-data__lead text-center">Tracker Networks Top Offenders</p>\n    <p>We\'re still collecting data to show how many tracker networks we\'ve blocked.</p>\n    <p>Please check back again soon.</p>\n</div>'], ['<div class="top-blocked__no-data">\n    <div class="top-blocked__no-data__graph">\n        <span class="top-blocked__no-data__graph__bar one"></span>\n        <span class="top-blocked__no-data__graph__bar two"></span>\n        <span class="top-blocked__no-data__graph__bar three"></span>\n        <span class="top-blocked__no-data__graph__bar four"></span>\n    </div>\n    <p class="top-blocked__no-data__lead text-center">Tracker Networks Top Offenders</p>\n    <p>We\'re still collecting data to show how many tracker networks we\'ve blocked.</p>\n    <p>Please check back again soon.</p>\n</div>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function () {
    return bel(_templateObject);
};

},{"bel":1}],62:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['', ''], ['', '']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function (siteRating, isWhitelisted, totalTrackerNetworksCount) {
    var iconNameModifier = 'blocked';

    if (isWhitelisted && siteRating.before === 'D' && totalTrackerNetworksCount !== 0) {
        iconNameModifier = 'warning';
    }

    var iconName = 'major-networks-' + iconNameModifier;

    return bel(_templateObject, iconName);
};

},{"bel":1}],63:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['', ''], ['', '']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function (site, isMajorNetworksCount) {
    // Show all trackers found if site is whitelisted
    // but only show the blocked ones otherwise
    var trackersCount = site.isWhitelisted ? site.trackersCount : site.trackersBlockedCount || 0;
    var uniqueTrackersText = trackersCount === 1 ? ' Tracker ' : ' Trackers ';

    if (isMajorNetworksCount) {
        trackersCount = site.majorTrackerNetworksCount;
        uniqueTrackersText = trackersCount === 1 ? ' Major Tracker Network ' : ' Major Tracker Networks ';
    }
    var finalText = trackersCount + uniqueTrackersText + trackersBlockedOrFound(site, trackersCount);

    return bel(_templateObject, finalText);
};

function trackersBlockedOrFound(site, trackersCount) {
    var msg = '';
    if (site && (site.isWhitelisted || trackersCount === 0)) {
        msg = 'Found';
    } else {
        msg = 'Blocked';
    }

    return bel(_templateObject, msg);
}

},{"bel":1}],64:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<section class="site-info site-info--main">\n    <ul class="default-list">\n        <li class="site-info__rating-li js-hero-open">\n            ', '\n        </li>\n        <li class="site-info__li--https-status padded border--bottom">\n            <h2 class="site-info__https-status bold">\n                <span class="site-info__https-status__icon\n                    is-', '">\n                </span>\n                <span class="text-line-after-icon">\n                    ', '\n                </span>\n            </h2>\n        </li>\n        <li class="js-site-tracker-networks js-site-show-page-trackers site-info__li--trackers padded border--bottom">\n            <a href="javascript:void(0)" class="link-secondary bold">\n                ', '\n            </a>\n        </li>\n        <li class="js-site-privacy-practices site-info__li--privacy-practices padded border--bottom">\n            <span class="site-info__privacy-practices__icon\n                is-', '">\n            </span>\n            <a href="javascript:void(0)" class="link-secondary bold">\n                <span class="text-line-after-icon"> ', ' Privacy Practices </span>\n                <span class="icon icon__arrow pull-right"></span>\n            </a>\n        </li>\n        <li class="site-info__li--toggle padded ', '">\n            <h2 class="is-transparent site-info__whitelist-status js-site-whitelist-status">\n                <span class="icon ', '"></span>\n                <span class="text-line-after-icon">\n                    ', '\n                </span>\n            </h2>\n            <h2 class="site-info__protection js-site-protection">Site Privacy Protection</h2>\n            <div class="site-info__toggle-container">\n                ', '\n            </div>\n        </li>\n        <li class="site-info__li--manage-whitelist padded border--bottom">\n            ', '\n        </li>\n    </ul>\n</section>'], ['<section class="site-info site-info--main">\n    <ul class="default-list">\n        <li class="site-info__rating-li js-hero-open">\n            ', '\n        </li>\n        <li class="site-info__li--https-status padded border--bottom">\n            <h2 class="site-info__https-status bold">\n                <span class="site-info__https-status__icon\n                    is-', '">\n                </span>\n                <span class="text-line-after-icon">\n                    ', '\n                </span>\n            </h2>\n        </li>\n        <li class="js-site-tracker-networks js-site-show-page-trackers site-info__li--trackers padded border--bottom">\n            <a href="javascript:void(0)" class="link-secondary bold">\n                ', '\n            </a>\n        </li>\n        <li class="js-site-privacy-practices site-info__li--privacy-practices padded border--bottom">\n            <span class="site-info__privacy-practices__icon\n                is-', '">\n            </span>\n            <a href="javascript:void(0)" class="link-secondary bold">\n                <span class="text-line-after-icon"> ', ' Privacy Practices </span>\n                <span class="icon icon__arrow pull-right"></span>\n            </a>\n        </li>\n        <li class="site-info__li--toggle padded ', '">\n            <h2 class="is-transparent site-info__whitelist-status js-site-whitelist-status">\n                <span class="icon ', '"></span>\n                <span class="text-line-after-icon">\n                    ', '\n                </span>\n            </h2>\n            <h2 class="site-info__protection js-site-protection">Site Privacy Protection</h2>\n            <div class="site-info__toggle-container">\n                ', '\n            </div>\n        </li>\n        <li class="site-info__li--manage-whitelist padded border--bottom">\n            ', '\n        </li>\n    </ul>\n</section>']),
    _templateObject2 = _taggedTemplateLiteral(['<a href="javascript:void(0)" class="site-info__trackers link-secondary bold">\n    <span class="site-info__trackers-status__icon\n        icon-', '"></span>\n    <span class="', ' text-line-after-icon"> ', ' </span>\n    <span class="icon icon__arrow pull-right"></span>\n</a>'], ['<a href="javascript:void(0)" class="site-info__trackers link-secondary bold">\n    <span class="site-info__trackers-status__icon\n        icon-', '"></span>\n    <span class="', ' text-line-after-icon"> ', ' </span>\n    <span class="icon icon__arrow pull-right"></span>\n</a>']),
    _templateObject3 = _taggedTemplateLiteral(['<div>\n    <a href="javascript:void(0)" class="js-site-manage-whitelist site-info__manage-whitelist link-secondary bold">\n        Manage Whitelist\n    </a>\n    <div class="separator"></div>\n    <a href="javascript:void(0)" class="js-site-report-broken site-info__report-broken link-secondary bold">\n        Report Broken Site\n    </a>\n</div>'], ['<div>\n    <a href="javascript:void(0)" class="js-site-manage-whitelist site-info__manage-whitelist link-secondary bold">\n        Manage Whitelist\n    </a>\n    <div class="separator"></div>\n    <a href="javascript:void(0)" class="js-site-report-broken site-info__report-broken link-secondary bold">\n        Report Broken Site\n    </a>\n</div>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var toggleButton = require('./shared/toggle-button.es6.js');
var ratingHero = require('./shared/rating-hero.es6.js');
var trackerNetworksIcon = require('./shared/tracker-network-icon.es6.js');
var trackerNetworksText = require('./shared/tracker-networks-text.es6.js');
var constants = require('../../../data/constants');

module.exports = function () {
    var tosdrMsg = this.model.tosdr && this.model.tosdr.message || constants.tosdrMessages.unknown;

    return bel(_templateObject, ratingHero(this.model, {
        showOpen: !this.model.disabled
    }), this.model.httpsState, this.model.httpsStatusText, renderTrackerNetworks(this.model), tosdrMsg.toLowerCase(), tosdrMsg, this.model.isWhitelisted ? '' : 'is-active', setTransitionIcon(!this.model.isWhitelisted), setTransitionText(!this.model.isWhitelisted), toggleButton(!this.model.isWhitelisted, 'js-site-toggle pull-right'), renderManageWhitelist(this.model));

    function setTransitionIcon(isSiteWhitelisted) {
        isSiteWhitelisted = isSiteWhitelisted || false;
        var icon = 'icon__check';

        if (isSiteWhitelisted) {
            icon = 'icon__shield';
        }

        return icon;
    }

    function setTransitionText(isSiteWhitelisted) {
        isSiteWhitelisted = isSiteWhitelisted || false;
        var text = 'Added to ';

        if (isSiteWhitelisted) {
            text = 'Removed From ';
        }

        text += 'Whitelist';
        return text;
    }

    function renderTrackerNetworks(model) {
        var isActive = !model.isWhitelisted ? 'is-active' : '';

        return bel(_templateObject2, trackerNetworksIcon(model.siteRating, model.isWhitelisted, model.totalTrackerNetworksCount), isActive, trackerNetworksText(model, false));
    }

    function renderManageWhitelist(model) {
        return bel(_templateObject3);
    }
};

},{"../../../data/constants":31,"./shared/rating-hero.es6.js":57,"./shared/toggle-button.es6.js":60,"./shared/tracker-network-icon.es6.js":62,"./shared/tracker-networks-text.es6.js":63,"bel":1}],65:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<li class="top-blocked__li">\n    <div class="top-blocked__li__company-name">', '</div>\n    <div class="top-blocked__li__blocker-bar">\n        <div class="top-blocked__li__blocker-bar__fg\n            js-top-blocked-graph-bar-fg"\n            style="width: 0px" data-width="', '">\n        </div>\n    </div>\n    <div class="top-blocked__li__blocker-pct js-top-blocked-pct">\n        ', '%\n    </div>\n</li>'], ['<li class="top-blocked__li">\n    <div class="top-blocked__li__company-name">', '</div>\n    <div class="top-blocked__li__blocker-bar">\n        <div class="top-blocked__li__blocker-bar__fg\n            js-top-blocked-graph-bar-fg"\n            style="width: 0px" data-width="', '">\n        </div>\n    </div>\n    <div class="top-blocked__li__blocker-pct js-top-blocked-pct">\n        ', '%\n    </div>\n</li>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function (companyListMap) {
    return companyListMap.map(function (data) {
        return bel(_templateObject, data.name, data.percent, data.percent);
    });
};

},{"bel":1}],66:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<li class="top-blocked__li top-blocked__li--truncated">\n    <div class="top-blocked__pill" aria-label="', ' found on ', '% of sites">\n        <div class="top-blocked__pill-site__icon-container">\n            <div class="top-blocked__pill-site__icon ', '"></div>\n        </div>\n        <div class="top-blocked__pill__divider"></div>\n        <div class="top-blocked__pill__blocker-pct js-top-blocked-pct">\n            ', '%\n        </div>\n    </div>\n</li>'], ['<li class="top-blocked__li top-blocked__li--truncated">\n    <div class="top-blocked__pill" aria-label="', ' found on ', '% of sites">\n        <div class="top-blocked__pill-site__icon-container">\n            <div class="top-blocked__pill-site__icon ', '"></div>\n        </div>\n        <div class="top-blocked__pill__divider"></div>\n        <div class="top-blocked__pill__blocker-pct js-top-blocked-pct">\n            ', '%\n        </div>\n    </div>\n</li>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var constants = require('../../../data/constants');
var majorTrackingNetworks = constants.majorTrackingNetworks;

module.exports = function (companyListMap) {
    return companyListMap.map(function (data) {
        return bel(_templateObject, data.name, data.percent, getScssClass(data.normalizedName), data.percent);
    });

    function getScssClass(companyName) {
        var genericName = 'generic';

        // TODO: remove Oath special case when we have an icon for it
        if (companyName !== 'oath' && majorTrackingNetworks[companyName]) {
            return companyName;
        } else {
            return genericName;
        }
    }
};

},{"../../../data/constants":31,"bel":1}],67:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<section class="top-blocked top-blocked--truncated silver-bg">\n    <h3 class="padded uppercase text--center">\n        Tracker Networks Top Offenders\n    </h3>\n    <ol class="default-list top-blocked__list top-blocked__list--truncated">\n        ', '\n    </ol>\n    <div class="top-blocked__see-all border--top js-top-blocked-see-all">\n        <a href="javascript:void(0)" class="link-secondary">\n            <span class="icon icon__arrow pull-right"></span>\n            All Tracker Networks\n        </a>\n    </div>\n</section>'], ['<section class="top-blocked top-blocked--truncated silver-bg">\n    <h3 class="padded uppercase text--center">\n        Tracker Networks Top Offenders\n    </h3>\n    <ol class="default-list top-blocked__list top-blocked__list--truncated">\n        ', '\n    </ol>\n    <div class="top-blocked__see-all border--top js-top-blocked-see-all">\n        <a href="javascript:void(0)" class="link-secondary">\n            <span class="icon icon__arrow pull-right"></span>\n            All Tracker Networks\n        </a>\n    </div>\n</section>']),
    _templateObject2 = _taggedTemplateLiteral(['<section class="top-blocked card card--transparent">\n    <ol class="default-list top-blocked__list top-blocked__list--truncated">\n        <li class="top-blocked__li top-blocked__li--no-data">\n            ', '\n        </li>\n    </ol>\n</section>'], ['<section class="top-blocked card card--transparent">\n    <ol class="default-list top-blocked__list top-blocked__list--truncated">\n        <li class="top-blocked__li top-blocked__li--no-data">\n            ', '\n        </li>\n    </ol>\n</section>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var listItems = require('./top-blocked-truncated-list-items.es6.js');
var noData = require('./shared/top-blocked-no-data.es6.js');

module.exports = function () {
    if (this.model.companyListMap && this.model.companyListMap.length > 0) {
        return bel(_templateObject, listItems(this.model.companyListMap));
    } else {
        return bel(_templateObject2, noData());
    }
};

},{"./shared/top-blocked-no-data.es6.js":61,"./top-blocked-truncated-list-items.es6.js":66,"bel":1}],68:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<section class="sliding-subview\n    sliding-subview--has-fixed-header">\n    ', '\n</section>'], ['<section class="sliding-subview\n    sliding-subview--has-fixed-header">\n    ', '\n</section>']),
    _templateObject2 = _taggedTemplateLiteral(['<div class="js-top-blocked-content">\n    ', '\n    ', '\n    ', '\n</div>'], ['<div class="js-top-blocked-content">\n    ', '\n    ', '\n    ', '\n</div>']),
    _templateObject3 = _taggedTemplateLiteral(['<p class="top-blocked__pct card">\n    Trackers were found on ', '%\n    of web sites you\'ve visited', '.\n</p>'], ['<p class="top-blocked__pct card">\n    Trackers were found on ', '%\n    of web sites you\'ve visited', '.\n</p>']),
    _templateObject4 = _taggedTemplateLiteral(['<ol aria-label="List of Trackers Found" class="default-list top-blocked__list card">\n    ', '\n</ol>'], ['<ol aria-label="List of Trackers Found" class="default-list top-blocked__list card">\n    ', '\n</ol>']),
    _templateObject5 = _taggedTemplateLiteral(['<ol class="default-list top-blocked__list">\n    <li class="top-blocked__li top-blocked__li--no-data">\n        ', '\n    </li>\n</ol>'], ['<ol class="default-list top-blocked__list">\n    <li class="top-blocked__li top-blocked__li--no-data">\n        ', '\n    </li>\n</ol>']),
    _templateObject6 = _taggedTemplateLiteral(['<div class="top-blocked__reset-stats">\n    <button class="top-blocked__reset-stats__button block\n        js-reset-trackers-data">\n        Reset Global Stats\n    </button>\n    <p>These stats are only stored locally on your device,\n    and are not sent anywhere, ever.</p>\n</div>'], ['<div class="top-blocked__reset-stats">\n    <button class="top-blocked__reset-stats__button block\n        js-reset-trackers-data">\n        Reset Global Stats\n    </button>\n    <p>These stats are only stored locally on your device,\n    and are not sent anywhere, ever.</p>\n</div>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var header = require('./shared/sliding-subview-header.es6.js');
var listItems = require('./top-blocked-list-items.es6.js');
var noData = require('./shared/top-blocked-no-data.es6.js');

module.exports = function () {
    if (!this.model) {
        return bel(_templateObject, header('All Trackers'));
    } else {
        return bel(_templateObject2, renderPctPagesWithTrackers(this.model), renderList(this.model), renderResetButton(this.model));
    }
};

function renderPctPagesWithTrackers(model) {
    var msg = '';
    if (model.lastStatsResetDate) {
        var d = new Date(model.lastStatsResetDate).toDateString();
        if (d) msg = ' since ' + d;
    }
    if (model.pctPagesWithTrackers) {
        return bel(_templateObject3, model.pctPagesWithTrackers, msg);
    }
}

function renderList(model) {
    if (model.companyListMap.length > 0) {
        return bel(_templateObject4, listItems(model.companyListMap));
    } else {
        return bel(_templateObject5, noData());
    }
}

function renderResetButton(model) {
    if (model.companyListMap.length > 0) {
        return bel(_templateObject6);
    }
}

},{"./shared/sliding-subview-header.es6.js":58,"./shared/top-blocked-no-data.es6.js":61,"./top-blocked-list-items.es6.js":65,"bel":1}],69:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<section class="sliding-subview\n    sliding-subview--has-fixed-header">\n</section>'], ['<section class="sliding-subview\n    sliding-subview--has-fixed-header">\n</section>']),
    _templateObject2 = _taggedTemplateLiteral(['<div class="tracker-networks site-info site-info--full-height card">\n    <div class="js-tracker-networks-hero">\n        ', '\n    </div>\n    <div class="tracker-networks__explainer padded border--bottom--inner\n        text--center">\n        Tracker networks aggregate your web history into a data profile about you.\n        Major tracker networks are more harmful because they can track and target you across more of the internet.\n    </div>\n    <div class="tracker-networks__details padded\n        js-tracker-networks-details">\n        <ol class="default-list site-info__trackers__company-list" aria-label="List of tracker networks">\n            ', '\n        </ol>\n    </div>\n</div>'], ['<div class="tracker-networks site-info site-info--full-height card">\n    <div class="js-tracker-networks-hero">\n        ', '\n    </div>\n    <div class="tracker-networks__explainer padded border--bottom--inner\n        text--center">\n        Tracker networks aggregate your web history into a data profile about you.\n        Major tracker networks are more harmful because they can track and target you across more of the internet.\n    </div>\n    <div class="tracker-networks__details padded\n        js-tracker-networks-details">\n        <ol class="default-list site-info__trackers__company-list" aria-label="List of tracker networks">\n            ', '\n        </ol>\n    </div>\n</div>']),
    _templateObject3 = _taggedTemplateLiteral(['', ''], ['', '']),
    _templateObject4 = _taggedTemplateLiteral(['<li class="is-empty">None</li>'], ['<li class="is-empty">None</li>']),
    _templateObject5 = _taggedTemplateLiteral(['<li class="', '">\n    <div class="site-info__tracker__wrapper ', ' float-right">\n        <span class="site-info__tracker__icon ', '">\n        </span>\n    </div>\n    <h1 class="site-info__domain block">', '</h1>\n    <ol class="default-list site-info__trackers__company-list__url-list" aria-label="Tracker domains for ', '">\n        ', '\n    </ol>\n</li>'], ['<li class="', '">\n    <div class="site-info__tracker__wrapper ', ' float-right">\n        <span class="site-info__tracker__icon ', '">\n        </span>\n    </div>\n    <h1 class="site-info__domain block">', '</h1>\n    <ol class="default-list site-info__trackers__company-list__url-list" aria-label="Tracker domains for ', '">\n        ', '\n    </ol>\n</li>']),
    _templateObject6 = _taggedTemplateLiteral(['<li>\n                <div class="url">', '</div>\n                <div class="category">', '</div>\n            </li>'], ['<li>\n                <div class="url">', '</div>\n                <div class="category">', '</div>\n            </li>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var hero = require('./shared/hero.es6.js');
var trackerNetworksIcon = require('./shared/tracker-network-icon.es6.js');
var trackerNetworksText = require('./shared/tracker-networks-text.es6.js');

module.exports = function () {
    if (!this.model) {
        return bel(_templateObject);
    } else {
        return bel(_templateObject2, renderHero(this.model.site), renderTrackerDetails(this.model, this.model.DOMAIN_MAPPINGS));
    }
};

function renderHero(site) {
    site = site || {};

    return bel(_templateObject3, hero({
        status: trackerNetworksIcon(site.siteRating, site.isWhitelisted, site.totalTrackerNetworksCount),
        title: site.domain,
        subtitle: '' + trackerNetworksText(site, false),
        showClose: true
    }));
}

function renderTrackerDetails(model, DOMAIN_MAPPINGS) {
    var companyListMap = model.companyListMap || {};
    if (companyListMap.length === 0) {
        return bel(_templateObject4);
    }
    if (companyListMap && companyListMap.length > 0) {
        return companyListMap.map(function (c, i) {
            var borderClass = '';
            if (c.name && c.name === 'unknown') {
                c.name = '(Tracker network unknown)';
            } else if (c.name && model.hasUnblockedTrackers(c, c.urlsList)) {
                var additionalText = ' associated domains';
                var domain = model.site ? model.site.domain : c.name;
                c.name = model.site.isWhitelisted ? domain + additionalText : domain + additionalText + ' (not blocked)';
                borderClass = companyListMap.length > 1 ? 'border--top' : '';
            }
            return bel(_templateObject5, borderClass, c.normalizedName, c.normalizedName, c.name, c.name, c.urlsList.map(function (url) {
                var category = '';
                if (DOMAIN_MAPPINGS[url.toLowerCase()]) {
                    category = DOMAIN_MAPPINGS[url.toLowerCase()].t;
                }
                return bel(_templateObject6, url, category);
            }));
        });
    }
}

},{"./shared/hero.es6.js":56,"./shared/tracker-network-icon.es6.js":62,"./shared/tracker-networks-text.es6.js":63,"bel":1}],70:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.View;

function Autocomplete(ops) {
    this.model = ops.model;
    this.pageView = ops.pageView;
    this.template = ops.template;
    Parent.call(this, ops);

    this.bindEvents([[this.store.subscribe, 'change:search', this._handleSearchText]]);
}

Autocomplete.prototype = window.$.extend({}, Parent.prototype, {

    _handleSearchText: function _handleSearchText(notification) {
        var _this = this;

        if (notification.change && notification.change.attribute === 'searchText') {
            if (!notification.change.value) {
                this.model.suggestions = [];
                this._rerender();
                return;
            }

            this.model.fetchSuggestions(notification.change.value).then(function () {
                return _this._rerender();
            });
        }
    }
});

module.exports = Autocomplete;

},{}],71:[function(require,module,exports){
'use strict';

var Parent = require('./sliding-subview.es6.js');
var ratingHeroTemplate = require('../templates/shared/rating-hero.es6.js');
var gradesTemplate = require('../templates/shared/grade-scorecard-grades.es6.js');
var reasonsTemplate = require('../templates/shared/grade-scorecard-reasons.es6.js');

function GradeScorecard(ops) {
    this.model = ops.model;
    this.template = ops.template;

    Parent.call(this, ops);

    this._setup();

    this.bindEvents([[this.store.subscribe, 'change:site', this._onSiteChange]]);

    this.setupClose();
}

GradeScorecard.prototype = window.$.extend({}, Parent.prototype, {
    _setup: function _setup() {
        this._cacheElems('.js-grade-scorecard', ['reasons', 'grades']);
        this.$hero = this.$('.js-rating-hero');
    },

    _rerenderHero: function _rerenderHero() {
        this.$hero.replaceWith(ratingHeroTemplate(this.model, { showClose: true }));
    },

    _rerenderGrades: function _rerenderGrades() {
        this.$grades.replaceWith(gradesTemplate(this.model));
    },

    _rerenderReasons: function _rerenderReasons() {
        this.$reasons.replaceWith(reasonsTemplate(this.model));
    },

    _onSiteChange: function _onSiteChange(e) {
        if (e.change.attribute === 'siteRating') {
            this._rerenderHero();
            this._rerenderGrades();
        }

        // all the other stuff we use in the reasons
        // (e.g. https, tosdr)
        // doesn't change dynamically
        if (e.change.attribute === 'trackerNetworks' || e.change.attribute === 'isaMajorTrackingNetwork') {
            this._rerenderReasons();
        }

        // recache any selectors that were rerendered
        this._setup();
        this.setupClose();
    }
});

module.exports = GradeScorecard;

},{"../templates/shared/grade-scorecard-grades.es6.js":53,"../templates/shared/grade-scorecard-reasons.es6.js":54,"../templates/shared/rating-hero.es6.js":57,"./sliding-subview.es6.js":78}],72:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.View;
var openOptionsPage = require('./mixins/open-options-page.es6.js');
var browserUIWrapper = require('./../base/chrome-ui-wrapper.es6.js');

function HamburgerMenu(ops) {
    this.model = ops.model;
    this.template = ops.template;
    Parent.call(this, ops);

    this._setup();
}

HamburgerMenu.prototype = window.$.extend({}, Parent.prototype, openOptionsPage, {

    _setup: function _setup() {
        this._cacheElems('.js-hamburger-menu', ['close', 'options-link', 'feedback-link', 'broken-site-link']);
        this.bindEvents([[this.$close, 'click', this._closeMenu], [this.$optionslink, 'click', this.openOptionsPage], [this.$feedbacklink, 'click', this._handleFeedbackClick], [this.$brokensitelink, 'click', this._handleBrokenSiteClick], [this.model.store.subscribe, 'action:search', this._handleAction], [this.model.store.subscribe, 'change:site', this._handleSiteUpdate]]);
    },

    _handleAction: function _handleAction(notification) {
        if (notification.action === 'burgerClick') this._openMenu();
    },

    _openMenu: function _openMenu(e) {
        this.$el.removeClass('is-hidden');
    },

    _closeMenu: function _closeMenu(e) {
        if (e) e.preventDefault();
        this.$el.addClass('is-hidden');
    },

    _handleFeedbackClick: function _handleFeedbackClick(e) {
        e.preventDefault();

        browserUIWrapper.openExtensionPage('/html/feedback.html');
    },

    _handleBrokenSiteClick: function _handleBrokenSiteClick(e) {
        e.preventDefault();

        var url = encodeURIComponent(this.model.tabUrl);
        browserUIWrapper.openExtensionPage('/html/feedback.html?broken=1&url=' + url);
    },

    _handleSiteUpdate: function _handleSiteUpdate(notification) {
        if (notification && notification.change.attribute === 'tab') {
            this.model.tabUrl = notification.change.value.url;
            this._rerender();
            this._setup();
        }
    }
});

module.exports = HamburgerMenu;

},{"./../base/chrome-ui-wrapper.es6.js":34,"./mixins/open-options-page.es6.js":74}],73:[function(require,module,exports){
'use strict';

module.exports = {
    animateGraphBars: function animateGraphBars() {
        var self = this;

        window.setTimeout(function () {
            if (!self.$graphbarfg) return;
            self.$graphbarfg.each(function (i, el) {
                var $el = window.$(el);
                var w = $el.data().width;
                $el.css('width', w + '%');
            });
        }, 250);

        window.setTimeout(function () {
            if (!self.$pct) return;
            self.$pct.each(function (i, el) {
                var $el = window.$(el);
                $el.css('color', '#333333');
            });
        }, 700);
    }
};

},{}],74:[function(require,module,exports){
'use strict';

var browserUIWrapper = require('./../../base/chrome-ui-wrapper.es6.js');

module.exports = {
    openOptionsPage: function openOptionsPage() {
        this.model.fetch({ getBrowser: true }).then(function (browser) {
            browserUIWrapper.openOptionsPage(browser);
        });
    }
};

},{"./../../base/chrome-ui-wrapper.es6.js":34}],75:[function(require,module,exports){
'use strict';

var ParentSlidingSubview = require('./sliding-subview.es6.js');

function PrivacyPractices(ops) {
    this.model = ops.model;
    this.template = ops.template;

    ParentSlidingSubview.call(this, ops);

    this.setupClose();
}

PrivacyPractices.prototype = window.$.extend({}, ParentSlidingSubview.prototype, {});

module.exports = PrivacyPractices;

},{"./sliding-subview.es6.js":78}],76:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.View;

function Search(ops) {
    var _this = this;

    this.model = ops.model;
    this.pageView = ops.pageView;
    this.template = ops.template;
    Parent.call(this, ops);

    this._cacheElems('.js-search', ['form', 'input', 'go', 'hamburger-button']);

    this.bindEvents([[this.$input, 'keyup', this._handleKeyup], [this.$go, 'click', this._handleSubmit], [this.$form, 'submit', this._handleSubmit], [this.$hamburgerbutton, 'click', this._handleBurgerClick]]);

    window.setTimeout(function () {
        return _this.$input.focus();
    }, 200);
}

Search.prototype = window.$.extend({}, Parent.prototype, {

    _handleKeyup: function _handleKeyup(e) {
        this.model.set('searchText', this.$input.val());
    },

    _handleSubmit: function _handleSubmit(e) {
        e.preventDefault();
        console.log('Search submit for ' + this.$input.val());
        this.model.fetch({ firePixel: 'epq' });
        this.model.doSearch(this.$input.val());
        window.close();
    },

    _handleBurgerClick: function _handleBurgerClick(e) {
        e.preventDefault();
        this.model.fetch({ firePixel: 'eph' });
        this.model.send('burgerClick');
    }
});

module.exports = Search;

},{}],77:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.View;
var GradeScorecardView = require('./../views/grade-scorecard.es6.js');
var TrackerNetworksView = require('./../views/tracker-networks.es6.js');
var PrivacyPracticesView = require('./../views/privacy-practices.es6.js');
var gradeScorecardTemplate = require('./../templates/grade-scorecard.es6.js');
var trackerNetworksTemplate = require('./../templates/tracker-networks.es6.js');
var privacyPracticesTemplate = require('./../templates/privacy-practices.es6.js');
var openOptionsPage = require('./mixins/open-options-page.es6.js');
var browserUIWrapper = require('./../base/chrome-ui-wrapper.es6.js');

function Site(ops) {
    var _this = this;

    this.model = ops.model;
    this.pageView = ops.pageView;
    this.template = ops.template;

    // cache 'body' selector
    this.$body = window.$('body');

    // get data from background process, then re-render template with it
    this.model.getBackgroundTabData().then(function () {
        if (_this.model.tab && (_this.model.tab.status === 'complete' || _this.model.domain === 'new tab')) {
            // render template for the first time here
            Parent.call(_this, ops);
            _this.model.fetch({ firePixel: 'ep' });
            _this._setup();
        } else {
            // the timeout helps buffer the re-render cycle during heavy
            // page loads with lots of trackers
            Parent.call(_this, ops);
            setTimeout(function () {
                return _this.rerender();
            }, 750);
        }
    });
}

Site.prototype = window.$.extend({}, Parent.prototype, openOptionsPage, {
    _onWhitelistClick: function _onWhitelistClick(e) {
        if (this.$body.hasClass('is-disabled')) return;
        this.model.toggleWhitelist();
        this._showWhitelistedStatusMessage();
    },

    // If we just whitelisted a site, show a message briefly before reloading
    // otherwise just reload the tab and close the popup
    _showWhitelistedStatusMessage: function _showWhitelistedStatusMessage() {
        var _this2 = this;

        var isTransparentClass = 'is-transparent';
        // Wait for the rerendering to be done
        // 10ms timeout is the minimum to render the transition smoothly
        setTimeout(function () {
            return _this2.$whiteliststatus.removeClass(isTransparentClass);
        }, 10);
        setTimeout(function () {
            return _this2.$protection.addClass(isTransparentClass);
        }, 10);
        // Wait a bit more before closing the popup and reloading the tab

        setTimeout(function () {
            browserUIWrapper.reloadTab(_this2.model.tab.id);
        }, 1500);
        setTimeout(function () {
            browserUIWrapper.closePopup();
        }, 1500);
    },

    // NOTE: after ._setup() is called this view listens for changes to
    // site model and re-renders every time model properties change
    _setup: function _setup() {
        // console.log('[site view] _setup()')
        this._cacheElems('.js-site', ['toggle', 'protection', 'whitelist-status', 'show-all-trackers', 'show-page-trackers', 'manage-whitelist', 'report-broken', 'privacy-practices']);

        this.$gradescorecard = this.$('.js-hero-open');

        this.bindEvents([[this.$toggle, 'click', this._onWhitelistClick], [this.$showpagetrackers, 'click', this._showPageTrackers], [this.$privacypractices, 'click', this._showPrivacyPractices], [this.$gradescorecard, 'click', this._showGradeScorecard], [this.$managewhitelist, 'click', this._onManageWhitelistClick], [this.$reportbroken, 'click', this._onReportBrokenSiteClick], [this.store.subscribe, 'change:site', this.rerender]]);
    },

    rerender: function rerender() {
        // console.log('[site view] rerender()')
        if (this.model && this.model.disabled) {
            if (!this.$body.hasClass('is-disabled')) {
                console.log('$body.addClass() is-disabled');
                this.$body.addClass('is-disabled');
                this._rerender();
                this._setup();
            }
        } else {
            this.$body.removeClass('is-disabled');
            this.unbindEvents();
            this._rerender();
            this._setup();
        }
    },

    _onManageWhitelistClick: function _onManageWhitelistClick() {
        if (this.model && this.model.disabled) {
            return;
        }

        this.openOptionsPage();
    },

    _onReportBrokenSiteClick: function _onReportBrokenSiteClick(e) {
        e.preventDefault();

        if (this.model && this.model.disabled) {
            return;
        }

        var url = encodeURIComponent(this.model.tab.url);
        browserUIWrapper.openExtensionPage('/html/feedback.html?broken=1&url=' + url);
    },

    _showPageTrackers: function _showPageTrackers() {
        if (this.$body.hasClass('is-disabled')) return;
        this.model.fetch({ firePixel: 'epn' });
        this.views.slidingSubview = new TrackerNetworksView({
            template: trackerNetworksTemplate
        });
    },

    _showPrivacyPractices: function _showPrivacyPractices() {
        if (this.model.disabled) return;
        this.model.fetch({ firePixel: 'epp' });

        this.views.privacyPractices = new PrivacyPracticesView({
            template: privacyPracticesTemplate,
            model: this.model
        });
    },

    _showGradeScorecard: function _showGradeScorecard() {
        if (this.model.disabled) return;
        this.model.fetch({ firePixel: 'epc' });

        this.views.gradeScorecard = new GradeScorecardView({
            template: gradeScorecardTemplate,
            model: this.model
        });
    }
});

module.exports = Site;

},{"./../base/chrome-ui-wrapper.es6.js":34,"./../templates/grade-scorecard.es6.js":48,"./../templates/privacy-practices.es6.js":50,"./../templates/tracker-networks.es6.js":69,"./../views/grade-scorecard.es6.js":71,"./../views/privacy-practices.es6.js":75,"./../views/tracker-networks.es6.js":81,"./mixins/open-options-page.es6.js":74}],78:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.View;

function SlidingSubview(ops) {
    ops.appendTo = window.$('.sliding-subview--root');
    Parent.call(this, ops);

    this.$root = window.$('.sliding-subview--root');
    this.$root.addClass('sliding-subview--open');

    this.setupClose();
}

SlidingSubview.prototype = window.$.extend({}, Parent.prototype, {

    setupClose: function setupClose() {
        this._cacheElems('.js-sliding-subview', ['close']);
        this.bindEvents([[this.$close, 'click', this._destroy]]);
    },

    _destroy: function _destroy() {
        var _this = this;

        this.$root.removeClass('sliding-subview--open');
        window.setTimeout(function () {
            _this.destroy();
        }, 400); // 400ms = 0.35s in .sliding-subview--root transition + 50ms padding
    }
});

module.exports = SlidingSubview;

},{}],79:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.View;
var TopBlockedFullView = require('./top-blocked.es6.js');
var topBlockedFullTemplate = require('./../templates/top-blocked.es6.js');

function TruncatedTopBlocked(ops) {
    var _this = this;

    this.model = ops.model;
    this.pageView = ops.pageView;
    this.template = ops.template;

    this.model.getTopBlocked().then(function () {
        Parent.call(_this, ops);
        _this._setup();
    });

    this.bindEvents([[this.model.store.subscribe, 'action:backgroundMessage', this.handleBackgroundMsg]]);
}

TruncatedTopBlocked.prototype = window.$.extend({}, Parent.prototype, {

    _seeAllClick: function _seeAllClick() {
        this.model.fetch({ firePixel: 'eps' });
        this.views.slidingSubview = new TopBlockedFullView({
            template: topBlockedFullTemplate,
            numItems: 10
        });
    },

    _setup: function _setup() {
        this._cacheElems('.js-top-blocked', ['graph-bar-fg', 'pct', 'see-all']);
        this.bindEvents([[this.$seeall, 'click', this._seeAllClick]]);
    },

    rerenderList: function rerenderList() {
        this._rerender();
        this._setup();
    },

    handleBackgroundMsg: function handleBackgroundMsg(message) {
        var _this2 = this;

        if (!message || !message.action) return;

        if (message.action === 'didResetTrackersData') {
            this.model.reset();
            setTimeout(function () {
                return _this2.rerenderList();
            }, 750);
            this.rerenderList();
        }
    }
});

module.exports = TruncatedTopBlocked;

},{"./../templates/top-blocked.es6.js":68,"./top-blocked.es6.js":80}],80:[function(require,module,exports){
'use strict';

var ParentSlidingSubview = require('./sliding-subview.es6.js');
var animateGraphBars = require('./mixins/animate-graph-bars.es6.js');
var TopBlockedModel = require('./../models/top-blocked.es6.js');

function TopBlocked(ops) {
    // model data is async
    this.model = null;
    this.numItems = ops.numItems;
    this.template = ops.template;
    ParentSlidingSubview.call(this, ops);

    this.setupClose();
    this.renderAsyncContent();

    this.bindEvents([[this.model.store.subscribe, 'action:backgroundMessage', this.handleBackgroundMsg]]);
}

TopBlocked.prototype = window.$.extend({}, ParentSlidingSubview.prototype, animateGraphBars, {

    setup: function setup() {
        this.$content = this.$el.find('.js-top-blocked-content');
        // listener for reset stats click
        this.$reset = this.$el.find('.js-reset-trackers-data');
        this.bindEvents([[this.$reset, 'click', this.resetTrackersStats]]);
    },

    renderAsyncContent: function renderAsyncContent() {
        var _this = this;

        var random = Math.round(Math.random() * 100000);
        this.model = new TopBlockedModel({
            modelName: 'topBlocked' + random,
            numCompanies: this.numItems
        });
        this.model.getTopBlocked().then(function () {
            var content = _this.template();
            _this.$el.append(content);
            _this.setup();

            // animate graph bars and pct
            _this.$graphbarfg = _this.$el.find('.js-top-blocked-graph-bar-fg');
            _this.$pct = _this.$el.find('.js-top-blocked-pct');
            _this.animateGraphBars();
        });
    },

    resetTrackersStats: function resetTrackersStats(e) {
        if (e) e.preventDefault();
        this.model.fetch({ resetTrackersData: true });
    },

    handleBackgroundMsg: function handleBackgroundMsg(message) {
        if (!message || !message.action) return;

        if (message.action === 'didResetTrackersData') {
            this.model.reset(message.data);
            var content = this.template();
            this.$content.replaceWith(content);
        }
    }
});

module.exports = TopBlocked;

},{"./../models/top-blocked.es6.js":42,"./mixins/animate-graph-bars.es6.js":73,"./sliding-subview.es6.js":78}],81:[function(require,module,exports){
'use strict';

var ParentSlidingSubview = require('./sliding-subview.es6.js');
var heroTemplate = require('./../templates/shared/hero.es6.js');
var CompanyListModel = require('./../models/site-company-list.es6.js');
var SiteModel = require('./../models/site.es6.js');
var trackerNetworksIconTemplate = require('./../templates/shared/tracker-network-icon.es6.js');
var trackerNetworksTextTemplate = require('./../templates/shared/tracker-networks-text.es6.js');

function TrackerNetworks(ops) {
    var _this = this;

    // model data is async
    this.model = null;
    this.currentModelName = null;
    this.currentSiteModelName = null;
    this.template = ops.template;
    ParentSlidingSubview.call(this, ops);

    setTimeout(function () {
        return _this._rerender();
    }, 750);
    this.renderAsyncContent();
}

TrackerNetworks.prototype = window.$.extend({}, ParentSlidingSubview.prototype, {

    setup: function setup() {
        this._cacheElems('.js-tracker-networks', ['hero', 'details']);

        // site rating arrives async
        this.bindEvents([[this.store.subscribe, 'change:' + this.currentSiteModelName, this._rerender]]);
    },

    renderAsyncContent: function renderAsyncContent() {
        var _this2 = this;

        var random = Math.round(Math.random() * 100000);
        this.currentModelName = 'siteCompanyList' + random;
        this.currentSiteModelName = 'site' + random;

        this.model = new CompanyListModel({
            modelName: this.currentModelName
        });
        this.model.fetchAsyncData().then(function () {
            _this2.model.site = new SiteModel({
                modelName: _this2.currentSiteModelName
            });
            _this2.model.site.getBackgroundTabData().then(function () {
                var content = _this2.template();
                _this2.$el.append(content);
                _this2.setup();
                _this2.setupClose();
            });
        });
    },

    _renderHeroTemplate: function _renderHeroTemplate() {
        if (this.model.site) {
            var trackerNetworksIconName = trackerNetworksIconTemplate(this.model.site.siteRating, this.model.site.isWhitelisted, this.model.site.totalTrackerNetworksCount);

            var trackerNetworksText = trackerNetworksTextTemplate(this.model.site, false);

            this.$hero.html(heroTemplate({
                status: trackerNetworksIconName,
                title: this.model.site.domain,
                subtitle: trackerNetworksText,
                showClose: true
            }));
        }
    },

    _rerender: function _rerender(e) {
        if (e && e.change) {
            if (e.change.attribute === 'isaMajorTrackingNetwork' || e.change.attribute === 'isWhitelisted' || e.change.attribute === 'totalTrackerNetworksCount' || e.change.attribute === 'siteRating') {
                this._renderHeroTemplate();
                this.unbindEvents();
                this.setup();
                this.setupClose();
            }
        }
    }
});

module.exports = TrackerNetworks;

},{"./../models/site-company-list.es6.js":40,"./../models/site.es6.js":41,"./../templates/shared/hero.es6.js":56,"./../templates/shared/tracker-network-icon.es6.js":62,"./../templates/shared/tracker-networks-text.es6.js":63,"./sliding-subview.es6.js":78}]},{},[46]);

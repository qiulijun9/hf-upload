"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.noop = noop;
exports.getUid = getUid;
exports.getFileExt = getFileExt;
exports.fileToObject = fileToObject;
exports.preproccessFile = exports.deleteId = exports.deleteFile = exports.updateFileLists = void 0;

require("core-js/modules/es6.object.define-property");

require("core-js/modules/es6.object.define-properties");

require("core-js/modules/es7.object.get-own-property-descriptors");

require("core-js/modules/es6.array.for-each");

require("core-js/modules/es6.symbol");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.array.iterator");

require("core-js/modules/es6.object.keys");

require("core-js/modules/es6.array.index-of");

require("core-js/modules/es6.promise");

require("core-js/modules/es6.object.to-string");

require("core-js/modules/es6.typed.data-view");

require("core-js/modules/es6.function.name");

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

require("core-js/modules/es6.regexp.split");

require("core-js/modules/es7.array.includes");

require("core-js/modules/es6.string.includes");

require("core-js/modules/es6.array.filter");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

require("core-js/modules/es6.array.find-index");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function noop() {
  return null;
}

var updateFileLists = function updateFileLists(file, fileLists) {
  var i = fileLists.findIndex(function (_) {
    return _.uid === file.uid;
  });
  i > -1 ? fileLists[i] = _objectSpread({}, file) : fileLists.push(file);
  return fileLists;
};

exports.updateFileLists = updateFileLists;

var deleteFile = function deleteFile(uid, fileLists) {
  return fileLists.filter(function (_) {
    return _.uid !== uid;
  });
};

exports.deleteFile = deleteFile;

var deleteId = function deleteId(uid, ids) {
  return ids.filter(function (_) {
    return _ !== uid;
  });
};

exports.deleteId = deleteId;

function getUid() {
  var count = 0;

  function getkey() {
    return "hf-upload-".concat(new Date().valueOf(), "-").concat(count++);
  }

  return getkey;
}

var uid = getUid();

function getFileExt(fileName) {
  if (!fileName.includes('.')) {
    return '';
  }

  var tempArr = fileName.split('.');
  return tempArr[tempArr.length - 1];
}

function fileToObject(file) {
  var name = file.name,
      size = file.size,
      type = file.type,
      percent = file.percent,
      rest = (0, _objectWithoutProperties2["default"])(file, ["name", "size", "type", "percent"]);
  return _objectSpread({
    uid: uid(),
    name: name,
    file_size: size,
    mime_type: type || 'application/octet-stream',
    // application/octet-stream 为通用的mime_type
    percent: percent || 0,
    originFile: file,
    extension: getFileExt(name).toLowerCase()
  }, rest);
}

var rotation = {
  1: 'rotate(0deg)',
  3: 'rotate(180deg)',
  6: 'rotate(90deg)',
  8: 'rotate(270deg)'
};

var getImgPreview = function getImgPreview(file, callback) {
  var reader = new FileReader();

  reader.onloadend = function () {
    var blobUrl = window.URL.createObjectURL(file);

    if (reader.error) {
      console.error('read file error', reader.error);

      if (callback) {
        callback(blobUrl);
      }

      return;
    }

    var readerResult = reader.result;
    var scanner = new DataView(readerResult);
    var idx = 0;
    var value = 1; // Non-rotated is the default

    var maxBytes = scanner.byteLength; // 不是 JPEG 文件

    if (scanner.getUint16(idx, false) != 0xffd8) {
      maxBytes = 0;
    }

    idx += 2;

    while (idx < maxBytes - 2) {
      var uint16 = scanner.getUint16(idx);
      idx += 2;

      switch (uint16) {
        case 0xffe1:
          {
            // Start of EXIF
            var exifLength = scanner.getUint16(idx);
            maxBytes = exifLength - idx;
            idx += 2;
            break;
          }

        case 0x0112:
          {
            // Orientation tag
            // Read the value, its 6 bytes further out
            // See page 102 at the following URL
            // http://www.kodak.com/global/plugins/acrobat/en/service/digCam/exifStandard2.pdf
            value = scanner.getUint16(idx + 6, false);
            maxBytes = 0; // Stop scanning

            break;
          }

        default:
          break;
      }
    }

    var img = new Image();
    img.src = blobUrl;

    img.onload = function () {
      var width = img.width;
      var height = img.height;
      var aspect = width / height;
      callback(blobUrl, width, height, aspect, value);
    };

    img.onerror = function () {
      callback();
    };
  };

  reader.readAsArrayBuffer(file);
};

var preproccessFile = function preproccessFile(file) {
  return new Promise(function (resolve) {
    var unPreview = typeof document === 'undefined' || typeof window === 'undefined' || !FileReader || !File || !(file.originFile instanceof File) || file.thumbUrl !== undefined || file.mime_type.indexOf('image') === -1;

    function preview(f) {
      f.thumbUrl = '';
      getImgPreview(f.originFile, function (previewDataUrl, width, height, aspect) {
        var value = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
        f.thumbUrl = previewDataUrl;
        f.width = width;
        f.height = height;
        f.aspect = aspect;
        f.transform = rotation[value];
        resolve(f);
      });
    }

    if (unPreview) {
      resolve(file);
    } else {
      preview(file);
    }
  });
};

exports.preproccessFile = preproccessFile;
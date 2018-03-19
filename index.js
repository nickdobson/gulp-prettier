'use strict';
const through = require('through2');
const PluginError = require('plugin-error');
const prettier = require('prettier');
const merge = require('merge');
const applySourceMap = require('vinyl-sourcemaps-apply');

module.exports = function(opt) {
  function transform(file, encoding, callback) {
    if (file.isNull())
      return callback(null, file);
    if (file.isStream())
      return callback(new PluginError(
        'gulp-prettier',
        'Streaming not supported'
      ));

    let data;
    const str = file.contents.toString('utf8');

    const options = merge(
      {
        // Fit code within this line limit
        printWidth: 80,
        // Number of spaces it should use per tab
        tabWidth: 2,
        // Use tabs instead of spaces
        useTabs: false,
        // Remove semicolons
        semi: true,
        // If true, will use single instead of double quotes
        singleQuote: false,
        // Controls the printing of trailing commas wherever possible
        trailingComma: "none",
        // Controls the printing of spaces inside array and objects
        bracketSpacing: true,
        // Put JSX angle brackets on a new line rather than the last line of attributes
        jsxBracketSameLine: false,
      },
      opt
    );

    try {
      data = prettier.format(str, options);
    } catch (err) {
      return callback(new PluginError('gulp-prettier', err));
    }

    if (data && data.v3SourceMap && file.sourceMap) {
      applySourceMap(file, data.v3SourceMap);
      if (file.contents.toString() !== data.js) file.isPrettier = true;
      file.contents = new Buffer(data.js);
    } else {
      if (file.contents.toString() !== data) file.isPrettier = true;
      file.contents = new Buffer(data);
    }

    callback(null, file);
  }

  return through.obj(transform);
};

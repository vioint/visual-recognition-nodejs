'use strict';
// this file is to validate that the test images we supply get proper results with the various class bundles
// it simply creates every permutation of classifiers (only 20 per category since we require a minimum of 3 selected) and then checks every image to ensure it's getting the expected classification

/* eslint no-console: 0, no-shadow: 0, no-param-reassign: 0, padded-blocks: 0 */

var util = require('util');
var fs = require('fs');
var path = require('path');
var async = require('async');
var getCombinations = require('combinations');
var visualRecognition = require('./watson-visual-classifier');

var categories = {
  numbers: [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine'
  ]
};

var testImages = {
  // this maps to public/images/bundles/numbers/test/{index}.jpg
  numbers: [
    'three',
    'nine',
    'two',
    'zero',
    'negatives',
    'one',
    'five',
    'negatives',
    'seven',
    'zero',
    'negatives',
    'three',
    'five',
    'eight'
  ]
};

var basedir = path.join(__dirname, '../public/images/bundles');

var knownSets = fs.readdirSync(path.join(basedir, 'numbers')).filter(function (filename) {
  return fs.statSync(path.join(basedir, 'numbers', filename)).isDirectory() && filename !== 'test';
}).map(function (knownSetDir) {
  return {
    'class': knownSetDir,
    testFiles: fs.readdirSync(path.join(basedir, 'numbers', knownSetDir))
      .filter((filename) => { return path.extname(filename) === '.jpg' || path.extname(filename) === '.png' })
  }
}).reduce((knownSetsFiles, knownSet) => {
  var knownSetFiles = knownSet.testFiles.map(tf => {
    return {
      'class': knownSet.class,
      filename: path.join(basedir, 'numbers', knownSet.class, tf)
    }
  });
  return knownSetsFiles.concat(knownSetFiles);
}, []);

var numbersSingle = {
  category: 'numbers',
  classes: categories.numbers,
  testImages: testImages.numbers,
  tests: [],
  results: {}
};

categories.numbers.forEach(function (catClass) {
  numbersSingle.results[catClass] = {
    tags: {},
    commonTags: []
  };
});

// match the test image files to the expected class
var isUsingTestDir = false;
if (isUsingTestDir) {
  numbersSingle.tests = numbersSingle.testImages.map(function (tag, index) {
    if (tag === null) {
      return tag;
    }
    return {
      'class': tag,
      filename: path.join(basedir, numbersSingle.category, 'test', index + '.jpg')
    };
  }).filter(function (test) {
    return test; // filter out the nulls (we need them up until now to keep the indexes lined up with the filenames)
  });
} else {
  numbersSingle.tests = knownSets;
}

console.log(`Running reframe data collection for ${numbersSingle.tests.length} images over the following categories:
 (${numbersSingle.tests.map(c => c['class']).filter((v, i, a) => a.indexOf(v) === i).join(',')})`);

// set up a queue to handle each permutation with CONCURRENCY parallel workers
var CONCURRENCY = 2;

async.eachLimit(numbersSingle.tests, CONCURRENCY, function (test, next) {

  visualRecognition.classify(function (err, res) {
    if (err) {
      test.error = err.message || err;
      return next(err);
    }

    test.results = res;

    var expected = (test.class && numbersSingle.classes.indexOf(test.class) > -1) ? test.class : false;

    var success;
    if (expected) {
      success = res.images[0].classifiers.length && res.images[0].classifiers[0].classes[0].class === test.class;
    } else {
      success = res.images[0].classifiers.length === 0;
    }

    test.success = success;

    // if (res.images[0].classifiers.length) {
    //   res.images[0].classifiers[0].classes.forEach((tag) => {
    //     if (test.class !== 'negatives') {
    //       if (numbersSingle.results[test.class].tags.hasOwnProperty(tag.class)) {
    //         numbersSingle.results[test.class].tags[tag.class]['totals'] += 1;
    //         numbersSingle.results[test.class].tags[tag.class]['avg'] += tag.score / numbersSingle.results[test.class].tags[tag.class]['totals'];
    //       } else {
    //         numbersSingle.results[test.class].tags[tag.class] = {
    //           totals: 1,
    //           avg: 0
    //         };
    //       }
    //     }
    //   });
    // }

    // console.log('%s (%s: %s) Test image %s should have class %s', success ? '✓' : 'x', numbersSingle.category, numbersSingle.classes, test.filename, test.class);
    if (!success) {
      console.log(res.images[0].classifiers.length ? res.images[0].classifiers[0].classes : '[no classifications returned]');
    }
    test.complete = true;
    next();
  }, test.filename, 0);

}, function (err) {
  if (err) {
    console.error('fatal error, cannot process results', err);
    return;
  } else {
    console.log('Completed.');
  }

  numbersSingle.tests.map((test) => {
    return {
      expected: test.class,
      found: test.results.images[0].classifiers[0].classes,
    }
  }).filter(res => {
    return res.expected !== 'negatives'
  }).forEach((res) => {

    res.found.forEach((fr) => {
      var foundTags = numbersSingle.results[res.expected]['tags'];
      if (!foundTags.hasOwnProperty(fr.class)) {
        foundTags[fr.class] = {
          totals: 1,
          totalScore: fr.score,
          avgScore: 0
        };
      } else {
        foundTags[fr.class].totals += 1;
        foundTags[fr.class].totalScore += fr.score;
      }
    });
    
  });

  // sort, arrange and summarize results
  for (let eClass in numbersSingle.results) {
      let classResult = numbersSingle.results[eClass];
      var totalTestsPerClass = numbersSingle.tests.filter(t => { return t.class === eClass });
      
      Object.keys(classResult.tags).forEach(function(key) {
        var tag = classResult.tags[key];
        
        // calculate average classification score
        tag.avgScore = tag.totalScore / tag.totals;
                
        const minOcc = 2;                                       // minimum global occurences
        const minOccPerSet = totalTestsPerClass.length * .2;    // 20%, minimum occurences per test set
        const minAverageScore = .55;                             // minimum average score

        // excluded class (eg. irrelevant environment description tags, etc.)
        const excludedClassKeywords = 'color';

        if (tag.totals >= minOcc && 
            tag.totals >= minOccPerSet && 
            tag.avgScore >= minAverageScore && 
            key.indexOf(excludedClassKeywords) === -1) {
          
          classResult.commonTags.push({
            name: key,
            avgScore: tag.avgScore
          });
        }
      });
      
  }


  var outfile = './classification-results.json';
  fs.writeFileSync(outfile, JSON.stringify(numbersSingle.results, null, 4));
  console.log('details written to %s', outfile);
  console.log(util.inspect(numbersSingle.results, { colors: true, depth: 5 }));
});
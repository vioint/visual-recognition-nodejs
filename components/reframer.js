var util = require('util');
var path = require('path');
var async = require('async');
var basedir = path.join(__dirname, '../');

const classifier = require('./watson-visual-classifier');
const maps = require('./reframe-map');

const Reset = "\x1b[0m";
const FgGreen = "\x1b[32m";
const FgRed = "\x1b[31m";

// this maps to public/images/bundles/numbers/test/{index}.jpg
var testImages = [
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
];

// translate orginial classification using our own mapping
function remapClassification(classes, mapping) {
    var mappedClasses = [];
    var classNames = classes.map((c) => c.class);
    mappedClasses = mapping.values.filter((tagMap) => {
        // is the classification contained in the source common classifications list and satisfies
        // the match strength (having enough matches within the common tags)
        var matchedClasses = tagMap.commonClasses.filter((st) => classNames.indexOf(st.name) !== -1);
        return matchedClasses.length / classNames.length >= mapping.matchStrength;
    }).map((tagMap) => {
        // return only the names
        return tagMap.destClass;
    });
    return mappedClasses;
}

// wrapper for calling the visual recognizer
function classifyAndReframe(expectedClass, filename, mapping, callback) {
    classifier.classify(function (err, res) {
        if (err) {
            test.error = err.message || err;
            callback(err);
            return;
        }
        var isCorrect = false;
        if (res.images[0].classifiers.length) {
            var mappedClasses = remapClassification(res.images[0].classifiers[0].classes, mapping);
            isCorrect = mappedClasses.indexOf(expectedClass) !== -1;

            var resultMessage = mappedClasses.length ?
                (isCorrect ? FgGreen : FgRed) +
                `'${path.basename(filename)}' is probably a ` + mappedClasses.join(' or a ') :
                `No classification mapping was found for image '${path.basename(filename)}'`;
            resultMessage += `, the expected classification is ${expectedClass}` + Reset;

            console.log(resultMessage);
        } else {
            console.log(`Sorry, no classifications returned for '${path.basename(filename)}' :(`);
        }
        callback(null, filename, isCorrect);

    }, filename, mapping.threshold);
}

function test() {
    var testingPath = path.join(basedir, 'public/images/bundles/numbers/test');
    var classify = function (expectedClass, filename, map, cb) {
        return function (err, callback) {
            classifyAndReframe(expectedClass, filename, map, cb);
        }
    };

    var reframerResults = [];

    async.forEach(testImages.entries(), function (item, next) {
        classifyAndReframe(item[1], path.join(testingPath, item[0] + '.jpg'), maps.numbers, function (err, filename, result) {
            if (err) {
                test.error = err.message || err;
                return next(err);
            }

            reframerResults[reframerResults.length] = result;

            next();
        });
    }, function (err) {
        if (err) {
            console.error(err);
        } else {
            var correctRes = reframerResults.filter(r => r).length;
            console.log(`Total success rate is ${correctRes}/${reframerResults.length} (${(correctRes / reframerResults.length * 100).toPrecision(4)}%)`);
        }
    });

}

test();
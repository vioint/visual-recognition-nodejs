const util = require('util');
const path = require('path');
const classifier = require('./watson-visual-classifier');

const Reset = "\x1b[0m";
const FgGreen = "\x1b[32m";
const FgRed = "\x1b[31m";

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

module.exports = {
    classify: classifyAndReframe
}
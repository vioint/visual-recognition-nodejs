const path = require('path');
const async = require('async');
const reframer = require('./reframer');
const maps = require('./reframe-map');

let basedir = path.join(__dirname, '../');

const Reset = "\x1b[0m";
const FgGreen = "\x1b[32m";
const FgRed = "\x1b[31m";
const FgBright = "\x1b[36m";


// this maps to public/images/bundles/numbers/test/{index}.jpg
let testImages = [
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


function test() {
    var testingPath = path.join(basedir, 'public/images/bundles/numbers/test');
    var results = [];

    async.forEach(testImages.entries(), function (item, next) {
        reframer.classify(item[1], path.join(testingPath, item[0] + '.jpg'), maps.numbers, function (err, filename, result, classes) {
            if (err) {
                test.error = err.message || err;
                return next(err);
            }

            results[results.length] = { isCorrect: result, isExactMatch: classes.length === 1 };

            var isExactMatch = classes.length === 1;
            var classificationMessage = `'${path.basename(filename)}' is probably a ` + classes.join(' or a ');
            var unclassifiedMessage = `No classification mapping was found for image '${path.basename(filename)}'`;
            var resultMessage = (classes.length ? classificationMessage : unclassifiedMessage);
            var expectedResultMessage = `, the expected classification is ${item[1]}`;
            resultMessage += (result ? (isExactMatch ? FgBright : FgGreen) : FgRed) + expectedResultMessage + Reset;
            
            console.log(resultMessage);

            next();
        });
    }, function (err) {
        if (err) {
            console.error(err);
        } else {
            var matches = results.filter(r => r.isCorrect).length;
            var exactMatches = results.filter(r => r.isCorrect && r.isExactMatch).length;
            console.log(`Total matches ${matches}/${results.length} (${(matches / results.length * 100).toPrecision(4)}%)\n` +
                        `Exact matches ${exactMatches}/${results.length} (${(exactMatches / results.length * 100).toPrecision(4)}%)`);
        }
    });

}

test();
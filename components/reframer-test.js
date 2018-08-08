const path = require('path');
const async = require('async');
const reframer = require('./reframer');
const maps = require('./reframe-map');

let basedir = path.join(__dirname, '../');

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
    var reframerResults = [];

    async.forEach(testImages.entries(), function (item, next) {
        reframer.classify(item[1], path.join(testingPath, item[0] + '.jpg'), maps.numbers, function (err, filename, result) {
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
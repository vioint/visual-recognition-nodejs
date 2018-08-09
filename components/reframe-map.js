var util = require('util');
var path = require('path');
var basedir = path.join(__dirname, '../');

let classificationResults = require(path.join(basedir, 'classification-results.json'));

let numbersMapping = {
    values: 
    [
        {
            destClass: "zero",
            commonClasses: [ /* { "name": "fastener", "avgScore": 0.6656249999999999 }, ... */ ]
        },
        {
            destClass: "one",
            commonClasses: []
        },
    ],
    matchStrength: 0.33,
    threshold: 0.8
};

function reloadMapping() {
    numbersMapping.values.length = 0;
    Object.keys(classificationResults).forEach(resultClass => {
        numbersMapping.values.push({
            destClass: resultClass,
            commonClasses: classificationResults[resultClass].commonTags
        });
    });

    // numbersMapping.values.forEach((val) => {
    //     if (classificationResults.hasOwnProperty(val.sourceClass)) {
    //         val.commonClasses = classificationResults[val.sourceClass].commonTags;
    //     }
    // });

    // console.log(util.inspect(reframeMapping.values));

}

reloadMapping();

module.exports = {
    numbers: numbersMapping,
}
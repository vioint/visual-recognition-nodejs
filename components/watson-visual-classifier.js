require('dotenv').config({ silent: true });

const fs = require('fs');
const VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');

// Create the service wrapper
var visualRecognition = new VisualRecognitionV3({
    version: '2018-03-19'
});

var _classify = function(callback, filename, threshold = 0) {
    visualRecognition.classify({
        classifier_ids: ["default"],
        images_file: fs.createReadStream(filename)
      }, function (err, res) {
        if (err) {
          console.log(err.message || err);
        }
        callback(err, res);
    });
};

module.exports = {
    classify: _classify
};
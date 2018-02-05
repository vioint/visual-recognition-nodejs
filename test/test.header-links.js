var system = require('system');
var apiKey = system.env.VISUAL_RECOGNITION_API_KEY;
var baseHost = 'http://localhost:3000';

casper.start();

casper.thenBypassUnless(function() {
  return apiKey && apiKey.length > 0;
}, 4);

casper.thenOpen('http://localhost:3000', function(result) {
  casper.test.assert(result.status === 200, 'Front page opens');
  casper.test.assertSelectorHasText('a.wordmark', 'IBMWatson Developer Cloud');
  testHeaderLinks();
});

function testHeaderLinks() {
  checkLinkDest(baseHost, 'nav.heading-nav li:nth-child(1) a', /https:\/\/www.ibm.com\/watson\/products-services\//);
  checkLinkDest(baseHost, 'nav.heading-nav li:nth-child(2) a', /https:\/\/console.bluemix.net\/docs\/services\/visual-recognition\/getting-started.html/);
}

function checkLinkDest(starturl, selectorToClick, shouldBePattern) {
  casper.thenOpen(starturl, function() { });
  casper.then(function() { this.click(selectorToClick);  });
  casper.then(function() { casper.test.assertUrlMatch(shouldBePattern, 'location should match ' + shouldBePattern); });
}

casper.run(function() {
  this.test.done();
});

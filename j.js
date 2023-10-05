var jenkinsapi = require('jenkins-api');
var jenkins = jenkinsapi.init("https://nikolay.klyuchev:977skgnW$$@jenkins-ci.techgp.net");
var jenkins = jenkinsapi.init("https://nikolay.klyuchev:1163924794e1e84cad1cb5dc32ad31003d@jenkins-ci.techgp.net");

// jenkins.all_builds('build_image', function(err, data) {
//   if (err){ return console.log(err); }
//   console.log(data)

//   jenkins.build_info('build_image', '2423', function(err, data) {
//     if (err){ return console.log(err); }
//     console.log(JSON.stringify(data,undefined,2))
//   });
// });

jenkins.build('migrate', function(err, data) {
  if (err){ return console.log(err); }
  console.log(data)
});

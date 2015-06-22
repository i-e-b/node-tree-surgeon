var tree = require('./tree-surgeon');
var fs = require('fs');

var bigObject = JSON.parse(fs.readFileSync('C:/Temp/big.json'));

var selector = function(x){return x._meta.ID;}

console.log('ready');
process.stdin.resume();
var fs = require('fs');
var response = fs.readSync(process.stdin.fd, 100, 0, "utf8");
process.stdin.pause();


var rel = tree.decompose(bigObject, ["_meta"]);
tree.compose(rel);


console.log('done');
process.stdin.resume();
var fs = require('fs');
var response = fs.readSync(process.stdin.fd, 100, 0, "utf8");
process.stdin.pause();


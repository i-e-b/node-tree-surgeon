var fs      = require('fs');
var metaret = require('metaret');

// Build the production source from the meta-ret *.jsm
/*console.log('compiling');
var src = fs.readFileSync('./tree-surgeon.jsm', {encoding:'utf-8'});
var output = metaret.jsm2js(src);
fs.writeFileSync('./tree-surgeon-EXP.js', output);
*/

// read source and test
var tree = require('./tree-surgeon');

var bigObject = JSON.parse(fs.readFileSync('C:/Temp/big.json'));

var selector = function(x){return x._meta.ID;}

/*console.log('ready');
process.stdin.resume();
var fs = require('fs');
var response = fs.readSync(process.stdin.fd, 100, 0, "utf8");
process.stdin.pause();*/

for (var i = 0; i < 10; i++){
    var rel = tree.decompose(bigObject, ["_meta"]);
    tree.compose(rel);
}

console.time('decomp');
for (var i = 0; i < 10; i++){
    var rel = tree.decompose(bigObject, ["_meta"]);
    tree.compose(rel);
}
console.timeEnd('decomp');

/*console.log('ready');
process.stdin.resume();
var fs = require('fs');
var response = fs.readSync(process.stdin.fd, 100, 0, "utf8");
process.stdin.pause();*/


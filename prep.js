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

if (false){
    rel = tree.decompose(bigObject, ["_meta"]);
    console.log(JSON.stringify(rel,null,2));

    console.log(JSON.stringify(tree.compose(rel),null,2));

    process.exit(0);
}





var rel, outp;
for (var i = 0; i < 10; i++){
    rel = tree.decompose(bigObject, ["_meta"]);
    tree.compose(rel);
}

console.time('decompose');
for (var i = 0; i < 10; i++){
    var rel = tree.decompose(bigObject, ["_meta"]);
    outp = tree.compose(rel);

}
console.timeEnd('decompose');
/*
console.time('compose');
for (var i = 0; i < 10; i++){
    outp = tree.compose(rel);
}
console.timeEnd('compose');
*/

fs.writeFileSync('C:/Temp/outp.json', JSON.stringify(outp));
/*console.log('ready');
process.stdin.resume();
var fs = require('fs');
var response = fs.readSync(process.stdin.fd, 100, 0, "utf8");
process.stdin.pause();*/


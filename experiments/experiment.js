
/*
// Quick experiment with chaining api:
var funs = ['hello', 'world', 'where', 'search', 'find'];
var api = {};
var reflow = function(name){
    console.log(JSON.stringify(arguments));
    return api;
};
funs.forEach(function(f){api[f] = reflow.bind(api,f); global[f] = api[f];}); // can you smell the hack?!

console.log("Just an experiment");
api.hello().world(where('x'));
*/

/*
// Decomposing to list of path->values
var _ = require('lodash');

function decompose(obj) {
    var nodesToDecompose = []; // [ [path, obj] ...]
    var finalOutput = {};
    nodesToDecompose.push(['', obj]);

    var add = function(path, value, kind) {
        if (kind == "_meta") return;

        var leaf = path+'/'+kind;
        if (value._meta.ID) leaf+='['+value._meta.ID+']';
        if (value.Business_ID) leaf+='{'+value.Business_ID+'}';
        if (value._meta.path) leaf += '('+value._meta.path+')';
        nodesToDecompose.push([leaf, value]);
    }

    while(nodesToDecompose.length > 0) {
        var pair = nodesToDecompose.shift();
        var path = pair[0], node = pair[1];
        _.forOwn(node, function(value, key) {
            if (_.isArray(value) && value.length > 0 && _.isPlainObject(value[0])) {
                // is an array of objects, treat as multiple child nodes
                for (var i = 0; i < value.length; i++) { add(path, value[i], key); }
            } else if (_.isPlainObject(value)) {
                // new node to be decomposed. Add to queue, don't add to parent.
                add(path, value, key);
            } else {
                // just some value. Add to general output
                var leaf = path+'/'+key;
                if (!finalOutput[leaf]) finalOutput[leaf] = [];
                finalOutput[leaf].push(value);
            }
        });
    };

    return finalOutput;
};

var ex = decompose(require('./test.json'));
console.log(JSON.stringify(ex,undefined,2));
*/

// picking through purely relational structure...



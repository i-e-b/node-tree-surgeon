var global, exports;

var _ = require('lodash');

(function (provider) {
    provider.test = function() {
        console.log("Skeleton loaded OK");
    }

    /** Takes a plain object and decomposed sub-objects into separate nodes
     *
     * Output structure looks like
     *      {"Nodes" : { "Key" :{ ... }, ... },
     *       "Relations": [ {"Parent":.., "Child":.., "Kind":...}, ... ]
     *      }
     * */
    provider.decompose = function decomposeRecursive(obj) {
        var nodesToDecompose = [obj];
        var nodes = {};
        var relations = [];
        var idx = 0; // used to make unique IDs
        var newId = function(){return "id_" + (idx++);};

        queueWorker(nodesToDecompose, function(){},
            function(node, done) {
                var out = {};
                var id = node.ID || newId();
                _.forOwn(node, function(value, key) {
                    if (_.isArray(value)) {
                        // should be multiple node and multiple relationships
                        throw new Error("Array subtrees not handled yet");
                    } else if (_.isPlainObject(value)) {
                        // new node to be decomposed. Add to queue, don't add to parent.
                        value.ID = value.ID || newId(); // TODO: remove mutation.
                        relations.push({"Parent":id, "Child":value.ID, "Kind":key});
                        nodesToDecompose.push(value);
                    } else {
                        // just some value. Add to general output
                        out[key] = value;
                    }
                });
                nodes[id] = out;
                done(undefined, null); // err, result set
            });

        return {"Nodes":nodes, "Relations":relations};
    }

    function queueWorker (queue, done, doWork) {
        var output = [];

        var trampoline = function (err, result) {
            if (err) {
                return done(err, undefined);
            }

            if (result) {
                output.push(result);
            }

            if (queue.length < 1) {
                return done(undefined, output);
            }

            var work = queue.shift();
            doWork(work, trampoline);
        };
        trampoline(null, null);
    };

})(global || exports || this);

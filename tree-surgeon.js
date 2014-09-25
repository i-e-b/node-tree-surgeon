var global, exports;

var _ = require('lodash');

(function (provides) {
    
    /** decompose -- Takes a plain object and decomposed sub-objects into separate nodes
     *
     * Output structure looks like
     *      {"Root": id,
     *       "Nodes" : { "Key" :{ ... }, ... },
     *       "Relations": [ {"Parent":.., "Child":.., "Kind":...}, ... ]
     *      }
     * */
    provides.decompose = function(obj) {
        var nodesToDecompose = [];
        var nodes = {};
        var relations = [];
        var idx = 0; // used to make unique IDs
        var newId = function(){return "id_" + (idx++);};

        var rootId = /*obj.ID || */newId();
        nodesToDecompose.push([rootId, obj]);

        queueWorkerSync(nodesToDecompose,
            function(pair) {
                var id = pair[0];
                var node = pair[1];
                var out = {};
                _.forOwn(node, function(value, key) {
                    if (_.isArray(value)) {
                        if (value.length > 0 && _.isPlainObject(value[0])) {
                            // is an array of objects, treat as multiple child nodes
                            for (var i = 0; i < value.length; i++) {
                                var aId = /*value[i].ID ||*/ newId();
                                relations.push({"Parent":id, "Child":aId, "Kind":key});
                                nodesToDecompose.push([aId, value[i]]);
                            }
                            return; // else fall through to value copying
                        }
                    } 
                    
                    if (_.isPlainObject(value)) {
                        // new node to be decomposed. Add to queue, don't add to parent.
                        var oId = /*value.ID ||*/ newId();
                        relations.push({"Parent":id, "Child":oId, "Kind":key});
                        nodesToDecompose.push([oId, value]);
                    } else {
                        // just some value. Add to general output
                        out[key] = value;
                    }
                });
                nodes[id] = out;
            });

        return {"Root":rootId, "Nodes":nodes, "Relations":relations};
    }

    /** compose -- Takes a decomposed structure and returns a plain object
     *
     * Input structure looks like
     *      {"Root": id,
     *       "Nodes" : { "Key" :{ ... }, ... },
     *       "Relations": [ {"Parent":.., "Child":.., "Kind":...}, ... ]
     *      }
     * */
    provides.compose = function(obj) {
        var parentToChild = _.groupBy(obj.Relations, "Parent");

        var join = function (old, additional) {
            if (old) {
                return (Array.isArray(old)) ? (old.concat([additional])) : ([old, additional]);
            } else {
                return additional;
            }
        };

        var build = function buildRecursive(currentNode) {
            var output = _.clone(obj.Nodes[currentNode]);
            var childNodes = parentToChild[currentNode];
            if (childNodes) {
                for (var i = 0; i < childNodes.length; i++) {
                    var childNode = childNodes[i];
                    output[childNode.Kind] = join(output[childNode.Kind],
                            buildRecursive(childNode.Child));
                }
            }
            return output;
        };

        return build(obj.Root);
    };

    /** prune -- remove relationships by kind */
    provides.prune = function(kind, relational) {
        _.remove(relational.Relations, function(rel) {
            return rel.Kind == kind;
        });
        return relational;
    };

    /** pruneAfter -- remove children by matching parent relationship kind */
    provides.pruneAfter = function(kind, relational) {
        // remove children of child IDs
        var parents = _.pluck(_.where(relational.Relations, {Kind:kind}), "Child");
        removeChildrenByParentsIds(relational, parents);
        return relational;
    };

    /** pruneAllBut -- remove nodes where kind is not in the given list */
    provides.pruneAllBut = function(kinds, relational) {
        _.remove(relational.Relations, function(rel) {
            return ! _.some(kinds, function(k) {return k == rel.Kind;});
        });
        return relational;
    };

    /** chop -- remove nodes and their children if they match a filter
     * @param filterFunc -- if this returns a truthy value, node will be removed, else node will be kept
     */
    provides.chop = function(filterFunc, relational) {
        var toRemove = [];
        _.forEach(relational.Nodes, function(node, id) {
            if (filterFunc(node)) toRemove.push(id);
        });
        removeNodesByIds(relational, toRemove);
        return relational;
    };

    /** chopAfter -- remove child nodes where a parent matches a predicate
     * @param filterFunc -- if this returns a truthy value, node will be removed, else node will be kept
     */
    provides.chopAfter = function(filterFunc, relational) {
        var toRemove = [];
        _.forEach(relational.Nodes, function(node, id) {
            if (filterFunc(node)) toRemove.push(id);
        });
        removeChildrenByParentsIds(relational, toRemove);
        return relational;
    };

    function removeNodesByIds(relational, Ids) {
        _.forEach(Ids, function(id){
            delete relational.Nodes[id];
            _.remove(relational.Relations, function(v) {
                return v.Child == id;
            });
        });
    }

    function removeChildrenByParentsIds(relational, parentIds) {
        _.forEach(parentIds, function(p){
            _.remove(relational.Relations, function(v) {
                if (v.Parent == p) {
                    delete relational.Nodes[v.Child];
                    return true;
                }
            });
        });
    }


    function queueWorkerSync (queue, doWork) {
        var output = [];

        while(queue.length > 0) {
            var work = queue.shift();
            doWork(work);
        };
    };

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
            process.nextTick(doWork.bind(this, work, trampoline));
        };
        trampoline(null, null);
    };


})(global || exports || this);

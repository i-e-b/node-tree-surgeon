"use strict"
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

        var rootId = newId();
        nodesToDecompose.push([rootId, obj]);

        var add = function(id, value, kind) {
            var aId = newId();                        
            relations.push({"Parent":id, "Child":aId, "Kind":kind});
            nodesToDecompose.push([aId, value]);
        }

        queueWorkerSync(nodesToDecompose, function(pair) {
            var id = pair[0], node = pair[1];
            nodes[id] = {};
            _.forOwn(node, function(value, key) {
                if (_.isArray(value) && value.length > 0 && _.isPlainObject(value[0])) {
                    // is an array of objects, treat as multiple child nodes
                    for (var i = 0; i < value.length; i++) { add(id, value[i], key); }
                } else if (_.isPlainObject(value)) {
                    // new node to be decomposed. Add to queue, don't add to parent.
                    add(id, value, key);
                } else {
                    // just some value. Add to general output
                    nodes[id][key] = value;
                }
            });
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

        var build = function buildRecursive(currentNode) {
            if (! obj.Nodes[currentNode]) return undefined;

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

        return build(obj.Root) || {};
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

    /** merge up by kind -- remove child nodes by relationship putting data into parent */
    provides.mergeUpByKind = function(kind, relational) {
        var more = true;
        while (more) {
            more = false;
            _.forEach(relational.Relations, function(rel, idx){
                if (rel.Kind != kind) return true; // continue (optimisation: remove from things we will scan over?)
                more = true; // otherwise merge this one and try again

                var parentId = rel.Parent;
                var selfId = rel.Child;

                // merge
                _.merge(relational.Nodes[parentId], relational.Nodes[selfId], join);

                // remap
                _.remove(relational.Relations, function(chrel) {
                    if (chrel.Parent == selfId) chrel.Parent = parentId; // remap this->C to P->C
                    return chrel.Child == selfId; // delete P->this
                });
                return false; // break, maybe restart loop
            });
        }
        return relational;
    };

    /** merge up by predicate on nodes -- remove nodes that match a predicate */
    provides.mergeUpByNode = function(predFunc, relational) {
        var ids = [];
        _.forEach(relational.Nodes, function(node, idx) {
            if (idx == relational.Root) return;
            if (predFunc(node)) ids.push(idx);
        });

        _.forEach(ids, function(nodeId) { // for each node to merge
            var parentId = null, childRels = [];
            _.forEach(relational.Relations, function(rel, idx) { // find rels where id is parent or child
                if ( ! rel) return;
                if (rel.Child == nodeId) {
                    parentId = rel.Parent;
                    delete relational.Relations[idx];
                } else if (rel.Parent == nodeId) {childRels.push(idx);}
            });
            _.merge(relational.Nodes[parentId], relational.Nodes[nodeId], join); // merge node up
            _.forEach(childRels, function(idx) { // connect children to parent
                relational.Relations[idx].Parent = parentId;
            });
        });
        // delete removed nodes
        _.forEach(ids, function(id) { delete relational.Nodes[id];});

        // filter undefined nodes
        _.remove(relational.Relations, function(r){return _.isUndefined(r);});

        return relational;
    };
    
    function join (old, additional) {
        if (_.isUndefined(additional)) return old;
        if (old) {
            return (_.isArray(old)) ? (old.concat(additional)) : ([old].concat(additional));
        } else {
            return additional;
        }
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

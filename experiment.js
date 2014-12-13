
// Idea: we store the relational structure as a giant set of paths through to property names:
//
// Actually, I want each node to be a collection of meta-data, and property name to be just part of that.
// so the path "a"."b"."c" might have additional data, like schema ids "x"."y"."z", cardinality restrictions
// (0:1).(1:1).(0..) and so on.
// I would want to be able to query a path based on suppyling or retrieving any of that data.
// I guess each node would have some unique id, then all the meta data, like:
//    {ID=x, name="a", card={m=1, mx=2}, schID=z}
// then I can have a set of functions on nodes, like
//    getName=n->(n.name), card=min,max,n->(n.card.m=min && n.card.mx=max)
// then I can chain the lot together like this:
//    root.where(Card(1,1)).getName();
//
// Also, some combinators would be useful...
//   root.search(nameIs('target')).findPath('a.b.c');
//   src.ifThenElse(where(Card(0,1)), doFound.., doNotFound..)
// Might have a use for 'tap' -- do some side effect then carry on:
//   src.where(nameIs('targ')).do(storeSchema).where(nameIs('child')); // would store schema of targ, then continue with query
//
// Probably a good idea to have predicates and queries as different sets.


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

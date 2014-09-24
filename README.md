node-tree-surgeon
=================

Tools for editing tree structures using a relational model

### General purpose:

Trees are represented internally with two sets: (relational structure)

* Relations: `[{"Parent":id, "Child":id, "Kind":any, ...}, ...]`
* Nodes: `[{"ID":id, ... }, ...]`

NOTE: the `"ID"` field is selected by this logic
* Already in data, field name in config
* Generated automatically, field name in config
* config field name defaults to "ID"
 
Functions given to split a POJO into this structure, and merge the structure into a POJO.

### Operations on the relational structure:

* Prune -- remove subtrees by relationship kind
* Chop -- remove subtrees by data predicate
* MergeUp -- remove a relationship and one node by merging data from child to parent. Subtree remains
* MergeDown -- remove a relationship and one node by merging data from parent to child. Subtree remains
* Fuse -- remove a node by merging into it's parent and child (by supplied function)
* Render -- pass each node through a function and compose tree from the results (also, could 'render' relations to get key names and filter?)

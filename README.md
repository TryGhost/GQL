# GQL

GQL stands for 'Ghost Query Language'

The aim is to provide a simple gmail or github filter-like syntax for specifying conditions, whilst being flexible and powerful enough to support the majority of 'where' expressions available in SQL. 

GQL itself is parsed and expanded out into a JSON object which can be used to build queries in SQL (and probably No SQL). 

### Example: 

The GQL expression `featured:true+tags.count:>10`

Would be converted to the following JSON object:

```
{statements: [
    {prop: "featured", op: "=", value: true},
    {prop: "tags.count", op: ">", value: 10, func: "and"}
]}
```

And via Knex, would be further converted to the following SQL:

`where "featured" = true and "tags"."count" > 10`

Inside of Ghost, this syntax is accepted via the `filter` parameter when browsing resources in our JSON API.

## What's in the box?

This repository comes in three parts:
- the language parsing functionality, providing `gql.parse()` 
- a set of lodash-like tools for processing the JSON objects returned 
- some currently Ghost-specific helpers for converting the JSON objects into SQL via [knex's query builder](http://knexjs.org/)

The intention is to eventually move all of the Ghost-specific code and replace it with generic query-building code for Knex and perhaps also a bookshelf plugin. It should also be possible to provide other interfaces, e.g. a direct conversion to SQL or NoSQL query formats.

## Usage

Knex:
```
var filters = gql.parse('featured:true+tags.count:>10');
gql.knexify(knex('myTable'), filters);
```

Bookshelf:
```
var filters = gql.parse('featured:true+tags.count:>10');
myBookshelfModel.forge().query(function (qb) {
  gql.knexify(qb, filters);
});
```

To get raw SQL via Knex:
```
var filters = gql.parse('featured:true+tags.count:>10');
var myTable = knex('myTable');
gql.knexify(myTable, filters);
return myTable.toQuery();
```

### Statement processing

GQL also supported grouped statements, e.g. `author:joe+(tag:photo,image:-null)`

Which result in nested statements like this:

```
{statements: [
 {op: "!=", value: "joe", prop: "author"},
 {group: [
    {op: "=", value: "photo", prop: "tag"},
    {op: "IS NOT", value: null, prop: "image", func: "or"}
  ], func: "and"}
]}
```

And which should result in the following SQL: 

`where "author"."slug" != "joe" and ("posts"."featured" = true or "posts"."image" is not null);`

As the JSON returned by GQL is not always a simple set of objects, performing an operation on every statement requires a recursive loop. GQL provides tools for this:

* eachStatement
* findStatement
* matchStatement
* mergeStatements
* rejectStatements
* printStatements

There are currently two ways that you 'could' use these functions externally (e.g. in Ghost) and in the vein of naming things is hard, I can't decide which I prefer.

You could do:

```
var _ = require('lodash');
_.mixin(require('ghost-gql').json);

_.eachStatement(statements...);
```

Or you could do

```
var gql = require('ghost-gql');
gql.json.eachStatement(statements...);
```

For now you'll need to use the [inline docs](https://github.com/TryGhost/GQL/blob/master/lib/lodash-stmt.js#L10) which explain how to use each function.


## Syntax

The full spec can be found in <https://github.com/TryGhost/Ghost/issues/5604> - I will move this eventually.

## How and why

GQL exists because we needed a very simple filter syntax that could be passed as a string in either a method call, a URL, or a handlebars helper attribute. The concept was originally proposed in https://github.com/TryGhost/Ghost/issues/5463#user-content-advancedfiltering and then later spec'd more fully in https://github.com/TryGhost/Ghost/issues/5604. The syntax created works well no matter whether the API is being called internally or externally.

The two-step conversion process from GQL -> JSON -> SQL exists for flexibility. This library can and will handle the whole process, but with the JSON step in the middle and the lodash style tools for processing the JSON, it is possible to perform various operations on the JSON, for example, filtering out unsafe conditions.

Also it's possible to implement conversion from the JSON format to SQL either via knex or without it, as well as to no-SQL JSON-like query formats. 

The conversion from GQL -> JSON is performed via a [JISON](http://zaach.github.io/jison/) parser. [JISON](http://zaach.github.io/jison/) is an amazing tool that allows you to easily specify the rules for a language in a JavaScript like syntax, and it creates the parser for you.

In the `/src/` folder is a .l and a .y file used by JISON to generate the parser. `gql.l` is the lexer or tokenizer that defines all of the symbols that GQL can understand. `gql.y` is the grammar, it defines the rules about in what order the symbols must appear. If you make changes to `gql.l` or `gql.y`, you'll need to run `grunt build` in order to generate a new version of the parser in `/dist/`.

# Copyright & License

Copyright (c) 2015-2017 Ghost Foundation - Released under the [MIT license](LICENSE).

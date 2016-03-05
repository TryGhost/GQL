# GQL

GQL stands for 'Ghost Query Language'

The aim is to provide a simple gmail or github filter-like syntax for specifying conditions, whilst being flexible and powerful enough to support the majority of 'where' expressions available in SQL.

GQL itself is parsed and expanded out into a JSON object which can be used to build queries in SQL (and probably No SQL).

## Beginner

### Basic Matching

This GQL expression: `name:John`
when executed against the `users` collection
would be converted to the following filter object:

```
{
    name: 'John'
}
```

And via Knex, would be further converted to the following SQL:

`WHERE name = "John"`

### Comparison Operators

string | filter | meaning
------ | ------ | -------
`>` | `$gt` | greater than
`>=` | `$gte` | means greater than or equal to
`<` | `$lt` | means less than
`<=` | `$lte` | means less than or equal to

This GQL expression: `published_at:>2016-03-04`
when executed against the `posts` collection
would be converted to the following filter object:

```
{
    published_at: {
        $gt: '2016-03-04'
    }
}
```

And via Knex, would be further converted to the following SQL:

`WHERE published_at > '2016-03-04'`

*TODO: more examples*

### Boolean operators

string | filter | meaning
------ | ------ | -------
`+` | &lt;implied&gt; | means AND
`,` | `$or` | means OR
`-` | `$not` | means NOT
`<attribute>` | `$not: { <attribute> : null }` | implies NOT NULL
`<attribute>:` | `<attribute> : null` | implies NULL

By default, filter expressions are ANDs. So there is no filter element to
represent AND.

OR and NOT clauses are modeled by wrapping filter elements in an `$or` or `$not`
element accordingly.

When multiple conditions exist for a single attribute, or when multiple
filter conditions are grouped using parentheses, those conditions are
represented as an array.

This GQL expression: `image:,image`
when executed against the `posts` collection
would be converted to the following filter:

```
{
    $or: {
        image: null,
        $not: {
            image: null
        }
    }
}
```

This GQL expression: `-published_at:>2016-01-01`
when executed against the `posts` collection
would be converted to the following filter:

```
{
    $not: {
        published_at: {
            $gt: '2016-01-01'
        }
    }
}
```

### Operator precedence

This GQL expression: `(published_at:>=2015-01-01+published_at:<2015-04-01),(published_at:>=2015-07-01+published_at:<2015-10-01)`
when executed against the `posts` collection
would be converted to the following filter:

```
{
    $or: [
        {
            published_at: [
                { $gte: '2015-01-01' },
                { $lt: '2015-04-01' }            
            ]
        },
        {
            published_at: [
                { $gte: '2015-01-01' },
                { $lt: '2015-04-01' }            
            ]
        }
    ]
}
```

... which in simple terms means anything published in the first or third quarter
of 2015.

In this example we see the use of array representation to indicate operator
precedence.

### The IN operator

- `[<value>,<value>,...]` corresponds to the IN operator, enabling a query for
records where a single column matches any of the given values.

TODO: examples

## Intermediate

### Matching Across Relations

This GQL expression: `posts.name:Hello World!`
when executed against the `tags` collection
would be converted to the following filter object:

```
{
    posts: {
        name: 'Hello World!'
    }
}
```

### Matching Across Relations with aliases

A couple of relations have [aliases](https://github.com/TryGhost/Ghost/blob/master/core/server/models/post.js#L269)
These aliases are basically shorthand for navigating attributes through join.
`author` ([here](https://github.com/TryGhost/Ghost/blob/master/core/server/models/plugins/filter.js#L118)
and [here](https://github.com/TryGhost/Ghost/blob/master/core/server/models/post.js#L270))
and `tags` ([here](https://github.com/TryGhost/Ghost/blob/master/core/server/models/plugins/filter.js#L94)
and [here](https://github.com/TryGhost/Ghost/blob/master/core/server/models/post.js#L286))
and `posts` ([here](https://github.com/TryGhost/Ghost/blob/master/core/server/models/user.js#L153)
and [here](https://github.com/TryGhost/Ghost/blob/master/core/server/models/tag.js#L46))
are the three most prevalent.

This GQL expression: `tags:food`
when executed against the `posts` collection
would be converted to the following filter object:

```
{
    tags: 'food'
}
```

This query would join posts to tags through posts_tags where tags.slug is 'food'.
The fact that it will query based on slug is abstracted.

This JSON alternate representation would be equivalent:

This GQL expression: `tags.slug:food`
when executed against the `posts` collection
would be converted to the following filter object:

```
{
    tags: {
        slug: 'food'
    }
}
```

## Advanced

### Aggregate Queries

The syntax for [aggregate functions](https://en.wikipedia.org/wiki/Aggregate_function)
is slightly different than basic matching. And aggregate queries are modeled
slightly differently than basic matches.

The basic matching portions that are covered above are referred to as the `filter`.

You'll see the filter in this example. The structure of the filter is exactly the
same as for basic matching. We just add to it the "having" element to encapsulate
the aggregate.

This GQL expression: `image+posts.$count:>1+posts.published_at:<2016-01-01+posts.published_at:>=2015-01-01`
when executed against the `users` collection
would be converted to the following JSON object:

```
{
    filter: {
        image: 1,
        posts: {
            published_at: {
                $lt: '2016-01-01',
                $gte: '2015-01-01'
            }
        }
    },
    having: {
        'posts.$count': {
            $gt: 1
        }
    }
}
```

Aggregate queries are handled separately from the filter because the SQL required
to extract them is a higher level operation. For example:

The SQL generated for the query above looks like this:

```
SELECT users.*, COUNT(DISTINCT posts.id) AS posts_count
    FROM users
    JOIN posts ON posts.author_id = users.id
    WHERE users.image NOT NULL
    AND posts.published_at >= '2016-01-01'
    AND posts.published_at < '2017-01-01'
    GROUP BY users.id
    HAVING posts_count > 1;
```

In plain English this means "all users that have an image AND who published at least 1 post in the year 2015".

# I HAVEN'T EDITED ANYTHING BELOW HERE
# IF EVERYONE'S COOL WITH THE FILTERS AND AGGREGATES I'LL UPDATE THE REST OF THE DOCS BELOW

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

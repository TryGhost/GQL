# GQL

GQL stands for 'Ghost Query Language'

The aim is to provide a simple gmail or github filter-like syntax for specifying conditions, while being flexible and powerful enough to support the majority of 'where' expressions available in SQL.

GQL itself is parsed and expanded out into a JSON object known as a 'filter' which can be used to build queries in SQL (and probably No SQL).

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
`>=` | `$gte` | greater than or equal to
`<` | `$lt` | less than
`<=` | `$lte` | less than or equal to

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

GQL | filter | SQL
------ | ------ | -------
`+` | &lt;implied&gt; | AND
`,` | `$or` | OR
`-` | `$not` | NOT
`<attribute>` | `<attribute> : { $ne: null }` | NOT NULL
`<attribute>:` | `<attribute> : null` | NULL

By default, filter expressions are ANDs. So there is no filter element to
represent AND.

OR and NOT clauses are modeled by wrapping filter elements in an `$or` or `$not`
element accordingly.

When multiple conditions exist for a single attribute, or when multiple
filter conditions are grouped using parentheses, those conditions are
represented as an array.

This GQL expression: `image:,image`
when executed against the `posts` collection
is converted to the following filter:

```
{
    $or: {
        image: [null, { $ne: null }]
    }
}
```

This GQL expression: `-published_at:>2016-01-01`
when executed against the `posts` collection
is converted to the following filter:

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
is converted to the following filter:

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
is converted to the following filter object:

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
is converted to the following filter object:

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
is converted to the following filter object:

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
is converted to the following JSON object:

```
{
    filter: {
        image: { $ne: null },
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

## Usage

Parse GQL into filters:
```
var filters = gql.parse('featured:true+tags.$count:>10');

/*
returns this object
{
    filter: {
        'featured': 1,
        'tags.$count': {
            '$gt': 10
        }
    }
}
*/
```

Notice that `featured:true` is not the same as `featured`. `featured:true` becomes `WHERE featured = 1` while `featured` becomes `WHERE featured NOT NULL`. `featured` is a boolean field in this example and we want to check that it's set to true. So we use `featured:true`.

Query through GQL directly:
```
var filters = gql.parse('featured:true+tags.$count:>10');
var results = gql.findAll('posts').filter(filters).fetch();

// This can also be done in the following way:
var results = gql.findAll('posts').filter('featured:true+tags.$count:>10').fetch();
```

Query through bookshelf model:
```
var filters = gql.parse('featured:true+tags.$count:>10');
var results = Post.filter(filters).fetch(); // Post is the bookshelf model

// which is equivalent to this
var results = Post.filter('featured:true+tags.$count:>10').fetch();
```

To get the raw query for the connected datasource:
```
var filters = gql.parse('featured:true+tags.$count:>10');
var sql = Post.filter(filters).toQuery(); // Post is the bookshelf model

// which is equivalent to this
var results = Post.filter('featured:true+tags.$count:>10').toQuery();
```

## Syntax

The full spec can be found in <https://github.com/TryGhost/Ghost/issues/5604> - I will move this eventually.

## How and why

GQL exists because we needed a very simple filter syntax that could be passed as a string in either a method call, a URL, or a handlebars helper attribute. The concept was originally proposed in https://github.com/TryGhost/Ghost/issues/5463#user-content-advancedfiltering and then later spec'd more fully in https://github.com/TryGhost/Ghost/issues/5604. The syntax created works well no matter whether the API is being called internally or externally.

The two-step conversion process from GQL -> JSON -> SQL exists for flexibility. This library can and will handle the whole process, but with the JSON step in the middle and the lodash style tools for processing the JSON, it is possible to perform various operations on the JSON, for example, filtering out unsafe conditions.

Also it's possible to implement conversion from the JSON format to SQL either via knex or without it, as well as to no-SQL JSON-like query formats.

The conversion from GQL -> JSON is performed via a [JISON](http://zaach.github.io/jison/) parser. [JISON](http://zaach.github.io/jison/) is an amazing tool that allows you to easily specify the rules for a language in a JavaScript like syntax, and it creates the parser for you.

In the `/src/` folder is a .l and a .y file used by JISON to generate the parser. `gql.l` is the lexer or tokenizer that defines all of the symbols that GQL can understand. `gql.y` is the grammar, it defines the rules about in what order the symbols must appear. If you make changes to `gql.l` or `gql.y`, you'll need to run `grunt build` in order to generate a new version of the parser in `/dist/`.

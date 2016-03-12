# GQL

[![Build Status](https://travis-ci.org/laran/GQL.svg?branch=master)](https://travis-ci.org/laran/GQL)
[![Test Coverage](https://codeclimate.com/github/laran/GQL/badges/coverage.svg)](https://codeclimate.com/github/laran/GQL/coverage)

**Note: Everything here is in major flux. GQL s not yet ready for public consumption.**

GQL stands for 'Ghost Query Language'

The aim is to provide a simple gmail or github filter-like syntax for 
specifying conditions, while being flexible and powerful enough to 
support the majority of 'where' expressions available in SQL.

GQL itself is parsed and expanded out into a JSON object known as a 
'filter' which can be used to build queries in SQL (and probably No SQL).

## Beginner

### Basic Matching

`name:John` would become the following filter:

```
{name: 'John'}
```

... and the following SQL:

`WHERE name = "John"`

### Comparison Operators

string | filter | meaning
------ | ------ | -------
`:` | `$eq` | equals
`!` | `$ne` | does not equal
`~` | `$like` | like 
`>` | `$gt` | is greater than
`>=` | `$gte` | is greater than or equal to
`<` | `$lt` | is less than
`<=` | `$lte` | is less than or equal to

`published_at>2016-03-04`
would be converted to the following filter:

```
{published_at: {$gt: '2016-03-04'}}
```

And via Knex, would be further converted to the following SQL:

`WHERE published_at > '2016-03-04'`

*TODO: more examples*

### Boolean operators

GQL | filter | SQL
------ | ------ | -------
`+` | &lt;implied&gt; | AND
`,` | `$or` | OR
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
{$or: [{image: null}, {image: {$ne: null}}]}
```

This GQL expression: `-published_at>2016-01-01`
when executed against the `posts` collection
is converted to the following filter:

```
{$not: {published_at: {$gt: '2016-01-01'}}}
```

#### Negation

GQL | filter | SQL
----|--------|----
`-` | `$not` | NOT

Negation is used in conjunction with boolean `+` and `,` operators.

For example:

`featured:true` and `-featured:true` are the inverse queries of one another

When used among multiple conditions the `-` operator is used like this:

`featured:true+-published_at>=2016-01-01`

That query means `featured and published before Jan 1, 2016`

Having the `-` before the name of the attribute and not between the attribute
and the attribute value allows support for attribute values that are negative
numbers. And it also allows us to negate groupings.

### Operator precedence

This GQL expression: `(published_at>=2015-01-01+published_at<2015-04-01),(published_at>=2015-07-01+published_at<2015-10-01)`
when executed against the `posts` collection
is converted to the following filter:

```
{
    $or: [
        {
            published_at: [
                {$gte: '2015-01-01'},
                {$lt:  '2015-04-01'}            
            ]
        },
        {
            published_at: [
                {$gte: '2015-01-01'},
                {$lt:  '2015-04-01'}            
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

### Joins

This GQL expression: `posts.name:Hello World!`
when executed against the `tags` collection
is converted to the following filter object:

```
{posts: {name: 'Hello World!'}}
```

### Joins through

This GQL expression: `tags:food`
when executed against the `posts` collection
is converted to the following filter object:

```
{tags: 'food'}
```

This query would join posts to tags through posts_tags where tags.slug is 'food'.
The fact that it will query based on slug is abstracted.

This JSON alternate representation would be equivalent:

This GQL expression: `tags.slug:food`
when executed against the `posts` collection
is converted to the following filter object:

```
{tags: {slug: 'food'}}
```

## Advanced

### Aggregate Queries

**Note: Aggregate query capabilities are still being developed. So some of this might be wrong.**

The syntax for [aggregate functions](https://en.wikipedia.org/wiki/Aggregate_function)
is slightly different than basic matching. And aggregate queries are modeled
slightly differently than basic matches.

string | meaning
------ | -------
`<relation>.<column>.$count` | counts distinct results based on distinct values of &lt;column&gt;
`<relation>.<column>.$sum` | calculates the sum of &lt;column&gt; values
`<relation>.<column>.$max` | calculates the max value of &lt;column&gt;
`<relation>.<column>.$min` | calculates the min value of &lt;column&gt;

The basic matching portions that are covered above are referred to as the `filter`.

You'll see the filter in this example. The structure of the filter is exactly the
same as for basic matching. We just add to it the "having" element to encapsulate
the aggregate.

This GQL expression: `image+posts.id.$count>1+posts.published_at<2016-01-01+posts.published_at>=2015-01-01`
when executed against the `users` collection
is converted to the following JSON object:

```
{
    filter: {
        image: {$ne: null},
        posts: {
            published_at: {
                $lt: '2016-01-01',
                $gte: '2015-01-01'
            }
        }
    },
    having: {'posts.id.$count': {$gt: 1}}
}
```

Aggregate queries are handled separately from the filter because the SQL required
to extract them is a higher level operation. For example:

The SQL generated for the query above looks like this:

```
SELECT users.*, COUNT(DISTINCT posts.id) AS posts_id_count
    FROM users
    JOIN posts ON posts.author_id = users.id
    WHERE users.image NOT NULL
    AND posts.published_at >= '2016-01-01'
    AND posts.published_at < '2017-01-01'
    GROUP BY users.id
    HAVING posts_id_count > 1;
```

In plain English this means "all users that have an image AND who 
published at least 1 post in the year 2015".

## Usage

Parse GQL into filters:
```
var filters = gql.parse('featured:true+tags.id.$count>10');

// returns this object
// {featured: 1, 'tags.id.$count': {$gt: 10}}
```

Notice that `featured:true` is not the same as `featured`. `featured:true` 
becomes `WHERE featured = 1` while `featured` becomes 
`WHERE featured NOT NULL`. `featured` is a boolean field in this example 
and we want to check that it's set to true. So we use `featured:true`.

### Execute a query:
```
// Featured posts
var posts = gql.findAll('posts')
    .filter('featured:true')
    .fetch();

// Posts tagged 'Hot'
var posts = gql.findAll('posts')
    .joinThrough('id', 'posts_tags', 'post_id', 'tag_id', 'tags', 'id')
    .filter('tags.slug:hot')
    .fetch('posts.*');

// Slugs of top 5 most commented posts
var posts = gql.findAll('posts')
    .join('comments', 'id', 'post_id')
    .filter()
    .orderBy('comments.id.$count','desc')
    .limit(5)
    .fetch('posts.slug');

// Posts tagged with more than 10 tags
var posts = gql.findAll('posts')
    .join('tags', 'id', 'post_id')
    .filter('featured:true+tags.id.$count>10')
    .fetch('posts.*');
```

## Syntax

The original spec for GQL can be found in [Ghost Issue #5604](https://github.com/TryGhost/Ghost/issues/5604).
I have changed the syntax to some degree to make it more concise,
more flexible, to provide more consistent support for aggregate queries,
to more simply clearly null/not-null queries from true/false boolean 
queries, and to better handle negation.

## How and why

GQL exists to provide a simple and effective filter syntax that could be 
passed as a string in either a method call, a URL, or a handlebars helper 
attribute.

The concept was originally proposed in 
[Ghost Issue #5463](https://github.com/TryGhost/Ghost/issues/5463#user-content-advancedfiltering)
and then later spec'd more fully in [Ghost Issue #5604](https://github.com/TryGhost/Ghost/issues/5604).

The two-step conversion process from GQL -> JSON -> SQL exists for 
flexibility. This library can and will handle the whole process.  

The JSON step in the middle makes it possible to perform various 
operations on the JSON, for example, filtering out unsafe conditions.

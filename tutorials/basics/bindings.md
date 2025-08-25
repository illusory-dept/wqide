# Bindings

hello again.

bindings let you give a value a nickname, so you can reuse it instead of re‑typing it.

## the idea

**bind** a value to a name with `:`, and use that name anywhere an expression fits:

```wq
answer:42
salute:"hello"
pair:(1;2)
echo answer
echo(pair+(10;10))
```

## naming rules

* letters, digits, underscores, question marks are okay: `score`, `max_speed`, `a2`, `correct?`
* don’t start with a digit: `2bad` is not a name (because it confuses me).
* don't start with a question mark either.
* names are case‑sensitive: `Total` and `total` are different.
* i reserve some names (*builtins*) like `sum`, which you can't use for your own bindings. enter `help builtins` in the REPL to see all those special names!

## rebinding

rebinding replaces the old value with a new one. notice how i don't mind changing "types":

```wq
x:10
echo x
x:x+1
echo x
x:"oh hi!"
echo x
```

## expressions

i treat **everything** as an *expression*. that means **everything** evaluates to some value!

just like how `1+2` evaluates to 3, `a:1` not only binds `a` to `1`, the expression (`a:1`) itself also evaluates to 1.

```wq
echo(a:1)
```

try hitting that run button!

## chaining bindings

you can also chain bindings because `:` is right‑associative.

```wq
a:b:1  // same as a:(b:1)
echo a
echo b
```

explanation: `b:1` happens first (binding `1` to `b` and evaluating to `1`), then `a:1`.

## tiny practice

no homework today!!

# The wq Prelude

hey. allow me to introduce myself.

i might be immature, maybe a toy to some, but i promise we’ll have fun and get things done.

coming right away: a tiny thing you can enter to say hi to me.

## bff `echo`

```wq
echo "hello!"
```

that’s how we talk, put anything after `echo` with a blank space in between, and i'll show it back to you. neat!

### REPL note

in the REPL (i also call it the "conversation mode") you don’t always need `echo`: just type an expression and i’ll print its result for you. BUT, enter only one expression at a time - i only show the last one’s result.

## here come the numbers

fun warmups! try clicking the "Run" button. btw, `^` is exponent. i’m not like python‑chan, who makes you type "**" for no good reason.

```wq
2*3+4
```

```wq
2*(3+4)
```

```wq
-5+-3
```

```wq
2^3^2
```

i care about *priorities*. `^` comes first, then negation `-` (as in `-5`), then `*` and `/`, then `+` and `-`.

try mixing operations and parens and see what happens!

## lists - think in groups

i call ordered collections **lists**. write them with parentheses and semicolons:

```wq
(1;2;3)
```

semicolon separates elements; parentheses group them.

you can nest lists like this:

```wq
(1;(2;3))
```

```wq
((1;2);(3;4))
```

## arithmetic on lists

so, what if you add two lists?

python-chan simply glues (*concatenates*) them:

```python
[1,2,3] + [4,5,6]  # => [1,2,3,4,5,6]
```

but, i treat lists like numbers that can pair up:

```wq
(1;2;3)+(4;5;6)  // try it!
// quick tip! // means the rest of this line is a comment.
// i ignore comments. useful for taking notes!
```

* want me to glue lists? put a comma `,` between two lists and see what happens!

* what if list lengths don’t match? try it! (spoilers: i call the behavior broadcasting, which we’ll get to later.)

## quick rules to remember

* `echo(x)` prints x no matter what it is.
* `+` performs math; it doesn’t glue lists.

## tiny practices

1. `(2;4;6)*2` - result?
2. `(1;2;3)+(10;10;10)` - result?
3. `((1;2);(3;4))+(10;20)` - result?

answers (peek only **after** you tried!!):

=-=-=-=-=-=-= i'm a divider =-=-=-=-=-=-=

1. `(4;8;12)`
2. `(11;12;13)`
3. `((11;12);(23;24))`

# Microservices Discovery

Tired of having lots and lots of config files? Not in a production environment that actually matters? Then this is the tool for you! POST your config onto the server, apply your helpers, and then let anyone GET the config and log in seemlessly.

```
POST: /login-server
{
    "IP": "${IP_ADDR}",
    "username" : "user",
    "pass": "pass"
}
```
Then...
```
const login = server.login(await (fetch("/login-server").json()));
```
and you're done!

Currently supports
IP_ADDR: Visible IP Address
HOSTNAME: Hostname from lookup
Gimme ideas ppl
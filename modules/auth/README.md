#### Auth Module

  Extends the server native authentication adapter with http basic or ldap auth for users.

#### Constructors

###### native

Native is the default authentication scheme, meaning users are authenticated from the local MongoDB 'account_auths' collection for accessing their endpoints and the API.

Server Config : 
```
"auth" : {
  "strategy" : "native"
}
```

######ldap

[LDAP](http://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol) utilises the [ldapjs client](http://ldapjs.org/client.html), where server, base and search are the various ldapjs client options.

```
"auth": {
  "strategy": "ldap",
  "config": {
      "server": {
          "url": "ldap://ldap.example.org"
      },
      "base": "dc=example,dc=org",
      "search": {
          "filter": "(uid={{username}})",
          "scope": "sub"
      },
      "auto_sync": {
          "mail_field": "mail"
      }
  }
}
```

###### http_basic

HTTP Basic can authenticate user supplied credentials from a 3rd party [HTTP Basic Auth](http://en.wikipedia.org/wiki/Basic_access_authentication) provider.

```
"auth": {
  "strategy": "http_basic",
  "config": {
      "url": "http://auth.example.org/login",
      "auto_sync": {
          "mail_field": "none"
      }
  }
}
```

**note** The `mail_field` option currently expects to extract an attribute (or [JSON Path](http://goessner.net/articles/JsonPath)) from a JSON response.

#### To Install Stats Module

`git clone git@github.com:bipio-server/bipio-contrib.git`

`rsync -rav ./bipio-contrib/modules/stats {/path/to/bipio}/src/modules`

Add the module constructor to `{/path/to/bipio}/config/{env}.json` under the `modules` section.

Restart the server.


For users to successfully authenticate, the user must have a matching username in the local MongoDB accounts collection.  Users may be automatically synced into the accounts collection from the various (non-native) strategies by setting the `mail_field` in the `auto_sync` option.  `mail_field` indicates which response attribute to use as the users synced email address.  Set `"mail_field" : "none"` to automatically create a dummy entry.


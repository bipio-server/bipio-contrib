#### Stats Module

  Adds statistics routes for admin users
 
     /rpc/stats/bips/recent - returns # of bips created in last day
     /rpc/stats/users/recent - returns engagement stats for new users in last day

#### Constructor

 ```
 "stats" : {
   "strategy" : "index"
 }
 ```

#### To Install Stats Module

`git clone git@github.com:bipio-server/bipio-contrib.git`

`rsync -rav ./bipio-contrib/modules/stats {/path/to/bipio}/src/modules`

Add the module constructor to `{/path/to/bipio}/config/{env}.json` under the `modules` section.

Restart the server.

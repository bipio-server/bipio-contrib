#### Stats Module

  Adds statistics routes for admin users
 
    /rpc/stats/bips - returns # of bips
    /rpc/stats/bips/recent - returns # of bips created in last day
    /rpc/stats/bips/running - returns # of distinct bips running and channels created, per day    
    /rpc/stats/bips/all - returns engagement stats for all users (optional fromUnix and toUnix GET parameters will control creation date window)    
    /rpc/stats/users - returns # of users
    /rpc/stats/users/recent - returns engagement stats for new users in last day
    /rpc/stats/users/all - returns engagement stats for all users (optional fromUnix and toUnix GET parameters will control creation date window)
    /rpc/stats/users/returning - returns # of returning users in last day
    /rpc/stats/users/leaderboard - get leaderboard info

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

/**
 *
 * The Bipio API Server contrib module for retrieving stats. Needs admin privileges
 *
 * @author Michael Pearson <michael@bip.io>
 * Copyright (c) 2010-2015 wot.io http://wot.io
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/*
 *
 * To enable, add to server config 'modules' section :
 *
 *   "stats" : {
 *     "strategy" : "index"
 *   }
 *
 * Adds routes :
 *
 *    /rpc/stats/bips/recent - returns # of bips created in last day
 *    /rpc/stats/users/recent - returns engagement stats for new users in last day
 *
 */

var Q = require('q');

function StatModule(options) {
  this.options = options;
}

function toUTC(date) {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
};

function nowUTCSeconds() {
  var d = toUTC(new Date());
  return d.getTime();
}

StatModule.prototype = {
  recentUsers : function(next) {
    var self = this,
      now = nowUTCSeconds() / 1000,
      then = now - (60 * 60 * 24);

    this.dao.findFilter(
      'account',
      {
        created : {
          '$gt' : then
        }
      },
      function(err, results) {
        var defer, promises = [];

        if (err) {
          next(err);
        } else {
          if (results.length) {
            for (var i = 0; i < results.length; i++) {
              defer = Q.defer();
              promises.push(defer.promise);

              (function(account, defer) {
                self.dao.list('bip', undefined, 1, 1, [ 'created', 'asc' ], { owner_id : account.id }, function(err, modelName, results) {
                  var struct = {
                    account : {
                      id : account.id,
                      name : account.name,
                      username : account.username,
                      email_account : account.email_account
                    },
                    now : now,
                    then : then,
                    total : 0,
                    acct_diff_seconds : 0,
                    ttfb : 0 // time to first bip (seconds)
                  };

                  if (err) {
                    defer.reject(err);
                  } else {
                    struct.total = results.total;
                    struct.acct_diff_seconds = now - account.created;

                    if (results.data && results.data.length) {
                      struct.ttfb = Math.floor( (results.data[0].created / 1000) - account.created);
                    }
                    defer.resolve(struct);
                  }
                });
              })(results[i], defer);
            }

            Q.all(promises).then(
              function(structs) {
                var
                  ttfbTotal = 0
                  ttfbDivisor = 0;

                for (var i = 0; i < structs.length; i++) {
                  if (structs[i].ttfb) {
                    ttfbTotal += structs[i].ttfb;
                    ttfbDivisor++;
                  }
                }

                next(
                  false,
                  {
                    since : then,
                    count : structs.length,
                    ttfb_avg : ttfbDivisor ? ttfbTotal / ttfbDivisor : 0,
                    ttfb_pct : structs.length ? ttfbDivisor / structs.length : 0,
                    stat : structs
                  }
                );
              },
              function(err) {
                next(err);
              }
            );
          } else {
            next(err, {});
          }
        }
      }
    );
  },
  bips : function(next) {
    this.dao.findFilter(
      'bip',
      {},
      function(err, results) {
        if (err) {
          next(err);
        } else {
          next(false, results.length);
        }
      }
    );
  },
  // @todo - created timestamp resolution mismatch? ms or seconds?
  recentBips : function(next) {
    var self = this,
      now = nowUTCSeconds(),
      then = now - (60 * 60 * 24 * 1000);

    this.dao.findFilter(
      'bip',
      {
        created : {
          '$gt' : then
        }
      },
      function(err, results) {
        if (err) {
          next(err);
        } else {
          next(false, results.length);
        }
      }
    );
  },
  setDAO : function(dao) {
    this.dao = dao;
  },
  _respond : function(stat, res) {
    return function(err, result) {
      if (err) {
        res.status(500).send(err);
      } else {
        var resp = {};
        resp[stat] = result;
        res.status(200).send(resp);
      }
    }
  },
  _notFound : function(res) {
    res.status(404).end();
  },
  routes : function(app, authWrapper) {
    var self = this;
    app.get('/rpc/stats/:stat/:mode?', authWrapper, function(req, res) {
      if (req.user && req.user.user.is_admin && req.params.stat) {
        switch (req.params.stat) {
          case 'users' :
            if ('recent' === req.params.mode) {
              self.recentUsers(self._respond(req.params.stat, res));
            } else {
              self._notFound(res);
            }
            break;
          case 'bips' :
            if (req.params.mode) {
              if ('recent' === req.params.mode) {
                self.recentBips(self._respond(req.params.stat, res));
              } else {
                self._notFound(res);
              }
            } else {
              self.bips(self._respond(req.params.stat, res));
            }
            break;
          default :
            self._notFound(res);
        }
      } else {
        res.status(403).end();
      }
    });
  }
};

module.exports = StatModule;

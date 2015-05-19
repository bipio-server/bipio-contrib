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
 var Q = require('q'),
 moment = require('moment'),
 _ = require('underscore');

 function StatModule(options) {
  this.options = options;
}

function nowUTCMSeconds() {
  return new Date().getTime();
}

StatModule.prototype = {
  actions : function(next) {
    actionsList = [];
    this.dao.findFilter(
      'channels',
      {},
      function(err, results) {
        if (err) {
         next(err);
       } else {
        next(false, results);
      }
    }
    );
  },
  users : function(next) {
    this.dao.findFilter(
      'account_option',
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
  returningUsers : function(next) {
    var self = this,
    now = Math.floor(nowUTCMSeconds() / 1000),
    then = now - (60 * 60 * 24);

    this.dao.findFilter(
      'account',
      {
        last_session : {
          '$gt' : then
        }
      },
      function(err, results) {
        var defer, promises = [];

        if (err) {
          next(err);
        } else {
          next(
            false,
            {
              count : results.length,
              since : then,
              now : now
            })
        }
      }
      );
  },

  leadUsers : function(next) {
    var self = this,
    leaderboard = [];

    this.dao.aggregate(
      'bip',
      [
      {
        $group : {
          '_id' : "$owner_id",
          'bips' : {
            $push : {
              name : "$name",
              type : "$type",
              paused : "$paused",
              _last_run : "$_last_run",
              _channel_idx : "$_channel_idx"
            }
          },
          'count' : {
            $sum : 1
          }
        }
      }
      ],
      function(err, results) {
        if (err) {
          next(err);
        } else {
          for (var i = 0; i < results.length; i++) {
            (function(aggResults, idx) {
              var channels = _.uniq(_.flatten(_.pluck(aggResults[idx].bips, '_channel_idx')));

              if (channels && channels.length) {
                // get channels
                self.dao.findFilter(
                  'channel',
                  {
                    owner_id : aggResults[idx]._id,
                    id : {
                      $in : channels
                    }
                  },
                  function(err, channelResults) {
                    if (err) {
                      next(err);
                    } else {
                      var manifest = [];
                      _.each(channelResults, function(result) {
                        manifest.push(result.action)
                      });
                      manifest = _.uniq(manifest).sort();

                      aggResults[idx].actions = manifest;

                      // get account
                      self.dao.find('account', { id : aggResults[idx]._id }, function(err, result) {
                        if (err) {
                          next(err);
                        } else {

                          if (result) {
                            aggResults[idx].username = result.username;
                            aggResults[idx].name = result.name;
                            aggResults[idx].email_account = result.email_account;
                          } else {
                            aggResults[idx].username = '__DEFUNCT__';
                          }

                          leaderboard.push(aggResults[idx]);

                          if (idx >= results.length - 1) {
                            next(false, _.sortBy(leaderboard, 'count').reverse() );
                          }
                        }
                      });
                    }
                  }
                  );
              } else {
                // get account
                self.dao.find('account', { id : aggResults[idx]._id }, function(err, result) {
                  if (err) {
                    next(err);
                  } else {

                    if (result) {
                      aggResults[idx].username = result.username;
                      aggResults[idx].name = result.name;
                      aggResults[idx].email_account = result.email_account;
                    } else {
                      aggResults[idx].username = '__DEFUNCT__';
                    }

                    leaderboard.push(aggResults[idx]);

                    if (idx >= results.length - 1) {
                      next(false, _.sortBy(leaderboard, 'count').reverse() );
                    }
                  }
                });
              }
            })(results, i);
          }
        }
      });
    },
    recentUsers : function(next, fromUnix, toUnix) {
      var self = this,
      now = Math.floor(nowUTCMSeconds() / 1000),
      then = now - (60 * 60 * 24),
      filter = {};

      if (undefined === fromUnix && undefined === toUnix) {
        filter.created = {
          '$gt' : then
        };
      } else {
          //
          if (fromUnix  && fromUnix > 0) {
            filter.created = {
              '$gt' : fromUnix
            };
          }

          //
          if (toUnix  && toUnix > 0) {
            if (!filter.created) {
              filter.created = {};
            }

            filter.created['$lt'] = toUnix;
          }
        }

        this.dao.findFilter(
          'account',
          filter,
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
                        total : 0,
                        acct_diff_seconds : 0,
                        created_day : moment(account.created).format('YYYYMMDD'),
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
                      now : now,
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
    recentBips : function(next, fromUnix, toUnix) {
      var self = this,
      now = nowUTCMSeconds(),
      then = now - (60 * 60 * 24 * 1000),
      filter = {},
      dayGroup = false;

      if (undefined === fromUnix && undefined === toUnix) {
        filter.created = {
          '$gt' : then
        };
      } else {
        //
        if (fromUnix  && fromUnix > 0) {
          filter.created = {
            '$gt' : fromUnix
          };
        }

        //
        if (toUnix  && toUnix > 0) {
          if (!filter.created) {
            filter.created = {};
          }

          filter.created['$lt'] = toUnix;
        }
        dayGroup = true;
      }

      this.dao.findFilter(
        'bip',
        filter,
        function(err, results) {
          if (err) {
            next(err);
          } else {
            var dayResults = {}, bipDate;
            if (dayGroup) {
              for (var i = 0; i < results.length; i++) {
                bipDate = moment(results[i].created).format('YYYYMMDD');
                if (!dayResults[bipDate]) {
                  dayResults[bipDate] = 0;
                }
                dayResults[bipDate]++;
              }
              next(false, dayResults);
            } else {
              next(false, results.length);
            }
          }
        }
        );
    },
    createdBips : function(next) {
      var self = this,
        filter = [
          {
            $group : {
              '_id' : "$day",
              'bips_total' : {
                $sum : "$bips_total"
              },
              'share_total' : {
                $sum : "$share_total"
              },
              'channels_total' : {
                $sum : "$channels_total"
              }
            }
          }
        ];

      this.dao.aggregate(
        'stats_account',
        filter,
        function(err, results) {
          next(err, results);
        }
      );
    },
    runningBips : function(next) {
      var self = this;

      self.dao.list('stats_account_network', undefined, 0, 1, [ 'day', 'asc' ], {}, function(err, modelName, results) {

        if (err) {
          next(err);
        } else {
          var stats = {},
            r;

          for (var i = 0; i < results.data.length; i++) {
            r = results.data[i];

            if (!stats[r.day]) {
              stats[r.day] = {
                src : 0,
                edges : 0
              }
            }

            _.each(r.data, function(value, ptr) {
              var src = ptr.split(';').shift(),
                tokens = src.split('#'),
                pod;

              if (0 === src.indexOf('bip') ) {
                stats[r.day].src += value;
              } else {
                pod = self.dao.pod(tokens[0]);
                if ('invoke' !== pod.getAction(tokens[1]).trigger ) {
                  stats[r.day].src += value;
                }
              }

              stats[r.day].edges += value
            });

          }
          next(false, stats);
        }
      });
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
              if (req.params.mode) {
                  // recent signup stats
                  if ('recent' === req.params.mode) {
                    self.recentUsers(self._respond(req.params.stat, res));

                  } else if ('all' === req.params.mode) {
                    self.recentUsers(self._respond(req.params.stat, res), req.query.fromUnix || 0, req.query.toUnix || 0);

                  // returning users stats
                } else if ('returning' === req.params.mode) {
                  self.returningUsers(self._respond(req.params.stat, res));

                } else if ('leaderboard' === req.params.mode) {
                  self.leadUsers(self._respond(req.params.stat, res));

                } else {
                  self._notFound(res);
                }
              } else {
                self.users(self._respond(req.params.stat, res));
              }
              break;

           case 'actions' :
              self.actions(self._respond(req.params.stat, res));
              break;

          case 'bips' :
            if (req.params.mode) {
              if ('recent' === req.params.mode) {
                self.recentBips(self._respond(req.params.stat, res));

              } else if ('all' === req.params.mode) {
                self.recentBips(self._respond(req.params.stat, res), req.query.fromUnix || 0, req.query.toUnix || 0);

              } else if ('created' === req.params.mode) {
                self.createdBips(self._respond(req.params.stat, res));

              } else if ('running' === req.params.mode) {
                self.runningBips(self._respond(req.params.stat, res));

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

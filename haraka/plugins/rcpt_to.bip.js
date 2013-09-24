/**
 *
 * The Bipio API Server
 *
 * @author Michael Pearson <michael@cloudspark.com.au>
 * Copyright (c) 2010-2013 CloudSpark pty ltd http://www.cloudspark.com.au
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
 * A Bipio Commercial OEM License may be obtained via enquiries@cloudspark.com.au
 */
process.HEADLESS = true;
//var bootstrap = require(__dirname + '/../../../src/bootstrap.js'),
var bootstrap = require(process.env.BIPIO_SERVER_ROOT + '/src/bootstrap.js'),
    bastion = bootstrap.app.bastion,
    log = bootstrap.app.logmessage;

function attachment() {
    return function() {
        var bufs = Buffers()
        , doc = {
            _attachments: {}
    }
    , filename
    ;
    return {
        start: function(content_type, name) {
            filename = name;
            doc._attachments[filename] = {
                content_type: content_type.replace(/\n/g, " ")
                };
        },
        data: function(data) {
            bufs.push(data)
        },
        end: function() {
            if(filename) doc._attachments[filename]['data'] = bufs.slice().toString('base64')
        },
        doc: function() {
            return doc
        }
    }
}();
}


exports.hook_data = function (next, connection) {
    var self = this;
    connection.transaction.parse_body = 1;
    connection.transaction._tmp_attached_files = [];

    connection.transaction.attachment_hooks(
        function (contentType, fileName, body, stream) {
            connection.loginfo('pre -------');
            stream.connection = connection;
            var ct = connection.transaction;
            stream.pause();

            // @todo - on error handling here!
            var tmpFile = bootstrap.app.dao.cdn.tmpStream(stream, connection.transaction._bipMeta.id);
            
            ct._tmp_attached_files.push(
                bootstrap.app.dao.cdn.normedMeta('haraka', connection.uuid, {
                    localpath : tmpFile,
                    name : fileName,
                    type : fileName.split('.').pop(),
                    encoding : stream.encoding,
                    content_type : contentType
                })
            );

        }
        );

    next();
};

exports.hook_data_post = function(next, connection) {
    next();
}

exports.register = function() {
    this.register_hook('rcpt', 'rcpt_to_bip');
}

exports.rcpt_to_bip = function(next, connection, params) {
    var plugin = this,
        ct = connection.transaction,
        rcpt_to = params[0],
        client;
 
    if (rcpt_to.address()) {
        client = {
            'id' : ct.uuid,
            'host' : connection.remote_ip,
            'date' : Math.floor(new Date().getTime() / 1000),
            'proto' : 'http',
            'reply_to' : ct.mail_from.user + '@' + ct.mail_from.host,
            'method' : 'smtp',
            'content_type' : ct.ct,
            'encoding' : ct.body_encoding
        };

        ct._clientInfo = client;

        bootstrap.app.dao.domainAuth(
            rcpt_to.host,
            true,
            function(err, accountInfo) {
                if (err) {
                    next(DENY);
                } else {
                    bastion.bipUnpack(
                        'smtp',
                        rcpt_to.user,
                        accountInfo,
                        client,
                        function(status, message, bip) {
                            ct._bipMeta = bip;
                            next(status, message);
                        },
                        {
                            'success' : OK,
                            'fail' : DENY
                        }
                    );
                }
            }
        );
    } else {
        return next();
    }
}
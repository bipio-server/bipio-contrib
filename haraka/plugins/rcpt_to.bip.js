/**
 *
 * Copyright (c) 2017 InterDigital, Inc. All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
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

        bootstrap.app.modules.auth.domainAuth(
            rcpt_to.host,
            function(err, accountInfo) {
                if (err) {
                    next(DENY);
                } else {
                    bastion.bipUnpack(
                        'smtp',
                        rcpt_to.user,
                        accountInfo,
                        client,
                        function(err, bip) {
                            if (err) {
                                next(DENY, err)
                            } else {
                                ct._bipMeta = bip;
                                next(OK, 'OK')
                            }
                        }
                    );
                }
            }
        );
    } else {
        return next();
    }
}

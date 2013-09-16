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
var dao = require(__dirname + '/../../../src/bootstrap.js');
var bastion = dao.app.bastion;

function attachment() {
  return function() {
    var bufs = Buffers()
      , doc = {_attachments: {}}
      , filename
      ;
    return {
      start: function(content_type, name) {
        filename = name;
        doc._attachments[filename] = {content_type: content_type.replace(/\n/g, " ")};
      },
      data: function(data) { bufs.push(data) },
      end: function() { if(filename) doc._attachments[filename]['data'] = bufs.slice().toString('base64') },
      doc: function() { return doc }
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
            /*
            var tmpFile = dao.cdn.tmpStream(stream, connection.transaction._bipMeta.id, contentType, fileName, function(err, path, contentType, fileName, stats) {
                if (!err) {         
                    connection.loginfo('proessed??? ');        
                    ct._tmp_attached_files.push(
                        dao.cdn.normedMeta('haraka', connection.uuid, {
                            size : stats.size,
                            localpath : path,
                            name : fileName,
                            type : fileName.split('.').pop(),
                            encoding : stream.encoding,
                            content_type : contentType
                        })
                    );
                        
                connection.loginfo('--------- normed meta');
                }
            });            */
            
            // @todo - on error handling here!
            var tmpFile = dao.cdn.tmpStream(stream, connection.transaction._bipMeta.id);            
            ct._tmp_attached_files.push(
                dao.cdn.normedMeta('haraka', connection.uuid, {
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
    var plugin = this;
    var rcpt_to = params[0],
        clientInfo;

    if (rcpt_to.address()) {

        clientInfo = {
            remote_ip : connection.remote_ip,
            remote_sender : connection.transaction.mail_from.user
                            + '@'
                            + connection.transaction.mail_from.host
        }
        connection.transaction._clientInfo = clientInfo;

        // connection.loginfo('UNPACKING ---- ');
        bastion.domainBipUnpack(
                        rcpt_to.user,
                        rcpt_to.host,
                        connection.transaction,
                        'smtp',
                        next,
                        {
                            'success' : OK,
                            'fail' : DENY
                        }
                    );
    } else {
        return next();
    }
}
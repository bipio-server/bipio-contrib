var dao = require(process.cwd() + '/src/bootstrap.js');
var Bastion = require(process.cwd() + '/src/managers/bastion');
var bastion = new Bastion(dao, true);

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
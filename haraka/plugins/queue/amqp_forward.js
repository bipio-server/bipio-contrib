// forwards to the public queue
process.HEADLESS = true;
var dao = require(__dirname + '/../../../../src/bootstrap.js');
var bastion = dao.app.bastion;

exports.hook_queue = function (next, connection) {
    var config = this.config.get('amqp.ini');
    var ct = connection.transaction;

    // create standard payload
    var subject = '', parts = ct.body.children, numParts = ct.body.children.length;
    if (undefined != ct.header.headers_decoded.subject) {
        subject = ct.header.headers_decoded.subject[0];
    }

    var exports = {
        'subject' :  subject,
        'body_html' : '',
        'body_text' : ''
    };

    //    connection.loginfo(connection);

    var bodyTxt, bodyHtml;

    // if there are children, then try to unpack them
    if (numParts > 0) {
        var partStruct, p;
        for (var i = 0; i < numParts; i++) {
            p = parts[i];
            if ('' != p.bodytext) {
                if (p.is_html) {
                    exports.body_html = p.bodytext;
                } else {
                    exports.body_text = p.bodytext;
                }
            }
        }
    } else {
        if ('' != ct.bodytext) {
            if (ct.is_html) {
                exports.body_html = ct.bodytext;
            } else {
                exports.body_text = ct.bodytext;
            }
        }
    }

    var channelId,
    transform,
    client = {
        'txid' : ct.id,
        'id' : ct.mail_from.user,
        'host' : ct._clientInfo.remote_ip,
        'date' : ct.header.headers.date[0],
        'proto' : 'smtp',
        'reply_to' : ct._clientInfo.remote_sender
    }

    exports._client = client;
    exports._bip = ct._bipMeta;
    // get attachment data from ct.
    bastion.bipFire(ct._bipMeta, ct.ct, ct.body_encoding, exports, client, contentParts, ct._tmp_attached_files || []);
    next(OK);
};

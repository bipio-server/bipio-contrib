/**
 *
 * The Bipio API Server
 *
 * @author Michael Pearson <github@m.bip.io>
 * Copyright (c) 2010-2013 Michael Pearson https://github.com/mjpearson
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
 * A Bipio Commercial OEM License may be obtained via support@beta.bip.io
 */
/*
 * Forwards an SMTP bip to the queue.
 */

process.HEADLESS = true;
var bootstrap = require(process.env.BIPIO_SERVER_ROOT + '/src/bootstrap.js'),
    bastion = bootstrap.app.bastion,
    log = bootstrap.app.logmessage;

exports.hook_queue = function (next, connection) {
    var ct = connection.transaction,
        body = ct.body,
        client = ct._clientInfo,
        contentType,
        encoding,
        subject = '',
        parts = body ? body.children : null,
        numParts = parts ? parts.length : 0;

    if (undefined != ct.header.headers_decoded.subject) {
        subject = ct.header.headers_decoded.subject[0];
    }

    var exports = {
        'source' : {
            'subject' :  subject,
            'body_html' : '',
            'body_text' : ''
        }
    };

    // if there are children, then try to unpack them
    if (numParts > 0) {
        var partStruct, p, body;
        for (var i = 0; i < numParts; i++) {
            p = parts[i];
            body = p.body;
            if (body) {
                if (body.is_html) {
                    exports.source.body_html = body.body_text_encoded;
                } else {
                    exports.source.body_text = ct.body_text_encoded;
                }
                encoding = body.body_encoding;
                contentType = body.ct;
            }
        }
    } else {
        if (body && '' != body.bodytext) {
            if (body.is_html) {
                exports.source.body_html = body.body_text_encoded;
            } else {
                exports.source.body_text = body.body_text_encoded;
            }
            encoding = body.body_encoding;
            contentType = body.ct;
        }
    }

    exports._client = client;
    exports._bip = ct._bipMeta;

    client.content_type = contentType;
    client.encoding = encoding;

    bastion.bipFire(ct._bipMeta, exports, client, {}, ct._tmp_attached_files || []);

    next(OK);
};

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

function setExport(body, exports) {
    if (body.is_html) {
        exports.source.body_html = body.bodytext;
    } else {
        exports.source.body_text = body.bodytext;
    }
}


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
            if (p.children && p.children.length > 0) {
                for (var j = 0; j < p.children.length; j++) {
                    setExport(p.children[j], exports);
                    encoding = p.children[j].body_encoding;
                    contentType = p.children[j].ct;
                }

            } else if (body) {
                setExport(body, exports)
                encoding = body.body_encoding;
                contentType = body.ct;

            } else {
                setExport(p, exports);
                encoding = p.body_encoding;
                contentType = p.ct;
            }
        }
    } else {
        setExport(body, exports);
        encoding = body.body_encoding;
        contentType = body.ct;
    }

    exports._client = client;
    exports._bip = ct._bipMeta;

    client.content_type = contentType;
    client.encoding = encoding;

    bastion.bipFire(ct._bipMeta, exports, client, {}, ct._tmp_attached_files || []);

    next(OK);
};

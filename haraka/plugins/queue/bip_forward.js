/**
 *
 * Forwards an SMTP bip to the queue.
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
            'body_text' : '',
            'reply_to' : client.reply_to,
            'headers' : ct.header.headers,
            'headers_raw' : ct.header.toString()
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

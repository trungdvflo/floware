/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
/* eslint-disable vars-on-top */
/* eslint-disable no-multi-assign */
/* eslint-disable eqeqeq */
/* eslint-disable prefer-template */
/* eslint-disable no-empty */
/* eslint-disable no-var */
/* eslint-disable func-names */
/* eslint-disable no-undef */
/* eslint-disable no-lonely-if */
// https://github.com/flowjs/flow.js/blob/master/samples/Node.js/flow-node.js
var fs = require('fs');
var path = require('path');

const Files = require('./Files');

module.exports = flow = function (temporaryFolder) {
    var $ = this;
    $.temporaryFolder = temporaryFolder;
    $.maxFileSize = null;
    $.fileParameterName = 'file';

    try {
        fs.mkdirSync($.temporaryFolder);
    } catch (e) {}

    function cleanIdentifier(identifier) {
        return identifier.replace(/[^0-9A-Za-z_-]/g, '');
    }

    function getChunkFilename(chunkNumber, identifier) {
        // Clean up the identifier
        identifier = cleanIdentifier(identifier);
        // What would the file name be?
        return path.resolve($.temporaryFolder, './flow-' + identifier + '.' + chunkNumber);
    }

    function validateRequest(chunkNumber, chunkSize, totalSize, identifier, filename, fileSize) {
        // Clean up the identifier
        identifier = cleanIdentifier(identifier);

        // Check if the request is sane
        if (chunkNumber == 0 || chunkSize == 0 || totalSize == 0 || identifier.length == 0 || filename.length == 0) {
            return 'non_flow_request';
        }
        var numberOfChunks = Math.max(Math.floor(totalSize / (chunkSize * 1.0)), 1);

        // console.log('numberOfChunks------', numberOfChunks);

        if (chunkNumber > numberOfChunks) {
            return 'invalid_flow_request1';
        }

        // Is the file too big?
        if ($.maxFileSize && totalSize > $.maxFileSize) {
            return 'invalid_flow_request2';
        }

        if (typeof fileSize != 'undefined') {
            if (chunkNumber < numberOfChunks && fileSize != chunkSize) {
                // The chunk in the POST request isn't the correct size
                return 'invalid_flow_request3';
            }

            // console.log('(totalSize % chunkSize) + parseInt(chunkSize)', (totalSize % chunkSize) + parseInt(chunkSize));

            // eslint-disable-next-line radix
            if (numberOfChunks > 1 && chunkNumber == numberOfChunks && fileSize != (totalSize % chunkSize) + parseInt(chunkSize)) {
                // The chunks in the POST is the last one, and the fil is not the correct size
                return 'invalid_flow_request4';
            }
            if (numberOfChunks == 1 && fileSize != totalSize) {
                // The file is only a single chunk, and the data size does not fit
                return 'invalid_flow_request5';
            }
        }

        return 'valid';
    }

    // 'found', filename, original_filename, identifier
    // 'not_found', null, null, null
    $.get = function (req, callback) {
        var chunkNumber = req.param('flowChunkNumber', 0);
        var chunkSize = req.param('flowChunkSize', 0);
        var totalSize = req.param('flowTotalSize', 0);
        var identifier = req.param('flowIdentifier', '');
        var filename = req.param('flowFilename', '');

        if (validateRequest(chunkNumber, chunkSize, totalSize, identifier, filename) == 'valid') {
            var chunkFilename = getChunkFilename(chunkNumber, identifier);
            fs.exists(chunkFilename, (exists) => {
                if (exists) {
                    callback('found', chunkFilename, filename, identifier);
                } else {
                    callback('not_found', null, null, null);
                }
            });
        } else {
            callback('not_found', null, null, null);
        }
    };

    $.post = async (req) => {
        const fields = req;
        const chunkNumber = fields.flowChunkNumber;
        const chunkSize = fields.flowChunkSize;
        const totalSize = fields.flowTotalSize;
        const { flowCurrentChunkSize } = fields;
        const identifier = cleanIdentifier(fields.flowIdentifier);
        const filename = fields.flowFilename;
        const original_filename = filename;
        const validation = validateRequest(chunkNumber, chunkSize, totalSize, identifier, filename, flowCurrentChunkSize);

        if (validation == 'valid') {
            const chunkFilename = getChunkFilename(chunkNumber, identifier);
            const writeFile = await Files.writeStreamBuffer(chunkFilename, fields.file._data);
            if (writeFile === false) {
                return {
                    status: 'upload_failed',
                    filename,
                    original_filename,
                    identifier
                };
            }

            let currentTestChunk = 1;
            const numberOfChunks = Math.max(Math.floor(totalSize / (chunkSize * 1.0)), 1);
            const arrayFileNumber = [];
            for (let index = 1; index <= chunkNumber; index++) {
                arrayFileNumber.push(index);
            }

            let checkStatusFinishUpload = false;
            await Promise.all(
                arrayFileNumber.map(async () => {
                    const chunkFilename01 = getChunkFilename(currentTestChunk, identifier);
                    const checkExistsFile = await fs.existsSync(chunkFilename01);
                    if (checkExistsFile && currentTestChunk >= numberOfChunks) {
                        checkStatusFinishUpload = true;
                    }
                    currentTestChunk++;
                })
            );

            if (checkStatusFinishUpload) {
                return {
                    status: 'done',
                    filename,
                    original_filename,
                    identifier
                };
            }

            return {
                status: 'partly_done',
                filename,
                original_filename,
                identifier
            };
        }
        return {
            status: 'upload_failed',
            filename,
            original_filename,
            identifier
        };
    };

    $.write = function (identifier, writableStream, options) {
        options = options || {};
        options.end = typeof options.end == 'undefined' ? true : options.end;
        // Iterate over each chunk
        var pipeChunk = function (number) {
            var chunkFilename = getChunkFilename(number, identifier);
            fs.exists(chunkFilename, (exists) => {
                if (exists) {
                    var sourceStream = fs.createReadStream(chunkFilename);
                    sourceStream.pipe(writableStream, {
                        end: false
                    });
                    sourceStream.on('end', async () => {                        
                        pipeChunk(number + 1);
                    });
                } else {
                    // When all the chunks have been piped, end the stream
                    if (options.end) writableStream.end();
                    if (options.onDone) options.onDone();
                    if (options.cleanChunks) clean(identifier, options);
                }
            });
        };
        pipeChunk(1);
    };

    $.clean = function (identifier, options) {
        options = options || {};

        // Iterate over each chunk
        var pipeChunkRm = function (number) {
            var chunkFilename = getChunkFilename(number, identifier);

            // console.log('removing pipeChunkRm ', number, 'chunkFilename', chunkFilename);
            fs.exists(chunkFilename, (exists) => {
                if (exists) {
                    // console.log('exist removing ', chunkFilename);
                    fs.unlink(chunkFilename, (err) => {
                        if (err && options.onError) options.onError(err);
                    });

                    pipeChunkRm(number + 1);
                } else {
                    if (options.onDone) options.onDone();
                }
            });
        };
        pipeChunkRm(1);
    };

    return $;
};

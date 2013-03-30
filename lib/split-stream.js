
var async = require('async')
var defineParam = require('quiver-param').defineParam
var createStreamChannel = require('quiver-stream-channel').createStreamChannel

var splitStreamParam = defineParam()
  .optional('splitCount', 2)

var splitStream = function(originalReadStream, options) {
  options = splitStreamParam.parseArgs(options)

  var splitCount = options.splitCount
  var timeout = options.timeout
  var self = { }
  originalReadStream.acquireOwnership(self)

  var writeStreams = []
  var readStreams = []

  var streamClosedErr = null

  for(var i=0; i<splitCount; i++) {
    (function(i) {
      var channel = createStreamChannel()
      var readStream = channel.readStream
      var writeStream = channel.writeStream

      readStreams.push(readStream)
      writeStreams.push(writeStream)
    })()
  }

  var doPipe = function(writeStreams) {
    async.filter(writeStreams, function(writeStream, callback) {
      writeStream.prepareWrite(function(streamClosed) {
        if(!streamClosed) return callback(true)

        if(streamClosed.err && !streamClosedErr) {
          streamClosedErr = streamClosed.err
        }

        callback(false)
      })
    }, function(writeStreams) {
      if(writeStreams.length == 0) return originalReadStream.closeRead(null)

      originalReadStream.read(function(streamClosed, data) {
        if(streamClosed) {
          writeStreams.forEach(function(writeStream) {
            writeStream.closeWrite(streamClosed.err)
          })
        } else {
          writeStreams.forEach(function(writeStream) {
            writeStream.write(data)
          })
          doPipe(writeStreams)
        }
      })
    })
  }

  doPipe(writeStreams)

  return readStreams
}

module.exports = {
  splitStream: splitStream
}
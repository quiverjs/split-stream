
var createChannel = require('quiver-stream-channel').createStreamChannel
var splitStream = require('../lib/split-stream').splitStream
var should = require('should')

describe('basic split stream test', function() {
  it('should be readable by two readers', function(callback) {
    var channel = createChannel()
    var writeStream = channel.writeStream
    var readStreams = splitStream(channel.readStream)
    var readStream1 = readStreams[0]
    var readStream2 = readStreams[1]

    var testData1 = 'foo'
    var testData2 = 'bar'
    var writeData

    writeStream.prepareWrite(function(streamClosed) {
      should.not.exist(streamClosed)
      writeData.should.equal(testData1)
      writeStream.write(writeData)
    })

    readStream1.read(function(streamClosed, data) {
      should.not.exist(streamClosed)
      data.should.equal(testData1)
      readStream1.closeRead('test close')
    })

    writeData = testData1
    readStream2.read(function(streamClosed, data) {
      should.not.exist(streamClosed)
      data.should.equal(testData1)

      writeStream.prepareWrite(function(streamClosed) {
        should.not.exist(streamClosed)
        writeData.should.equal(testData2)
        writeStream.write(writeData)
      })

      writeData = testData2

      readStream2.read(function(streamClosed, data) {
        should.not.exist(streamClosed)
        data.should.equal(testData2)

        readStream2.closeRead('test close')

        writeStream.prepareWrite(function(streamClosed) {
          should.exist(streamClosed)

          callback(null)
        })
      })
    })
  })
})
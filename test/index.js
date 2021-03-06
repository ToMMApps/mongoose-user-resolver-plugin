describe("index", function () {
    var mongoose = require('mongoose');
    var expect = require('expect.js');
    var sinon = require('sinon');

    var plugin = require('../index');

    before(function (done) {
        var host = process.env.MONGODB_HOST || 'localhost';
        var port = process.env.MONGODB_PORT || 27017;
        var database = process.env.MONGODB_DATABSE || 'mongoose-user-resolver-test';

        var uri = "mongodb://" + host + ":" + port + "/" + database;

        mongoose.connect(uri, function (error) {
            if (error) throw error; // Handle failed connection
            console.log("connected to " + uri);
            done();
        });
    });

    var sandbox;

    before(function (done) {
        sandbox = sinon.sandbox.create();
        mongoose.connection.once('open', done);
    });

    after(function (done) {
        mongoose.connection.close(done);
    });

    afterEach(function (done) {
        sandbox.restore();
        mongoose.connection.db.dropDatabase(done);
    });

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        delete mongoose.connection.models['example'];
        delete mongoose.connection.models['exampleChild'];
    });

    function multipleDone(expectedTimes, done){
        var _expectedTimes = expectedTimes;
        var _counter = 0;

        return function () {
                _counter++;

                if(_counter === _expectedTimes){
                    done();
                } else if(_counter > expectedTimes){
                    throw new Error("done called too often");
                }
            }
    }

    it("should reject if ref is not defined and path does not equal id or _id", function (done) {
        var ExampleSchema = mongoose.Schema({
            user: mongoose.Schema.ObjectId
        });

        var multiDone = multipleDone(2, done);

        ExampleSchema.plugin(plugin, {path: 'user'});

        var ExampleModel =  mongoose.model('example', ExampleSchema);

        var instance = new ExampleModel({
            user: mongoose.Types.ObjectId()
        });

        instance.save(function (err) {
            expect(err).to.be(null);

            instance.getUserId(function (err, userId) {
                expect(err).to.be.an('object');
                multiDone();
            });

            instance.getUserId().catch(function () {
                multiDone();
            });
        });
    });

    it("should reject if the given path is undefined", function (done) {
        var ExampleSchema = mongoose.Schema({
            user: mongoose.Schema.ObjectId
        });

        var multiDone = multipleDone(2, done);

        ExampleSchema.plugin(plugin, {path: 'nonsense'});

        var ExampleModel =  mongoose.model('example', ExampleSchema);

        var instance = new ExampleModel({
            user: mongoose.Types.ObjectId()
        });
        
        instance.save(function (err) {
            expect(err).to.be(null);

            instance.getUserId(function (err, userId) {
                expect(err).to.be.an('object');
                multiDone();
            });

            instance.getUserId().catch(function () {
                multiDone();
            });
        })


    });

    it("should resolve if ref is not specified but stop is", function (done) {
        var ExampleSchema = mongoose.Schema({
            user: mongoose.Schema.ObjectId
        });

        ExampleSchema.plugin(plugin, {path: 'user', stop: true});

        var multiDone = multipleDone(2, done);

        var ExampleModel =  mongoose.model('example', ExampleSchema);

        var instance = new ExampleModel({
            user: mongoose.Types.ObjectId()
        });

        instance.save(function (err, instance) {
            expect(err).to.be(null);

            instance.getUserId(function (err, userId) {
                expect(err).to.be(null);
                expect(userId).to.be(instance.user);
                multiDone();
            });

            instance.getUserId().then(function (userId) {
                expect(userId).to.be(instance.user);
                multiDone();
            });
        });
    });

    it("should resolve if the referenced entry has an user id", function (done) {
        var ExampleChildSchema = mongoose.Schema({
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'example'
            }
        });

        ExampleChildSchema.plugin(plugin, {path: 'user'});

        var ExampleSchema = mongoose.Schema({});

        ExampleSchema.plugin(plugin, {path: '_id'});

        var ExampleModel =  mongoose.model('example', ExampleSchema);
        var ExampleChildModel =  mongoose.model('exampleChild', ExampleChildSchema);

        var multiDone = multipleDone(2, done);

        var instance = new ExampleModel({});

        instance.save(function (err, instance) {

            var childInstance = new ExampleChildModel({
                user: instance._id
            });

            childInstance.save(function (err, childInstance) {

                childInstance.getUserId(function(err, userId){
                    expect(userId).to.eql(instance._id);
                    multiDone();
                });

                childInstance.getUserId().then(function (userId) {
                    expect(userId).to.eql(instance._id);
                    multiDone();
                });
            })
        })


    });

    it("should reject if the referenced entry has no method getUserId", function (done) {
        var ExampleChildSchema = mongoose.Schema({
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'example'
            }
        });

        ExampleChildSchema.plugin(plugin, {path: 'user'});

        var ExampleSchema = mongoose.Schema({});

        var ExampleModel =  mongoose.model('example', ExampleSchema);
        var ExampleChildModel =  mongoose.model('exampleChild', ExampleChildSchema);

        var multiDone = multipleDone(2, done);

        var instance = new ExampleModel({});

        instance.save(function (err, instance) {
            var childInstance = new ExampleChildModel({
                user: instance._id
            });

            childInstance.save(function (err, childInstance) {
                childInstance.getUserId(function(err){
                    expect(err).to.be.an('object');
                    multiDone();
                });

                childInstance.getUserId().catch(function () {
                    multiDone();
                });
            });
        });
    });
});
describe("index", function () {
    var mongoose = require('mongoose');
    var mockgoose = require('mockgoose');
    var expect = require('expect.js');
    var Q = require('q');
    var sinon = require('sinon');

    mockgoose(mongoose); //for all further tests a mocked version of mongoose will be used

    var plugin = require('../index');

    before(function () {
        mongoose.connect("");
    });

    var sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    afterEach(function () {
        mockgoose.reset();

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

        sandbox.stub(ExampleModel, "findById");

        var instance = new ExampleModel({
            user: mongoose.Types.ObjectId()
        });

        instance.getUserId(function (err, userId) {
            expect(err).to.be.an('object');
            multiDone();
        });
        
        instance.getUserId().catch(function () {
            multiDone();
        });
    });

    it("should reject if the given path is undefined", function (done) {
        var ExampleSchema = mongoose.Schema({
            _id: mongoose.Schema.ObjectId
        });

        var multiDone = multipleDone(2, done);

        ExampleSchema.plugin(plugin, {path: 'nonsense'});

        var ExampleModel =  mongoose.model('example', ExampleSchema);

        sandbox.stub(ExampleModel, "findById");

        var instance = new ExampleModel({
            user: mongoose.Types.ObjectId()
        });

        instance.getUserId(function (err, userId) {
            expect(err).to.be.an('object');
            multiDone();
        });

        instance.getUserId().catch(function () {
            multiDone();
        });
    });

    it("should resolve if ref is not specified but stop is", function (done) {
        var ExampleSchema = mongoose.Schema({
            user: mongoose.Schema.ObjectId
        });

        ExampleSchema.plugin(plugin, {path: 'user', stop: true});

        var multiDone = multipleDone(2, done);

        var ExampleModel =  mongoose.model('example', ExampleSchema);

        sandbox.stub(ExampleModel, "findById");

        var instance = new ExampleModel({
            user: mongoose.Types.ObjectId()
        });

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

    it("should resolve if the referenced entry has an user id", function (done) {
        var ExampleChildSchema = mongoose.Schema({
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'example'
            }
        });

        ExampleChildSchema.plugin(plugin, {path: 'user'});

        var ExampleSchema = mongoose.Schema({
            _id: mongoose.Schema.ObjectId
        });

        ExampleSchema.plugin(plugin, {path: '_id'});

        var ExampleModel =  mongoose.model('example', ExampleSchema);
        var ExampleChildModel =  mongoose.model('exampleChild', ExampleChildSchema);

        var multiDone = multipleDone(2, done);

        var instance = new ExampleModel({
            _id: mongoose.Types.ObjectId()
        });

        var childInstance = new ExampleChildModel({
            _id: mongoose.Types.ObjectId(),
            user: instance._id
        });

        sandbox.stub(ExampleModel, "findById").withArgs(instance._id).returns({
            exec: function (cb) {
                cb(null, instance);
            }
        });
        sandbox.stub(ExampleChildModel, "findById");

        childInstance.getUserId(function(err, userId){
            expect(userId).to.be(instance._id);
            multiDone();
        });
        
        childInstance.getUserId().then(function (userId) {
            expect(userId).to.be(instance._id);
            multiDone();
        });
    });

    it("should reject if the referenced entry has no method getUserId", function (done) {
        var ExampleChildSchema = mongoose.Schema({
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'example'
            }
        });

        ExampleChildSchema.plugin(plugin, {path: 'user'});

        var ExampleSchema = mongoose.Schema({
            _id: mongoose.Schema.ObjectId
        });

        var ExampleModel =  mongoose.model('example', ExampleSchema);
        var ExampleChildModel =  mongoose.model('exampleChild', ExampleChildSchema);

        var multiDone = multipleDone(2, done);

        var instance = new ExampleModel({
            _id: mongoose.Types.ObjectId()
        });

        var childInstance = new ExampleChildModel({
            _id: mongoose.Types.ObjectId(),
            user: instance._id
        });

        sandbox.stub(ExampleModel, "findById").withArgs(instance._id).returns({
            exec: function (cb) {
                cb(null, instance);
            }
        });
        sandbox.stub(ExampleChildModel, "findById");

        childInstance.getUserId(function(err, userId){
            expect(err).to.be.an('object');
            multiDone();
        });

        childInstance.getUserId().catch(function () {
            multiDone();
        });
    });
});
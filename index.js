var Q = require('q');
var util = require('util');

module.exports = function(schema, options){

    /**
     * Tries to resolve the user this entry belongs to.
     * Recursively dereferences the path entry that must be specified in the options
     * and calls getUserId on the resulting model. Throws an exception if getUserId is not defined.
     * If path equals 'id' or '_id' the resolver stops and returns the id.
     * If stop is set to true the resolver returns path.
     * @returns {promise}
     */
    schema.methods.getUserId = function(cb) {
        var deferred = Q.defer();
        var mongoose = require('mongoose');

        if (!options || !options.path) {
            return Q.reject(new TypeError("options.path must be specified"));
        }

        var path = options.path;
        var self = this;

        if(options.stop){
            if(cb) cb(null, self[path]);
            deferred.resolve(self[path]);
        } else if(['id', '_id'].indexOf(path) !== -1){
            if(cb) cb(null, self[path]);
            deferred.resolve(self[path]);
        } else if (!self[path]) {
            var err = new TypeError(path + " is null or undefined");
            if(cb) cb(err);
            deferred.reject(err);
        } else if (self[path].getUserId) {
            if(cb) self[path].getUserId(cb);
            deferred.resolve(self[path].getUserId());
        } else {
            var referencedModel = schema.paths[path].options.ref;

            if(!referencedModel){
                var err = new Error("ref is not defined");
                if(cb) cb(err);
                deferred.reject(err);
            } else {
                mongoose.model(referencedModel).findById(self[path]).exec(function(err, instance){
                    if(err) {
                        if(cb) cb(err);
                        deferred.reject(err);
                    } else {
                        if (instance && instance.getUserId && (typeof instance.getUserId === 'function')) {
                            if(cb) instance.getUserId(cb);
                            deferred.resolve(instance.getUserId());
                        } else {
                            err = new TypeError(path + " has no such method 'getUserId'");
                            if(cb) cb(err);
                            deferred.reject(err);
                        }
                    }
                });
            }

        }

        return deferred.promise;
    }
};
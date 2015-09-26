# Mongoose-User-Resolver-Plugin
Automatically resolves the owning user of every model.

![BuildStatus](http://jenkins.tomm-apps.de/buildStatus/icon?job=mongoose-user-resolver-plugin)
![Test](http://jenkins.tomm-apps.de:3434/badge/mongoose-user-resolver-plugin/test)
![LastBuild](http://jenkins.tomm-apps.de:3434/badge/mongoose-user-resolver-plugin/lastbuild)
![CodeCoverageInJenkins](http://jenkins.tomm-apps.de:3434/badge/mongoose-user-resolver-plugin/coverage)

## Installation

```javascript
npm install mongoose-user-resolver-plugin
```

## Usage

The plugin is configured by using the plugin function like any other mongoose plugin.

Assume you have a model project with a name and a owning user:

```javascript
var ProjectSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'user',
        required: true
    }
});
```

The resolver-plugin would then be configured like this:

```javascript
ProjectSchema.plugin(require('mongoose-user-resolver-plugin'), {path: 'user', stop: true});
```

The stop attribute indicates that the provided id is the userId, so that the plugin would not try to retrieve the referenced model
as it is unnecessary here.

Calling getUserId on a project instance would then resolve to the path user.
The clue is that this does also work on instances that reference this project, for example:

Assume we have another model file:

```javascript
var FileSchema = mongoose.Schema({
    basename: {
        required: true,
        type: String
    },
    project: {
        required: true,
        type: mongoose.Schema.ObjectId,
        ref: 'project'
    }
});
FileSchema.plugin(require('mongoose-user-resolver-plugin'), {path: 'project'});
```

This model references the above project model.

Calling getUserId on a file instance returns the userId that is referenced from the referenced project!
With this technique you can easily build authentication and verify-algorithms that are independent from the concrete model.

## License

MIT

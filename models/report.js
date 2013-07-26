var mongodb = require('./db');
var markdown = require('markdown').markdown;
var ObjectId = require('mongodb').ObjectID;

function Report(username, report, time, _id) {
	this.id = _id;
  this.user = username;
  this.report = report;
  this.htmlReport = markdown.toHTML(report);
  if (time) {
    this.time = time;
  } else {
    this.time = new Date();
  }
};
module.exports = Report;

Report.prototype.save = function save(callback) {
  var report = {
    user: this.user,
    report: this.report,
    time: this.time,
  };

  mongodb.open(function(err, db) {
    if (err) {
      return callback(err);
    }

    db.collection('reports', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.ensureIndex('user');

      collection.insert(report, {safe: true}, function(err, report) {
        mongodb.close();
        callback(err, report);
      });
    });
  });
};

Report.get = function get(username, startDate, endDate, callback) {
  mongodb.open(function(err, db) {
    if (err) {
      return callback(err);
    }

    db.collection('reports', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }

      var query = {};
      if (username) {
        query.user = username;
      }
      
      if (startDate && endDate) {
        var time = {};
      	time.$gte = new Date(startDate);
      	time.$lt = new Date(endDate);
      	query.time = time;
      }
      
      collection.find(query).sort({time: -1}).toArray(function(err, docs) {
        mongodb.close();
        if (err) {
          callback(err, null);
        }

        var reports = [];
        docs.forEach(function(doc, index) {
          var report = new Report(doc.user, doc.report, doc.time, doc._id);
          
          reports.push(report);
        });
        callback(null, reports);
      });
    });
  });
};

Report.getOne = function get(id, callback) {
  mongodb.open(function(err, db) {
    if (err) {
      return callback(err);
    }

    db.collection('reports', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }

      var query = {};
      if (id) {
        query._id = ObjectId.createFromHexString(id);
      }
      
      collection.find(query).sort({time: -1}).toArray(function(err, docs) {
        mongodb.close();
        if (err) {
          callback(err, null);
        }

        var reports = [];
        docs.forEach(function(doc, index) {
          var report = new Report(doc.user, doc.report, doc.time, doc._id);
          
          reports.push(report);
        });
        callback(null, reports);
      });
    });
  });
};

Report.delete = function remove(id, user, callback) {
  mongodb.open(function(err, db) {
    if (err) {
      return callback(err);
    }

    db.collection('reports', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.findAndRemove({_id: ObjectId.createFromHexString(id), user: user.name}, [['_id','asc']], {}, function(err, object) {
        mongodb.close();
        callback(err);
      });
    });
  });
};

Report.update = function update(id, user, content, callback) {
  mongodb.open(function(err, db) {
    if (err) {
      return callback(err);
    }

    db.collection('reports', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.update({_id: ObjectId.createFromHexString(id), user: user.name}, {$set: {report: content}}, function(err) {
        mongodb.close();
        callback(err);
      });
    });
  });
};
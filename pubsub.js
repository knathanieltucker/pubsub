Posts = new Meteor.Collection("posts");

if (Meteor.isClient) {
  MA = new Meteor.Collection("running-average");

  Meteor.subscribe("running-average");

  Deps.autorun(function () {
    // the below calls a Counts.depenency.depend()
    console.log(MA.findOne());
  });

}

if (Meteor.isServer) {

  // all publish does is establish a link between the server and minimongo via ddp
  Meteor.publish("running-average", function () {
    var self = this;
    var runningAverageId = "running-average-id";

    // non reactive because in server
    // initialize the publish by adding to minimongo
    var sum = Posts.find()
      .map(function (i){return i.num;})
      .reduceRight(function (x, y){return x + y;}, 0);
    var count = Posts.find().count();
    self.added("running-average", runningAverageId, {runningAverage:sum/(count || 1)});

    // reactively monitor the database
    // and inform minimongo subscribers
    var handle = Posts.find().observe({
      added: function (doc) {
        count++;
        sum += doc.num;
        self.changed("running-average", runningAverageId, {runningAverage:sum/(count || 1)});
      },
      removed: function (doc) {
        count--;
        sum -= doc.num;
        self.changed("running-average", runningAverageId, {runningAverage:sum/(count || 1)});
      },
      changed: function (oldDoc, newDoc) {
        sum += newDoc.num - oldDoc.num;
        self.changed("running-average", runningAverageId, {runningAverage:sum/(count || 1)});
      }
    });

    self.onStop(function () {
      handle.stop();
    });

    self.ready();

  });

}

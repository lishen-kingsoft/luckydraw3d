import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
 
export const Events = new Mongo.Collection('events');

Meteor.methods({
  'removeAllEvents' : function () {
    Events.remove({});
  },
  'resetAllEvents': function() {
    Events.remove({});
  }
});
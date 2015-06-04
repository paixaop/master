/**
 * Created by pedro on 6/3/15.
 */
va Utils = function() {
  var self = this;

  /**
   * Try to match a single value to one regular expression out of a list
   *
   * @param value {String}  value to match against the regular expressions
   * @param list {Array}    of strings that are compiled to regular expressions
   * @returns {number}     index of matched regex, or -1 if no match found
   */
  self.matchOne = function(value, list) {

    check(value, String);
    check(list, [String]);

    for(var i = 0; i< list.length; i++) {
      var re = new RegExp(list[i]);
      if( re.match(value) ) {
        return i;
      }

    }
    return -1;
  };


  /**
   * Try to match asingle value to all regular expressions in list
   *
   * @param value {String}  value to match against the regular expressions
   * @param list {Array}    of strings that are compiled to regular expressions
   * @returns {Boolean}     true if one of the regular expressions matches
   */
  self.matchAll = function(value, list) {

    check(value, String);
    check(list, [String]);

    for(var i = 0; i< list.length; i++) {
      var re = new RegExp(list[i]);
      if( !re.match(value) ) {
        return false;
      }

    }
    return true;
  }

};


// Register to Meteor
Meteor.Utils = new Utils();

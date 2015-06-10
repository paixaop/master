/**
 * Created by pedro on 6/7/15.
 */
var Sanitize = function() {

  self.length = new Validator.Assert().Length( { min: 10 } );

  self.notBlank = new Validator.Assert().NotBlank();

  self.constraint = new Constraint( { foo: length, bar: notBlank } );

}

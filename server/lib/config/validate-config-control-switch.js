/**
 * Created by pedro on 6/8/15.
 */


check(serverConfig.controls.types["switch"], Match.ObjectIncluding({
  basic: Match.ObjectIncluding({
    commands: [ String ],
    set_property: String
  })
}));

var props = Object.keys(serverConfig.controls.types["switch" ].properties);
props.forEach(function(p) {
  check(serverConfig.controls.types["switch" ].properties[p],
    Match.ObjectIncluding({
      acl: String,
      type: String
    })
  );
});

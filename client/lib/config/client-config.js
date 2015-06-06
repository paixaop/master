clientConfig = {

  // Enable debug output to browser console?
  debug: true,

  // Angular settings
  angular: {

    // Application name
    app_name: "master"

  },

  // Controls Settings
  controls: {

    // Meteor Collection used to store controls
    collection: "controls",

    // Single Tap idenfication (in ms)
    // A single tap will be identified if control taps are separated by this interval
    tap_delay: 500,

    // Double tap
    // A doulbe tap will be identified if control taps are separated by this interval
    // double_tap delay must be smaller than tap_delay
    doubletap_delay: 200
  }
};
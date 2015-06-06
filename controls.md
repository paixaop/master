# Master Remote Control
Remote control for IoT. Simple to create web apps to interface with IoT controllers via MQTT.

Controls' states in the remote control are kept in sync with the controller via MQTT messages. Users can change control states and these will be communicated in real time to the IoT controller that supports MQTT.

HTTP and other protocols may be added in the future.

# Control data model structure

  * A control can have many users
  * Users can have many Controls
  * A controls can have many screens
  * Screens can have one or more panels
  * Panels can have one or more controls
  * A panel can be used in many screens
  * A control can be used in many screens

# Master has one MQTT control input topic

    master/<what>/<name>/<command|status>/<path>

Command depends on thing being controled. Can be

  * Switch - ON, OFF
  * Dimmer - ON, OFF, INCREASE, DECREASE
  * Roller - UP, DOWN, STOP


What can be screen, panel, control

  * Can set screen properties
  * Enable or disable screens
  * Change to other screens
  * Enable or disable controls
  * Show alert

<status> get status of object - basically take a mondoDB selector and return the control's document

# MQTT
Interface to the Thing's World is through MQTT protocol.
Server connects and processes all MQTT messages, then makes changes to the things in the database, which will be reflected in the clients.

Clients do not process MQTT messages directly, they don't even know about out side world. All they manipulate are the data in the database.

## MQTT In/Out Topics
The outside world can affect each of the controls in the remote by sending a message to the proper MQTT topic. State changes are also o communicated to the outside world via MQTT topic.

  * MQTT in topic - messages from the outside to update control state or properties
  * MQTT out topic - messages from the control to the outside world reflecting a state change

MQTT in and out topics can be the same.

## Topic Format

    thing/+id/path


# Controls user stories

  * State Machine controls (DONE)
  * Joystick controls
  * Dimmer/Slider controls
    * should be able to specify a ramp up/down function for dimmers that softly dimms the light up or down
  * Text/Numeric Label controls
    * function to calculate something base on values
  * Alerts
  * Guage
  * Charts
  * Video
  * Web page

# All Controls
  * name
  * label
  * enable

# State Machines
## Properties
  * state - current state
  * Actions - list of actions that will be triggered once control moves into this state
    * audio
    * http
    * mqtt
    * Text to Speech
    * Telegram
  * Timer
    * onToOffTimer
    * offToOnTimer
  * Event Fired (callback)
    * tap
    * doubleTap
    * trippleTap
    * hold
    * dataIn
    * dataOut
    * swipeUp
    * swipeLeft
    * swipe

# Dimmer/Sliders
  * value
  * min:0 - minimum value allowed by the control
  * max: 100 - maximum value alloed by the control
  * increment: 10 - set increments
  * rampUp: 2000  - ms to ramp up to value
  * rampDown: 2000 - ms to ramp down to value
  * stored max - save max, so when on ramp up to this value, if not configured go to max
  * current min - saved min, so when off ramp down to this value, if not configured go to min
  * Actions - list of actions that will triggeer once the control goes to that value
    * up_N - when going UP and hit value N
    * down_Y - when going down and hit value Y
    * MAX - when max is hit
    * MIN - when min is hit
    * picture - each action can also change picture of control
  * HSB, RGB - stors color information for colored lights and others
    * for RGB lights mave a mode to random colors or cycle colors

# knob Control
http://tutorialzine.com/2011/11/pretty-switches-css3-jquery/
http://gordyd.github.io/dial.html

# HTML Time picker
http://raspberry.vanoorschot.biz/code/timepicker/timepicker-demo.html
http://angularscript.com/circular-time-picker-directive-with-angularjs/


# Joystick
http://phaser.io/examples/v2/category/virtualjoystick
https://github.com/austinhallock/html5-virtual-game-controller

# QR Codes
http://angularscript.com/qr-code-directive-for-angularjs/

# Color Picker
http://myplanet.github.io/angular-color-picker/

# Charts
http://n3-charts.github.io/line-chart/#/examples
http://jtblin.github.io/angular-chart.js/

# Pulse and jump animations
http://720kb.github.io/angular-fx/#list

# Circular Menu Navigation
https://maxklenk.github.io/angular-circular-navigation/
http://tympanus.net/codrops/2013/08/09/building-a-circular-navigation-with-css-transforms/
http://tympanus.net/Tutorials/SwatchBook/index5.html#

# 3D View Effect
http://tympanus.net/Development/3DEffectMobileShowcase/index3.html

# Icon Over Effects
http://tympanus.net/Development/IconHoverEffects/#set-9

# Menu
http://tympanus.net/Tutorials/ResponsiveRetinaReadyMenu/

# Page transitions
http://tympanus.net/Development/PageTransitions/
http://tympanus.net/Tutorials/ExpandingOverlayEffect/index2.html

# Slider
http://tympanus.net/Development/SliderPagination/
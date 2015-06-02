/**
 * Control Utility functions
 * 
 * Pedro Paixao
 */

var Control = function() {
    var self = this;    

    /**
     * Get a control from the database
     * @param {String} controlName  The name of the control
     */
    
    self.getControlByName = function(controlName) {
        if (!controlName) {
            console.log('Error. You must pass a control name ');
            return undefined;
        }
        
        var c = Controls.find({ name: controlName } );
        if (!c) {
            console.log('Control not found: ' + controlName);
        }
        else if (!c.type) {
            console.log('WARNING: Control type unknown, possible control misconfiguration in database.');
        }
        
        return c;
    };
    
    
    /**
     * Load control configuration files
     */
    
    self.loadControlConfigurations = function(next) {
        var config = { };
        check(next, isFunction);
        
        // Read all files in the config directory
        fs.readdir(Meteor.settings.controls.config_path, function(err, files) {
            if ( err ) {
                throw new Error('Control configuration directory not found: ' + err);
            }
            _.forEach(files, function(file) {
                var m = file.match(/(^[0-9a-z_-]+).json$/i);
                if( m ) {
                    self.config[m[1]] = JSON.parse(Assets.getText(Meteor.settings.controls.config_path + file));         
                }
            });
            return next(err);
        });
    };
    
    /**
     * Is the property writable
     */
    self.isWritable = function(controlSettings, property) {
        
        if (!property ||
            !controlSettings.properties ||
            !controlSettings.properties[property] ||
            !controlSettings.properties[property].acl) {
            
            return false;
        }
        
        if( controlSettings.properties[property].acl.match(/w/gi) )
            return true;
        
        return false;
    };
    
    /**
     * Check if a control is of expected type
     */
    self.isControlType = function(c, type) {
        
        if (!c.type) {
            console.log('WARNING: Control type unknown, possible control misconfiguration in database.');
            return false;
        }
        
        var t = type === c.type;
        if (!t) {
            console.log('Control '+ c.name + ' does not have the same type ' + type + ' is not ' + c.type);
        }
        return t;
    };
    
    self.validateAndParseControlMessage = function(controlSettings, msg) {
        // control messages are either a direct command like ON or OFF or a parsable JSON object
        msg.valid = false;
        
        if (msg.message.match(controlSettings.basic_commands) ) {
            msg.type = 'basic';
            msg.valid = true;
            return msg;
        }
        
        try {
            var obj = JSON.parse(msg.message);
            msg.type = 'json';
            msg.parse = obj;
            msg.valid = true;
        }
        catch (error) {
            console.log('Control: Error invalid message in topic ' + msg.topic);
        }
        
        return msg;
    };
    
};

Meteor.Control = new Control();

/*
var Switch = function() {
    var self = this;
    
    self.processMessage = function(msg) { 
        var controlSettings = { };
        controlSettings = JSON.parse(Assets.getText("control.json"));
        
        var control = getControlByName(controlSettings, msg.params.name)
        
        if (!control) {
            return;
        }
        
        if( !isControlType(control.type, 'switch') ){
            return;
        }
    
        if (control.path !== msg.params.path) {
            console.log('WARNING! Control ' + msg.params.name + ' found but there\'s a path mismatch. Expecting ' +
                control.path + ' got ' + msg.params.name + '. Ignoring path');
        }
    
        
    }
    
    self.isValidMessage = function(msg) {
        // Validate message before processing it
    }
    
}

*/
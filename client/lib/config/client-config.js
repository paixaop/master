clientConfig = {
    
    angular: {
        app_name: "master"
    },
    
    controls: {
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
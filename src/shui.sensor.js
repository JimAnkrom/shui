/**
 * Created by Jim Ankrom on 9/14/2014.
 * 
 * 
 */
var 水 = shui = 水 || {};
水.sensor = 水.sensor || {};

// Handle location events
水.sensor.location = {
    detect: function () {},
    polyfill: function () {},
    init: function () {
        if (navigator.geolocation) {
            var options = {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 0
            };

            navigator.geolocation.getCurrentPosition(水.sensor.location.handlePosition, function () {}, options);
            navigator.geolocation.watchPosition(水.sensor.location.handlePosition, function () {}, options);
        }
    },
    handlePosition: function (position) {
        水.motion.calibration.position = position;

        if (水.debugPanel) {
            水.renderDebugEvent.call(水, 水.debugPanel, position);
        }
        // position.coords.latitude
        // position.coords.longitude
        // position.coords.accuracy
        // position.coords.altitude
        // position.coords.altitudeAccuracy
        // position.coords.heading
        // position.coords.speed
    }
};

水.sensor.motion = {
    detect: function () {},
    polyfill: function () {},
    init: function () {}
};

水.sensor.orientation = {
    calibration: null,
    detect: function () {},
    polyfill: function () {},
    init: function () {},
    handler: function (e) {
//            if (!calibration) {
//                // This should always be the user pointing towards their desired start point on the screen!
//                // We may be able to have them point to "the front" first, or even run a system calibration to establish where the compass heading is.
//                this.calibration = e;
//            }

        // Fix for #49, prefer webkitCompassHeading if available.
        var correctAlpha = e.alpha;
        if (!e.absolute && e.webkitCompassHeading) {
            correctAlpha = e.webkitCompassHeading;
        } else {
            // invert compass
            correctAlpha = 360 - correctAlpha;
        }

        // TODO: deal with issues here
        this.calibration.orientation = e;
        this.calibration.compassHeading = e.webkitCompassHeading;
        this.calibration.correctAlpha = correctAlpha;

        this.orientation = {
            alpha: correctAlpha,
            beta: e.beta,
            gamma: e.gamma,
            absolute: e.absolute
        };

        // Set the throttle for input
        if (!this.poll) {
            this.poll = window.setInterval(function () {
                this.onOrientation(this.orientation);
            }, this.playerConfig.controlInterval);
        }
    }
};

/**
 * shui.sensor.touch
 * 
 * Detect touch input, normalize it to a percentage of screen size
 * 
*/
水.sensor.touch = {
    detect: function () {},
    polyfill: function () {},
    init: function () {}
};
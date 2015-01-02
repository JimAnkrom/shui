/**
 * shui.motion - Created by Jim Ankrom on 9/14/2014.
 *
 * References:
 * http://www.w3.org/TR/orientation-event/
 * https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained
 * http://diveintohtml5.info/geolocation.html

 * X, Y, Z - East, North, Up (off the device)
 * Alpha - Yaw
 * Beta - Pitch
 * Gamma - Roll
 *
 * Alpha 0 is north; compass counts up counter-clockwise
 *
 * Device lying flat horizontal pointing west:
 *  {alpha: 90, beta: 0, gamma: 0};
 *
 */
var 水 = shui = 水 || {};

水.motion = {
    onMotion: multicast(),
    onOrientation: multicast(),
    init: function () {
        // Detect Browser Capabilities and wire up events for each
        if (window.DeviceOrientationEvent) {
            水.motion.capabilities.orientation = true;
            window.addEventListener('deviceorientation', function (e) {
                水.motion.handleOrientationEvent.call(水.motion, e);
            });
        }
        if (window.DeviceMotionEvent) {
            水.motion.capabilities.motion = true;
            window.addEventListener('devicemotion', function (e) {
                水.motion.handleMotionEvent.call(水.motion, e);
            });
        }
    },
    // TODO: Orientation
    // TODO: Motion
    motion: null,
    icon: null,
    capabilities: {},
    calibration: {},

    // TODO: DeviceOrientationEvent.absolute
    // TODO: DeviceOrientationEvent.alpha
    // TODO: DeviceOrientationEvent.beta
    // TODO: DeviceOrientationEvent.gamma,
    // TODO: Browsers may handle this differently, please test.

    // TODO: DeviceMotionEvent.acceleration - if data is missing here, try IncludingGravity
    // TODO: DeviceMotionEvent.accelerationIncludingGravity
    // TODO: DeviceMotionEvent.interval
    // TODO: DeviceMotionEvent.rotationRate

    renderIcon: function (e) {
        if (!水.motion.icon) {
            var icon = document.createElement('img');
            icon.style.position = 'absolute';
            icon.style.zIndex = 100;
            shui.motion.icon = icon;
            document.body.appendChild(shui.motion.icon);
            // TODO: Installation specific
            icon.src = '/images/videobleepicon.gif';
        }
        // beta - pitch - is -180 upside-down from pointing forward, 180 upsidedown from tilting back (towards user)
        var posTop = Math.round(((e.beta + 180)/360)*100);
        // gamma - roll - is -90 full to left, 90 full to right; or 0 to 180 corrected
        var posLeft = Math.round(((e.gamma + 90)/180)*100);

        水.motion.icon.style.left = posLeft + '%';
        水.motion.icon.style.top = posTop + '%';

    },
    // DeviceOrientationEvent handler
    handleOrientationEvent: function (e) {
//            if (!calibration) {
//                // This should always be the user pointing towards their desired start point on the screen!
//                // We may be able to have them point to "the front" first, or even run a system calibration to establish where the compass heading is.
//                this.calibration = e;
//            }
        // TODO: Future
        //shui.motion.renderIcon(e);

        var plugin = 水.config.channel.plugin;
        var pluginConfig = 水.config.channel[plugin];

        //alert(shui.config.channel.plugin);

        // if we don't have orientation in the plugin, do nothing
        if (pluginConfig && pluginConfig.orientation) {

            // Fix for #49, prefer webkitCompassHeading if available.
            var correctAlpha = e.alpha;
            if (!e.absolute) correctAlpha = e.webkitCompassHeading;

            // invert compass
            correctAlpha = 360 - correctAlpha;

            // TODO: deal with issues here
            this.calibration.orientation = e;
            this.calibration.compassHeading = e.webkitCompassHeading;
            this.calibration.correctAlpha = correctAlpha;

            var o = {
                alpha: correctAlpha,
                beta: e.beta,
                gamma: e.gamma,
                absolute: e.absolute
            };

            //// set a value to compare to in setInterval closure
            //var timestamp = Date.now();
            //shui.motion.timestamp = timestamp;

            shui.motion.current = { control: { orientation: o}};

            // Set the throttle for input
            if (!shui.poll) {
                shui.poll = window.setInterval(function () {
                    //TODO: If the channel changes, we should kill the interval and reset it.

                    // idle is when the last motion event is the same as current
                    // set or unset idle timeout and control interval.
                    if (shui.motion.idle((shui.motion.last === shui.motion.current))) {
                        window.clearInterval(shui.poll);
                        return;
                    }

                    // for obvious reasons which won't appear obvious later ... this line must come after the check above
                    shui.motion.last = shui.motion.current;

                    // transform the values only when we want to send them to the server
                    shui.data.transform.transformValues(shui.motion.current.control.orientation, pluginConfig.orientation);

                    shui.motion.onOrientation(shui.motion.current.control.orientation);

                    // TODO: Ensure these are wired up
                    //if (socket) {
                    //    // console.log('Values: ' + values.alpha  + ' '  + values.beta + ' ' + values.gamma);
                    //    socket.send(serializeableControl(values.alpha, values.beta, values.gamma));
                    //} else {
                    //    shui.api.post(shui.config.url + shui.config.api.control, shui.motion.current, {});
                    //}

                }, shui.config.user.controlInterval);
            }
        }

        if (shui.debugPanel) {
            shui.renderDebugEvent.call(this, shui.debugPanel, e);
        }
    },
    // DeviceMotionEvent handler
    handleMotionEvent: function (e) {
        this.calibration.motion = e.acceleration || e.accellerationIncludingGravity || {};
        this.calibration.rotation = e.rotationRate || {};
        this.calibration.motionInterval = e.interval || {};

        if (shui.debugPanel) {
            shui.renderDebugEvent.call(this, shui.debugPanel, e);
        }
    },
    // Consider refactoring this out as a throttle class with idle.
    idle: function (isIdle) {
        // Having problems with idle? return false;
        if (isIdle) {
            if (console) console.log('Starting Idle Countdown');
            // setTimeout for idle expiration
            shui.idleTimeout = window.setTimeout(function () {
                if (console) console.log('User is idle, deleting from server.');
                shui.api.post(shui.config.url + shui.config.api.deleteUser, {}, {});
            }, shui.config.user.idleTimeout);
            return true;
        }
        if (shui.idleTimeout) {
            // we are no longer idle, let's remove the idle timeout
            if (console) console.log('User is no longer idle, aborting idle.');
            window.clearTimeout(shui.idleTimeout);
        }
        return false;
    }
};
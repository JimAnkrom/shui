/**
 *
 * Shui Data Library
 * Created by Jim Ankrom on 7/30/2014.
 *
 * Transformation of data
 *
 */
var 水 = shui = 水 || {};
水.data = 水.data || {};

/**
 * shui.data.transformation - Scale and constrain data to appropriate values
 */
水.data.transform = {
    // transform a value to given scale, based on its ratio within a constraint range.
    scaleValue: function (value, scale, constraints) {
        // We cannot scale without constraints
        if (!constraints) return value;

        var constrainedValue = this.constrainValue(value, constraints);

        if (scale) {
            var absoluteValue = value;
            var ratio = this.ratioValue(constrainedValue, constraints);
            if (ratio != null) {
                var scaleRange = scale.max - scale.min;
                var relativeOffset = ratio * scaleRange;
                absoluteValue = relativeOffset + scale.min;
            }

            return absoluteValue;
        }
        // this MUST return an unaffected value if scale or constraints don't exist
        return constrainedValue;
    },
    // Get the ratio of the value to the size of the constraint range
    ratioValue: function (value, constraints) {
        if (constraints) {
            var rangeSize = constraints.ceiling - constraints.floor;
            var adjustedValue = value - constraints.floor;
            return adjustedValue / rangeSize;
        }
    },
    // Constrain a value to given thresholds
    constrainValue: function (value, constraints) {
        if (constraints) {
            if (value < constraints.floor) return constraints.floor;
            if (value > constraints.ceiling) return constraints.ceiling;
        }
        return value;
    },
    // Transform (constrain / ratio / scale) all values
    transformValues: function (valueHash, config) {
        var keys = Object.keys(valueHash);
        for (var i=0; i<keys.length; i++) {
            var key = keys[i];
            var keyConfig = config[key];
            if (keyConfig) {
                var scaleConfig = keyConfig.scale || config.scale;
                var constraintsConfig = keyConfig.constraints || config.constraints || {};
                var value = valueHash[key] || constraintsConfig.floor || 0; // TODO - create a config value for null?
                valueHash[key] = this.scaleValue(value, scaleConfig, constraintsConfig);
            } else {
                //alert("Key not found: " + key);
            }
        }
    }
};




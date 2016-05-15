/*eslint-env node */
var pngQuant = require("imagemin-pngquant");
var jpegTran = require("imagemin-jpegtran");

module.exports = {
    /**
     * This defines a set of scales. For every scale a full set of
     * spritesheets will be generated. The "resolution" field is passed
     * through to PIXI.
     **/
    "scales": {
        "web": {"scale": 0.5, "resolution": 1},
        "web_retina": {"scale": 1, "resolution": 2}
    },

    /**
     * Variations can be used for themes or languages. Sprites that are
     * not part of one variation will be included in all of them.
     **/
    "variations": [ "EN", "DE" ],

    /**
     * Different loading stages mean the game can started before all
     * images have been loaded. Remaining images can be loaded while
     * the user makes decisions or the game is going on.
     **/
    "loading_stages": [ "menu", "game" ],

    group_default: {
        max_width: 500,          // default: 2048
        max_height: 500,         // default: 1024
        oversized_warning: true, // default: false
        padding: 1               // default: 1
    },

    /**
     * Groups are units of images that fall into the same category in respect to
     * - Variations: EN, DE, or (if not defined) both
     * - JPEG: true/false (e.g. do we need an alpha channel?)
     * - loading stage (see above)
     * - quality
     *
     * All paths are relative to this file
     **/
    "groups": [
        {
            "id": "en_menu",
            "variation": "EN",
            "loading_stage": "menu",
            "compressor": pngQuant(),
            "sprites": ["example-sprites/menu/EN/*.png"]
        },
        {
            "id": "de_menu",
            "variation": "DE",
            "loading_stage": "menu",
            "compressor": pngQuant(),
            "sprites": ["example-sprites/menu/DE/*.png"]
        },
        {   // No alpha channel needed, so we can use JPEG
            "id": "menu_background",
            "loading_stage": "menu",
            "jpeg": true,
            "quality": 90,
            "compressor": jpegTran(),
            "sprites": ["example-sprites/menu/menu_bg.png"]
        },

        {
            "id": "game",
            "loading_stage": "game",
            "sprites": ["example-sprites/game/**/*.png"]
        }
    ]
};

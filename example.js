/*eslint-env node */
const pngQuant = require("imagemin-pngquant");
const jpegTran = require("imagemin-jpegtran");
const webp = require("imagemin-webp");
const pngToJpeg = require("png-to-jpeg");

module.exports = {
    /**
     * This defines a set of scales. For every scale a full set of
     * spritesheets will be generated. The "resolution" field is passed
     * through to PIXI.
     **/
    scales: {
        "web": {"scale": 0.5, "resolution": 1},
        "web_retina": {"scale": 1, "resolution": 2}
    },

    /**
     * Variations can be used for themes or languages. Sprites that are
     * not part of one variation will be included in all of them.
     **/
    variations: [ "EN", "DE" ],

    /**
     * Different loading stages mean the game can be started before all
     * assets have been fully loaded.
     **/
    loading_stages: [ "menu", "game" ],

    /**
     * Defines post-processing options. Changing options for one of those while
     * keeping the name will not invalidate the cache. Therefore it's best
     * to use expressive names and to adapt it when you change parameters
     **/
    post_processing: {
        png: {
            // extension: "png", // you don't need to define the png extension, it's the default
            transformer: pngQuant()
        },
        png_hq: {}, // Unprocessed PNG
        "jpeg:90": {
            extension: "jpeg",
            transformer: (input) =>
                pngToJpeg()(input)
                .then(jpegTran()) // Chainable via promises
        },
        "webp:50": {
            extension: "webp",
            check: "webp", // gets passed through to browser for compatibility check.
                           // 'webp' is supported out-of-the-box for pixi-packer-parser
                           // but custom checks can be added
            transformer: webp({quality: 50})
        },
        "webp_no_alpha:50": {
            extension: "webp",
            check: "webp",
            transformer: webp({quality: 50, alphaQuality: 0})
        }
    },

    group_default: {
        max_width: 500,           // default: 2048
        max_height: 500,          // default: 1024
        oversized_warning: true,  // default: false
        padding: 1,               // default: 1
        loading_stage: "menu",    // default: first loading stage, it's not strictly needed in this section
        trim: true,               // default: true

        post_processing: ["webp:50", "png"]
    },

    /**
     * Groups are units of images that fall into the same category in respect to variations,
     * post processing and loading stage. All paths are relative to this file
     **/
    groups: [
        {
            id: "en_menu",
            variation: "EN",
            sprites: ["example-sprites/menu/EN/*.png"]
        },
        {
            id: "de_menu",
            variation: "DE",
            sprites: ["example-sprites/menu/DE/*.png"]
        },
        {
            id: "menu_background",
            sprites: ["example-sprites/menu/menu_bg.png"],
            post_processing: ["webp_no_alpha:50", "jpeg:90"], // No alpha channel needed
        },
        {
            id: "game",
            variation: ["DE", "EN"], // Equivalent to not having variation at all since the array includes all current variations
            loading_stage: "game",
            sprites: ["example-sprites/game/**/*.png"]
        }
    ]
};

# PIXI Packer
PIXI Packer is a sprite packer made for HTML5 game engine <a href="https://github.com/pixijs/pixi.js">PIXI.js</a>. It's designed to create small downloads and be easy and fast to use.

```
npm install pixi-packer -g
```

## Features
The aim is to provide all the most useful features of commercial sprite packers while trying to make it more convenient to use in large projects and with complicated build pipelines.

- Fast - Uses caching to only process updated images
- Lightweight - No GUI or installer
- Minimise HTTP round trips - Creates as few images and JSON files as possible
- Support for variations (like languages or themes)
- Scale aware - Automatically generates bundles for different resolutions
- Multi-phase loading - Load sprites in order of usage
- Configurable image quality - Compression and image type (png/jpg) can be defined separately for every sprite
- Trimming - Automatically crops away transparent pixels and tells PIXI how to correct for it. This can lead to significant savings in terms of download size
- Enforce maximum pixel size per image - Avoid problems with old iOS devices and browsers
- git friendly - check all the source images into git rather than finished sprites

## Current known issues
- All source images have to be pngs
- The quality parameter for pngs is ignored, it only works for jpegs

## External dependencies
- ImageMagick

## Usage
Create an ```image-config.js``` in the folder where you're storing your sprites.

Example:
```Javascript
module.exports = {
    /* Only "true" is supported (read: tested) at the moment */
    "use_image_magick": true,

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
    "variations": ["EN", "DE"],

    /**
     * Different loading stages mean the game can started before all
     * images have been loaded. Remaining images can be loaded while
     * the user makes decisions or the game is going on.
     **/
    "loading_stages": [
        "initial",
        "game"
    ],

    /**
     * This enforces an upper bound of pixels per sprite sheet. This can be
     * useful for older browsers and devices, especially Safari on iPhone4s who
     * starts to behave weirdly with images larger than 3 megapixel. See
     * http://www.williammalone.com/articles/html5-javascript-ios-maximum-image-size/
     * for more information.
     **/
    "max_pixels_per_sprite_sheet": {
        "soft": 2.2 * 1024 * 1024,
        "hard": 3 * 1024 * 1024
    },

    /**
     * Trims of transparent pixels at the sprite edges
     **/
    "trim": true,

    /**
     * Groups are units of images that fall into the same category in respect to
     * - Language: EN, DE, or (if not defined) both
     * - JPEG: true/false (e.g. do we need an alpha channel?)
     * - loading stage (see above)
     * - compression ("pngquant" (default), "optipng", "none" - some sprites look
     *                bad when compressed) (only applies to png)
     *
     * Comparison of png compression algorithms:
     * http://pointlessramblings.com/posts/pngquant_vs_pngcrush_vs_optipng_vs_pngnq/
     *
     * All paths are relative to this file
     **/
    "groups": [
        /* English */
        {
            "id": "en_initial",
            "variation": "EN",
            "loading_stage": "initial",
            "sprites": ["images/EN/*.png", "images/EN/branding/*.png"]
        },
        {
            "id": "en_jpeg_game",
            "variation": "EN",
            "jpeg": true,
            "quality": 75,
            "loading_stage": "game",
            "sprites": ["images/EN/placeholder/*.png"]
        },
        {
            "id": "en_game",
            "variation": "EN",
            "loading_stage": "game",
            "sprites": ["images/EN/game_animations/*.png"]
        },

        /* German */
        {
            "id": "de_initial",
            "variation": "DE",
            "loading_stage": "initial",
            "sprites": ["images/DE/*.png", "images/DE/branding/*.png"]
        },
        {
            "id": "de_jpeg_game",
            "variation": "DE",
            "jpeg": true,
            "quality": 75,
            "loading_stage": "game",
            "sprites": ["images/DE/placeholder/*.png"]
        },
        {
            "id": "de_game",
            "variation": "DE",
            "loading_stage": "game",
            "sprites": ["images/DE/game_animations/*.png"]
        },

        /* Language independent */
        {   // No Alpha channel
            "id": "jpeg_initial",
            "jpeg": true,
            "quality": 75,
            "loading_stage": "initial",
            "sprites": ["images/backgrounds/initial/*.png"]
        },
        {   // No Alpha channel and only needed during game
            "id": "jpeg_game",
            "jpeg": true,
            "quality": 75,
            "loading_stage": "game",
            "sprites": ["images/backgrounds/game/*.png"]
        },
        {   // Only needed during game, but with alpha channel
            "id": "game",
            "loading_stage": "game",
            "sprites": [
                "images/shapes/*.png",
            ]
        },
        {   // Sprites that look bad using pngquant
            "id": "high_quality_game",
            "compression": "optipng",
            "loading_stage": "game",
            "sprites": [
                "images/gradients/*.png",
            ]
        },
        {   // All the rest
            "id": "initial",
            "loading_stage": "initial",
            "sprites": [
                "images/arrows/*.png",
                "images/circles/*.png",
                "images/animations/*.png",
            ]
        }
    ]
};

```

Now you can create your spritesheets via
```
pixi-packer path/to/image-config.js build/images/
```

The first round of processing will take a while but subsequent re-runs will be a lot quicker. On our relatively large test set of 1.5k sprites a warm-cache run takes about 2 second.

## PIXI.js Loader integration
The manifest files created by pixi-packer are not natively supported by pixi. You need to add https://github.com/Gamevy/pixi-packer-parser to your asset loader. At the moment <strong>only PIXI >=3.0.0 is supported</strong>.

```javascript
var pixiPackerParser = require("pixi-packer-parser");
var PIXI = require("pixi.js");

var loader = new PIXI.loaders.Loader();
loader.after(pixiPackerParser(PIXI));
loader.add("path/to/my/manifest_DE_initial.json");
loader.on("progress", function (p) => { console.log("progress", p); });
loader.load(function () => { console.log("done"); });
```

## Other game engines
Currently only PIXI.js is supported, but there's nothing to stop you from using pixi-packer for other game engines. Feel free to add your own loader plugin, the manifest file is relatively straighforward. Please open an issue if there is anything unclear.

## Caching
By default ```~/.pixi-packer-tmp``` is used as cache folder. You can use a different one via ```--cache /path/to/temp/folder```. Sharing the same cache folder for different repositories can be especially useful for example for build servers where the same set of images is regularly processed by a pull-request builder task and a master-branch builder task.

Please don't commit your cache folder or share it between machines, it will not work and might lead to unexpected behaviour.

For the purpose of cache invalidation cache keys are hashes based on the source sprites. To avoid having to open every image the hash is based on the full path, file size and last modified time.

If for some reason the cache has become stale or just too large (nothing is ever deleted) you can delete the cache folder or use ```--clean-cache```.

## API
Pixi-packer can be used without the CLI. See ```cli.js``` for how it's done or use ```--help```

## Gulp integration
pixi-packer goes to some lengths avoiding opening images in order to improve performance. This doesn't play well with Gulp's piping concepts. If you're already using gulp you can use the following code to call pixi-packer directly:

```javascript
gulp.task("sprites", function () {
    var config = require("./resources/images.js");

    var pixiPacker = new PixiPacker(
        config,
        path.resolve(__dirname, "resources"),
        path.resolve(__dirname, "static/build/resources/images"),
        path.resolve(__dirname, path.join(process.env.HOME || process.env.USERPROFILE, ".pixi-packer-tmp"))
    );

    pixiPacker.log = {
        log: _.compose(gutil.log, util.format),
        error: _.compose(gutil.log, util.format),
        info: _.compose(gutil.log, util.format),
        warn: _.compose(gutil.log, util.format)
    };

    return pixiPacker.process();
});
```




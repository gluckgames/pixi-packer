# PIXI Packer
PIXI Packer is a sprite packer made for HTML5 game engine <a href="https://github.com/pixijs/pixi.js">PIXI.js</a>. Its design priorities are to provide download as fast as possible and to make as useful as possible for developers.

```
npm install pixi-packer -g
```

## Features
We aim to bring all the most useful features of commercial counter parts while trying to make it more convenient to use in large projects and with complicated build pipelines.

- Fast - Uses caching to only process updated images
- Lightweight - No GUI or installer
- Minimise HTTP round trips - Creates as few images and JSON files as possible
- Support for variations (like languages or themes)
- Scale aware - Automatically generates bundles for different resolutions
- Multi-phase loading - Load sprites in order of usage
- PNG/JPEG support - Currently all source sprites have to be in PNG, but we're allowing JPEG as output format
- Build-in support for image compression
- Trimming - Automatically crops away transparent pixels and tells PIXI how to correct for it. This can lead to significant savings in terms of download size
- Enforce maximum pixel size per image - Avoid problems with old iOS devices and browsers
- git friendly - check all the source images into git rather than finished sprites

## Dependencies
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
     * Groups are units of images that fall into the same category in respect to
     * - Variations: EN, DE, or (if not defined) both
     * - JPEG: true/false (e.g. do we need an alpha channel?)
     * - loading stage (see above)
     * - quality
     *
     * Groups don't have to be chosen to be below a certain pixel size, they are
     * split automatically
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

Now you can run the pixi-packer via
```
pixi-packer path/to/image-config.js build/images/
```

The first round of processing will be slow (it's as fast as we could make it though!) but subsequent re-runs will be a lot quicker. On our relatively large test set of 1.5k sprites a warm-cache-no-changes run took 1 second. YMMV.

## Caching
By default ```~/.pixi-packer-tmp``` is used as cache folder. You can use a different one via ```--cache /path/to/temp/folder```. Sharing the same cache folder for different repositories can be especially useful for example for build servers where the same set of images is regularly processed by a pull-request builder task and a master-branch builder task.

Please don't commit your cache folder or share it between machines, it will not work and might even lead to invalid behaviour.

For the purpose of cache invalidation cache keys are hashes based on the source sprites. To avoid having to read the whole file in every time the hash is based on the full path, file size and last modified time.

If for some reason the cache has become stale or just too large (nothing is ever deleted) just delete the cache folder or use ```--clean-cache```.

## API
Pixi-packer can be used without the CLI. See ```cli.js``` for how it's done.

ToDo: Document usage

ToDo: Add example for gulp/grunt

## Integration with PIXI.js
See: https://github.com/Gamevy/pixi-packer-parser

ToDo: Add more information

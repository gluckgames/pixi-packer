# PIXI Packer
<a href="https://travis-ci.org/Gamevy/pixi-packer"><img alt="Build Status" src="https://travis-ci.org/Gamevy/pixi-packer.svg?branch=master" /></a>
[![Dependency Status](https://david-dm.org/gamevy/pixi-packer.svg)](https://david-dm.org/gamevy/pixi-packer)

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
Create an ```images.js``` in the folder where you're storing your sprites. Have a look at ```example.js``` in this folder
for an in-depth explanation.

Now you can create your spritesheets via
```
pixi-packer path/to/images.js build/images/
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

For the purpose of cache invalidation cache keys are hashes based on the source sprites. To avoid having to open every image the hash is based on the full path and file size.

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
## Acknowledgement
Graphics used in the ```example-sprites``` folder are taken from http://www.lostgarden.com/2007/05/dancs-miraculously-flexible-game.html

# Pushover Tiled extension

This is an extension for [Tiled](https://www.mapeditor.org/)
to support level editing in the DOS game *Pushover*.

## Setup

You need a copy of the DOS game Pushover, and you will likely also
need [DOSBox](https://www.dosbox.com/) to run the game.

### Decompress levels

Download [RNC_ProPACK](https://aminet.net/package/util/pack/RNC_ProPack).
Unpack the archive and copy `PPIBM.EXE` into the `SCREENS` folder of
your Pushover copy.

We now need to decompress all the levels. Navigate into the `SCREENS`
folder, and open this folder in DOSBox.
For example, this can be done by opening a terminal/commandline and running

```
dosbox .
```

or dragging the DOSBox executable onto the folder in your filebrowser.

In dosbox, run the following command:

```
PPIBM.EXE u -k 0x1984 *.SCR
```

### Set up Tiled

Copy the content of this repository into your Pushover folder
(the folder containing `PUSH.EXE`).

Install the latest snapshot or version 1.4 or later of
[Tiled](https://www.mapeditor.org/).

Launch Tiled, go to the _File -> Open File or Project_ menu,
and open `pushover.tiled-project`.

If you're using Tiled >= 1.7, you will see a pop-up indicating that
this project uses scripted extensions. Click "Enable extensions".

In the _View -> Views and Toolbars_ menu I recommend to
enable (at least) _Project, Issues, Properties, Tilesets, Tile stamps_
and _Tools_.

## Usage

To open a level, either open the `.SCR` file in the `SCREENS` folder,
or a `.pom` file in the `tiled/maps` folder. While the original `.SCR`
files do not indicate the level number in the file name, the `.pom`
files indicate both the level number and password, and internally point
at the appropriate `.SCR` file.

### Layers

Background, foreground and domino editing is supported. All of these
are available in the _Tilesets_ panel after opening a level.

Each level has three layers (see _Layers_ panel): a foreground layer,
background layer and domino layer. All of these are tile layers.
Tiled allows you to add any kind of tiles to any layer, so it is easy to
accidentally add foreground tiles to the background layer or vice versa.
Upon saving a level a warning will appear in the _Issues_ panel in that case.
The _Highlight current layer_ feature in the bottom right of the
_Layers_ tab should help you avoid placing tiles on the wrong layer.

Each foreground tileset has an entrance door (last tile of the foreground
tileset) and an exit door (4th to last tile of the foreground tileset).
These need to be placed in the map, otherwise they will be placed in
default positions (a warning will appear in the _Issues_ panel).

### Properties

The level map has custom properties that appear in the properties panel
when opening the map. Later on, you can bring back the properties of
the map by selecting _Map -> Map Properties_. Properties include the time
limit, author initials, hints (in 4 languages) and a sequence of inputs
forming a demo solution (optional).

To change the theme of the map, edit the `theme` property.
The theme change only takes effect after closing
and reopening the map. Background is erased in the process.

### Background Tile Stamps

Backgrounds are hard to edit tile by tile. _Tile stamps_ make editing
easier by grouping tiles into sensible units that can be applied to the
background. I have only partially compiled tile stamps, especially for
_Mechanic_, _Toxcity_, _Electro_, _Space_ and _Aztec_ more can be done,
and no stamps are available for the _Cavern_ theme yet.
Contributions are appreciated; looking at the original levels can help
to understand tile usage and create new stamps.

To open a folder of tile stamps, click the little _Set Stamps Folder_
icon at the bottom right of the tile stamps panel and select the stamps
for the appropriate theme. You can then apply stamps and create your own.
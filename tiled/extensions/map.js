var extract_string = function(uint8slice) {
	var bytes = Array.from(uint8slice.filter((value) => value != 0));
	return String.fromCharCode.apply(null, bytes);
};

var write_string = function(text, array, start, maxlength) {
	for (i=0; i<Math.max(text.length, maxlength); i++) {
		array[start+i] = text.charCodeAt(i);
	}
};

var theme_from_data = function(data) {
	return extract_string(data.slice(0x618, 0x622)).toLowerCase();
};

var KEYS_MASKS = {
	'.': 0x00,
	'S': 0x80,
	'U': 0x01,
	'D': 0x02,
	'L': 0x04,
	'R': 0x08, 
	'4': 0x10, 
	'5': 0x20, 
	'6': 0x40
};

var write_map = function(filename, fglayer, bglayer, domlayer, map) {
	if (!fglayer.isTileLayer || !bglayer.isTileLayer || !domlayer.isTileLayer) {
		tiled.warn("Invalid layer format. Level not saved.");
		return false;
	}

	// Write meta
	var theme = map.property("theme");
	var data = new Uint8Array(0xF76);
	write_string(theme.toUpperCase(), data, 0x618, 9);
	write_string("SILENCE", data, 0x622, 7);
	write_string(map.property("author"), data, 0x630, 3);
	data[0x774] = map.property("time_minutes");
	data[0x775] = map.property("time_seconds");

	// Write hints
	var langs = ['en', 'fr', 'de', 'es'];  // O = $, U = %
	for (let langid = 0; langid < 4; ++langid) {
		let lang = langs[langid];
		for (let i = 0; i < 5; i++) {
			let hint = map.property(`zhint_${lang}${i}`).replace('Ö', '$').replace('Ü', '%').padEnd(15);
			write_string(hint, data, 0x634+80*langid+16*i, 15);
		}
	}

	// Write demo
	var demo = map.property("demo").split(' ');
	for (let i = 0; i < Math.max(0x800, demo.length); i++) {
		let frame = demo[i];
		if (frame) for (var k of frame) {
			data[i+0x776] |= KEYS_MASKS[k] ?? 0x00;
		}
	}

	// Write map layout
	write_layers(data, theme, fglayer, bglayer, domlayer);

	var fgfile = new BinaryFile(filename, BinaryFile.ReadWrite);
	fgfile.resize(0);
	fgfile.write(data.buffer);
	fgfile.commit();
	return true;
};

var read_map = function(data, theme, fgtileset, bgtileset, domtileset) {
	var tilemap = new TileMap();
	tilemap.setSize(20, 13);
	tilemap.setTileSize(16, 16);
	tilemap.setProperty("theme", theme);

	// Read meta
	var author = extract_string(data.slice(0x630, 0x634));
	var silence = extract_string(data.slice(0x622, 0x62C));
	tilemap.setProperty("mode", "foreground");
	tilemap.setProperty("author", author);
	tilemap.setProperty("time_minutes", data[0x774]);
	tilemap.setProperty("time_seconds", data[0x775]);

	// Read hints
	var langs = ['en', 'fr', 'de', 'es'];  // O = $, U = %
	for (let langid = 0; langid < 4; ++langid) {
		let lang = langs[langid];
		for (let i = 0; i < 5; i++) {
			let hint = extract_string(data.slice(0x634+80*langid+16*i, 0x634+80*langid+16*i+15)).replace('$', 'Ö').replace('%', 'Ü');
			tilemap.setProperty(`zhint_${lang}${i}`, hint);
		}
	}

	// Read demo
	var chars = [];
	var max_nontrivial = 0;
	for (let off = 0x776; off < 0xF76; ++off) {
		let str = '';
		for (const [key, mask] of Object.entries(KEYS_MASKS)) {
			if (data[off] & mask) {
				str += key;
			}
		}
		if (data[off] != 0) max_nontrivial = off-0x776;
		if (str == '') str = '.';
		chars.push(str);
	}
	var demo = chars.slice(0, max_nontrivial+1).join(' ');
	tilemap.setProperty("demo", demo);

	// Read map layout
	var layers = read_layers(data, fgtileset, bgtileset, domtileset);
	var fglayer = layers[0];
	var bglayer = layers[1];
	var domlayer = layers[2];
	domlayer.offset = Qt.point(0, -12);

	tilemap.addTileset(fgtileset);
	tilemap.addTileset(bgtileset);
	tilemap.addTileset(domtileset);
	tilemap.addLayer(bglayer);
	tilemap.addLayer(fglayer);
	tilemap.addLayer(domlayer);
	return tilemap;
};


var write_layers = function(data, theme, fglayer, bglayer, domlayer) {
	var xexit = null;
	var yexit = null;
	var xentrance = null;
	var yentrance = null;

	for (var y = 0; y < fglayer.height; ++y) {
		for (var x = 0; x < fglayer.width; ++x) {
			let off = 6*(x + fglayer.width*y);

			if (bglayer.tileAt(x, y) != null && bglayer.tileAt(x, y).tileset != null) {
				if (bglayer.tileAt(x, y).tileset.name == "bg_" + theme) {
					data[off] = Math.floor(bglayer.tileAt(x, y).id / 0x100);
					data[off+1] = bglayer.tileAt(x, y).id % 0x100;
				} else {
					tiled.warn("Background tile from invalid tileset at (" + x + ", " + y + "). Using ID 0.");
				}
			}
			if (fglayer.tileAt(x, y) != null && fglayer.tileAt(x, y).tileset != null) {
				if (fglayer.tileAt(x, y).tileset.name.startsWith("fg_")) {
					let tid = fglayer.tileAt(x, y).id;
					data[off + 2] = tid;
					if (tid == 0x14) {
						xexit = x;
						yexit = y;
					} else if (tid == 0x17) {
						xentrance = x;
						yentrance = y;
					}
				} else {
					tiled.warn("Foreground tile from invalid tileset at (" + x + ", " + y + "). Using ID 0.");
				}
			}
			if (domlayer.tileAt(x, y) != null && domlayer.tileAt(x, y).tileset != null) {
				if (domlayer.tileAt(x, y).tileset.name == "dominoes") {
					data[off + 3] = domlayer.tileAt(x, y).id;
				} else {
					tiled.warn("Domino tile from invalid tileset at (" + x + ", " + y + "). Using ID 0.");
				}
			}
		}
	}

	if (xexit == null) {
		tiled.warn("No exit door found in foreground layout. Setting to position (1, 1).");
		xexit = 1;
		yexit = 1;
	}
	if (xentrance == null) {
		tiled.warn("No entrance door found in foreground layout. Setting to position (2, 1).");
		xentrance = 2;
		yentrance = 1;
	}

	data[0x62C] = xentrance;
	data[0x62D] = yentrance;
	data[0x62E] = xexit;
	data[0x62F] = yexit;
};

var read_layers = function(data, fgtileset, bgtileset, domtileset) {
	var fglayer = new TileLayer("foreground");
	fglayer.width = 20;
	fglayer.height = 13;
	var bglayer = new TileLayer("background");
	bglayer.width = 20;
	bglayer.height = 13;
	var domlayer = new TileLayer("dominoes");
	domlayer.width = 20;
	domlayer.height = 13;

	// Get an editable version of the tile layer.
	var fgedit = fglayer.edit();
	var bgedit = bglayer.edit();
	var domedit = domlayer.edit();

	for (var x = 0; x < fglayer.width; ++x) {
		for (var y = 0; y < fglayer.height; ++y) {
			let off = 6*(x + fglayer.width*y);
			var bgid = data[off+1] + (data[off] << 8);
			var fgid = data[off + 2];
			var domid = data[off + 3];
			if (fgid < fgtileset.tileCount) {
				fgedit.setTile(x, y, fgtileset.tile(fgid));
			} else {
				tiled.warn("Invalid foreground tile at (" + x + ", " + y + ").");
				fgedit.setTile(x, y, fgtileset.tile(0));
			}
			if (bgid < bgtileset.tileCount) {
				bgedit.setTile(x, y, bgtileset.tile(bgid));
			} else {
				tiled.warn("Invalid background tile at (" + x + ", " + y + ").");
				bgedit.setTile(x, y, bgtileset.tile(0));
			}
			if (domid < domtileset.tileCount) {
				domedit.setTile(x, y, domtileset.tile(domid));
			} else {
				tiled.warn("Invalid domino tile at (" + x + ", " + y + ").");
				domedit.setTile(x, y, domtileset.tile(0));
			}
		}
	}

	var x_entrance = data[0x62C];
	var y_entrance = data[0x62D];
	var x_exit = data[0x62E];
	var y_exit = data[0x62F];
	if (x_exit < fglayer.width && y_exit < fglayer.height) {
		fgedit.setTile(x_exit, y_exit, fgtileset.tile(0x14));
	} else {
		tiled.warn(`Invalid exit position (${x_exit}, ${y_exit}) in level file.`);
	}
	if (x_entrance < fglayer.width && y_entrance < fglayer.height) {
		fgedit.setTile(x_entrance, y_entrance, fgtileset.tile(0x17));
	} else {
		tiled.warn(`Invalid entrance position (${x_entrance}, ${y_entrance}) in level file.`);
	}

	fgedit.apply();
	bgedit.apply();
	domedit.apply();
	return [fglayer, bglayer, domlayer];
};
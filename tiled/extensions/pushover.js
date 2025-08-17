var scrMapFormat = {
    name: "Pushover map",
    extension: "SCR",

	read: function(fileName) {
		var levelfile = new BinaryFile(fileName, BinaryFile.ReadOnly);
		var data = new Uint8Array(levelfile.readAll());
		levelfile.close();

		var theme = theme_from_data(data);

		var file_path = FileInfo.path(FileInfo.fromNativeSeparators(fileName));
		var path_fgtileset = FileInfo.joinPaths(file_path, `../tiled/foreground/${theme}.tsx`);
		var path_bgtileset = FileInfo.joinPaths(file_path, `../tiled/background/${theme}.tsx`);
		var path_domtileset = FileInfo.joinPaths(file_path, "../tiled/dominoes.tsx");

		var fgtileset = tiled.tilesetFormat("tsx").read(path_fgtileset);
		if (fgtileset == null) {
			tiled.error("Tileset file " + path_fgtileset + " not found.");
			return;
		}

		var bgtileset = tiled.tilesetFormat("tsx").read(path_bgtileset);
		if (bgtileset == null) {
			tiled.error("Tileset file " + path_bgtileset + " not found.");
			return;
		}

		var domtileset = tiled.tilesetFormat("tsx").read(path_domtileset);
		if (domtileset == null) {
			tiled.error("Tileset file " + path_domtileset + " not found.");
			return;
		}

		return read_map(data, theme, fgtileset, bgtileset, domtileset);
	},

	write: function(map, fileName) {
		var fglayout = null;
		var bglayout = null;
		var domlayout = null;

		for (var lid = 0; lid < map.layerCount; ++lid) {
			layer = map.layerAt(lid);
			if (layer.name == "foreground") {
				fglayout = layer;
			} else if (layer.name == "background") {
				bglayout = layer;
			} else if (layer.name == "dominoes") {
				domlayout = layer;
			} 
		}

		if (!fglayout) {
			tiled.warn("No valid foreground layer found. No data saved.");
			return;
		}
		if (!bglayout) {
			tiled.warn("No valid block layer found. No data saved.");
			return;
		}
		if (!domlayout) {
			tiled.warn("No valid object layer found. No data saved.");
			return;
		}

		write_map(fileName, fglayout, bglayout, domlayout, map)
	}

};

tiled.registerMapFormat("scr", scrMapFormat);

var scr_from_pom = function(fileName) {
	var pomfile = new TextFile(fileName, TextFile.ReadOnly);
	var scrFile = pomfile.readAll().trim();
	pomfile.close();
	var file_path = FileInfo.path(FileInfo.fromNativeSeparators(fileName));
	return FileInfo.joinPaths(file_path, '../..', scrFile);
};

var pomMapFormat = {
    name: "Pushover map",
    extension: "pom",

	//Function for reading from a kclv file
	read: function(fileName) {
		var scrFile = scr_from_pom(fileName);
		return scrMapFormat.read(scrFile);
	},
	
	write: function(map, fileName) {
		var scrFile = scr_from_pom(fileName);
		scrMapFormat.write(map, scrFile);
	}
};

tiled.registerMapFormat("pom", pomMapFormat);
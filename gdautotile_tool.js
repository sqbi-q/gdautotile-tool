
class Tilemap {
    constructor(title, canvas){
        this.title = title;
        this.canvas = canvas;
    }
    title = "unnamed tilemap";
    canvas = null;
    tileset_config = {
        "tile_width": 8,
        "tile_height": 8,
        "offset_x": 0,
        "offset_y": 0,
        "margin_x": 0,
        "margin_y": 0,

        getTotalTileWidth() { return this.tile_width+this.margin_x; },
        getTotalTileHeight() { return this.tile_height+this.margin_y; },
        tileX_to_x(tile_x) { return tile_x*this.getTotalTileWidth(); },
        tileY_to_y(tile_y) { return tile_y*this.getTotalTileHeight(); },
    };

    _bitmask_current_tile = [];
    tiles_bitmask = {};
    getTilesNonEmptyBitmask() {
        return Object.fromEntries(
            Object.entries(this.tiles_bitmask).filter(
                ([key, val]) => val.length > 0
        ));
    } 
    
    setCurrentTileBitmask(bitmask_array) { this.tiles_bitmask[this._bitmask_current_tile] = bitmask_array; }
    getCurrentTileBitmask() { 
        if (this.tiles_bitmask.hasOwnProperty(this._bitmask_current_tile))
            return this.tiles_bitmask[this._bitmask_current_tile]; 
        return [];
    }

    getBitmaskTilesPos() {
        let tiles_pos = [];
        for (const tile_pos_key in this.getTilesNonEmptyBitmask()) {
            tiles_pos.push(
                tile_pos_key.split(',').map((v) => {
                    return parseInt(v);
                })
            );
        }
        return tiles_pos;
    }
    
}
let tilemaps = [];

let current_tilemap = null;
function setCurrentTilemap(index) {
    current_tilemap = tilemaps[index];
    
    update_tilemaps_list();
    update_tilesetConfig_form();
    displayCurrentTilemap();
}

function createNewTilemap() {
    tilemaps.push(new Tilemap("New Tilemap", document.createElement('canvas')));
    update_tilemaps_list();
}


let tilemap_list = document.getElementById("tilemap_list");
function update_tilemaps_list() {
    tilemap_list.replaceChildren();

    var i = 0;
    for (const tilemap of tilemaps) {
        let child = document.createElement('li');
        child.innerHTML = 
            `<button ${(tilemap == current_tilemap) ? 'style="background-color:gray;"' : 'style=""'}`
            +`onclick="setCurrentTilemap(${i});">${tilemap.title}</button>`;
        
        let download_a = document.createElement('a');
        download_a.setAttribute("download", `${tilemap.title}_${i}.png`);
        download_a.innerHTML = 
        `<div style="display: flex; flex-direction: column; align-items: center;">
            <small>canvas</small>
            <span class="material-icons">
                file_download
            </span>
        </div>`;

        let index = i;
        download_a.addEventListener("click", () => {
            download_a.setAttribute("href", tilemaps[index].canvas.toDataURL("image/png")
                .replace("image/png", "image/octet-stream"));
            update_tilemaps_list();
        });

        child.appendChild(download_a);
        tilemap_list.appendChild(child);
        i++;
    }
}





let tilesetConfig_form = document.getElementById("tileset_configuration");
function onTilesetConfig_change() {
    set_tilemap_tilesetConfig();
    displayCurrentTilemap();
}

function set_tilemap_tilesetConfig(){
    for (const elem of tilesetConfig_form.elements) {
        current_tilemap.tileset_config[elem.name] = parseInt(elem.value);
    }
}

function update_tilesetConfig_form() {
    if (current_tilemap != null){
        document.getElementById("tilemap_configuration").style.display = "block";
        for (let elem of tilesetConfig_form.elements)
            elem.value = current_tilemap.tileset_config[elem.name].toString();
    }
    else
        document.getElementById("tilemap_configuration").style.display = "none";
}





let loadedimg_canvas = document.getElementById("loadedimg_viewer");
let draw_grid_checkbox = document.getElementById("draw_grid_checkbox");
function displayCurrentTilemap() {
    let srcimg = current_tilemap.canvas.toDataURL();

    let image = new Image();
    image.onload = function() {
        let destctx = loadedimg_canvas.getContext('2d');

        loadedimg_canvas.width = image.width;
        loadedimg_canvas.height = image.height;

        destctx.drawImage(image, 0, 0);

        if (draw_grid_checkbox.checked) {
            drawGrid(destctx);
        }

        if (crop_option_elem.checked){
            destctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            destctx.strokeStyle = 'rgb(255, 255, 255)';
            if (cropSelection.getPointsSize() == 1) {
                drawTile(destctx,
                    cropSelection.points[0].x,
                    cropSelection.points[0].y
                );
            }
            else if (cropSelection.getPointsSize() == 2){
                drawTile(destctx,
                    cropSelection.getSelectionX(), cropSelection.getSelectionY(),
                    cropSelection.getSelectionWidth(), cropSelection.getSelectionHeight()
                );
            }
            destctx.fillStyle = 'black';
            destctx.strokeStyle = 'black';
        }

        else if (bitmask_edit_option_elem.checked) {

            destctx.fillStyle = 'rgba(0, 155, 0, 0.5)';
            destctx.strokeStyle = 'rgb(0, 155, 0)';

            for (const tile_pos of current_tilemap.getBitmaskTilesPos())
                drawTile(destctx, tile_pos[0], tile_pos[1]);


            destctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
            destctx.strokeStyle = 'rgb(0, 0, 255)';

            let tile_pos = current_tilemap._bitmask_current_tile;
            if (tile_pos != null)
                drawTile(destctx, tile_pos[0], tile_pos[1]);

            destctx.fillStyle = 'black';
            destctx.strokeStyle = 'black';
        }
    };
    image.src = srcimg;
}


function drawGrid(ctx) {
    let tileset_conf = current_tilemap.tileset_config;
    for (var x=tileset_conf.offset_x; x<loadedimg_canvas.width;){
        ctx.beginPath();
        ctx.moveTo(x, tileset_conf.offset_y);
        ctx.lineTo(x, loadedimg_canvas.height);
        ctx.stroke();

        x+=tileset_conf.tile_width;

        ctx.fillRect(
            x, tileset_conf.offset_y, 
            tileset_conf.margin_x, loadedimg_canvas.height
        );
        
        x+=tileset_conf.margin_x;
    }

    for (var y=tileset_conf.offset_y; y<loadedimg_canvas.height;){
        ctx.beginPath();
        ctx.moveTo(tileset_conf.offset_x, y);
        ctx.lineTo(loadedimg_canvas.width, y);
        ctx.stroke();

        y+=tileset_conf.tile_height;

        ctx.fillRect(
            tileset_conf.offset_x, y,
            loadedimg_canvas.width, tileset_conf.margin_y
        );

        y+=tileset_conf.margin_y;
    }
}

function drawTile(ctx, x, y, w=1, h=1){
    var img_x = x*current_tilemap.tileset_config.getTotalTileWidth();
    var img_y = y*current_tilemap.tileset_config.getTotalTileHeight();

    var imgWidth = w*current_tilemap.tileset_config.getTotalTileWidth();
    var imgHeight = h*current_tilemap.tileset_config.getTotalTileHeight();

    ctx.fillRect(img_x, img_y, imgWidth, imgHeight);
    ctx.beginPath();
    ctx.rect(img_x, img_y, imgWidth, imgHeight);
    ctx.stroke();
}


let imgdrop_elem = document.getElementById("imgdrop");
imgdrop_elem.addEventListener("dragover", (e) => {e.preventDefault();}, false);

imgdrop_elem.addEventListener("drop", (event) => {
    event.preventDefault();

    let imgFile = event.dataTransfer.files[0];

    const imgReader = new FileReader();
    imgReader.addEventListener("load", onImageRead, false);
    imgReader.readAsDataURL(imgFile);
}, false);

imgdrop_elem.addEventListener("paste", (event) => {
    event.preventDefault();

    let imgFile = event.clipboardData.files[0];

    const imgReader = new FileReader();
    imgReader.addEventListener("load", onImageRead, false);
    imgReader.readAsDataURL(imgFile);
}, false);


function onImageRead(event) {
    let srcimg = event.target.result;

    let image = new Image();
    image.onload = function() {
        let destctx = current_tilemap.canvas.getContext('2d');
        current_tilemap.canvas.width = image.width;
        current_tilemap.canvas.height = image.height;
        destctx.drawImage(image, 0, 0);
        displayCurrentTilemap();
    };
    image.src = srcimg;
}




function onclick_tilemapName_btt() {
    let result = prompt("Type new tilemap name:");
    if (result == null || result.length < 1) return;
    current_tilemap.title = result;
    update_tilemaps_list();
}

function onclick_deleteTilemap_btt() {
    tilemaps = tilemaps.filter((e) => {
        return e != current_tilemap;
    });
    current_tilemap = null;
    update_tilemaps_list();
    update_tilesetConfig_form();
}







// SELECTING AND CROPPING
class Point {
    constructor(x=0, y=0){
        this.x=x;
        this.y=y;
    }
}

class SquareSelection {
    points = [];
    constructor(...tilePoints){
        this.points = tilePoints;
    }
    clearPoints() { this.points = []; }
    pushPoint(point) { 
        if (this.getPointsSize() >= 2) this.clearPoints();
        this.points.push(point);
    }
    getPointsSize() { return this.points.length; }

    getSelectionX() {
        // console.log(this.points[0].x, this.points[1].x);
        return Math.min(this.points[0].x, this.points[1].x); 
    }
    getSelectionY() { 
        return Math.min(this.points[0].y, this.points[1].y); 
    }
    getSelectionWidth() { return Math.abs(this.points[0].x - this.points[1].x)+1; }
    getSelectionHeight() { return Math.abs(this.points[0].y - this.points[1].y)+1; }
}
let cropSelection = new SquareSelection();


function getTile(destctx, x, y, w=1, h=1) {
    var image = new Image();

    var img_x = current_tilemap.tileset_config.tileX_to_x(x);
    var img_y = current_tilemap.tileset_config.tileY_to_y(y);
    var img_w = current_tilemap.tileset_config.tileX_to_x(w);
    var img_h = current_tilemap.tileset_config.tileY_to_y(h);

    image.onload = () => {
        destctx.drawImage(image, img_x, img_y, img_w, img_h, 0, 0, img_w, img_h);
    }
    image.src = current_tilemap.canvas.toDataURL();
}


loadedimg_canvas.addEventListener("click", onLoadedImgClicked, false);


//on editing_option changed
document.querySelectorAll("input[name='editing_option']").forEach((input) => {
    input.addEventListener('change', () => {
        cropSelection.clearPoints();
        crop_btt.disabled = true;
        
        current_tilemap._bitmask_current_tile = null;
        reset_bitmaskSelection();

        update_bitmaskInputs();
        displayCurrentTilemap();
    });
});


let crop_option_elem = document.getElementById("crop_option");
let bitmask_edit_option_elem = document.getElementById("bitmask_option");

function onLoadedImgClicked(event) {
    if (crop_option_elem.checked) cropSelect(event);
    else if (bitmask_edit_option_elem.checked) bitmaskEdit(event);
}



let crop_btt = document.getElementById("crop_button");
function cropSelect(event) {
    crop_btt.disabled = true;

    if (current_tilemap == null) return;
    var ntile_x, ntile_y;

    for (ntile_x=0; ntile_x*current_tilemap.tileset_config.getTotalTileWidth()<event.layerX; ntile_x++);
    for (ntile_y=0; ntile_y*current_tilemap.tileset_config.getTotalTileHeight()<event.layerY; ntile_y++);

    cropSelection.pushPoint(new Point(ntile_x-1, ntile_y-1));

    crop_btt.disabled = !(cropSelection.getPointsSize() == 2);

    displayCurrentTilemap();
}


function onCropbtt_clicked() {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    canvas.width = current_tilemap.tileset_config.tileX_to_x(cropSelection.getSelectionWidth());
    canvas.height = current_tilemap.tileset_config.tileY_to_y(cropSelection.getSelectionHeight());
    getTile(ctx,
        cropSelection.getSelectionX(), cropSelection.getSelectionY(),
        cropSelection.getSelectionWidth(), cropSelection.getSelectionHeight()
    );

    let tilemap = new Tilemap("New Cropped Tilemap", canvas);
    tilemaps.push(tilemap);
    update_tilemaps_list();
}




function bitmaskEdit(event) {
    current_tilemap._bitmask_current_tile = null;
    reset_bitmaskSelection();

    if (current_tilemap == null) return;
    var ntile_x, ntile_y;

    for (ntile_x=0; ntile_x*current_tilemap.tileset_config.getTotalTileWidth()<event.layerX; ntile_x++);
    for (ntile_y=0; ntile_y*current_tilemap.tileset_config.getTotalTileHeight()<event.layerY; ntile_y++);

    current_tilemap._bitmask_current_tile = [ntile_x-1, ntile_y-1];

    update_bitmaskSelection();
    displayCurrentTilemap();
}

let bitmaskInput_table = document.getElementById("bitmask_input_table");
function onBitmaskInputChange() {
    tile_bitmask = [];

    let row_i = 0;
    for (const row of bitmaskInput_table.rows) {
        let cell_i = 0;
        for (const cell of row.cells) {
            if (cell.firstChild.checked)
                tile_bitmask.push([cell_i, row_i]);
            cell_i++;
        }
        row_i++;
    }
    current_tilemap.setCurrentTileBitmask(tile_bitmask);

    displayCurrentTilemap();
}


function _bitmaskSelectionInnerHTML(bitmaskType) {
    switch (bitmaskType) {
        case "2x2":
            return `
            <table id="bitmask_input_table">
                <tr>
                    <td><input type="checkbox" onchange="onBitmaskInputChange();" disabled></td>
                    <td><input type="checkbox" onchange="onBitmaskInputChange();" disabled></td>
                </tr>

                <tr>
                    <td><input type="checkbox" onchange="onBitmaskInputChange();" disabled></td>
                    <td><input type="checkbox" onchange="onBitmaskInputChange();" disabled></td>
                </tr>
            </table>`;
            break;
        
        case "3x3_minimal":
        case "3x3":
            return `
            <table id="bitmask_input_table">
                <tr>
                    <td><input type="checkbox" onchange="onBitmaskInputChange();" disabled></td>
                    <td><input type="checkbox" onchange="onBitmaskInputChange();" disabled></td>
                    <td><input type="checkbox" onchange="onBitmaskInputChange();" disabled></td>
                </tr>
                <tr>
                    <td><input type="checkbox" onchange="onBitmaskInputChange();" disabled></td>
                    <td><input type="checkbox" onchange="onBitmaskInputChange();" disabled></td>
                    <td><input type="checkbox" onchange="onBitmaskInputChange();" disabled></td>
                </tr>
                <tr>
                    <td><input type="checkbox" onchange="onBitmaskInputChange();" disabled></td>
                    <td><input type="checkbox" onchange="onBitmaskInputChange();" disabled></td>
                    <td><input type="checkbox" onchange="onBitmaskInputChange();" disabled></td>
                </tr>
            </table>
            `;
            break;
    }
}


let bitmaskSelection_elem = document.getElementById("bitmask_selection");
function onBitmaskTypeChange(type_value) {
    bitmaskSelection_elem.innerHTML = _bitmaskSelectionInnerHTML(type_value);
    bitmaskInput_table = document.getElementById("bitmask_input_table");
    update_bitmaskSelection();
    update_bitmaskInputs();
}


function update_bitmaskInputs() {
    for (const row of bitmaskInput_table.rows) 
        for (const cell of row.cells)
            cell.firstChild.disabled = !bitmask_edit_option_elem.checked;
}

function reset_bitmaskSelection() {
    for (const row of bitmaskInput_table.rows)
        for (const cell of row.cells) 
            cell.firstChild.checked = false;
}

function update_bitmaskSelection() {
    reset_bitmaskSelection();

    for (const input_pos of current_tilemap.getCurrentTileBitmask())
        bitmaskInput_table.rows[input_pos[1]].cells[input_pos[0]].firstChild.checked = true;
}



function generateGDTresTileset() {
    
}
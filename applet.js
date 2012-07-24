const Applet = imports.ui.applet;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Cinnamon = imports.gi.Cinnamon;
const GTop = imports.gi.GTop;

const REFRESH_RATE = 1000;

function MyApplet(orientation) {
    this._init(orientation);
}


MyApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(orientation) {        
        Applet.TextIconApplet.prototype._init.call(this, orientation);
        
        try {                 
            this.set_applet_icon_symbolic_name('utilities-system-monitor-symbolic');
            this._orientation = orientation;
            this.cinnamonMem = new CinnamonMemMonitor();
            this.initialTime = new Date();

            this._pulse();
        }
        catch (e) {
            global.logError(e);
        }
    },

    _pulse: function() {
        let now = new Date();
        let raw = this.cinnamonMem.getData();
        let elapsed = (now.getTime() - this.initialTime.getTime()) / 60000; // get elapsed minutes
        let delta = ((raw - this.cinnamonMem.getStartMem())/1024) / elapsed;
        let ttip;
        if (delta > 0) {
            ttip = "+" + delta.toFixed(2) + "k/min (click to reset)";
        } else if (delta < 0) {
            ttip = "-" + delta.toFixed(2) + "k/min (click to reset)";
        } else {
            ttip = "flat (click to reset)";
        }
        let label = (raw/1048576).toFixed(2) + "m";
        this.set_applet_label(label);
        this.set_applet_tooltip(ttip);
        Mainloop.timeout_add(REFRESH_RATE, Lang.bind(this, this._pulse));
    },

    on_applet_clicked: function(event) {
        this.cinnamonMem.resetStats();
        this.initialTime = new Date();
    },
    
    on_orientation_changed: function (orientation) {
        this._orientation = orientation;
        // this._initContextMenu();
    }
};

function CinnamonMemMonitor() {
    this._init();
}

CinnamonMemMonitor.prototype = {

    _init: function() {
        try {
            this.pid = global.get_pid();
            this.procMem = new GTop.glibtop_proc_mem();
            GTop.glibtop.get_proc_mem(this.procMem, this.pid);
            this.startMem = this.procMem.resident;
        } catch (e) {
            global.logError(e);
        }
    },

    getData: function() {
        GTop.glibtop.get_proc_mem(this.procMem, this.pid);
        return this.procMem.resident;
    },

    getStartMem: function() {
        return this.startMem;
    },

    resetStats: function() {
        this.startMem = this.getData();
    }
};

function main(metadata, orientation) {  
    let myApplet = new MyApplet(orientation);
    return myApplet;      
}

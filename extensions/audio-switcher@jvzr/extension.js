// @ts-nocheck
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import { AudioManager } from './audioManager.js';
// Available icon names
const AVAILABLE_ICONS = ['headphones', 'desktop-speakers', 'large-speakers', 'earbuds'];
// Function to create SVG icon
function createSvgIcon(iconName, extensionPath) {
    if (!AVAILABLE_ICONS.includes(iconName)) {
        return new St.Label({ text: '🎧' }); // Fallback
    }
    try {
        const iconPath = `${extensionPath}/icons/${iconName}.svg`;
        const file = Gio.File.new_for_path(iconPath);
        if (file.query_exists(null)) {
            const gicon = Gio.FileIcon.new(file);
            return new St.Icon({
                gicon: gicon,
                icon_size: 16,
                style_class: 'system-status-icon'
            });
        }
    }
    catch (error) {
        console.error(`Error loading icon ${iconName}:`, error);
    }
    // Fallback to emoji
    const fallbacks = {
        'headphones': '🎧',
        'desktop-speakers': '🔊',
        'large-speakers': '📢',
        'earbuds': '🎵'
    };
    return new St.Label({
        text: fallbacks[iconName] || '🎧',
        style_class: 'system-status-icon'
    });
}
const AudioSwitcherIndicator = GObject.registerClass(class AudioSwitcherIndicator extends PanelMenu.Button {
    _settings;
    _audioManager;
    _iconWidget;
    _extensionPath;
    constructor(settings, extensionPath) {
        super(0.0, 'Audio Switcher', false);
        this._settings = settings;
        this._audioManager = new AudioManager();
        this._extensionPath = extensionPath;
        // Start with default icon
        this._iconWidget = createSvgIcon('headphones', this._extensionPath);
        this._iconWidget.y_align = Clutter.ActorAlign.CENTER;
        this.add_child(this._iconWidget);
        // Connect to click event
        this.connect('button-press-event', () => {
            this._toggleAudio();
            return Clutter.EVENT_PROPAGATE;
        });
        this._updateIndicator();
    }
    async _toggleAudio() {
        const output1 = this._settings.get_string('output-1');
        const output2 = this._settings.get_string('output-2');
        if (!output1 || !output2) {
            Main.notify('Audio Switcher', 'Please configure both audio outputs in extension settings');
            return;
        }
        const currentDefault = await this._audioManager.getCurrentDefault();
        let targetOutput;
        if (currentDefault === output1) {
            targetOutput = output2;
        }
        else {
            targetOutput = output1;
        }
        // Check if target output is available
        const isAvailable = await this._audioManager.isOutputAvailable(targetOutput);
        if (!isAvailable) {
            const fallbackOutput = currentDefault === output1 ? output1 : output2;
            const isFallbackAvailable = await this._audioManager.isOutputAvailable(fallbackOutput);
            if (isFallbackAvailable) {
                Main.notify('Audio Switcher', `Target output unavailable, staying on current output`);
            }
            else {
                Main.notify('Audio Switcher', 'Neither configured output is available');
            }
            return;
        }
        const success = await this._audioManager.switchToOutput(targetOutput);
        if (success) {
            this._updateIndicator();
        }
        else {
            Main.notify('Audio Switcher', 'Failed to switch audio output');
        }
    }
    async _updateIndicator() {
        const output1 = this._settings.get_string('output-1');
        const output2 = this._settings.get_string('output-2');
        const icon1 = this._settings.get_string('indicator-icon-1');
        const icon2 = this._settings.get_string('indicator-icon-2');
        if (!output1 || !output2) {
            this._updateIcon('headphones'); // Default config icon
            return;
        }
        const currentDefault = await this._audioManager.getCurrentDefault();
        if (currentDefault === output1) {
            this._updateIcon(icon1);
        }
        else if (currentDefault === output2) {
            this._updateIcon(icon2);
        }
        else {
            this._updateIcon('headphones'); // Unknown state
        }
    }
    _updateIcon(iconName) {
        // Remove current icon
        this.remove_child(this._iconWidget);
        // Create new icon
        this._iconWidget = createSvgIcon(iconName, this._extensionPath);
        this._iconWidget.y_align = Clutter.ActorAlign.CENTER;
        // Add new icon
        this.add_child(this._iconWidget);
    }
    updateFromSettings() {
        this._updateIndicator();
    }
});
const AudioSwitcherSystemIndicator = GObject.registerClass(class AudioSwitcherSystemIndicator extends QuickSettings.SystemIndicator {
    _settings;
    _audioManager;
    _extensionPath;
    _indicator;
    constructor(settings, extensionPath) {
        super();
        this._settings = settings;
        this._audioManager = new AudioManager();
        this._extensionPath = extensionPath;
        // Create the panel icon
        this._indicator = this._addIndicator();
        this._indicator.icon_name = 'audio-headphones-symbolic';
        // Make the indicator clickable
        this.reactive = true;
        this.track_hover = true;
        // Connect to click event
        this.connect('button-press-event', () => {
            this._toggleAudio();
            return Clutter.EVENT_STOP;
        });
        this._updateIndicator();
    }
    async _toggleAudio() {
        const output1 = this._settings.get_string('output-1');
        const output2 = this._settings.get_string('output-2');
        if (!output1 || !output2) {
            Main.notify('Audio Switcher', 'Please configure both audio outputs in extension settings');
            return;
        }
        const currentDefault = await this._audioManager.getCurrentDefault();
        let targetOutput;
        if (currentDefault === output1) {
            targetOutput = output2;
        }
        else {
            targetOutput = output1;
        }
        const isAvailable = await this._audioManager.isOutputAvailable(targetOutput);
        if (!isAvailable) {
            Main.notify('Audio Switcher', `Target output unavailable`);
            return;
        }
        const success = await this._audioManager.switchToOutput(targetOutput);
        if (success) {
            this._updateIndicator();
        }
        else {
            Main.notify('Audio Switcher', 'Failed to switch audio output');
        }
    }
    async _updateIndicator() {
        const output1 = this._settings.get_string('output-1');
        const output2 = this._settings.get_string('output-2');
        const icon1 = this._settings.get_string('indicator-icon-1');
        const icon2 = this._settings.get_string('indicator-icon-2');
        if (!output1 || !output2) {
            this._indicator.icon_name = 'audio-headphones-symbolic';
            return;
        }
        const currentDefault = await this._audioManager.getCurrentDefault();
        // Map custom icons to symbolic names
        const iconMap = {
            'headphones': 'audio-headphones-symbolic',
            'desktop-speakers': 'audio-speakers-symbolic',
            'large-speakers': 'audio-speakers-symbolic',
            'earbuds': 'audio-headset-symbolic'
        };
        if (currentDefault === output1) {
            this._indicator.icon_name = iconMap[icon1] || 'audio-headphones-symbolic';
        }
        else if (currentDefault === output2) {
            this._indicator.icon_name = iconMap[icon2] || 'audio-speakers-symbolic';
        }
        else {
            this._indicator.icon_name = 'audio-headphones-symbolic';
        }
    }
    updateFromSettings() {
        this._updateIndicator();
    }
});
const AudioSwitcherQuickToggle = GObject.registerClass(class AudioSwitcherQuickToggle extends QuickSettings.QuickToggle {
    _settings;
    _audioManager;
    constructor(settings) {
        super({
            title: 'Audio Output',
            iconName: 'audio-speakers-symbolic',
        });
        // Disable menu to prevent dropdown arrow
        this.menu = null;
        this._settings = settings;
        this._audioManager = new AudioManager();
        // Connect to click event for immediate toggle
        this.connect('clicked', () => {
            this._toggleAudio();
        });
        this._updateFromSettings();
    }
    async _toggleAudio() {
        const output1 = this._settings.get_string('output-1');
        const output2 = this._settings.get_string('output-2');
        if (!output1 || !output2) {
            return;
        }
        const currentDefault = await this._audioManager.getCurrentDefault();
        let targetOutput;
        if (currentDefault === output1) {
            targetOutput = output2;
        }
        else {
            targetOutput = output1;
        }
        const isAvailable = await this._audioManager.isOutputAvailable(targetOutput);
        if (!isAvailable) {
            return;
        }
        const success = await this._audioManager.switchToOutput(targetOutput);
        if (success) {
            this._updateFromSettings();
        }
    }
    async _updateFromSettings() {
        const output1 = this._settings.get_string('output-1');
        const output2 = this._settings.get_string('output-2');
        const icon1 = this._settings.get_string('indicator-icon-1');
        const icon2 = this._settings.get_string('indicator-icon-2');
        if (!output1 || !output2) {
            this.title = 'Audio Output (Not configured)';
            return;
        }
        const currentDefault = await this._audioManager.getCurrentDefault();
        // Convert icon names to display names
        const iconDisplayNames = {
            'headphones': '🎧',
            'desktop-speakers': '🔊',
            'large-speakers': '📢',
            'earbuds': '🎵'
        };
        if (currentDefault === output1) {
            this.title = `${iconDisplayNames[icon1] || '🎧'} Audio Output`;
        }
        else if (currentDefault === output2) {
            this.title = `${iconDisplayNames[icon2] || '🔊'} Audio Output`;
        }
        else {
            this.title = 'Audio Output';
        }
    }
    updateFromSettings() {
        this._updateFromSettings();
    }
});
export default class AudioSwitcherExtension extends Extension {
    _indicator = null;
    _systemIndicator = null;
    _quickToggle = null;
    _settings = null;
    constructor(metadata) {
        super(metadata);
    }
    enable() {
        this._settings = this.getSettings();
        // Add to system panel if enabled and AppIndicator is available
        const showInTray = this._settings.get_boolean('show-in-tray');
        if (showInTray) {
            this._indicator = new AudioSwitcherIndicator(this._settings, this.path);
            Main.panel.addToStatusArea(this.uuid, this._indicator);
        }
        // Add to quick settings if enabled
        const showInQuickSettings = this._settings.get_boolean('show-in-quick-settings');
        if (showInQuickSettings) {
            this._quickToggle = new AudioSwitcherQuickToggle(this._settings);
            // Insert into quick settings panel in the main grid (not as external indicator)
            const quickSettings = Main.panel.statusArea.quickSettings;
            if (quickSettings && quickSettings.menu && quickSettings.menu.addQuickSettingsItems) {
                quickSettings.menu.addQuickSettingsItems([this._quickToggle]);
            }
        }
        // Add system indicator icon to panel (top right icons)
        const showSystemIndicator = this._settings.get_boolean('show-system-indicator');
        if (showSystemIndicator) {
            this._systemIndicator = new AudioSwitcherSystemIndicator(this._settings, this.path);
            // Add to Quick Settings panel with position control (0 = leftmost position)
            Main.panel.statusArea.quickSettings.addExternalIndicator(this._systemIndicator, 0);
        }
        // Handle settings changes - connect to specific keys for immediate updates
        this._settings.connect('changed::output-1', () => {
            this._onSettingsChanged();
        });
        this._settings.connect('changed::output-2', () => {
            this._onSettingsChanged();
        });
        this._settings.connect('changed::indicator-icon-1', () => {
            this._onSettingsChanged();
        });
        this._settings.connect('changed::indicator-icon-2', () => {
            this._onSettingsChanged();
        });
        this._settings.connect('changed::show-in-tray', () => {
            this._onSettingsChanged();
        });
        this._settings.connect('changed::show-in-quick-settings', () => {
            this._onSettingsChanged();
        });
        this._settings.connect('changed::show-system-indicator', () => {
            this._onSettingsChanged();
        });
    }
    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        if (this._systemIndicator) {
            this._systemIndicator.destroy();
            this._systemIndicator = null;
        }
        if (this._quickToggle) {
            this._quickToggle.destroy();
            this._quickToggle = null;
        }
        this._settings = null;
    }
    _onSettingsChanged() {
        // Update existing indicators
        if (this._indicator) {
            this._indicator.updateFromSettings();
        }
        if (this._systemIndicator) {
            this._systemIndicator.updateFromSettings();
        }
        if (this._quickToggle) {
            this._quickToggle.updateFromSettings();
        }
        // Handle show/hide tray indicator
        const showInTray = this._settings.get_boolean('show-in-tray');
        if (showInTray && !this._indicator) {
            // Create tray indicator
            this._indicator = new AudioSwitcherIndicator(this._settings, this.path);
            Main.panel.addToStatusArea(this.uuid, this._indicator);
        }
        else if (!showInTray && this._indicator) {
            // Remove tray indicator
            this._indicator.destroy();
            this._indicator = null;
        }
        // Handle show/hide system indicator
        const showSystemIndicator = this._settings.get_boolean('show-system-indicator');
        if (showSystemIndicator && !this._systemIndicator) {
            // Create system indicator
            this._systemIndicator = new AudioSwitcherSystemIndicator(this._settings, this.path);
            Main.panel.statusArea.quickSettings.addExternalIndicator(this._systemIndicator, 0);
        }
        else if (!showSystemIndicator && this._systemIndicator) {
            // Remove system indicator
            this._systemIndicator.destroy();
            this._systemIndicator = null;
        }
        // Handle show/hide quick settings toggle
        const showInQuickSettings = this._settings.get_boolean('show-in-quick-settings');
        if (showInQuickSettings && !this._quickToggle) {
            // Create quick settings toggle
            this._quickToggle = new AudioSwitcherQuickToggle(this._settings);
            const quickSettings = Main.panel.statusArea.quickSettings;
            if (quickSettings && quickSettings.menu && quickSettings.menu.addQuickSettingsItems) {
                quickSettings.menu.addQuickSettingsItems([this._quickToggle]);
            }
        }
        else if (!showInQuickSettings && this._quickToggle) {
            // Remove quick settings toggle
            this._quickToggle.destroy();
            this._quickToggle = null;
        }
    }
}

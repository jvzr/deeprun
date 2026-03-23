// @ts-nocheck
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { AudioManager } from './audioManager.js';
const AudioSwitcherPrefsWidget = GObject.registerClass(class AudioSwitcherPrefsWidget extends Adw.PreferencesPage {
    _settings;
    _audioManager;
    _output1Row = null;
    _output2Row = null;
    _availableOutputs = [];
    constructor(settings) {
        super({
            title: 'Audio Switcher Preferences',
            icon_name: 'audio-speakers-symbolic',
        });
        this._settings = settings;
        this._audioManager = new AudioManager();
        this._buildUI();
        this._loadAvailableOutputs();
    }
    _buildUI() {
        // Audio Outputs Group
        const outputsGroup = new Adw.PreferencesGroup({
            title: 'Audio Outputs',
            description: 'Select the two audio outputs to toggle between',
        });
        // Output 1 selection
        this._output1Row = new Adw.ComboRow({
            title: 'First Output',
            subtitle: 'The first audio output device',
        });
        // Output 2 selection
        this._output2Row = new Adw.ComboRow({
            title: 'Second Output',
            subtitle: 'The second audio output device',
        });
        outputsGroup.add(this._output1Row);
        outputsGroup.add(this._output2Row);
        this.add(outputsGroup);
        // Visual Indicators Group
        const indicatorsGroup = new Adw.PreferencesGroup({
            title: 'Visual Indicators',
            description: 'Choose icons for each audio output',
        });
        // Icon choices
        const iconChoices = new Gtk.StringList();
        iconChoices.append('Headphones');
        iconChoices.append('Desktop Speakers');
        iconChoices.append('Large Speakers');
        iconChoices.append('Earbuds');
        const iconValues = ['headphones', 'desktop-speakers', 'large-speakers', 'earbuds'];
        const icon1Row = new Adw.ComboRow({
            title: 'First Output Icon',
            subtitle: 'Icon to display when first output is active',
            model: iconChoices,
        });
        const icon2Row = new Adw.ComboRow({
            title: 'Second Output Icon',
            subtitle: 'Icon to display when second output is active',
            model: iconChoices,
        });
        // Set current selections
        const currentIcon1 = this._settings.get_string('indicator-icon-1');
        const currentIcon2 = this._settings.get_string('indicator-icon-2');
        const icon1Index = iconValues.indexOf(currentIcon1);
        const icon2Index = iconValues.indexOf(currentIcon2);
        if (icon1Index >= 0)
            icon1Row.set_selected(icon1Index);
        if (icon2Index >= 0)
            icon2Row.set_selected(icon2Index);
        // Connect change handlers
        icon1Row.connect('notify::selected', () => {
            const selected = icon1Row.get_selected();
            if (selected >= 0 && selected < iconValues.length) {
                this._settings.set_string('indicator-icon-1', iconValues[selected]);
            }
        });
        icon2Row.connect('notify::selected', () => {
            const selected = icon2Row.get_selected();
            if (selected >= 0 && selected < iconValues.length) {
                this._settings.set_string('indicator-icon-2', iconValues[selected]);
            }
        });
        indicatorsGroup.add(icon1Row);
        indicatorsGroup.add(icon2Row);
        this.add(indicatorsGroup);
        // Display Options Group
        const displayGroup = new Adw.PreferencesGroup({
            title: 'Display Options',
            description: 'Choose where to show the audio switcher',
        });
        const trayRow = new Adw.SwitchRow({
            title: 'Show in System Tray',
            subtitle: 'Display toggle button in system tray (requires AppIndicator extension)',
            active: this._settings.get_boolean('show-in-tray'),
        });
        const quickSettingsRow = new Adw.SwitchRow({
            title: 'Show in Quick Settings',
            subtitle: 'Display toggle button in quick settings panel',
            active: this._settings.get_boolean('show-in-quick-settings'),
        });
        const systemIndicatorRow = new Adw.SwitchRow({
            title: 'Show System Indicator Icon',
            subtitle: 'Display audio switcher icon in top panel (next to system icons)',
            active: this._settings.get_boolean('show-system-indicator'),
        });
        trayRow.connect('notify::active', () => {
            this._settings.set_boolean('show-in-tray', trayRow.get_active());
        });
        quickSettingsRow.connect('notify::active', () => {
            this._settings.set_boolean('show-in-quick-settings', quickSettingsRow.get_active());
        });
        systemIndicatorRow.connect('notify::active', () => {
            this._settings.set_boolean('show-system-indicator', systemIndicatorRow.get_active());
        });
        displayGroup.add(trayRow);
        displayGroup.add(quickSettingsRow);
        displayGroup.add(systemIndicatorRow);
        this.add(displayGroup);
        // Refresh button
        const refreshGroup = new Adw.PreferencesGroup();
        const refreshRow = new Adw.ActionRow({
            title: 'Refresh Audio Outputs',
            subtitle: 'Click to refresh the list of available audio outputs',
        });
        const refreshButton = new Gtk.Button({
            label: 'Refresh',
            valign: Gtk.Align.CENTER,
            css_classes: ['suggested-action'],
        });
        refreshButton.connect('clicked', () => {
            this._loadAvailableOutputs();
        });
        refreshRow.add_suffix(refreshButton);
        refreshRow.set_activatable_widget(refreshButton);
        refreshGroup.add(refreshRow);
        this.add(refreshGroup);
    }
    async _loadAvailableOutputs() {
        try {
            this._availableOutputs = await this._audioManager.getAvailableOutputs();
            if (!this._output1Row || !this._output2Row)
                return;
            // Create string list models
            const model1 = new Gtk.StringList();
            const model2 = new Gtk.StringList();
            let selectedIndex1 = -1;
            let selectedIndex2 = -1;
            const output1Setting = this._settings.get_string('output-1');
            const output2Setting = this._settings.get_string('output-2');
            this._availableOutputs.forEach((output, index) => {
                const displayText = `${output.description}${output.isDefault ? ' (Default)' : ''}`;
                model1.append(displayText);
                model2.append(displayText);
                if (output.name === output1Setting) {
                    selectedIndex1 = index;
                }
                if (output.name === output2Setting) {
                    selectedIndex2 = index;
                }
            });
            this._output1Row.set_model(model1);
            this._output2Row.set_model(model2);
            if (selectedIndex1 >= 0) {
                this._output1Row.set_selected(selectedIndex1);
            }
            if (selectedIndex2 >= 0) {
                this._output2Row.set_selected(selectedIndex2);
            }
            // Connect change handlers
            this._output1Row.connect('notify::selected', () => {
                const selected = this._output1Row?.get_selected();
                if (selected !== undefined && selected >= 0 && selected < this._availableOutputs.length) {
                    this._settings.set_string('output-1', this._availableOutputs[selected].name);
                }
            });
            this._output2Row.connect('notify::selected', () => {
                const selected = this._output2Row?.get_selected();
                if (selected !== undefined && selected >= 0 && selected < this._availableOutputs.length) {
                    this._settings.set_string('output-2', this._availableOutputs[selected].name);
                }
            });
        }
        catch (error) {
            console.error('Error loading available outputs:', error);
        }
    }
});
export default class AudioSwitcherPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new AudioSwitcherPrefsWidget(settings);
        window.add(page);
    }
}

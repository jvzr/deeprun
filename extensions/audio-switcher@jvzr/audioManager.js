import GLib from 'gi://GLib';
export class AudioManager {
    _outputs = [];
    _currentDefault = null;
    constructor() {
        this._refreshOutputs();
    }
    async _refreshOutputs() {
        try {
            // Use pactl to get PipeWire/PulseAudio sinks
            const [success, stdout] = GLib.spawn_command_line_sync('pactl list short sinks');
            if (!success) {
                console.error('Failed to get audio outputs');
                return;
            }
            const decoder = new TextDecoder();
            const output = decoder.decode(stdout || new Uint8Array());
            this._outputs = [];
            for (const line of output.split('\n')) {
                if (!line.trim())
                    continue;
                const parts = line.split('\t');
                if (parts.length >= 2) {
                    const index = parseInt(parts[0]);
                    const name = parts[1];
                    // Get detailed info for this sink
                    const [detailSuccess, detailStdout] = GLib.spawn_command_line_sync(`pactl list sinks`);
                    if (detailSuccess) {
                        const detailOutput = decoder.decode(detailStdout || new Uint8Array());
                        const sinkInfo = this._parseSinkInfo(detailOutput, name);
                        this._outputs.push({
                            name,
                            description: sinkInfo.description || name,
                            index,
                            isDefault: sinkInfo.isDefault
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error('Error refreshing audio outputs:', error);
        }
    }
    _parseSinkInfo(output, targetName) {
        const sinks = output.split('Sink #');
        for (const sink of sinks) {
            if (sink.includes(`Name: ${targetName}`)) {
                const descMatch = sink.match(/Description: (.+?)$/m);
                const description = descMatch ? descMatch[1].trim() : targetName;
                // Check if this is the default sink
                const isDefault = sink.includes('State: RUNNING') && sink.includes('* index:');
                return { description, isDefault };
            }
        }
        return { description: targetName, isDefault: false };
    }
    async getAvailableOutputs() {
        await this._refreshOutputs();
        return [...this._outputs];
    }
    async getCurrentDefault() {
        try {
            const [success, stdout] = GLib.spawn_command_line_sync('pactl get-default-sink');
            if (!success)
                return null;
            const decoder = new TextDecoder();
            const output = decoder.decode(stdout || new Uint8Array()).trim();
            this._currentDefault = output;
            return output;
        }
        catch (error) {
            console.error('Error getting current default sink:', error);
            return null;
        }
    }
    async switchToOutput(outputName) {
        try {
            const [success] = GLib.spawn_command_line_sync(`pactl set-default-sink ${outputName}`);
            if (success) {
                this._currentDefault = outputName;
                // Move all playing streams to the new default
                const [streamsSuccess, streamsStdout] = GLib.spawn_command_line_sync('pactl list short sink-inputs');
                if (streamsSuccess) {
                    const decoder = new TextDecoder();
                    const streamsOutput = decoder.decode(streamsStdout || new Uint8Array());
                    for (const line of streamsOutput.split('\n')) {
                        if (!line.trim())
                            continue;
                        const parts = line.split('\t');
                        if (parts.length >= 1) {
                            const streamIndex = parts[0];
                            GLib.spawn_command_line_sync(`pactl move-sink-input ${streamIndex} ${outputName}`);
                        }
                    }
                }
            }
            return success;
        }
        catch (error) {
            console.error('Error switching audio output:', error);
            return false;
        }
    }
    async isOutputAvailable(outputName) {
        await this._refreshOutputs();
        return this._outputs.some(output => output.name === outputName);
    }
}

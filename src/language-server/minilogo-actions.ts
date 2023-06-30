export interface Command {
    name: 'penUp' | 'penDown' | 'move' | 'color';
    args: MoveArgs | ColorArgs | undefined;
}

export interface MoveArgs {
    x: number;
    y: number;
}

/**
 * Either a hex value or RGB values can be provided, not both.
 */
export interface ColorArgs {
    /** A hex value for a color */
    color?: string;
    /** RGB values for a color */
    r?: number;
    g?: number;
    b?: number;
}

/**
 * Converts generateMiniLogoCmds to an array of commands
 * @param commands the output of generateMiniLogoCmds
 * @returns an array of commands
 */
export function getCommands(commands: any[]): Command[] {
    let result: Command[] = [];
    commands.forEach((command) => {
        switch (command.cmd) {
            case 'penUp':
                result.push({ name: 'penUp', args: undefined } as Command);
                break;
            case 'penDown':
                result.push({ name: 'penDown', args: undefined } as Command);
                break;
            case 'move':
                result.push({ name: 'move', args: { x: command.x, y: command.y } as MoveArgs} as Command);
                break;
            case 'color':
                result.push({ name: 'color', args: { color: command.color, r: command.r, g: command.g, b: command.b } as ColorArgs } as Command);
                break;

        }
    })
    return result;
}

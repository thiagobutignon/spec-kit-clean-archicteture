/**
 * Interactive Prompt Utilities
 * Provides user interaction for critical decisions
 */
import inquirer from 'inquirer';
/**
 * Ask user for confirmation
 * @param message - Question to ask
 * @param defaultValue - Default answer
 * @returns User's choice
 */
export async function confirmAction(message, defaultValue = false) {
    const answer = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmed',
            message,
            default: defaultValue,
        },
    ]);
    return answer.confirmed;
}
/**
 * Ask user to choose from a list of options
 * @param message - Question to ask
 * @param choices - Available choices
 * @param defaultValue - Default choice
 * @returns User's selection
 */
export async function chooseOption(message, choices, defaultValue) {
    const answer = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message,
            choices,
            default: defaultValue,
        },
    ]);
    return answer.choice;
}

import fs from 'fs';
import readline from 'readline';
import chalk from 'chalk';
import ora from 'ora';
import { pitchInspector, statsAnalyst, devilsAdvocate, captainCool } from './agents.js';

const scenario = JSON.parse(fs.readFileSync('./mock_scenario.json', 'utf8'));
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let matchHistory = [];

async function playTurn(lastAction) {
    if (lastAction) {
        matchHistory.push(lastAction);
    }
    
    console.log(chalk.bold.yellow(`\n🏏 MATCH STATE: ${scenario.matchState} ${scenario.equation}`));
    console.log(chalk.gray(`Conditions: ${scenario.conditions} | Striker: ${scenario.players.striker} | Bowler: ${scenario.players.bowler}`));
    console.log(chalk.gray(`--------------------------------------------------`));

    // Pitch Inspector
    const pitchSpinner = ora('Pitch Inspector analyzing surface...').start();
    const pitchOutput = await pitchInspector('pitch.jpg');
    pitchSpinner.succeed(chalk.cyan(`🌱 Pitch Inspector: ${pitchOutput}`));

    // Stats Analyst
    const analystSpinner = ora('Stats Analyst computing optimal move...').start();
    try {
        const analystOutput = await statsAnalyst(scenario, pitchOutput, matchHistory);
        analystSpinner.succeed(chalk.blue(`📊 Stats Analyst [Proposal]: ${analystOutput.proposedMove}`));
        console.log(chalk.blue(`   [Reasoning]: ${analystOutput.reasoning}`));
        
        // Devil's Advocate
        const advocateSpinner = ora("Devil's Advocate analyzing risks...").start();
        const advocateOutput = await devilsAdvocate(analystOutput, matchHistory);
        advocateSpinner.succeed(chalk.red(`👿 Devil's Advocate [Flaw]: ${advocateOutput.flaw}`));
        console.log(chalk.red(`   [Counter Move]: ${advocateOutput.counterMove} (Win Prob Drop: ${advocateOutput.winProbabilityDrop}%)`));

        // Captain Cool
        const captainSpinner = ora('Captain Cool making the final call...').start();
        const captainOutput = await captainCool(analystOutput, advocateOutput);
        captainSpinner.succeed(chalk.green(`🧢 Captain Cool:\n   ${captainOutput}`));

    } catch (e) {
        analystSpinner.fail(chalk.red(`Error in agent chain: ${e.message}`));
    }

    askUser();
}

function askUser() {
    console.log(chalk.gray(`--------------------------------------------------`));
    rl.question('🎙️  What happened on that ball? (or type "exit" to quit): ', (answer) => {
        if (answer.trim().toLowerCase() === 'exit') {
            console.log(chalk.yellow("🏆 Match simulation ended. See you next time!"));
            rl.close();
            process.exit(0);
        } else {
            playTurn(`Ball Event: ${answer}`);
        }
    });
}

// Start CLI
console.log(chalk.bold.magenta("🚀 Booting up Captain Cool - Multi-Agent IPL Strategist..."));
playTurn();

const { spawn } = require('child_process');

const child = spawn('node', ['master_captain.js']);

const inputs = [
    "Bumrah fires an incredible 145kmh inswinging yorker hitting the batsman right on the boot. Massive appeal, but given inside edge.\n",
    "The batsman dances down the track, picks up the slower length ball, and clears long-on for a colossal 95-meter six!\n",
    "exit\n"
];

let inputIndex = 0;
let outputLog = "";

child.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);
    outputLog += text;
    
    if (text.includes('🎙️  What happened on that ball?')) {
        if (inputIndex < inputs.length) {
            console.log(`\n--- Waiting 15 seconds before next input to avoid rate limits ---`);
            setTimeout(() => {
                console.log(`\n--- Sending Input ${inputIndex + 1} ---`);
                child.stdin.write(inputs[inputIndex]);
                outputLog += `\n> ${inputs[inputIndex]}\n`;
                inputIndex++;
            }, 15000); // 15s delay
        }
    }
});

child.stderr.on('data', (data) => {
    const text = data.toString();
    process.stderr.write(text);
    outputLog += text;
});

child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
    const fs = require('fs');
    fs.writeFileSync('raw_terminal_stream.txt', outputLog);
});

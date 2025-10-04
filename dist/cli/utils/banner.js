import chalk from 'chalk';
const BANNER = `
████████╗██╗  ██╗███████╗    ██████╗ ███████╗ ██████╗ ███████╗███╗   ██╗████████╗
╚══██╔══╝██║  ██║██╔════╝    ██╔══██╗██╔════╝██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
   ██║   ███████║█████╗      ██████╔╝█████╗  ██║  ███╗█████╗  ██╔██╗ ██║   ██║
   ██║   ██╔══██║██╔══╝      ██╔══██╗██╔══╝  ██║   ██║██╔══╝  ██║╚██╗██║   ██║
   ██║   ██║  ██║███████╗    ██║  ██║███████╗╚██████╔╝███████╗██║ ╚████║   ██║
   ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝
`;
const TAGLINE = 'The Regent - AI-Powered Clean Architecture CLI with Guaranteed Quality';
export function showBanner() {
    const bannerLines = BANNER.trim().split('\n');
    const colors = [
        chalk.cyan,
        chalk.blue,
        chalk.cyanBright,
        chalk.blueBright,
        chalk.white,
        chalk.whiteBright
    ];
    console.log();
    bannerLines.forEach((line, index) => {
        const color = colors[index % colors.length];
        console.log(color(line));
    });
    console.log(chalk.yellow.italic(TAGLINE));
    console.log();
}

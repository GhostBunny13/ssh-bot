const fs = require("fs")
const path = require("path");
const SSH = require("simple-ssh")
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});
const colors = require("colors/safe")

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};


const readHosts = fs.readFileSync(path.join(__dirname, "host.txt"), "utf8")
const readPass = fs.readFileSync(path.join(__dirname, "password.txt"), "utf8")
const readCmd = fs.readFileSync(path.join(__dirname, "command.txt"), "utf8")
const hostList = readHosts.split("\n")
const passList = readPass.split("\n")
const commandList = readCmd.split("\n")

let delCommand = []
commandList.map((cmd, indexCmd) => {
	if (cmd.trim()[0] === "#" || cmd.trim().length === 0) {
		delCommand.push(cmd)
	}
})
delCommand.map((val)=>{
	commandList.remove(val)
})
console.log(`${colors.yellow(hostList.length)} server ${commandList.length} command`)
commandList.map((cmd, indexCmd) => {
	console.log(indexCmd+1, ">>>",colors.blue(cmd))
})
console.log("\n")
let doneList = []
let undoneList = []
let skipList = []
let errorList = []
let inputEditList = []
hostList.map((host, indexHost) => {
	undoneList.push(indexHost+1)
	inputEditList.push(indexHost+1)
})
let count_total = 0

function show_status() {
	console.log("count_done: " + colors.green(doneList.sort((a, b) => (a-b))))
	console.log("skip: " + colors.blue(skipList.sort((a, b) => (a-b))))
	console.log("wait: " + colors.yellow(undoneList.sort((a, b) => (a-b))))
	console.log("error: " + colors.red(errorList.sort((a, b) => (a-b))))
}
readline.question(`do you want run bot? [yes: no: edit] `, resp => {
	if (resp == "edit") {
		readline.question(`enter list: `, inputList => {
			inputEditList = inputList.split(",").map((val)=> (Number(val.trim())))
			readline.emit("yes")
		})
		
	}else if (resp != "yes") {
		console.log("type 'yes' for run bot ")
		readline.close()
	} else {
		readline.emit("yes")
	}
  
});


readline.on("yes", ()=> {
	if (hostList.length === passList.length) {
		console.log(`start bot ${hostList.length} server`)
		hostList.map((host, index) => {
			if (inputEditList.indexOf(index + 1) != -1) {
				const ssh = new SSH({
					host: host,
					user: "root",
					pass: passList[index]
				})
				commandList.map((cmd, indexCmd) => {
					let count_cmd = 0
					ssh.exec(cmd, {
						out: (stdout) => {
							console.log(`server ${colors.blue(index+1)} host: ${colors.yellow(host)} pass: ${passList[index]}`)
							console.log("command: "+ cmd)
							console.log(stdout)
						},
						err: (err) => {
							console.log(`server ${index+1} host: ${colors.yellow(host)} pass: ${passList[index]}`)
							console.log("command: "+cmd)
							console.log(err)
						},
						exit: (code) => {
							console.log(code)
							count_cmd += 1
							if (count_cmd === commandList.length) {
								if (code == 0) {
									doneList.push(index+1)
								} else {
									errorList.push(index+1)
								}
								undoneList.remove(index+1)
								show_status()
							}

							ssh.end()
							if (undoneList.length === 0) {
								console.log(colors.green.bgWhite("done!!!!!"))
								readline.close()
							}
						}
					}).start()

				})

			} else {
				skipList.push(index+1)
				undoneList.remove(index+1)
			}
		})
	} else {
		console.log("len error!!!")
		console.log(`${hostList.length} server and ${passList.length} password`)
	}

})

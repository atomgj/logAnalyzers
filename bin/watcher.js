var fs = require('fs');
var process = require('child_process');

var mergeMap = {};
var iptables = {};
var sourceMap = {};
var reg = /\[(.+?)\]/;
var reg_ip = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
var reg_usr = /\user=\S+/;
var logDir = '/root/stopIP.log';

module.exports = function (file, socket) {
    var vm = this;
    vm.file = file;
    vm.socket = socket;

    vm.parser = function (buffer) {
        var i, line = buffer.split('\n');
        for (i = 0; i < line.length; i++) {
            if (line[i]) {
                vm.merge(line[i]);
            }
        }
        vm.parseSeries();
    };
    this.emit = function (log) {
        if (vm.socket) {
            vm.socket.emit('msg', {
                log: log
            });
        }
    };

    /**
     * 归并操作
     * @param line
     */
    this.merge = function (line){

        var idMatch = line.match(reg);
        if(idMatch && idMatch.length > 1){
            if(!mergeMap[idMatch[1]]){
                mergeMap[idMatch[1]] = [];
            }
            mergeMap[idMatch[1]].push(line);
        }
    };

    /**
     * 处理单条
     */
    this.parseSeries = function(){
        var i, j, series = {}
            , ipMatch
            , usrMatch;
        for(i in mergeMap){
            if(mergeMap.hasOwnProperty(i)){
                series = {};
                for(j = 0; j < mergeMap[i].length; j++){
                    if(!series.date){
                        series.date = mergeMap[i][j].substring(0,15);
                    }
                    if(!series.src){
                        ipMatch = mergeMap[i][j].match(reg_ip);
                        if(ipMatch && ipMatch.length > 0){
                            series.src = ipMatch[0]
                        }
                    }
                    if(!series.user){
                        usrMatch = mergeMap[i][j].match(reg_usr);
                        if(usrMatch && usrMatch.length > 0){
                            series.user = usrMatch[0].split('=')[1];
                        }
                    }
                }
                if(!sourceMap[series.src]){
                    sourceMap[series.src] = series;
                    series.count = 1;
                }else{
                    sourceMap[series.src].count ++;
                }
            }
        }

        for(i in sourceMap){
            if(sourceMap.hasOwnProperty(i)){
                vm.emit(sourceMap[i]);
                if(sourceMap[i].count > 20 && !iptables[i]){
                    vm.preventAttact(i);
                    iptables[i] = true;
                    delete sourceMap[i];
                }
            }
        }
    };

    this.preventAttact = function (ip) {
        var command = 'iptables -I INPUT -s '+ip+' -j DROP';
        process.exec(command, function (error, stdout, stderr) {
            var logStr;
            if (error !== null) {
                logStr = new Date().getTime() + ', exec command failure: '+ command + '\n';
            }else{
                logStr = new Date().getTime() + ', exec command success: '+ command + '\n';
            }
            console.log(logStr);
            fs.appendFile(logDir, logStr, function(err){
                if(err){
                    throw err;
                }
            });
        });
    };

    this.watch = function (file) {
        var buffer;

        fs.open(file, 'a+', function (error, fd) {
            fs.watchFile(file, function (curr, prev) {
                if (curr.mtime > prev.mtime) {
                    buffer = new Buffer(curr.size - prev.size);
                    fs.read(fd, buffer, 0, (curr.size - prev.size), prev.size, function (err, bytesRead, buffer) {
                        vm.parser(buffer.toString());
                    });
                }
            });
        });
    };
};
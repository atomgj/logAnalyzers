var socket = io.connect();
function appendNode(log){
    var node = document.createElement("div");
    node.innerText = log;
    document.getElementById('log-container').appendChild(node);
}

socket.on('connect',function(){
    console.log('连接成功');
});

socket.on('msg',function(data){
    appendNode(data.log);
});
